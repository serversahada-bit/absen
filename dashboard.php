<?php
session_start();
require 'config/database.php';
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

function e($s){ return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

// ✅ FLASH dari proses absen (popup di dashboard)
$flash_absen = $_SESSION['flash_absen'] ?? null;
unset($_SESSION['flash_absen']);

// 1. CEK LOGIN
if (!isset($_SESSION['user_id'])) {
    header("Location: app");
    exit();
}

// Set Timezone
date_default_timezone_set('Asia/Jakarta');
$user_id = (int)$_SESSION['user_id'];

// ============================
// ✅ JADWAL SHIFT DINAMIS
// Senin-Kamis: 08:00-16:15
// Jumat      : 08:00-16:00
// Sabtu      : 08:00-12:00
// Minggu     : 08:00-16:15   ✅ (DIUBAH: TIDAK LIBUR)
// ============================
function jadwal_hari_ini(): array {
    $dow = (int)date('N'); // 1=Mon ... 7=Sun

    // ✅ Minggu tidak libur lagi
    $masuk  = '08:00';
    $pulang = '16:15';

    if ($dow === 5) {          // Jumat
        $pulang = '16:00';
    } elseif ($dow === 6) {    // Sabtu
        $pulang = '12:00';
    } elseif ($dow === 7) {    // Minggu
        $pulang = '16:15';
    }

    if ($dow >= 1 && $dow <= 4) {
        $label = 'Senin - Kamis';
    } elseif ($dow === 5) {
        $label = 'Jumat';
    } elseif ($dow === 6) {
        $label = 'Sabtu';
    } else {
        $label = 'Minggu';
    }

    return [
        'label' => $label,
        'masuk' => $masuk,
        'pulang' => $pulang,
        'libur' => false, // ✅ selalu false sekarang
    ];
}

$jadwal = jadwal_hari_ini();
$shiftLabel  = $jadwal['label'];
$shiftMasuk  = $jadwal['masuk'];   // "08:00"
$shiftPulang = $jadwal['pulang'];  // "16:15"/"16:00"/"12:00"
$isLibur     = (bool)$jadwal['libur']; // ✅ sekarang selalu false

// 2. AMBIL DATA USER
$query_user = "SELECT nama, jabatan, organisasi, foto, peran FROM karyawan WHERE id = ? LIMIT 1";
$stmt = $conn->prepare($query_user);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$data_user = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$data_user) {
    session_destroy();
    header("Location: app");
    exit();
}

$nama_user  = (string)($data_user['nama'] ?? '');
$jabatan    = (string)($data_user['jabatan'] ?? '');
$perusahaan = (string)($data_user['organisasi'] ?? 'PT. Great HRD');
$foto_user  = (string)($data_user['foto'] ?? '');
$peran_user = strtolower(trim((string)($data_user['peran'] ?? '')));

$inisial = strtoupper(substr(trim($nama_user ?: 'NA'), 0, 2));

// ✅ Manager / SPV / Supervisor yang lihat menu Tim Saya & Aproval Izin & Aproval Lembur
$jabLower = strtolower(trim($jabatan));
$isLeader =
    in_array($peran_user, ['manager','spv','supervisor'], true) ||
    (strpos($jabLower, 'manager') !== false) ||
    (strpos($jabLower, 'spv') !== false) ||
    (strpos($jabLower, 'supervisor') !== false);

$isManager = $isLeader;

// =======================================================
// ✅ BADGE PENDING APPROVAL ATASAN (SESUIAI DATABASE KAMU)
// lembur: gunakan manager_status
// izin/cuti: gunakan manager_status
// =======================================================
$pendingIzinCount  = 0;
$pendingLemburCount = 0;

