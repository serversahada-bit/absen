<?php
session_start();
require 'config/database.php';
date_default_timezone_set('Asia/Jakarta');

function e($s){ return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

// 1) CEK LOGIN
if (!isset($_SESSION['user_id'])) {
    header("Location: request_login");
    exit();
}

$id_karyawan = (int)$_SESSION['user_id'];
$tanggal_hari_ini = date('Y-m-d');

$tipe = $_GET['tipe'] ?? 'masuk';
$tipe = ($tipe === 'pulang') ? 'pulang' : 'masuk';

// pesan dari backend (reject redirect)
$errorMsg = trim((string)($_GET['error'] ?? ''));
$successMsg = trim((string)($_GET['msg'] ?? ''));

// CSRF
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(16));
}
$csrf = $_SESSION['csrf_token'];

// 2) AMBIL DATA KARYAWAN (jadwal + jam)
$stmt = mysqli_prepare($conn, "SELECT nama, jenis_jadwal, jam_jadwal_masuk, jam_jadwal_pulang
                              FROM karyawan WHERE id=? LIMIT 1");
mysqli_stmt_bind_param($stmt, "i", $id_karyawan);
mysqli_stmt_execute($stmt);
$res = mysqli_stmt_get_result($stmt);
$k = mysqli_fetch_assoc($res) ?: [];
mysqli_stmt_close($stmt);

$nama_karyawan = $k['nama'] ?? 'Karyawan';
$jenis_jadwal = $k['jenis_jadwal'] ?? 'Tetap';
$jam_jadwal_masuk = $k['jam_jadwal_masuk'] ?? null;
$jam_jadwal_pulang = $k['jam_jadwal_pulang'] ?? null;

// 3) CEK STATUS ABSENSI
$stmt = mysqli_prepare($conn, "SELECT * FROM presensi WHERE karyawan_id = ? AND tanggal = ? LIMIT 1");
mysqli_stmt_bind_param($stmt, "is", $id_karyawan, $tanggal_hari_ini);
mysqli_stmt_execute($stmt);
$res = mysqli_stmt_get_result($stmt);
$data_absen = mysqli_fetch_assoc($res) ?: null;
mysqli_stmt_close($stmt);

$jamMasuk  = $data_absen['jam_masuk'] ?? null;
$jamPulang = $data_absen['jam_pulang'] ?? null;

$blokir_akses = false;
$pesan_judul = "";
$pesan_deskripsi = "";
$ikon_status = "";

// 4) BLOKIR STATUS
if ($tipe === 'masuk') {
    if ($data_absen && !empty($jamMasuk)) {
        $blokir_akses = true;
        $pesan_judul = "Anda Sudah Absen Masuk";
        $pesan_deskripsi = "Data kehadiran Anda hari ini sudah tercatat. Anda bisa absen lagi mulai pukul 00:00 esok hari.";
        $ikon_status = "✅";
    }
} else {
    if (!$data_absen || empty($jamMasuk)) {
        $blokir_akses = true;
        $pesan_judul = "Belum Absen Masuk";
        $pesan_deskripsi = "Anda tidak bisa melakukan Absen Pulang karena belum melakukan Absen Masuk hari ini.";
        $ikon_status = "⚠️";
    } elseif (!empty($jamPulang)) {
        $blokir_akses = true;
        $pesan_judul = "Anda Sudah Absen Pulang";
        $pesan_deskripsi = "Terima kasih atas kerja kerasnya hari ini! Anda bisa absen lagi besok.";
        $ikon_status = "✅";
    }
}

// 5) ✅ TANPA BLOKIR WAKTU (FITUR MINIMAL/TERLALU AWAL DIHILANGKAN)
// - Absen masuk boleh kapan saja (tidak ada "Belum Waktunya Absen").
// - Tapi status telat tetap dihitung kalau sekarang lewat jam jadwal masuk.
$isLate = false;
$lateMinutes = 0;

if (!$blokir_akses && $tipe === 'masuk' && !empty($jam_jadwal_masuk)) {
    $now   = new DateTime('now');
    $start = new DateTime($tanggal_hari_ini . ' ' . $jam_jadwal_masuk);

    if ($now > $start) {
        $diff = $start->diff($now);
        $lateMinutes = ((int)$diff->h * 60) + (int)$diff->i;
        $isLate = ($lateMinutes > 0);
    }
}
?>

<?php if ($blokir_akses): ?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Status Absensi</title>
  <link rel="icon" href="logo.webp" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#F6F3FF] min-h-screen flex items-center justify-center p-4">
  <div class="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center border border-[#E7DDFF] relative overflow-hidden">
    <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-600 to-fuchsia-500"></div>

    <div class="mb-6 flex justify-center">
      <div class="h-24 w-24 bg-violet-50 rounded-full flex items-center justify-center text-5xl shadow-inner border border-violet-100">
        <?= e($ikon_status) ?>
      </div>
    </div>

    <h2 class="text-2xl font-extrabold text-slate-900 mb-2"><?= e($pesan_judul) ?></h2>
    <p class="text-slate-600 text-sm leading-relaxed mb-5"><?= e($pesan_deskripsi) ?></p>

    <?php if (!empty($jam_jadwal_masuk) && !empty($jam_jadwal_pulang)): ?>
      <div class="mb-6 text-[12px] text-slate-700 font-bold">
        Jadwal: <?= e($jenis_jadwal) ?> • <?= e(substr($jam_jadwal_masuk,0,5)) ?> - <?= e(substr($jam_jadwal_pulang,0,5)) ?>
      </div>
    <?php endif; ?>

    <a href="/dashboard"
       class="block w-full bg-violet-600 hover:bg-violet-700 text-white font-extrabold py-3.5 rounded-2xl transition-all shadow-lg shadow-violet-500/20 active:scale-95">
      Kembali ke Dashboard
    </a>

    <p class="mt-4 text-[10px] text-slate-400">Sistem Great HRD v1.0</p>
  </div>
</body>
</html>
<?php exit(); endif; ?>

<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Absen Wajah</title>
  <link rel="icon" href="logo.webp" />

  <script src="https://cdn.tailwindcss.com"></script>
  <script src="/assets/face-api.min.js"></script>

  <style>
    .safe-top { padding-top: env(safe-area-inset-top); }
    .safe-bottom { padding-bottom: env(safe-area-inset-bottom); }

    .camVideo{
      position:absolute; inset:0;
      width:100%; height:100%;
      object-fit:cover;
      background:#000;
      -webkit-transform: translateZ(0) scaleX(-1);
      transform: translateZ(0) scaleX(-1);
      -webkit-backface-visibility:hidden;
      backface-visibility:hidden;
    }

    .bracket{
      position:absolute;width:44px;height:44px;border:4px solid rgba(255,255,255,.90);
      border-radius:18px;pointer-events:none;opacity:.9;
      filter: drop-shadow(0 10px 24px rgba(0,0,0,.25));
    }
    .bracket.tl{top:90px;left:26px;border-right:0;border-bottom:0}
    .bracket.tr{top:90px;right:26px;border-left:0;border-bottom:0}
    .bracket.bl{bottom:170px;left:26px;border-right:0;border-top:0}
    .bracket.br{bottom:170px;right:26px;border-left:0;border-top:0}

    .face-guide{
      position:absolute;left:50%;top:46%;
      transform:translate(-50%,-50%);
      width:min(76vw,340px);
      height:min(92vw,420px);
      border:3px dashed rgba(255,255,255,.92);
      border-radius:999px;
      pointer-events:none;
      opacity:.92;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.10);
    }

    .glass{
      background: rgba(255,255,255,.82);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      border: 1px solid rgba(255,255,255,.55);
      box-shadow: 0 -24px 80px rgba(0,0,0,.22);
    }

    @supports (-webkit-touch-callout: none) {
      .glass{
        -webkit-backdrop-filter: none !important;
        backdrop-filter: none !important;
        background: rgba(255,255,255,.92) !important;
      }
    }

    .track{
      height: 10px;
      border-radius: 999px;
      background: rgba(148,163,184,.30);
      overflow: hidden;
      box-shadow: inset 0 2px 10px rgba(0,0,0,.06);
    }
    .fill{
      height:100%;
      width:0%;
      border-radius:999px;
      background: linear-gradient(90deg, #7c3aed, #d946ef);
      transition: width 70ms linear;
      box-shadow: 0 12px 30px rgba(124,58,237,.22);
    }

    .toast{
      position:fixed;
      left:12px; right:12px; top:calc(14px + env(safe-area-inset-top));
      z-index:80;
      display:none;
    }
    .toast.show{ display:block; }
  </style>
</head>

<body class="h-screen w-screen overflow-hidden bg-black">

  <div class="absolute inset-0">
    <video id="camera" autoplay playsinline muted class="camVideo"></video>
    <div class="absolute inset-0 bg-gradient-to-b from-black/15 via-black/20 to-black/45"></div>

    <div class="face-guide"></div>
    <div class="bracket tl"></div>
    <div class="bracket tr"></div>
    <div class="bracket bl"></div>
    <div class="bracket br"></div>
  </div>

  <!-- Toast -->
  <div id="toast" class="toast">
    <div id="toastBox" class="glass rounded-2xl px-4 py-3">
      <div class="flex items-start gap-3">
        <div id="toastIcon" class="text-xl leading-none">⚠️</div>
        <div class="flex-1">
          <div id="toastTitle" class="font-extrabold text-sm text-slate-900">Info</div>
          <div id="toastText" class="text-[12px] text-slate-700 mt-0.5">-</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Top bar -->
  <div class="absolute top-0 left-0 right-0 z-30 safe-top">
    <div class="px-4 pt-4 flex items-center justify-between">
      <div class="text-white/90 text-xs font-extrabold tracking-widest uppercase">
        Absen <?= e($tipe) ?>
      </div>
      <a href="/dashboard"
         class="h-10 w-10 grid place-items-center rounded-full bg-white/10 border border-white/15 text-white font-black backdrop-blur-lg active:scale-95">
        ×
      </a>
    </div>
  </div>

  <!-- Modern bottom card -->
  <div class="fixed bottom-0 left-0 right-0 z-40 safe-bottom p-4">
    <div class="mx-auto max-w-md glass rounded-3xl px-5 pt-5 pb-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-[11px] font-extrabold tracking-widest text-slate-600 uppercase">
            Great HRD • Face Check
          </div>
          <div id="subtxt" class="mt-1 text-[13px] font-extrabold text-slate-900">
            Memuat sistem...
          </div>
        </div>

      </div>

      <?php if (!empty($jam_jadwal_masuk) && !empty($jam_jadwal_pulang)): ?>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <div class="inline-flex items-center gap-2 text-[11px] font-bold px-3 py-1.5 rounded-full bg-slate-900/5 border border-slate-900/10 text-slate-700">
            📅 <?= e($jenis_jadwal) ?> • <?= e(substr($jam_jadwal_masuk,0,5)) ?> - <?= e(substr($jam_jadwal_pulang,0,5)) ?>
          </div>

          <?php if ($tipe === 'masuk' && $isLate): ?>
            <div class="inline-flex items-center gap-2 text-[11px] font-extrabold px-3 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
              ⏱️ Terlambat <?= (int)$lateMinutes ?> menit
            </div>
          <?php endif; ?>
        </div>
      <?php endif; ?>

      <p id="hint" class="mt-3 text-[12px] text-slate-700 font-semibold text-center">
        Silakan posisikan wajah Anda, lalu klik Ambil Foto.
      </p>

      <button type="button" id="btnCapture" class="mt-4 mb-1 w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold tracking-widest transition-all duration-300 shadow-md">
        AMBIL FOTO
      </button>

      <form id="formAbsen" action="/actions/proses_absen.php" method="POST" class="hidden">
        <input type="hidden" name="csrf_token" value="<?= e($csrf) ?>">
        <input type="hidden" name="tipe" value="<?= e($tipe) ?>">
        <input type="hidden" name="foto" id="inp_foto">
        <input type="hidden" name="lokasi" id="inp_lokasi">
      </form>
    </div>
  </div>

<script>
window.addEventListener('DOMContentLoaded', () => {
  const video   = document.getElementById('camera');
  const subtxt  = document.getElementById('subtxt');
  const hint    = document.getElementById('hint');

  const form    = document.getElementById('formAbsen');
  const inpFoto = document.getElementById('inp_foto');
  const inpLok  = document.getElementById('inp_lokasi');

  const toast = document.getElementById('toast');
  const toastIcon = document.getElementById('toastIcon');
  const toastTitle = document.getElementById('toastTitle');
  const toastText = document.getElementById('toastText');
  const toastBox = document.getElementById('toastBox');

  const serverError = <?= json_encode($errorMsg, JSON_UNESCAPED_UNICODE) ?>;
  const serverMsg   = <?= json_encode($successMsg, JSON_UNESCAPED_UNICODE) ?>;

  if (!video || !subtxt || !hint || !form || !inpFoto || !inpLok) {
    alert("Elemen UI tidak lengkap.");
    return;
  }

  function showToast(type, title, text){
    toast.classList.add('show');
    toastIcon.textContent = (type === 'error') ? '⚠️' : '✅';
    toastTitle.textContent = title || (type === 'error' ? 'Gagal' : 'Berhasil');
    toastText.textContent = text || '';
    toastBox.style.borderColor = (type === 'error') ? 'rgba(239, 68, 68, .25)' : 'rgba(16, 185, 129, .25)';
    toastBox.style.background = 'rgba(255,255,255,.90)';
    setTimeout(() => toast.classList.remove('show'), 4200);
  }

  // Info untuk in-app browser
  const ua = navigator.userAgent || "";
  if (/WhatsApp|FBAN|FBAV|Instagram/i.test(ua)) {
    showToast('error', 'In-App Browser', 'Jika kamera bermasalah, buka link via Safari / Chrome.');
  }

  if (serverError) {
    subtxt.textContent = "Gagal memproses absen";
    hint.textContent = serverError;
    showToast('error', 'Gagal', serverError);
  } else if (serverMsg) {
    showToast('success', 'Info', serverMsg);
  }

  let gpsOK = false;
  let camOK = false;
  let submitted = false;

  const btnCapture = document.getElementById('btnCapture');

  btnCapture.addEventListener('click', () => {
    if (submitted) return;
    if (!camOK) {
      showToast('error', 'Kamera', 'Mohon tunggu, kamera sedang dimuat.');
      return;
    }
    
    btnCapture.disabled = true;
    btnCapture.classList.add('opacity-50', 'cursor-not-allowed');
    btnCapture.textContent = "MEMPROSES...";
    
    if (!gpsOK) {
      hint.textContent = "Menunggu lokasi GPS...";
      const checkGPS = setInterval(() => {
        if (gpsOK) {
          clearInterval(checkGPS);
          autoCaptureAndSubmit();
        }
      }, 500);
    } else {
      autoCaptureAndSubmit();
    }
  });

  // GPS
  if (!navigator.geolocation) {
    hint.textContent = "Browser tidak mendukung GPS.";
    gpsOK = false;
  } else {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lon = pos.coords.longitude.toFixed(6);
        inpLok.value = lat + "," + lon;
        gpsOK = true;
      },
      (err) => {
        gpsOK = false;
        hint.textContent = "GPS gagal: " + err.message + " (aktifkan izin lokasi).";
        subtxt.textContent = "Izin lokasi dibutuhkan";
        showToast('error', 'Izin lokasi', 'Aktifkan GPS & izin lokasi browser.');
      },
      { enableHighAccuracy:true, timeout:15000, maximumAge:0 }
    );
  }

  // ===== Kamera =====
  let currentStream = null;

  async function startCamera(){
    try{
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio:false
      });
      currentStream = stream;
      video.srcObject = stream;
      await video.play();
      camOK = true;
      subtxt.textContent = "Siap Mengambil Foto";
    }catch(err){
      camOK = false;
      showToast('error', 'Kamera', 'Kamera tidak bisa dibuka: ' + err.message);
    }
  }

  function stopCamera(){
    if(currentStream){
      currentStream.getTracks().forEach(t => t.stop());
      currentStream = null;
    }
  }

  startCamera();

  // Watchdog video hitam
  const probe = document.createElement('canvas');
  const pctx = probe.getContext('2d', { willReadFrequently:true });
  let blackCount = 0;

  setInterval(() => {
    if (submitted) return;
    if (!video.srcObject || video.readyState < 2) return;

    probe.width = 32; probe.height = 32;
    try {
      pctx.drawImage(video, 0, 0, 32, 32);
      const img = pctx.getImageData(0,0,32,32).data;
      let sum = 0;
      for(let i=0;i<img.length;i+=4) sum += img[i] + img[i+1] + img[i+2];
      const avg = sum / (32*32*3);

      if (avg < 5) blackCount++;
      else blackCount = 0;

      if (blackCount >= 3) {
        blackCount = 0;
        stopCamera();
        startCamera();
      }
    } catch(e) {}
  }, 1000);

  // ===============================
  // CLIENT COMPRESSION (PAKSA KECIL)
  // ===============================
  function dataURLBytes(dataURL){
    const base64 = (dataURL.split(',')[1] || '');
    const padding = base64.endsWith('==') ? 2 : (base64.endsWith('=') ? 1 : 0);
    return Math.max(0, Math.floor(base64.length * 3 / 4) - padding);
  }

  function makeDataURL(canvas, preferWebp, quality){
    if (preferWebp){
      try {
        const d = canvas.toDataURL('image/webp', quality);
        if (d && d.startsWith('data:image/webp')) return d;
      } catch(e){}
    }
    return canvas.toDataURL('image/jpeg', quality);
  }

  function resizeCanvasFromVideo(videoEl, targetW){
    const vw = videoEl.videoWidth || 640;
    const vh = videoEl.videoHeight || 480;

    const scale = targetW / vw;
    const cw = Math.max(1, Math.round(vw * scale));
    const ch = Math.max(1, Math.round(vh * scale));

    const c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    const ctx = c.getContext('2d');

    // mirror agar konsisten
    ctx.translate(cw, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoEl, 0, 0, cw, ch);

    return c;
  }

  // ✅ PAKSA: selalu buat file kecil (target 180KB)
  function autoCaptureAndSubmit(){
    if (submitted) return;
    submitted = true;

    subtxt.textContent = "Menyimpan...";
    hint.textContent = "Mengompres foto...";

    const TARGET_BYTES = 180 * 1024;

    let targetW = 720;
    let q = 0.82;

    const minW = 420;
    const minQ = 0.45;

    let bestDataURL = "";
    let bestBytes = Infinity;

    for (let round = 0; round < 30; round++){
      if (!video.srcObject || video.readyState < 2) break;

      const c = resizeCanvasFromVideo(video, targetW);
      const d = makeDataURL(c, true, q);
      const bytes = dataURLBytes(d);

      if (bytes < bestBytes){
        bestBytes = bytes;
        bestDataURL = d;
      }

      if (bytes <= TARGET_BYTES){
        inpFoto.value = d;
        hint.textContent = "Mengirim (" + Math.round(bytes/1024) + "KB)...";
        form.submit();
        return;
      }

      if (q > minQ) {
        q = Math.max(minQ, q - 0.05);
      } else if (targetW > minW) {
        targetW = Math.max(minW, Math.round(targetW * 0.88));
        q = 0.80;
      } else {
        break;
      }
    }

    if (bestDataURL){
      inpFoto.value = bestDataURL;
      hint.textContent = "Mengirim (" + Math.round(bestBytes/1024) + "KB)...";
      form.submit();
      return;
    }

    showToast('error', 'Gagal', 'Tidak bisa mengambil foto. Coba ulang.');
    submitted = false;
  }
});
</script>
</body>
</html>
