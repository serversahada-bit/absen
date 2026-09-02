<?php
// mengaji.php — Input Mengaji Harian (MULTI / unlimited per hari) + Manual Juz (1-30) + Hal Mulai/Selesai + Ket
// + Fitur IZIN + RIWAYAT
// FIX WIB:
// 1) Paksa timezone PHP Asia/Jakarta
// 2) Paksa timezone session MySQL +07:00
// 3) Insert created_at dari PHP (WIB) agar konsisten walau server DB UTC

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
require 'config/database.php';

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
date_default_timezone_set('Asia/Jakarta');

function e($s){ return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

// ============================
// FIX: PAKSA TIMEZONE MYSQL SESSION KE WIB
// ============================
try {
  if (isset($conn) && $conn instanceof mysqli) {
    $conn->query("SET time_zone = '+07:00'");
  }
} catch (Throwable $e) {
  // kalau gagal, tetap lanjut, karena created_at kita isi dari PHP
}

// AUTH USER
if (!isset($_SESSION['user_id'])) {
  header("Location: app");
  exit();
}

$user_id = (int)$_SESSION['user_id'];
$today   = date('Y-m-d');

// CSRF
if (empty($_SESSION['csrf_token'])) $_SESSION['csrf_token'] = bin2hex(random_bytes(16));
$csrf = $_SESSION['csrf_token'];

// flash
$flash = $_SESSION['flash_mengaji'] ?? null;
unset($_SESSION['flash_mengaji']);

function flash_set($ok, $title, $desc, $status='info'){
  $_SESSION['flash_mengaji'] = [
    'ok'     => (bool)$ok,
    'title'  => (string)$title,
    'desc'   => (string)$desc,
    'status' => (string)$status
  ];
}
function redirect_self(){
  header("Location: mengaji.php");
  exit();
}

// ============================
// IZIN MENGAJI
// ============================
function izin_label(string $jenis): string {
  $j = strtoupper(trim($jenis));
  if ($j === 'HAID')  return 'Haid';
  if ($j === 'SAKIT') return 'Sakit';
  if ($j === 'DINAS') return 'Dinas';
  if ($j === 'CUTI')  return 'Cuti';
  return 'Izin Lain';
}

// ============================
// clamp input
// ============================
function clamp_int($v, $min, $max){
  $v = (int)$v;
  if ($v < $min) $v = $min;
  if ($v > $max) $v = $max;
  return $v;
}
function clamp_juz($j){
  $j = (int)$j;
  if ($j < 1) $j = 1;
  if ($j > 30) $j = 30;
  return $j;
}
function clamp_ket($s){
  $s = trim((string)$s);
  if (function_exists('mb_strlen') && mb_strlen($s) > 255) $s = mb_substr($s, 0, 255);
  if (!function_exists('mb_strlen') && strlen($s) > 255) $s = substr($s, 0, 255);
  return $s;
}
function fmt_tgl_id($ymd){
  $t = strtotime((string)$ymd);
  return $t ? date('d/m/Y', $t) : (string)$ymd;
}
function fmt_dt_id($dt){
  $t = strtotime((string)$dt);
  return $t ? date('d/m/Y H:i', $t) : (string)$dt;
}

// ============================
// PRELOAD: IZIN hari ini (dipakai untuk lock)
// ============================
$isIzinToday = false;
$izinRow = null;
try {
  $stmt = $conn->prepare("SELECT id, jenis, keterangan, created_at FROM mengaji_izin WHERE karyawan_id=? AND tanggal=? LIMIT 1");
  $stmt->bind_param("is", $user_id, $today);
  $stmt->execute();
  $izinRow = $stmt->get_result()->fetch_assoc();
  $stmt->close();
  $isIzinToday = (bool)$izinRow;
} catch (Throwable $e) {
  $isIzinToday = false;
  $izinRow = null;
}

// ============================
// PRELOAD: sesi mengaji hari ini (unlimited)
// ============================
$todaySessions = [];
$todayCount = 0;
try{
  $stmt = $conn->prepare("
    SELECT id, juz, halaman_mulai, halaman_selesai, keterangan, created_at
    FROM mengaji_baca
    WHERE karyawan_id=? AND tanggal=?
    ORDER BY created_at DESC, id DESC
  ");
  $stmt->bind_param("is", $user_id, $today);
  $stmt->execute();
  $rs = $stmt->get_result();
  while($row = $rs->fetch_assoc()){
    $todaySessions[] = $row;
  }
  $stmt->close();
  $todayCount = count($todaySessions);
}catch(Throwable $e){
  $todaySessions = [];
  $todayCount = 0;
}

$isMengajiToday = ($todayCount > 0);

// lock rules (unlimited):
$lockInput = $isIzinToday;       // hanya izin yang mengunci input
$lockIzin  = $isMengajiToday;    // izin tidak boleh jika sudah mulai mengaji hari ini

// ============================
// HANDLE POST
// ============================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $postedCsrf = (string)($_POST['csrf'] ?? '');
  if (!hash_equals($csrf, $postedCsrf)) {
    flash_set(false, "Gagal", "Token tidak valid. Silakan refresh.", "error");
    redirect_self();
  }

  $action = (string)($_POST['action'] ?? '');

  // ====== SET IZIN ======
  if ($action === 'set_izin') {
    if ($isMengajiToday) {
      flash_set(false, "Tidak bisa", "Hari ini kamu sudah mulai mengaji, jadi tidak bisa mengajukan izin. Silakan besok.", "error");
      redirect_self();
    }

    $jenis = strtoupper(trim((string)($_POST['jenis'] ?? 'LAIN')));
    $allowed = ['HAID','SAKIT','DINAS','CUTI','LAIN'];
    if (!in_array($jenis, $allowed, true)) $jenis = 'LAIN';

    $ket = clamp_ket($_POST['keterangan'] ?? '');
    $now = date('Y-m-d H:i:s'); // FIX: WIB dari PHP

    try {
      // FIX: simpan created_at dari PHP agar WIB konsisten
      $stmt = $conn->prepare("
        INSERT INTO mengaji_izin (karyawan_id, tanggal, jenis, keterangan, created_at)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE jenis=VALUES(jenis), keterangan=VALUES(keterangan), created_at=VALUES(created_at)
      ");
      $stmt->bind_param("issss", $user_id, $today, $jenis, $ket, $now);
      $stmt->execute();
      $stmt->close();

      flash_set(true, "Izin Tersimpan", "Hari ini ditandai izin: ".izin_label($jenis).".", "info");
      redirect_self();
    } catch (Throwable $e) {
      flash_set(false, "Gagal", "Tabel mengaji_izin belum ada atau error DB. Buat tabel dulu.", "error");
      redirect_self();
    }
  }

  // ====== CLEAR IZIN ======
  if ($action === 'clear_izin') {
    try {
      $stmt = $conn->prepare("DELETE FROM mengaji_izin WHERE karyawan_id=? AND tanggal=? LIMIT 1");
      $stmt->bind_param("is", $user_id, $today);
      $stmt->execute();
      $stmt->close();

      flash_set(true, "Izin Dibatalkan", "Silakan input mengaji hari ini.", "sukses");
      redirect_self();
    } catch (Throwable $e) {
      flash_set(false, "Gagal", "Tabel mengaji_izin belum ada atau error DB.", "error");
      redirect_self();
    }
  }

  // ====== INPUT MENGAJI (UNLIMITED) ======
  if ($action === 'input_mengaji') {
    if ($isIzinToday) {
      flash_set(false, "Tidak bisa", "Hari ini status kamu IZIN. Batalkan izin jika ingin input mengaji.", "error");
      redirect_self();
    }

    $juz     = clamp_juz($_POST['juz'] ?? 1);
    $mulai   = clamp_int($_POST['halaman_mulai'] ?? 1, 1, 604);
    $selesai = clamp_int($_POST['halaman_selesai'] ?? 1, 1, 604);

    if ($selesai < $mulai) {
      flash_set(false, "Gagal", "Halaman selesai tidak boleh lebih kecil dari halaman mulai.", "error");
      redirect_self();
    }

    $ket = clamp_ket($_POST['keterangan'] ?? '');
    $now = date('Y-m-d H:i:s'); // FIX: WIB dari PHP

    try {
      // FIX: simpan created_at dari PHP agar WIB konsisten
      $stmt = $conn->prepare("
        INSERT INTO mengaji_baca (karyawan_id, tanggal, juz, halaman_mulai, halaman_selesai, keterangan, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      ");
      $stmt->bind_param("isiiiss", $user_id, $today, $juz, $mulai, $selesai, $ket, $now);
      $stmt->execute();
      $stmt->close();

      flash_set(true, "Berhasil", "Catatan mengaji tersimpan. Kamu masih bisa input lagi hari ini.", "sukses");
      redirect_self();
    } catch (Throwable $e) {
      flash_set(false, "Gagal", "Tabel mengaji_baca belum ada atau error DB. Pastikan struktur tabel benar.", "error");
      redirect_self();
    }
  }

  flash_set(false, "Gagal", "Aksi tidak dikenali.", "error");
  redirect_self();
}

// ============================
// VIEW DATA (profil user)
// ============================
$stmt = $conn->prepare("SELECT nama, jabatan, organisasi, foto FROM karyawan WHERE id=? LIMIT 1");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$u = $stmt->get_result()->fetch_assoc();
$stmt->close();

$nama    = $u['nama'] ?? 'Karyawan';
$jabatan = $u['jabatan'] ?? '-';
$org     = $u['organisasi'] ?? 'PT. Great HRD';
$foto    = trim((string)($u['foto'] ?? ''));

// foto user
$FOTO_BASE_URL = "uploads/profile/";
$FOTO_FS_DIR   = __DIR__ . "/uploads/profile/";

$foto_ada = false;
$fotoUrl  = '';

if ($foto !== '') {
  $fs = $FOTO_FS_DIR . $foto;
  if (file_exists($fs)) {
    $foto_ada = true;
    $v = @filemtime($fs) ?: time();
    $fotoUrl = $FOTO_BASE_URL . rawurlencode($foto) . '?v=' . $v;
  }
}

function initials($name){
  $name = trim((string)$name);
  if ($name === '') return '??';
  $p = preg_split('/\s+/', $name);
  $a = strtoupper(substr($p[0] ?? '', 0, 1));
  $b = strtoupper(substr($p[1] ?? '', 0, 1));
  return $b ? ($a.$b) : strtoupper(substr($p[0] ?? '', 0, 2));
}

// ============================
// RIWAYAT (gabung mengaji + izin) - default 30 terakhir
// ============================
$riwayat = [];
try {
  $limit = 30;

  $sql = "
    (SELECT tanggal, created_at, 'MENGAJI' AS tipe, juz, halaman_mulai, halaman_selesai, keterangan, NULL AS izin_jenis
     FROM mengaji_baca
     WHERE karyawan_id=?
    )
    UNION ALL
    (SELECT tanggal, created_at, 'IZIN' AS tipe, NULL AS juz, NULL AS halaman_mulai, NULL AS halaman_selesai, keterangan, jenis AS izin_jenis
     FROM mengaji_izin
     WHERE karyawan_id=?
    )
    ORDER BY tanggal DESC, created_at DESC
    LIMIT ?
  ";

  $stmt = $conn->prepare($sql);
  $stmt->bind_param("iii", $user_id, $user_id, $limit);
  $stmt->execute();
  $res = $stmt->get_result();
  while($row = $res->fetch_assoc()){
    $riwayat[] = $row;
  }
  $stmt->close();
} catch (Throwable $e) {
  $riwayat = [];
}
?>
<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
  <title>Catatan Mengaji Harian</title>
  <link rel="icon" href="logo.webp" />

  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .shadow-soft{ box-shadow: 0 18px 45px rgba(15,23,42,0.08); }
    .text-primary-600{ color:#4f46e5; }
    .bg-primary-600{ background:#4f46e5; }
    ::-webkit-scrollbar{ width:0; background:transparent; }
  </style>
</head>

<body class="min-h-screen bg-slate-50 text-slate-900 pb-24">
  <div class="mx-auto flex min-h-screen max-w-md flex-col px-4 pt-4 relative">

    <!-- HEADER -->
    <div class="rounded-3xl bg-white border border-slate-100 shadow-soft p-4 flex items-center justify-between">
      <div class="flex items-center gap-3 min-w-0">
        <?php if ($foto_ada): ?>
          <img src="<?= e($fotoUrl) ?>" class="h-11 w-11 rounded-3xl object-cover ring-2 ring-indigo-100"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div style="display:none" class="h-11 w-11 rounded-3xl bg-indigo-600 text-white flex items-center justify-center font-bold uppercase">
            <?= e(initials($nama)) ?>
          </div>
        <?php else: ?>
          <div class="h-11 w-11 rounded-3xl bg-indigo-600 text-white flex items-center justify-center font-bold uppercase">
            <?= e(initials($nama)) ?>
          </div>
        <?php endif; ?>

        <div class="min-w-0">
          <p class="text-[11px] uppercase tracking-[0.22em] text-slate-400">Mengaji Harian</p>
          <p class="text-sm font-semibold truncate"><?= e($nama) ?></p>
          <p class="text-[11px] text-slate-400 truncate"><?= e($jabatan) ?> • <?= e($org) ?></p>
        </div>
      </div>

      <a href="dashboard.php" class="text-[12px] font-semibold text-primary-600">Kembali</a>
    </div>

    <?php if ($flash): ?>
      <div class="mt-3 rounded-3xl border border-slate-100 bg-white shadow-soft p-4">
        <div class="text-sm font-bold"><?= e($flash['title'] ?? 'Info') ?></div>
        <div class="text-[12px] text-slate-600 mt-1"><?= e($flash['desc'] ?? '') ?></div>
      </div>
    <?php endif; ?>

    <!-- FORM INPUT -->
    <div class="mt-3 rounded-3xl bg-white border border-slate-100 shadow-soft p-4">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-sm font-bold text-slate-900">Catatan Mengaji Hari Ini</p>
          <p class="text-[12px] text-slate-500 mt-1">
            Unlimited input hari ini. Total sesi: <b><?= (int)$todayCount ?></b>
          </p>
        </div>

        <?php if ($isIzinToday): ?>
          <span class="shrink-0 inline-flex items-center rounded-full bg-amber-50 text-amber-800 border border-amber-100 px-3 py-1 text-[11px] font-bold">
            IZIN AKTIF
          </span>
        <?php else: ?>
          <span class="shrink-0 inline-flex items-center rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 px-3 py-1 text-[11px] font-bold">
            BISA INPUT
          </span>
        <?php endif; ?>
      </div>

      <?php if ($isIzinToday): ?>
        <div class="mt-3 rounded-2xl bg-amber-50 border border-amber-100 p-3 text-[12px] text-amber-800">
          Hari ini status <b>IZIN</b>, input mengaji dikunci. Batalkan izin jika ingin input.
        </div>
      <?php endif; ?>

      <?php if ($todayCount > 0): ?>
        <div class="mt-3 rounded-2xl bg-emerald-50 border border-emerald-100 p-3 text-[12px] text-emerald-800">
          <div class="font-bold">Sesi hari ini</div>
          <div class="mt-2 space-y-2">
            <?php foreach (array_slice($todaySessions, 0, 3) as $s): ?>
              <div class="rounded-xl bg-white/70 border border-emerald-100 px-3 py-2">
                <div>Juz <b><?= (int)$s['juz'] ?></b> • Hal <?= (int)$s['halaman_mulai'] ?> - <?= (int)$s['halaman_selesai'] ?></div>
                <div class="text-[11px] text-emerald-700 mt-1"><?= e(fmt_dt_id($s['created_at'])) ?></div>
              </div>
            <?php endforeach; ?>
            <?php if ($todayCount > 3): ?>
              <div class="text-[11px] text-emerald-700">dan <?= (int)($todayCount - 3) ?> sesi lainnya…</div>
            <?php endif; ?>
          </div>
        </div>
      <?php endif; ?>

      <form method="post" class="mt-3 space-y-3">
        <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
        <input type="hidden" name="action" value="input_mengaji">

        <?php if (!$lockInput): ?>
          <div>
            <label class="text-[11px] text-slate-500 font-medium">Sekarang Juz berapa?</label>
            <input type="number" name="juz" min="1" max="30" required
                   class="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                   placeholder="contoh: 2">
            <div class="text-[11px] text-slate-400 mt-1">Isi 1 sampai 30</div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[11px] text-slate-500 font-medium">Halaman Mulai</label>
              <input type="number" name="halaman_mulai" min="1" max="604" required
                     class="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                     placeholder="contoh: 120">
              <div class="text-[11px] text-slate-400 mt-1">Range default 1 - 604</div>
            </div>

            <div>
              <label class="text-[11px] text-slate-500 font-medium">Halaman Selesai</label>
              <input type="number" name="halaman_selesai" min="1" max="604" required
                     class="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                     placeholder="contoh: 125">
            </div>
          </div>

          <div>
            <label class="text-[11px] text-slate-500 font-medium">Keterangan</label>
            <input name="keterangan" maxlength="255" placeholder="cth: selesai setelah maghrib"
                   class="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm">
          </div>
        <?php else: ?>
          <div class="rounded-2xl bg-slate-50 border border-slate-100 p-3 text-[12px] text-slate-600">
            Input dikunci untuk hari ini karena status IZIN aktif. Batalkan izin jika ingin input.
          </div>
        <?php endif; ?>

        <button class="w-full rounded-2xl bg-primary-600 text-white py-3.5 text-sm font-semibold shadow-soft hover:bg-indigo-500 active:scale-[0.99] <?= $lockInput ? 'opacity-50 cursor-not-allowed' : '' ?>"
                <?= $lockInput ? 'disabled' : '' ?>>
          Simpan Sesi Mengaji
        </button>
      </form>
    </div>

    <!-- IZIN -->
    <?php if ($isIzinToday): ?>
      <div class="mt-3 rounded-3xl bg-amber-50 border border-amber-100 shadow-soft p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-sm font-bold text-amber-800">Status Hari Ini: IZIN</div>
            <div class="text-[12px] text-amber-800 mt-1">
              Jenis: <b><?= e(izin_label((string)$izinRow['jenis'])) ?></b>
            </div>
            <?php if (!empty($izinRow['keterangan'])): ?>
              <div class="mt-1 text-[12px] text-amber-800">Keterangan: <?= e((string)$izinRow['keterangan']) ?></div>
            <?php endif; ?>
            <div class="text-[11px] text-amber-700 mt-2">Input mengaji terkunci selama izin aktif.</div>
          </div>

          <form method="post">
            <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
            <input type="hidden" name="action" value="clear_izin">
            <button class="px-3 py-2 rounded-2xl bg-white border border-amber-200 text-[12px] font-semibold text-amber-800 hover:bg-amber-100">
              Batalkan
            </button>
          </form>
        </div>
      </div>
    <?php else: ?>
      <div class="mt-3 rounded-3xl bg-white border border-slate-100 shadow-soft p-4">
        <div class="text-sm font-bold text-slate-900">Halangan atau Izin Hari Ini?</div>
        <div class="text-[12px] text-slate-500 mt-1">
          Jika berhalangan (haid, sakit, dll), ajukan izin agar input terkunci.
          <?php if ($isMengajiToday): ?>
            <span class="block mt-1 text-amber-700 font-semibold">Karena sudah ada sesi mengaji hari ini, izin tidak bisa diajukan.</span>
          <?php endif; ?>
        </div>

        <form method="post" class="mt-3 space-y-2">
          <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
          <input type="hidden" name="action" value="set_izin">

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[11px] text-slate-500 font-medium">Jenis</label>
              <select name="jenis" class="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                <?= $lockIzin ? 'disabled' : '' ?>>
                <option value="HAID">Haid</option>
                <option value="SAKIT">Sakit</option>
                <option value="DINAS">Dinas</option>
                <option value="CUTI">Cuti</option>
                <option value="LAIN">Izin Lain</option>
              </select>
            </div>

            <div>
              <label class="text-[11px] text-slate-500 font-medium">Keterangan</label>
              <input name="keterangan" maxlength="255" placeholder="cth: demam atau kontrol dokter"
                     class="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
                     <?= $lockIzin ? 'disabled' : '' ?>>
            </div>
          </div>

          <button class="w-full rounded-2xl bg-amber-500 text-white py-3 text-sm font-semibold hover:bg-amber-400 active:scale-[0.99] <?= $lockIzin ? 'opacity-50 cursor-not-allowed' : '' ?>"
            <?= $lockIzin ? 'disabled' : '' ?>>
            Ajukan Izin Hari Ini
          </button>
        </form>
      </div>
    <?php endif; ?>

    <!-- RIWAYAT -->
    <div class="mt-3 rounded-3xl bg-white border border-slate-100 shadow-soft p-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm font-bold text-slate-900">Riwayat</div>
          <div class="text-[12px] text-slate-500 mt-1">Menampilkan hingga 30 catatan terakhir (mengaji dan izin).</div>
        </div>
        <span class="text-[11px] font-semibold text-slate-500"><?= e(fmt_tgl_id($today)) ?></span>
      </div>

      <?php if (empty($riwayat)): ?>
        <div class="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-[12px] text-slate-600">
          Belum ada riwayat.
        </div>
      <?php else: ?>
        <div class="mt-3 space-y-2">
          <?php foreach ($riwayat as $r): ?>
            <?php
              $tipe = (string)($r['tipe'] ?? '');
              $tgl  = (string)($r['tanggal'] ?? '');
              $cat  = (string)($r['keterangan'] ?? '');
              $dt   = (string)($r['created_at'] ?? '');

              $isMengaji = ($tipe === 'MENGAJI');
              $badgeCls  = $isMengaji
                ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-100';
              $title     = $isMengaji ? 'Mengaji' : 'Izin';
            ?>
            <div class="rounded-2xl border border-slate-100 bg-white p-3">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold <?= e($badgeCls) ?>">
                      <?= e($title) ?>
                    </span>
                    <span class="text-[12px] font-semibold text-slate-700"><?= e(fmt_tgl_id($tgl)) ?></span>
                  </div>

                  <?php if ($isMengaji): ?>
                    <div class="mt-1 text-[12px] text-slate-700">
                      Juz <b><?= e((int)$r['juz']) ?></b> • Halaman <b><?= e((int)$r['halaman_mulai']) ?></b> - <b><?= e((int)$r['halaman_selesai']) ?></b>
                    </div>
                  <?php else: ?>
                    <div class="mt-1 text-[12px] text-slate-700">
                      Jenis: <b><?= e(izin_label((string)$r['izin_jenis'])) ?></b>
                    </div>
                  <?php endif; ?>

                  <?php if ($cat !== ''): ?>
                    <div class="mt-1 text-[12px] text-slate-500"><?= e($cat) ?></div>
                  <?php endif; ?>
                </div>

                <div class="shrink-0 text-[11px] text-slate-400">
                  <?= e(fmt_dt_id($dt)) ?>
                </div>
              </div>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </div>

  </div>
</body>
</html>