if ($isManager) {
    // ✅ IZIN/CUTI pending approval atasan
    try {
        $stmt = $conn->prepare("
            SELECT COUNT(*) AS c
            FROM pengajuan_izin i
            JOIN tim_saya ts ON ts.anggota_id = i.karyawan_id
            WHERE ts.manager_id = ?
              AND i.manager_status = 'PENDING'
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        $pendingIzinCount = (int)($row['c'] ?? 0);
    } catch (Throwable $e) {
        $pendingIzinCount = 0;
    }

    // ✅ LEMBUR pending approval atasan (INI YANG BENAR UNTUK DB KAMU)
    try {
        $stmt = $conn->prepare("
            SELECT COUNT(*) AS c
            FROM lembur l
            JOIN tim_saya ts ON ts.anggota_id = l.karyawan_id
            WHERE ts.manager_id = ?
              AND l.manager_status = 'PENDING'
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        $pendingLemburCount = (int)($row['c'] ?? 0);
    } catch (Throwable $e) {
        $pendingLemburCount = 0;
    }
}

// 3. CEK DATA PRESENSI
$tanggal_hari_ini = date('Y-m-d');
$query_presensi   = "SELECT jam_masuk, jam_pulang, status FROM presensi WHERE karyawan_id = ? AND tanggal = ? LIMIT 1";
$stmt_absen = $conn->prepare($query_presensi);
$stmt_absen->bind_param("is", $user_id, $tanggal_hari_ini);
$stmt_absen->execute();
$data_absen = $stmt_absen->get_result()->fetch_assoc();
$stmt_absen->close();

$status_tombol    = 'belum';
$jam_masuk_db     = '--:--';
$jam_pulang_db    = '--:--';
$ket_masuk        = 'Belum absen';
$ket_pulang       = 'Belum absen';
$status_kehadiran = '';

if ($data_absen) {
    if (!empty($data_absen['jam_masuk'])) {
        $jam_masuk_db     = date('H:i', strtotime($data_absen['jam_masuk']));
        $ket_masuk        = 'Tercatat';
        $status_kehadiran = (string)($data_absen['status'] ?? '');
        $status_tombol    = 'masuk';
    }

    if (!empty($data_absen['jam_pulang'])) {
        $jam_pulang_db = date('H:i', strtotime($data_absen['jam_pulang']));
        $ket_pulang    = 'Tercatat';
        $status_tombol = 'selesai';
    }
}

// ✅ DIUBAH: minggu bukan libur, jadi jangan auto disable lagi
// if ($isLibur) { $status_tombol = 'selesai'; }

function tanggal_indo(): string {
    $hari_arr  = [
        'Sunday'    => 'Minggu',
        'Monday'    => 'Senin',
        'Tuesday'   => 'Selasa',
        'Wednesday' => 'Rabu',
        'Thursday'  => 'Kamis',
        'Friday'    => 'Jumat',
        'Saturday'  => 'Sabtu'
    ];
    $bulan_arr = [1=>'Jan',2=>'Feb',3=>'Mar',4=>'Apr',5=>'Mei',6=>'Jun',7=>'Jul',8=>'Ags',9=>'Sep',10=>'Okt',11=>'Des'];
    return $hari_arr[date('l')] . ", " . date('d') . " " . $bulan_arr[(int)date('m')] . " " . date('Y');
}

$jam_now = (int)date('H');
if ($jam_now < 11) $sapaan = "Selamat pagi";
elseif ($jam_now < 15) $sapaan = "Selamat siang";
elseif ($jam_now < 19) $sapaan = "Selamat sore";
else $sapaan = "Selamat malam";

// ✅ Hitung telat "X jam Y menit"
function format_telat(string $jamMasuk, string $targetMasuk = '08:00'): string {
    $target = strtotime(date('Y-m-d') . ' ' . $targetMasuk . ':00');
    $masuk  = strtotime(date('Y-m-d') . ' ' . date('H:i:s', strtotime($jamMasuk)));

    $diff = $masuk - $target;
    if ($diff <= 0) return "0 menit";

    $jam = intdiv($diff, 3600);
    $menit = intdiv($diff % 3600, 60);

    if ($jam > 0 && $menit > 0) return "{$jam} jam {$menit} menit";
    if ($jam > 0) return "{$jam} jam";
    return "{$menit} menit";
}

$telat_text = '';
if ($status_kehadiran === 'Terlambat' && !empty($data_absen['jam_masuk'])) {
    $telat_text = format_telat($data_absen['jam_masuk'], $shiftMasuk ?: '08:00');
}

// ============================
// ✅ TIMELINE 6 HARI KE BELAKANG (H0..H-5)
// - Manager: tampilkan IZIN/CUTI PENDING anggota tim (manager_status PENDING)
// - Non manager: tampilkan IZIN/CUTI yang disetujui (seperti sebelumnya)
// - Ultah: 6 hari
// ============================
function tgl_indo_singkat(string $ymd): string {
    $hari_arr  = [
        'Sunday'    => 'Minggu',
        'Monday'    => 'Senin',
        'Tuesday'   => 'Selasa',
        'Wednesday' => 'Rabu',
        'Thursday'  => 'Kamis',
        'Friday'    => 'Jumat',
        'Saturday'  => 'Sabtu'
    ];
    $bulan_arr = [1=>'Jan',2=>'Feb',3=>'Mar',4=>'Apr',5=>'Mei',6=>'Jun',7=>'Jul',8=>'Ags',9=>'Sep',10=>'Okt',11=>'Des'];
    $ts = strtotime($ymd);
    return $hari_arr[date('l', $ts)] . ", " . date('d', $ts) . " " . $bulan_arr[(int)date('m', $ts)] . " " . date('Y', $ts);
}

$timelineByDate = []; // ['Y-m-d' => [items...]]
$dates = [];

for ($i=0; $i<6; $i++) {
    $d = date('Y-m-d', strtotime("-{$i} day"));
    $dates[] = $d;
    $timelineByDate[$d] = [];
}

// ============================
// ✅ IZIN/CUTI TIMELINE
// ============================
$stIzin = null;

try {
    // ✅ 1. Tampilkan IZIN/CUTI yang disetujui untuk SEMUA ORANG (termasuk manager)
    $sqlIzin = "
      SELECT
        k.nama,
        k.jabatan,
        i.tipe_izin,
        i.mulai_tanggal,
        i.sampai_tanggal,
        i.status,
        i.manager_status
      FROM pengajuan_izin i
      JOIN karyawan k ON k.id = i.karyawan_id
      WHERE ? BETWEEN i.mulai_tanggal AND i.sampai_tanggal
        AND (i.status = 'Disetujui' OR i.manager_status = 'Disetujui')
      ORDER BY k.nama ASC
      LIMIT 100
    ";
    $stIzin = $conn->prepare($sqlIzin);

    foreach ($dates as $d) {
        try {
            $stIzin->bind_param("s", $d);
            $stIzin->execute();
            $rs = $stIzin->get_result();

            while ($r = $rs->fetch_assoc()) {
                $mulai   = (string)$r['mulai_tanggal'];
                $selesai = (string)$r['sampai_tanggal'];

                $rangeText = ($mulai === $selesai)
                    ? date('d M Y', strtotime($mulai))
                    : (date('d M', strtotime($mulai)) . " – " . date('d M Y', strtotime($selesai)));

                $tipe = (string)($r['tipe_izin'] ?? 'Izin');
                $sub  = trim(((string)($r['jabatan'] ?? '')). ' • ' . $tipe);

                $timelineByDate[$d][] = [
                    'type' => 'izin',
                    'title' => (string)$r['nama'],
                    'subtitle' => $sub,
                    'meta' => $rangeText,
                ];
            }
            $rs->free();
        } catch (Throwable $e) {}
    }

    // ✅ 2. Jika MANAGER, TAMBAHKAN juga pengajuan PENDING dari anggota timnya
    if ($isManager) {
        $sqlIzinPending = "
          SELECT
            k.nama,
            k.jabatan,
            i.tipe_izin,
            i.mulai_tanggal,
            i.sampai_tanggal,
            i.status,
            i.manager_status
          FROM pengajuan_izin i
          JOIN tim_saya ts ON ts.anggota_id = i.karyawan_id
          JOIN karyawan k ON k.id = i.karyawan_id
          WHERE ts.manager_id = ?
            AND ? BETWEEN i.mulai_tanggal AND i.sampai_tanggal
            AND i.manager_status = 'PENDING'
          ORDER BY k.nama ASC
          LIMIT 100
        ";
        $stIzinPending = $conn->prepare($sqlIzinPending);

        foreach ($dates as $d) {
            try {
                $stIzinPending->bind_param("is", $user_id, $d);
                $stIzinPending->execute();
                $rs = $stIzinPending->get_result();

                while ($r = $rs->fetch_assoc()) {
                    $mulai   = (string)$r['mulai_tanggal'];
                    $selesai = (string)$r['sampai_tanggal'];

                    $rangeText = ($mulai === $selesai)
                        ? date('d M Y', strtotime($mulai))
                        : (date('d M', strtotime($mulai)) . " – " . date('d M Y', strtotime($selesai)));

                    $tipe = (string)($r['tipe_izin'] ?? 'Izin');
                    $sub  = trim(((string)($r['jabatan'] ?? '')). ' • ' . $tipe);

                    $timelineByDate[$d][] = [
                        'type' => 'izin',
                        'title' => (string)$r['nama'],
                        'subtitle' => $sub,
                        'meta' => $rangeText,
                        'badge' => 'PENDING',
                    ];
                }
                $rs->free();
            } catch (Throwable $e) {}
        }
        if ($stIzinPending) $stIzinPending->close();
    }

} catch (Throwable $e) {
    $stIzin = null;
}
if ($stIzin) $stIzin->close();

// ✅ Ulang Tahun (6 hari terakhir)
try {
    $sqlUltahRange = "
        SELECT 
            k.id,
            k.nama,
            k.jabatan,
            k.tanggal_lahir,
            k.tgl_lahir_date,
            DATE_ADD(
                k.tgl_lahir_date,
                INTERVAL YEAR(CURDATE()) - YEAR(k.tgl_lahir_date)
                    - IF(DATE_FORMAT(CURDATE(), '%m%d') < DATE_FORMAT(k.tgl_lahir_date, '%m%d'), 1, 0)
                YEAR
            ) AS tanggal_perayaan
        FROM (
            SELECT
                id,
                nama,
                jabatan,
                tanggal_lahir,
                COALESCE(
                    STR_TO_DATE(tanggal_lahir, '%Y-%m-%d'),
                    STR_TO_DATE(tanggal_lahir, '%d-%m-%Y')
                ) AS tgl_lahir_date
            FROM karyawan
            WHERE status_karyawan != 'Non-Aktif'
        ) AS k
        WHERE k.tgl_lahir_date IS NOT NULL
        HAVING tanggal_perayaan BETWEEN DATE_SUB(CURDATE(), INTERVAL 5 DAY) AND CURDATE()
        ORDER BY tanggal_perayaan DESC
    ";

    $resUltah = $conn->query($sqlUltahRange);
    if ($resUltah) {
        while ($u = $resUltah->fetch_assoc()) {
            if (empty($u['tanggal_perayaan'])) continue;

            $tglPer = $u['tanggal_perayaan'];
            $dKey = date('Y-m-d', strtotime($tglPer));

            if (!isset($timelineByDate[$dKey])) continue;

            $tglLahirDate = !empty($u['tgl_lahir_date']) ? $u['tgl_lahir_date'] : ($u['tanggal_lahir'] ?? '');
            $tahunLahir   = $tglLahirDate ? (int)date('Y', strtotime($tglLahirDate)) : 0;
            $tahunPer     = (int)date('Y', strtotime($tglPer));

            $umurTxt = '';
            if ($tahunLahir > 0) {
                $umurTxt = " • " . max(0, $tahunPer - $tahunLahir) . " th";
            }

            // ✅ Ambil komentar ucapan ultah
            $karyawanId = (int)($u['id'] ?? 0);
            $komentarList = [];
            if ($karyawanId > 0) {
                try {
                    // Cek apakah tabel ucapan_ultah ada
                    $tableCheck = $conn->query("SHOW TABLES LIKE 'ucapan_ultah'");
                    if ($tableCheck && $tableCheck->num_rows > 0) {
                        $stKom = $conn->prepare("
                            SELECT u.komentar, k2.nama
                            FROM ucapan_ultah u
                            JOIN karyawan k2 ON k2.id = u.pengirim_id
                            WHERE u.penerima_id = ? AND u.tahun = ?
                            ORDER BY u.created_at ASC
                            LIMIT 20
                        ");
                        if ($stKom) {
                            $stKom->bind_param('ii', $karyawanId, $tahunPer);
                            $stKom->execute();
                            $rsKom = $stKom->get_result();
                            while ($kom = $rsKom->fetch_assoc()) {
                                $komentarList[] = $kom;
                            }
                            $rsKom->free();
                            $stKom->close();
                        }
                    }
                } catch (Throwable $ekKom) {}
            }

            $timelineByDate[$dKey][] = [
                'type'           => 'ultah',
                'title'          => (string)($u['nama'] ?? ''),
                'subtitle'       => ((string)($u['jabatan'] ?? 'Karyawan')) . $umurTxt,
                'meta'           => 'Ulang Tahun',
                'karyawan_id'    => $karyawanId,
                'tahun_perayaan' => $tahunPer,
                'komentar'       => $komentarList,
            ];
        }
        $resUltah->free();
    }
} catch (Throwable $e) {}

// Urutkan dalam tiap hari: izin dulu, baru ultah
foreach ($timelineByDate as $d => &$items) {
    usort($items, function($a, $b){
        $pa = ($a['type'] === 'izin') ? 0 : 1;
        $pb = ($b['type'] === 'izin') ? 0 : 1;
        return $pa <=> $pb;
    });
}
unset($items);
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <title>GREAT Dashboard</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
    <link rel="icon" href="logo.webp" />
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        /* Modern Premium CSS Reset & Variables */
        :root {
            --primary: #4f46e5; /* Indigo 600 */
            --primary-light: #e0e7ff; /* Indigo 100 */
            --primary-dark: #3730a3; /* Indigo 800 */
            --secondary: #ec4899; /* Pink 500 */
            --accent: #8b5cf6; /* Violet 500 */
            --bg-base: #f4f4f5; /* Zinc 100 */
            --surface: #ffffff;
            --text-main: #0f172a; /* Slate 900 */
            --text-muted: #64748b; /* Slate 500 */
            --border: #f1f5f9; /* Slate 100 */
            --radius-lg: 28px;
            --radius-md: 20px;
            --radius-sm: 14px;
            --shadow-soft: 0 12px 40px -10px rgba(0,0,0,0.06);
            --shadow-glow: 0 0 25px rgba(79, 70, 229, 0.4);
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        
        body { 
            font-family: 'Inter', sans-serif; 
            background: var(--bg-base); 
            color: var(--text-main); 
            min-height: 100vh; 
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
        }
        
        h1, h2, h3, .brand-pill, .timer-time, .card-value, .menu-title, .timeline-title {
            font-family: 'Outfit', sans-serif;
        }

        ::-webkit-scrollbar { width: 0; background: transparent; }
        
        .app-wrap { max-width: 420px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; padding-bottom: 120px; position: relative;}
        
        /* Decorative Background */
        .app-wrap::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0; height: 380px;
            background: linear-gradient(135deg, rgba(79,70,229,0.15) 0%, rgba(236,72,153,0.1) 100%);
            border-bottom-left-radius: 50px; border-bottom-right-radius: 50px;
            z-index: -1;
            animation: bgFloat 10s ease-in-out infinite alternate;
        }
        @keyframes bgFloat {
            0% { transform: translateY(0) scale(1); opacity: 0.8; }
            100% { transform: translateY(-10px) scale(1.05); opacity: 1; }
        }

        /* TOP BAR */
        .topbar { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; }
        .topbar-month { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 800; color: var(--text-main); letter-spacing: -0.5px;}
        .topbar-month svg { color: var(--primary); width: 22px; height: 22px; }
        .brand-pill { 
            background: rgba(255,255,255,0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
            color: var(--primary-dark); font-size: 11px; font-weight: 800; letter-spacing: 1.5px; 
            padding: 8px 14px; border-radius: 999px; box-shadow: 0 8px 20px rgba(79,70,229,0.15);
            border: 1px solid rgba(255,255,255,0.8); text-transform: uppercase;
        }

        /* CALENDAR STRIP */
        .cal-strip { padding: 4px 24px 20px; overflow-x: auto; scroll-behavior: smooth; }
        .cal-inner { display: flex; gap: 10px; width: max-content; }
        .cal-day { 
            display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; 
            width: 48px; height: 64px; border-radius: var(--radius-md); cursor: pointer; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            background: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.7);
            backdrop-filter: blur(8px);
        }
        .cal-day:hover { background: var(--surface); transform: translateY(-4px); box-shadow: var(--shadow-soft); }
        .cal-day.active { 
            background: linear-gradient(135deg, var(--primary), var(--accent)); color: white;
            box-shadow: 0 10px 25px -5px rgba(79,70,229,0.5); border: none; transform: translateY(-2px);
        }
        .cal-day-num { font-size: 16px; font-weight: 800; color: var(--text-main); transition: color 0.3s; font-family: 'Outfit', sans-serif;}
        .cal-day.active .cal-day-num { color: white; }
        .cal-day-name { font-size: 9px; font-weight: 700; letter-spacing: 1px; color: var(--text-muted); text-transform: uppercase; transition: color 0.3s;}
        .cal-day.active .cal-day-name { color: rgba(255,255,255,0.95); }

        /* SECTION CARDS */
        .section-cards { padding: 0 24px; display: flex; flex-direction: column; gap: 12px; }
        .glass-card { 
            background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
            border-radius: 20px; padding: 16px; display: flex; align-items: center; gap: 12px; 
            box-shadow: 0 12px 30px -10px rgba(0,0,0,0.05); border: 1px solid rgba(255,255,255,1);
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease;
        }
        .glass-card:hover { transform: translateY(-3px) scale(1.01); box-shadow: 0 16px 35px -10px rgba(0,0,0,0.08); }
        
        .card-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative; overflow: hidden;}
        .card-icon::after { content: ''; position: absolute; inset: 0; background: currentColor; opacity: 0.15; }
        .card-icon svg { z-index: 1; width: 22px; height: 22px; }
        .icon-gradient { background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; box-shadow: 0 6px 15px rgba(79,70,229,0.25); }
        .icon-gradient::after { display: none; }
        
        .card-body { flex: 1; min-width: 0; }
        .card-label { font-size: 10px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
        .card-value { font-size: 16px; font-weight: 800; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.5px;}
        .card-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; font-weight: 600;}
        
        .status-badge { 
            font-size: 11px; font-weight: 800; padding: 6px 12px; border-radius: 999px; flex-shrink: 0;
            display: flex; align-items: center; gap: 6px; letter-spacing: 0.5px;
        }
        .status-badge::before { content: ''; display: block; width: 6px; height: 6px; border-radius: 50%; background: currentColor; box-shadow: 0 0 8px currentColor;}
        .badge-green  { background: rgba(16, 185, 129, 0.15); color: #059669; }
        .badge-orange { background: rgba(245, 158, 11, 0.15); color: #d97706; }
        .badge-purple { background: rgba(139, 92, 246, 0.15); color: #7c3aed; }
        .badge-red    { background: rgba(239, 68, 68, 0.15); color: #dc2626; }
        .badge-blue   { background: rgba(59, 130, 246, 0.15); color: #2563eb; }

        /* MODERN DIGITAL CLOCK */
        .timer-section { padding: 16px 20px 8px; display: flex; flex-direction: column; align-items: center; position: relative;}
        .clock-card {
            background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            border-radius: 24px; padding: 16px 20px 20px; width: 100%; max-width: 260px;
            box-shadow: 0 12px 35px -10px rgba(79,70,229,0.12), inset 0 0 0 1px rgba(255,255,255,0.8);
            display: flex; flex-direction: column; align-items: center; position: relative; overflow: hidden;
            margin: 0 auto;
        }
        .clock-card::before {
            content: ''; position: absolute; top: -40px; right: -40px; width: 120px; height: 120px;
            background: radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%); border-radius: 50%; pointer-events: none;
        }
        .clock-header {
            display: flex; align-items: center; gap: 6px; margin-bottom: 8px; z-index: 1;
        }
        .pulse-dot {
            width: 8px; height: 8px; border-radius: 50%; background: #10b981;
            box-shadow: 0 0 10px rgba(16,185,129,0.6); animation: blink 2s infinite;
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        #timerTopLabel {
            font-size: 10px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.2px;
        }
        .clock-time-wrap {
            display: flex; align-items: baseline; justify-content: center; gap: 4px; z-index: 1; margin-bottom: 12px;
        }
        .clock-time {
            font-size: 42px; font-weight: 800; letter-spacing: -1.5px; line-height: 1;
            background: linear-gradient(135deg, var(--primary-dark), var(--secondary));
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            font-feature-settings: "tnum"; font-variant-numeric: tabular-nums;
        }
        .clock-sec {
            font-size: 18px; font-weight: 800; color: var(--secondary); opacity: 0.9;
            font-feature-settings: "tnum"; font-variant-numeric: tabular-nums;
            margin-bottom: 6px;
        }
        .clock-footer {
            display: flex; flex-direction: column; align-items: center; gap: 8px; z-index: 1;
        }
        #timerSubLabel {
            font-size: 12px; font-weight: 700; color: var(--text-muted);
        }
        .clock-pill {
            display: flex; align-items: center; gap: 6px; background: rgba(79,70,229,0.08); 
            color: var(--primary-dark); font-size: 12px; font-weight: 800; padding: 6px 16px; 
            border-radius: 999px; border: 1px solid rgba(79,70,229,0.15);
        }
        .clock-progress-bg {
            position: absolute; bottom: 0; left: 0; width: 100%; height: 6px;
            background: rgba(79,70,229,0.1);
        }
        .clock-progress-bar {
            height: 100%; background: linear-gradient(90deg, var(--primary), var(--secondary));
            width: 0%; transition: width 1s linear; border-top-right-radius: 6px; border-bottom-right-radius: 6px;
        }

        /* CTA BUTTON */
        .cta-wrap { width: 100%; margin-top: 20px; }
        .cta-btn { 
            display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px; 
            font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 800; letter-spacing: 1px;
            border-radius: 20px; border: none; cursor: pointer; text-decoration: none; 
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: relative; overflow: hidden;
        }
        .cta-btn::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); transform: translateX(-100%); transition: transform 0.6s ease; }
        .cta-btn:hover::after { transform: translateX(100%); }
        .cta-btn:hover { transform: translateY(-4px) scale(1.02); }
        .cta-btn:active { transform: scale(0.95); }
        
        .cta-primary { background: linear-gradient(135deg, var(--primary), var(--accent)); color: white; box-shadow: 0 15px 35px -5px rgba(79,70,229,0.5); border: 1px solid rgba(255,255,255,0.2);}
        .cta-danger  { background: linear-gradient(135deg, #f43f5e, #be123c); color: white; box-shadow: 0 15px 35px -5px rgba(244,63,94,0.5); border: 1px solid rgba(255,255,255,0.2);}
        .cta-disabled { background: var(--border); color: var(--text-muted); cursor: not-allowed; box-shadow: none;}

        /* QUICK MENU */
        .menu-section { padding: 16px 24px; }
        .menu-title { font-size: 18px; font-weight: 800; color: var(--text-main); margin-bottom: 20px; letter-spacing: -0.5px;}
        .menu-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px 12px; }
        .menu-item { 
            background: rgba(255,255,255,0.6); backdrop-filter: blur(12px); border-radius: var(--radius-md); 
            padding: 16px 8px; display: flex; flex-direction: column; align-items: center; gap: 10px; 
            cursor: pointer; border: 1px solid rgba(255,255,255,0.9); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: relative; 
            font-family: inherit; box-shadow: 0 8px 20px rgba(0,0,0,0.03);
        }
        .menu-item:hover { background: var(--surface); transform: translateY(-5px) scale(1.05); box-shadow: 0 15px 30px rgba(0,0,0,0.08); border-color: white;}
        .menu-item:active { transform: scale(0.95); }
        
        .menu-item-icon { 
            width: 48px; height: 48px; border-radius: 16px; display: flex; align-items: center; justify-content: center; 
            background: white; box-shadow: 0 6px 15px rgba(0,0,0,0.06); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: relative; overflow: hidden;
        }
        .menu-item-icon::after { content: ''; position: absolute; inset: 0; background: currentColor; opacity: 0.15; }
        .menu-item:hover .menu-item-icon { transform: scale(1.15) rotate(5deg); }
        .menu-item-icon svg { z-index: 1; width: 24px; height: 24px; }
        .menu-item-label { font-size: 11px; font-weight: 700; color: var(--text-main); text-align: center; line-height: 1.2; }
        
        .ic-green { color: #10b981; } .ic-orange { color: #f59e0b; } .ic-blue { color: #3b82f6; } 
        .ic-pink { color: #ec4899; } .ic-purple { color: #8b5cf6; } .ic-slate { color: #64748b; }
        .ic-teal { color: #14b8a6; } .ic-red { color: #f43f5e; }

        .menu-badge { position: absolute; top: -10px; right: -10px; min-width: 26px; height: 26px; padding: 0 8px; border-radius: 999px; background: linear-gradient(135deg, #ef4444, #b91c1c); color: white; font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 15px rgba(239,68,68,0.5); border: 2px solid white; z-index: 2;}

        /* TIMELINE */
        .timeline-section { padding: 24px; }
        .timeline-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
        .timeline-title { font-size: 18px; font-weight: 800; color: var(--text-main); letter-spacing: -0.5px;}
        .timeline-sub { font-size: 13px; color: var(--text-muted); margin-top: 6px; font-weight: 600;}
        .tl-date-badge { font-size: 12px; font-weight: 800; color: var(--primary-dark); background: rgba(79,70,229,0.1); padding: 8px 16px; border-radius: 999px; border: 1px solid rgba(79,70,229,0.2);}
        
        .tl-day-block { margin-bottom: 30px; position: relative;}
        .tl-day-label { font-size: 14px; font-weight: 800; color: var(--text-main); margin-bottom: 16px; display: flex; align-items: center; gap: 12px; }
        .tl-today-tag { font-size: 10px; font-weight: 800; color: white; background: linear-gradient(135deg, var(--primary), var(--secondary)); padding: 4px 10px; border-radius: 999px; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 4px 12px rgba(79,70,229,0.4);}
        
        .tl-item { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 16px; position: relative;}
        .tl-dot-col { display: flex; flex-direction: column; align-items: center; padding-top: 12px; height: 100%; position: absolute; left: 0; top: 0; bottom: -16px; width: 14px;}
        .tl-dot { width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 0 4px rgba(255,255,255,0.9); z-index: 1;}
        .tl-line { width: 3px; height: 100%; background: linear-gradient(to bottom, rgba(79,70,229,0.25), transparent); margin-top: 6px; border-radius: 999px;}
        
        .tl-card { 
            flex: 1; min-width: 0; background: rgba(255,255,255,0.8); backdrop-filter: blur(12px); border-radius: var(--radius-lg); padding: 20px; 
            box-shadow: 0 8px 25px rgba(0,0,0,0.04); margin-left: 36px; border: 1px solid rgba(255,255,255,1); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease;
        }
        .tl-card:hover { transform: translateX(6px) translateY(-2px); box-shadow: 0 12px 30px rgba(0,0,0,0.08);}
        
        .tl-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
        .tl-name { font-size: 16px; font-family: 'Outfit', sans-serif; font-weight: 800; color: var(--text-main); }
        .tl-meta { font-size: 13px; color: var(--text-muted); font-weight: 600;}
        .tl-right { font-size: 12px; font-weight: 800; color: var(--text-muted); }
        .empty-tl { background: rgba(79,70,229,0.03); padding: 24px; font-size: 13px; font-weight: 700; color: var(--text-muted); text-align: center; border: 2px dashed rgba(79,70,229,0.2); border-radius: var(--radius-lg); margin-left: 36px;}

        /* BIRTHDAY CARD */
        .bd-card { background: linear-gradient(135deg, #fff1f2 0%, #ffedd5 100%); border: 1px solid #fecdd3; position: relative; overflow: hidden;}
        .bd-card::before { content: '🎉'; position: absolute; right: -25px; top: -25px; font-size: 120px; opacity: 0.15; transform: rotate(15deg); pointer-events: none;}
        .bd-badge { display: inline-flex; align-items: center; gap: 8px; background: white; color: #e11d48; font-size: 12px; font-weight: 800; padding: 8px 16px; border-radius: 999px; box-shadow: 0 6px 15px rgba(225,29,72,0.15); border: 1px solid #ffe4e6;}
        .bd-wishes { font-size: 14px; color: #be123c; margin-top: 16px; line-height: 1.6; font-weight: 600;}
        
        .bd-comments { margin-top: 20px; padding-top: 20px; border-top: 2px dashed rgba(254,205,211,0.6); display: flex; flex-direction: column; gap: 12px; }
        .bd-comment-item { background: rgba(255,255,255,0.95); border-radius: 16px; padding: 14px 18px; font-size: 13px; color: #4c1d95; box-shadow: 0 4px 12px rgba(0,0,0,0.05); font-weight: 500;}
        .bd-comment-name { font-weight: 800; color: #e11d48; display: block; margin-bottom: 6px;}
        
        .bd-form { margin-top: 20px; display: flex; gap: 12px; align-items: center; background: rgba(255,255,255,0.95); padding: 8px; border-radius: 999px; box-shadow: 0 8px 20px rgba(225,29,72,0.12); border: 1px solid #ffe4e6;}
        .bd-input { flex: 1; background: transparent; border: none; padding: 12px 18px; font-size: 14px; color: var(--text-main); outline: none; font-family: inherit; font-weight: 600;}
        .bd-input::placeholder { color: #fca5a5; }
        .bd-send-btn { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #f43f5e, #be123c); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 6px 15px rgba(225,29,72,0.4);}
        .bd-send-btn:hover { transform: scale(1.1) rotate(-10deg); box-shadow: 0 10px 20px rgba(225,29,72,0.6); }

        /* BOTTOM NAV */
        .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; z-index: 100; display: flex; justify-content: center; padding: 0 16px 16px; pointer-events: none; }
        .bottom-nav-inner { 
            pointer-events: auto; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(32px); -webkit-backdrop-filter: blur(32px);
            border-radius: 30px; box-shadow: 0 15px 40px rgba(0,0,0,0.1); padding: 6px 20px; 
            display: flex; align-items: center; border: 1px solid rgba(255,255,255,0.9); 
            width: 100%; max-width: 380px; justify-content: space-between; position: relative;
        }
        .nav-btn { 
            display: flex; flex-direction: column; align-items: center; gap: 4px; border: none; background: none; 
            cursor: pointer; color: var(--text-muted); font-size: 9px; font-weight: 800; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); padding: 6px; font-family: inherit;
        }
        .nav-btn:hover { color: var(--primary); transform: translateY(-3px);}
        .nav-btn.active { color: var(--primary); }
        .nav-btn svg { width: 20px; height: 20px; transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .nav-btn.active svg { transform: scale(1.15); stroke-width: 2.5; filter: drop-shadow(0 4px 6px rgba(79,70,229,0.3));}
        
        .nav-center-btn { 
            width: 56px; height: 56px; border-radius: 28px; background: linear-gradient(135deg, var(--primary), var(--accent)); 
            border: 5px solid #f4f4f5; display: flex; align-items: center; justify-content: center; 
            cursor: pointer; box-shadow: 0 8px 25px rgba(79,70,229,0.4); margin-top: -28px; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); z-index: 10;
        }
        .nav-center-btn svg { width: 24px; height: 24px; }
        .nav-center-btn:hover { transform: translateY(-4px) scale(1.05); box-shadow: 0 12px 30px rgba(79,70,229,0.5); }

        /* NOTIFICATION & LOGOUT MODALS */
        .modal-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.4s ease; }
        .modal-overlay.show { opacity: 1; pointer-events: auto; }
        .modal-box { background: var(--surface); border-radius: 40px; padding: 48px 32px; width: 90%; max-width: 380px; text-align: center; transform: scale(0.9) translateY(30px); transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.3); border: 1px solid rgba(255,255,255,0.8);}
        .modal-overlay.show .modal-box { transform: scale(1) translateY(0); }
        
        .modal-icon { width: 88px; height: 88px; border-radius: 28px; display: flex; align-items: center; justify-content: center; margin: 0 auto 28px; position: relative; overflow: hidden;}
        .modal-icon::after { content: ''; position: absolute; inset: 0; background: currentColor; opacity: 0.15; }
        .modal-icon svg { z-index: 1; width: 44px; height: 44px;}
        
        .modal-title { font-size: 26px; font-family: 'Outfit', sans-serif; font-weight: 800; color: var(--text-main); margin-bottom: 16px; letter-spacing: -0.5px;}
        .modal-desc { font-size: 16px; color: var(--text-muted); line-height: 1.6; margin-bottom: 40px; font-weight: 600;}
        
        .modal-btn { width: 100%; padding: 20px; background: var(--text-main); color: white; font-size: 18px; font-weight: 800; border: none; border-radius: var(--radius-lg); cursor: pointer; font-family: inherit; transition: all 0.3s ease; box-shadow: 0 15px 30px rgba(0,0,0,0.15);}
        .modal-btn:hover { background: #334155; transform: translateY(-2px); }
        
        .modal-actions { display: flex; gap: 20px; }
        .btn-cancel { flex: 1; padding: 20px; background: var(--border); color: var(--text-main); font-weight: 800; font-size: 18px; border-radius: var(--radius-lg); border: none; cursor: pointer; transition: all 0.3s ease; font-family: inherit;}
        .btn-cancel:hover { background: #e2e8f0; transform: translateY(-2px); }
        .btn-confirm { flex: 1; padding: 20px; background: linear-gradient(135deg, #ef4444, #b91c1c); color: white; font-weight: 800; font-size: 18px; border-radius: var(--radius-lg); border: none; cursor: pointer; transition: all 0.3s ease; text-decoration: none; display: flex; justify-content: center; align-items: center; box-shadow: 0 15px 30px rgba(239,68,68,0.3);}
        .btn-confirm:hover { transform: translateY(-2px); box-shadow: 0 20px 40px rgba(239,68,68,0.4); }

        /* ANIMATIONS */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .anim { opacity: 0; animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .d-1 { animation-delay: 0.1s; } .d-2 { animation-delay: 0.2s; } .d-3 { animation-delay: 0.3s; }
        .d-4 { animation-delay: 0.4s; } .d-5 { animation-delay: 0.5s; } .d-6 { animation-delay: 0.6s; }
        
        @keyframes menuPop { 0%{transform:translateY(15px) scale(.9);opacity:0} 100%{transform:translateY(0) scale(1);opacity:1} }
        .mpop { opacity:0; animation: menuPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .mpop:nth-child(1){animation-delay:.1s} .mpop:nth-child(2){animation-delay:.15s}
        .mpop:nth-child(3){animation-delay:.2s} .mpop:nth-child(4){animation-delay:.25s}
        .mpop:nth-child(5){animation-delay:.3s} .mpop:nth-child(6){animation-delay:.35s}
        .mpop:nth-child(7){animation-delay:.4s} .mpop:nth-child(8){animation-delay:.45s}
        .mpop:nth-child(9){animation-delay:.5s} .mpop:nth-child(10){animation-delay:.55s}

        @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 0 0 rgba(79,70,229,0.5); } 50% { box-shadow: 0 0 0 15px rgba(79,70,229,0); } }
        .pulse-btn { animation: pulseGlow 2.5s infinite; }
    </style>
</head>
<body>
<div class="app-wrap">

    <!-- TOP BAR -->
    <div class="topbar anim d-1">
        <div class="topbar-month">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <rect x="3" y="4" width="18" height="18" rx="4"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <?php
            $bulan_en = [1=>'January',2=>'February',3=>'March',4=>'April',5=>'May',6=>'June',
                         7=>'July',8=>'August',9=>'September',10=>'October',11=>'November',12=>'December'];
            echo e($bulan_en[(int)date('m')] . ' ' . date('Y'));
            ?>
        </div>
        <div class="brand-pill">GREAT ABSENSI</div>
    </div>

    <!-- CALENDAR STRIP -->
    <div class="cal-strip anim d-1" id="calStrip">
        <div class="cal-inner">
            <?php
            $days_map = [1=>'MON',2=>'TUE',3=>'WED',4=>'THU',5=>'FRI',6=>'SAT',7=>'SUN'];
            for ($ci = -3; $ci <= 7; $ci++):
                $d_ts   = strtotime("{$ci} day");
                $d_ymd  = date('Y-m-d', $d_ts);
                $d_num  = date('j', $d_ts);
                $d_dow  = $days_map[(int)date('N', $d_ts)];
                $active = ($d_ymd === date('Y-m-d'));
            ?>
            <div class="cal-day <?= $active ? 'active' : '' ?>" data-date="<?= e($d_ymd) ?>">
                <span class="cal-day-num"><?= $d_num ?></span>
                <span class="cal-day-name"><?= $d_dow ?></span>
            </div>
            <?php endfor; ?>
        </div>
    </div>

    <!-- CARDS -->
    <div class="section-cards">
        <!-- User card -->
        <div class="glass-card anim d-2">
            <div class="card-icon icon-gradient">
                <?php
                $fotoFile2   = $foto_user ?? '';
                $fotoUrl2    = "uploads/profile/" . rawurlencode($fotoFile2);
                $fotoFsPath2 = __DIR__ . "/uploads/profile/" . $fotoFile2;
                $foto_ada2   = (!empty($fotoFile2) && file_exists($fotoFsPath2));
                ?>
                <?php if ($foto_ada2): ?>
                    <img src="<?= e($fotoUrl2) ?>" alt="Foto"
                         style="width:100%;height:100%;border-radius:12px;object-fit:cover;"
                         onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                    <div style="display:none;align-items:center;justify-content:center;width:100%;height:100%;border-radius:12px;font-size:16px;font-weight:800;font-family:'Outfit',sans-serif;">
                        <?= e($inisial) ?>
                    </div>
                <?php else: ?>
                    <div style="font-size:16px;font-weight:800;font-family:'Outfit',sans-serif;"><?= e($inisial) ?></div>
                <?php endif; ?>
            </div>
            <div class="card-body">
                <div class="card-label">Employee</div>
                <div class="card-value"><?= e($nama_user) ?></div>
                <div class="card-sub"><?= e($jabatan) ?></div>
            </div>
        </div>

        <!-- Check-in card -->
        <?php if ($status_tombol !== 'belum'): ?>
        <div class="glass-card anim d-3">
            <div class="card-icon ic-purple">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
            </div>
            <div class="card-body">
                <div class="card-label">Check In Status</div>
                <div class="card-value"><?= e($jam_masuk_db) ?> WIB</div>
                <div class="card-sub"><?= e($ket_masuk) ?></div>
            </div>
            <?php if ($status_kehadiran === 'Terlambat'): ?>
                <span class="status-badge badge-red">Terlambat</span>
            <?php elseif ($status_kehadiran === 'Tepat Waktu'): ?>
                <span class="status-badge badge-green">Tepat Waktu</span>
            <?php elseif ($status_tombol === 'selesai'): ?>
                <span class="status-badge badge-purple">Selesai</span>
            <?php else: ?>
                <span class="status-badge badge-blue">Di Kantor</span>
            <?php endif; ?>
        </div>
        <?php endif; ?>

        <!-- Shift card -->
        <div class="glass-card anim d-3">
            <div class="card-icon ic-blue">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <div class="card-body">
                <div class="card-label">Shift Kerja</div>
                <div class="card-value"><?= $isLibur ? 'Libur' : (e($shiftMasuk) . ' – ' . e($shiftPulang)) ?></div>
                <div class="card-sub"><?= e($shiftLabel) ?></div>
            </div>
            <?php if ($isLibur): ?>
                <span class="status-badge badge-orange">Libur</span>
            <?php elseif ($status_tombol === 'selesai'): ?>
                <span class="status-badge badge-green">Selesai</span>
            <?php endif; ?>
        </div>
    </div>

    <!-- DIGITAL CLOCK CARD -->
    <div class="timer-section anim d-4">
        <div class="clock-card">
            <div class="clock-header">
                <span class="pulse-dot"></span>
                <span id="timerTopLabel">Waktu Sekarang</span>
            </div>
            <div class="clock-time-wrap">
                <span class="clock-time" id="timerDisplay">--:--</span>
                <span class="clock-sec" id="timerSec">--</span>
            </div>
            <div class="clock-footer">
                <span id="timerSubLabel">Zona WIB</span>
                <div class="clock-pill" id="timerPillContainer">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM13 12H17V14H11V7H13V12Z"/></svg>
                    <span id="timerPillText">—</span>
                </div>
            </div>
            <div class="clock-progress-bg">
                <div class="clock-progress-bar" id="timerBar"></div>
            </div>
        </div>

        <!-- CTA -->
        <div class="cta-wrap">
            <?php if ($status_tombol === 'belum'): ?>
                <a href="absen?tipe=masuk" class="cta-btn cta-primary pulse-btn">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="8"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 7v4.5l2.5 1.5"/></svg>
                    CLOCK IN SEKARANG
                </a>
            <?php elseif ($status_tombol === 'masuk'): ?>
                <a href="absen?tipe=pulang" class="cta-btn cta-danger pulse-btn">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
                    CLOCK OUT SEKARANG
                </a>
            <?php else: ?>
                <button class="cta-btn cta-disabled" disabled>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <?= $isLibur ? 'HARI INI LIBUR' : 'ANDA SUDAH SELESAI' ?>
                </button>
            <?php endif; ?>
        </div>
    </div>

    <!-- QUICK MENU -->
    <div class="menu-section anim d-5">
        <h3 class="menu-title">Quick Actions</h3>
        <div class="menu-grid">
            <button class="menu-item mpop" onclick="location.href='mengaji'">
                <div class="menu-item-icon ic-green">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
                </div>
                <span class="menu-item-label">HabitQ</span>
            </button>

            <button class="menu-item mpop" onclick="location.href='riwayat_absen'">
                <div class="menu-item-icon ic-orange">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                <span class="menu-item-label">Riwayat</span>
            </button>

            <button class="menu-item mpop" onclick="location.href='riwayat_izin'">
                <div class="menu-item-icon ic-blue">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <span class="menu-item-label">Izin</span>
            </button>

            <button class="menu-item mpop" onclick="window.open('https://pengajuan.ptslu.id/login','_blank')">
                <div class="menu-item-icon ic-teal">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-3-3v6M7 4h10a2 2 0 012 2v9.5a2 2 0 01-.586 1.414l-2.5 2.5A2 2 0 0114.5 20H7a2 2 0 01-2-2V6a2 2 0 012-2z"/></svg>
                </div>
                <span class="menu-item-label">Pengajuan</span>
            </button>

            <button class="menu-item mpop" onclick="location.href='lembur'">
                <div class="menu-item-icon ic-red">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                </div>
                <span class="menu-item-label">Lembur</span>
            </button>

            <button class="menu-item mpop" onclick="location.href='karyawan'">
                <div class="menu-item-icon ic-purple">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                </div>
                <span class="menu-item-label">Karyawan</span>
            </button>

            <button class="menu-item mpop" onclick="location.href='peraturan_perusahaan'">
                <div class="menu-item-icon ic-slate">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                </div>
                <span class="menu-item-label">Peraturan</span>
            </button>

            <?php if ($isManager): ?>
            <button class="menu-item mpop" onclick="location.href='tim_saya'">
                <div class="menu-item-icon ic-teal">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M16 3.13a3 3 0 010 5.75M20 20v-1a4 4 0 00-3-3.87M9 7a3 3 0 110 6 3 3 0 010-6z"/></svg>
                </div>
                <span class="menu-item-label">Tim Saya</span>
            </button>

            <button class="menu-item mpop" onclick="location.href='aproval_izin'">
                <div class="menu-item-icon ic-orange">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6M7 3h7l3 3v15a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"/></svg>
                </div>
                <span class="menu-item-label">App. Izin</span>
                <?php if (!empty($pendingIzinCount)): ?>
                    <span class="menu-badge"><?= (int)$pendingIzinCount ?></span>
                <?php endif; ?>
            </button>

            <button class="menu-item mpop" onclick="location.href='aproval_lembur'">
                <div class="menu-item-icon ic-red">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 7v5l3 2"/></svg>
                </div>
                <span class="menu-item-label">App. Lembur</span>
                <?php if (!empty($pendingLemburCount)): ?>
                    <span class="menu-badge"><?= (int)$pendingLemburCount ?></span>
                <?php endif; ?>
            </button>
            <?php endif; ?>
        </div>
    </div>

    <!-- TIMELINE -->
    <div class="timeline-section anim d-6">
        <div class="timeline-header">
            <div>
                <h2 class="timeline-title">Timeline</h2>
                <p class="timeline-sub"><?= $isManager ? 'Izin Pending Tim & Ulang Tahun' : 'Cuti/Izin & Ulang Tahun' ?></p>
            </div>
            <span class="tl-date-badge"><?= e(date('d M Y')) ?></span>
        </div>

        <?php
        $hasAny2 = false;
        foreach ($timelineByDate as $_d => $_it) { if (!empty($_it)) { $hasAny2 = true; break; } }
        $hari_arr_tl  = ['Sunday'=>'Minggu','Monday'=>'Senin','Tuesday'=>'Selasa','Wednesday'=>'Rabu','Thursday'=>'Kamis','Friday'=>'Jumat','Saturday'=>'Sabtu'];
        $bulan_arr_tl = [1=>'Jan',2=>'Feb',3=>'Mar',4=>'Apr',5=>'Mei',6=>'Jun',7=>'Jul',8=>'Ags',9=>'Sep',10=>'Okt',11=>'Nov',12=>'Des'];
        ?>

        <?php if (!$hasAny2): ?>
            <div class="empty-tl">
                <svg style="margin:0 auto 8px; color:var(--text-muted); opacity:0.5;" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Tidak ada agenda dalam 6 hari terakhir.
            </div>
        <?php else: ?>
        <?php foreach ($timelineByDate as $tlD => $tlItems): ?>
            <?php
            $tlTs    = strtotime($tlD);
            $tlLabel = $hari_arr_tl[date('l',$tlTs)].', '.date('d',$tlTs).' '.$bulan_arr_tl[(int)date('m',$tlTs)].' '.date('Y',$tlTs);
            ?>
            <div class="tl-day-block">
                <div class="tl-day-label">
                    <span><?= e($tlLabel) ?></span>
                    <?php if ($tlD === date('Y-m-d')): ?>
                    <span class="tl-today-tag">Hari ini</span>
                    <?php endif; ?>
                </div>

                <?php if (empty($tlItems)): ?>
                    <div class="empty-tl" style="padding: 12px; margin-bottom: 8px;">Tidak ada agenda.</div>
                <?php else: ?>
                    <?php foreach ($tlItems as $tlIt): ?>

                        <?php if ($tlIt['type'] === 'ultah'): ?>
                        <!-- Birthday -->
                        <div class="tl-item">
                            <div class="tl-dot-col">
                                <div class="tl-dot" style="background:#F43F5E;"></div>
                                <div class="tl-line" style="background: linear-gradient(to bottom, rgba(244,63,94,0.2), transparent);"></div>
                            </div>
                            <div class="tl-card bd-card" style="margin-bottom: 8px;">
                                <div class="tl-card-head">
                                    <span class="tl-name" style="color:#881337; font-size: 18px;"><?= e($tlIt['title']) ?></span>
                                    <span class="bd-badge">🎉 ULTAH</span>
                                </div>
                                <div class="bd-wishes">
                                    Semoga diberi kesehatan & rezeki yang lapang, doa terbaik selalu menyertai langkahmu. Happy Birthday! 🎂
                                </div>
                                <?php if (!empty($tlIt['komentar'])): ?>
                                <div class="bd-comments">
                                    <?php foreach ($tlIt['komentar'] as $kom): ?>
                                    <div class="bd-comment-item">
                                        <span class="bd-comment-name"><?= e(strtok($kom['nama'], ' ')) ?></span>
                                        <?= e($kom['komentar']) ?>
                                    </div>
                                    <?php endforeach; ?>
                                </div>
                                <?php endif; ?>
                                <div class="bd-form">
                                    <form action="actions/ucapan_ultah.php" method="POST" style="display:contents;">
                                        <input type="hidden" name="penerima_id" value="<?= (int)($tlIt['karyawan_id'] ?? 0) ?>">
                                        <input type="hidden" name="tahun" value="<?= (int)($tlIt['tahun_perayaan'] ?? date('Y')) ?>">
                                        <input class="bd-input" type="text" name="komentar" placeholder="Tulis ucapan selamat..." required maxlength="200">
                                        <button class="bd-send-btn" type="submit">
                                            <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>

                        <?php else: ?>
                        <!-- Izin/Cuti -->
                        <?php
                        $tlIsIzin  = ($tlIt['type'] === 'izin');
                        $tlDot     = $tlIsIzin ? '#3b82f6' : '#ec4899';
                        $tlBadge   = $tlIsIzin ? (($tlIt['badge'] ?? '') ?: 'CUTI/IZIN') : 'ULTAH';
                        $tlBadgeCl = $tlIsIzin ? 'badge-blue' : 'badge-red';
                        ?>
                        <div class="tl-item">
                            <div class="tl-dot-col">
                                <div class="tl-dot" style="background:<?= $tlDot ?>;"></div>
                                <div class="tl-line" style="background: linear-gradient(to bottom, <?= $tlDot ?>40, transparent);"></div>
                            </div>
                            <div class="tl-card" style="margin-bottom: 8px;">
                                <div class="tl-card-head">
                                    <span class="tl-name"><?= e($tlIt['title']) ?></span>
                                    <span class="status-badge <?= $tlBadgeCl ?>"><?= e($tlBadge) ?></span>
                                </div>
                                <div class="tl-meta"><?= e($tlIt['subtitle'] ?? '') ?></div>
                                <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px; padding-top:8px; border-top:1px dashed var(--border);">
                                    <span class="tl-meta" style="color: var(--text-main); font-weight:600;"><svg style="display:inline; margin-top:-2px;" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> <?= e($tlIt['meta'] ?? '') ?></span>
                                    <span class="tl-right"><?= ($tlIsIzin && isset($tlIt['badge']) && $tlIt['badge']==='PENDING') ? '⏳ Menunggu' : ($tlIsIzin ? '🔴 Tidak Masuk' : '🎉') ?></span>
                                </div>
                            </div>
                        </div>
                        <?php endif; ?>

                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        <?php endforeach; ?>
        <?php endif; ?>
    </div>

</div><!-- /.app-wrap -->

<!-- BOTTOM NAV -->
<nav class="bottom-nav">
    <div class="bottom-nav-inner">
        <button class="nav-btn active" onclick="location.href='dashboard'">
            <svg fill="currentColor" viewBox="0 0 24 24"><path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z"/><path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z"/></svg>
            <span>Home</span>
        </button>
        <button class="nav-btn" onclick="location.href='riwayat_izin'">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <span>Izin</span>
        </button>
        <button class="nav-center-btn" onclick="location.href='absen'">
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"/><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"/></svg>
        </button>
        <button class="nav-btn" onclick="location.href='profil'">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            <span>Profil</span>
        </button>
        <button class="nav-btn" onclick="openLogout()">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            <span>Keluar</span>
        </button>
    </div>
</nav>

<!-- NOTIFICATION MODAL -->
<div class="modal-overlay" id="notifModal">
    <div class="modal-box">
        <div class="modal-icon" id="notifIconBg">
            <svg id="notifIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"></svg>
        </div>
        <h3 class="modal-title" id="notifTitle">Info</h3>
        <p class="modal-desc" id="notifMessage"></p>
        <button class="modal-btn" onclick="closeNotif()">Mengerti, Tutup</button>
    </div>
</div>

<!-- LOGOUT MODAL -->
<div class="modal-overlay" id="logoutModal">
    <div class="modal-box">
        <div class="modal-icon" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
        </div>
        <h3 class="modal-title">Konfirmasi Keluar</h3>
        <p class="modal-desc">Apakah Anda yakin ingin keluar dari sesi aplikasi saat ini?</p>
        <div class="modal-actions">
            <button class="btn-cancel" onclick="closeLogout()">Batal</button>
            <a href="actions/logout.php" class="btn-confirm">Ya, Keluar</a>
        </div>
    </div>
</div>

<script>
const statusTombol       = <?= json_encode($status_tombol) ?>;
const shiftPulangJS      = <?= json_encode($shiftPulang ?: null) ?>;
const shiftMasukJS       = <?= json_encode($shiftMasuk ?: '08:00') ?>;
const isLiburJS          = <?= json_encode($isLibur) ?>;
const isManagerJS        = <?= json_encode((bool)$isManager) ?>;
const pendingIzinCountJS    = <?= json_encode((int)$pendingIzinCount) ?>;
const pendingLemburCountJS  = <?= json_encode((int)$pendingLemburCount) ?>;

// Clock and progress bar
const bar = document.getElementById('timerBar');

function parseHHMM(t) {
    const [h, m] = (t || '00:00').split(':').map(Number);
    return h * 3600 + m * 60;
}

function updateTimer() {
    const now    = new Date();
    const nowSec = now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds();
    const hh = String(now.getHours()).padStart(2,'0');
    const mm = String(now.getMinutes()).padStart(2,'0');
    const ss = String(now.getSeconds()).padStart(2,'0');

    const topLabel   = document.getElementById('timerTopLabel');
    const display    = document.getElementById('timerDisplay');
    const secDisplay = document.getElementById('timerSec');
    const subLabel   = document.getElementById('timerSubLabel');
    const pillText   = document.getElementById('timerPillText');

    if (isLiburJS) {
        topLabel.textContent = 'Status Hari Ini';
        display.textContent  = 'LIBUR';
        display.style.fontSize = '28px';
        if(secDisplay) secDisplay.style.display = 'none';
        subLabel.textContent = '';
        pillText.textContent = 'Selamat beristirahat 🌴';
        if(bar) bar.style.width = '0%';
        return;
    }

    if (statusTombol === 'masuk') {
        const endSec = parseHHMM(shiftPulangJS || '16:15');
        const diff   = endSec - nowSec;
        topLabel.textContent = 'Sisa Waktu Kerja';
        subLabel.textContent = 'Estimasi Pulang ' + (shiftPulangJS || '16:15');

        if (diff > 0) {
            const rh = Math.floor(diff / 3600);
            const rm = Math.floor((diff % 3600) / 60);
            const rs = diff % 60;
            display.textContent  = `${String(rh).padStart(2,'0')}:${String(rm).padStart(2,'0')}`;
            if(secDisplay) {
                secDisplay.textContent = `:${String(rs).padStart(2,'0')}`;
                secDisplay.style.display = 'inline';
            }
            display.style.fontSize = '36px';
            pillText.textContent = `${rh}j ${rm}m lagi`;

            const totalSec = parseHHMM(shiftPulangJS||'16:15') - parseHHMM(shiftMasukJS||'08:00');
            const elapsed  = Math.max(0, totalSec - diff);
            const ratio    = Math.min(1, Math.max(0, elapsed / totalSec));
            if(bar) bar.style.width = (ratio * 100) + '%';
        } else {
            display.textContent  = 'OVERTIME';
            display.style.fontSize = '28px';
            if(secDisplay) secDisplay.style.display = 'none';
            topLabel.textContent = 'Status';
            pillText.textContent = 'Shift sudah berakhir';
            if(bar) bar.style.width = '100%';
        }

    } else if (statusTombol === 'selesai') {
        topLabel.textContent = 'Status';
        display.textContent  = 'SELESAI';
        display.style.fontSize = '28px';
        if(secDisplay) secDisplay.style.display = 'none';
        subLabel.textContent = 'Anda sudah pulang';
        pillText.textContent = 'Sampai jumpa besok 👋';
        if(bar) bar.style.width = '100%';

    } else {
        // belum absen
        topLabel.textContent = 'Waktu Sekarang';
        display.textContent  = `${hh}:${mm}`;
        if(secDisplay) {
            secDisplay.textContent = `:${ss}`;
            secDisplay.style.display = 'inline';
        }
        display.style.fontSize = '42px';
        subLabel.textContent = 'Zona WIB';
        pillText.textContent = `Belum Clock In`;
        
        const totalSec = 24 * 3600;
        const ratio = nowSec / totalSec;
        if(bar) bar.style.width = (ratio * 100) + '%';
    }
}
setInterval(updateTimer, 1000);
updateTimer();

// Auto-scroll calendar to today
setTimeout(() => {
    const today = document.querySelector('.cal-day.active');
    if (today) {
        const strip = document.getElementById('calStrip');
        const scrollLeft = today.offsetLeft - (strip.clientWidth / 2) + (today.clientWidth / 2);
        strip.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
}, 300);

// â”€â”€ NOTIFICATION â”€â”€
const notifModal  = document.getElementById('notifModal');
const notifIconBg = document.getElementById('notifIconBg');
const notifIcon   = document.getElementById('notifIcon');

function showNotif({ judul, pesan, status }) {
    document.getElementById('notifTitle').textContent   = judul || 'Info';
    document.getElementById('notifMessage').textContent = pesan || '';
    notifIconBg.style.background = '';
    notifIcon.style.color = '';
    notifIcon.innerHTML = '';
    if (status === 'error' || status === 'telat') {
        notifIconBg.style.background = 'rgba(239, 68, 68, 0.1)'; notifIcon.style.color = '#ef4444';
        notifIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>';
    } else if (status === 'sukses') {
        notifIconBg.style.background = 'rgba(16, 185, 129, 0.1)'; notifIcon.style.color = '#10b981';
        notifIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>';
    } else {
        notifIconBg.style.background = 'rgba(59, 130, 246, 0.1)'; notifIcon.style.color = '#3b82f6';
        notifIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>';
    }
    notifModal.classList.add('show');
    history.replaceState(null, '', location.pathname);
}
function closeNotif() { notifModal.classList.remove('show'); }
notifModal.addEventListener('click', e => { if(e.target===notifModal) closeNotif(); });

const urlP = new URLSearchParams(location.search);
if (urlP.has('pesan')) showNotif({ judul:urlP.get('judul')||'Info', pesan:urlP.get('pesan'), status:urlP.get('status')||'info' });

<?php if ($flash_absen): ?>
const fOk = <?= json_encode((bool)($flash_absen['ok']??false)) ?>;
const fSt = <?= json_encode(!empty($flash_absen['ok']) ? ($flash_absen['status']??'sukses') : 'error') ?>;
let fJ = <?= json_encode($flash_absen['title']??'Info') ?>;
let fP = <?= json_encode($flash_absen['desc']??'') ?>;
if (fOk && fSt==='telat') { const tt=<?= json_encode($telat_text?:'') ?>; fJ='Terlambat'; fP=tt?`Maaf, Anda telat ${tt}.`:'Maaf, Anda terlambat.'; }
showNotif({ judul:fJ, pesan:fP, status:fSt });
<?php endif; ?>

if (isManagerJS) {
    const tot = (pendingIzinCountJS||0) + (pendingLemburCountJS||0);
    if (tot > 0) showNotif({ judul:'Menunggu Persetujuan', pesan:`Ada ${pendingIzinCountJS} izin/cuti dan ${pendingLemburCountJS} lembur yang perlu di-approve.`, status:'info' });
}

// â”€â”€ LOGOUT â”€â”€
const logoutModal = document.getElementById('logoutModal');
function openLogout()  { logoutModal.classList.add('show'); }
function closeLogout() { logoutModal.classList.remove('show'); }
logoutModal.addEventListener('click', e => { if(e.target===logoutModal) closeLogout(); });
function openModalLogout()  { openLogout(); }
function closeModalLogout() { closeLogout(); }
</script>
</body>
</html>

