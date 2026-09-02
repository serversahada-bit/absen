<?php
session_start();
require 'config/database.php';

// 1. CEK LOGIN
if (!isset($_SESSION['user_id'])) {
    header("Location: request_login");
    exit();
}

$id_karyawan = $_SESSION['user_id'];

// 2. AMBIL DATA RIWAYAT (tambahkan catatan_admin)
$query = "SELECT id,karyawan_id,tipe_izin,mulai_tanggal,sampai_tanggal,alasan,bukti_foto,status,created_at,catatan_admin
          FROM pengajuan_izin
          WHERE karyawan_id = '$id_karyawan'
          ORDER BY created_at DESC";
$result = mysqli_query($conn, $query);

// Helper Status
function statusBadge($status) {
    if ($status == 'Pending') {
        return '<span class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-bold border border-yellow-200 flex items-center gap-1"><span class="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span> Menunggu</span>';
    } elseif ($status == 'Disetujui') {
        return '<span class="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-200">✅ Disetujui</span>';
    } else {
        return '<span class="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[10px] font-bold border border-rose-200">❌ Ditolak</span>';
    }
}

// Helper Tanggal
function formatTanggal($tgl) {
    if ($tgl == '0000-00-00' || empty($tgl)) return '-';
    $bulan = [1=>'Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
    $split = explode('-', $tgl);
    if(count($split) === 3) {
        return $split[2] . ' ' . $bulan[(int)$split[1]] . ' ' . $split[0];
    }
    return $tgl;
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Riwayat Izin</title>
    <link rel="icon" href="logo.webp" />
    <script src="https://cdn.tailwindcss.com"></script>

    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
                    colors: {
                        primary: {
                            50: '#f4f6ff',
                            100: '#e4e7ff',
                            500: '#4f46e5',
                            600: '#4338ca'
                        }
                    },
                },
            },
        };
    </script>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-slate-50 min-h-screen pb-24 text-slate-900">

    <div class="bg-white px-4 py-3 shadow-sm flex items-center gap-3 sticky top-0 z-40 border-b border-slate-100">
        <a href="dashboard" class="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition active:scale-95 text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
        </a>
        <h1 class="font-bold text-lg text-slate-800">Riwayat Pengajuan</h1>
    </div>

    <div class="max-w-md mx-auto p-4 space-y-5">

        <a href="izin" class="block w-full bg-indigo-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-200 flex items-center justify-between hover:bg-indigo-700 transition transform active:scale-[0.98]">
            <div class="flex items-center gap-3">
                <div class="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div class="text-left">
                    <p class="font-bold text-sm">Buat Pengajuan Baru</p>
                    <p class="text-[11px] text-indigo-100 opacity-90">Sakit, Cuti, atau Izin Lainnya</p>
                </div>
            </div>
            <div class="bg-white/10 p-1.5 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
            </div>
        </a>

        <div class="flex items-center justify-between mt-2 mb-1 px-1">
            <h2 class="font-bold text-slate-700 text-sm">Daftar Riwayat</h2>
            <span class="text-[10px] text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-sm"><?= mysqli_num_rows($result) ?> Data</span>
        </div>

        <?php if(mysqli_num_rows($result) > 0): ?>
            <div class="space-y-3">
            <?php while($row = mysqli_fetch_assoc($result)): ?>
                <div class="bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col gap-3 transition-all hover:border-indigo-100">

                    <div class="flex justify-between items-start">
                        <div class="flex items-center gap-3">
                            <?php if($row['tipe_izin'] == 'Sakit'): ?>
                                <div class="bg-rose-50 p-2.5 rounded-xl text-rose-500 ring-1 ring-rose-100">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                </div>
                            <?php else: ?>
                                <div class="bg-blue-50 p-2.5 rounded-xl text-blue-500 ring-1 ring-blue-100">
                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                            <?php endif; ?>

                            <div>
                                <h3 class="font-bold text-slate-800 text-sm"><?= htmlspecialchars($row['tipe_izin']) ?></h3>
                                <p class="text-[10px] text-slate-400 mt-0.5">
                                    Diajukan: <?= (!empty($row['created_at'])) ? formatTanggal(date('Y-m-d', strtotime($row['created_at']))) : '-' ?>
                                </p>
                            </div>
                        </div>
                        <?= statusBadge($row['status']) ?>
                    </div>

                    <div class="bg-slate-50 p-3 rounded-xl border border-slate-100/80">
                        <div class="flex justify-between text-xs text-slate-600 mb-2 border-b border-slate-200 pb-2">
                            <span>Mulai: <b class="text-slate-800"><?= formatTanggal($row['mulai_tanggal']) ?></b></span>
                            <span>Sampai: <b class="text-slate-800"><?= formatTanggal($row['sampai_tanggal']) ?></b></span>
                        </div>

                        <p class="text-[11px] text-slate-500 italic leading-relaxed">
                          "<?= htmlspecialchars($row['alasan']) ?>"
                        </p>

                        <?php
                          $catatan = trim((string)($row['catatan_admin'] ?? ''));
                          if (($row['status'] ?? '') === 'Ditolak' && $catatan !== ''):
                        ?>
                          <div class="mt-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-[11px] leading-relaxed">
                              <div class="font-bold mb-1">Alasan Ditolak</div>
                              <div><?= htmlspecialchars($catatan) ?></div>
                          </div>
                        <?php endif; ?>
                    </div>

                    <?php if(!empty($row['bukti_foto'])): ?>
                        <a href="uploads/izin/<?= htmlspecialchars($row['bukti_foto']) ?>" target="_blank" class="text-[11px] text-indigo-600 font-semibold flex items-center gap-1.5 hover:underline bg-indigo-50 w-fit px-3 py-1.5 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            Lihat Bukti
                        </a>
                    <?php endif; ?>

                </div>
            <?php endwhile; ?>
            </div>
        <?php else: ?>
            <div class="text-center py-16">
                <div class="bg-slate-50 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-4 ring-1 ring-slate-100 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01.707-.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 class="text-sm font-bold text-slate-700">Belum ada riwayat</h3>
                <p class="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed">Data pengajuan izin Anda akan muncul di sini.</p>
            </div>
        <?php endif; ?>

    </div>

    <?php include 'nav_bottom.php'; ?>

</body>
</html>
