<?php
session_start();

// Cek Login
if (!isset($_SESSION['user_id'])) {
    header("Location: request_login");
    exit();
}

function e($s) {
    return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
}

// ambil flash message dari query
$status = $_GET['status'] ?? '';
$msg    = $_GET['msg'] ?? '';

?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pengajuan Izin - Great</title>
    <link rel="icon" href="logo.webp" />
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-slate-50 min-h-screen pb-20 text-slate-900">

    <div class="bg-white px-4 py-3 shadow-sm flex items-center gap-3 sticky top-0 z-50 border-b border-slate-100">
        <a href="riwayat_izin" class="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition active:scale-95 text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
        </a>
        <div class="flex items-center gap-3">
            <img src="assets/brand/great-logo.png" alt="Great" class="h-9 w-9 rounded-2xl bg-slate-50 p-1.5 ring-1 ring-slate-200" />
            <div class="leading-tight">
                <h1 class="font-bold text-base text-slate-800">Form Pengajuan</h1>
                <p class="text-[11px] text-slate-400">Great HRD</p>
            </div>
        </div>
    </div>

    <div class="max-w-md mx-auto p-5">

        <?php if ($status === 'success'): ?>
            <div class="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm">
                <?= e($msg !== '' ? $msg : 'Pengajuan izin berhasil dikirim ke HR dan salinan ke email Anda.') ?>
            </div>
        <?php elseif ($status === 'error'): ?>
            <div class="mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                <?= e($msg !== '' ? $msg : 'Terjadi kesalahan saat mengirim pengajuan.') ?>
            </div>
        <?php endif; ?>

        <!-- TAB: 4 tombol -->
        <div class="grid grid-cols-2 gap-3 mb-6">

            <button type="button" onclick="gantiTab('sakit')" id="btn-sakit"
                class="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-rose-500 bg-rose-50 text-rose-600 transition-all shadow-sm active:scale-95">
                <div class="bg-white p-2.5 rounded-full mb-2 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </div>
                <span class="font-bold text-sm">Izin Sakit</span>
            </button>

            <button type="button" onclick="gantiTab('cuti')" id="btn-cuti"
                class="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                <div class="bg-slate-100 p-2.5 rounded-full mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <span class="font-bold text-sm">Cuti Tahunan</span>
            </button>

            <button type="button" onclick="gantiTab('cuti_khusus')" id="btn-cuti-khusus"
                class="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-center">
                <div class="bg-slate-100 p-2.5 rounded-full mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12h6m-3-3v6m8-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <span class="font-bold text-sm">Cuti Khusus</span>
            </button>

            <button type="button" onclick="gantiTab('setengah_hari')" id="btn-setengah-hari"
                class="flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-center">
                <div class="bg-slate-100 p-2.5 rounded-full mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <span class="font-bold text-sm">Cuti 1/2 Hari</span>
            </button>

        </div>

        <!-- penting: action ke /actions/proses_izin.php -->
        <form action="/actions/proses_izin.php" method="POST" enctype="multipart/form-data"
            class="bg-white p-6 rounded-3xl shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-slate-100 space-y-5">

            <input type="hidden" name="tipe" id="input-tipe" value="Sakit">

            <div class="border-b border-slate-100 pb-2">
                <h2 id="judul-form" class="text-xl font-bold text-slate-800">Formulir Sakit</h2>
                <p id="desc-form" class="text-[11px] text-slate-400 mt-1">
                    Lampirkan surat dokter jika lebih dari 1 hari.
                </p>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Mulai Tanggal</label>
                    <input type="date" name="mulai" required
                        class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm transition-all hover:bg-white">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Sampai Tanggal</label>
                    <input type="date" name="sampai" required
                        class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm transition-all hover:bg-white">
                </div>
            </div>

            <!-- DROPDOWN CUTI KHUSUS -->
            <div id="box-cuti-khusus" class="hidden">
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Jenis Cuti Khusus</label>
                <select name="jenis_cuti_khusus" id="jenis-cuti-khusus"
                        class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all hover:bg-white"
                        disabled>
                    <option value="" selected disabled>Pilih jenis cuti khusus...</option>
                    <option value="Cuti haid">Cuti haid</option>
                    <option value="Cuti melahirkan">Cuti melahirkan</option>
                    <option value="Cuti keguguran">Cuti keguguran</option>
                    <option value="Cuti menikah">Cuti menikah</option>
                    <option value="Cuti menikahkan anak">Cuti menikahkan anak</option>
                    <option value="Cuti mengkhitankan anak">Cuti mengkhitankan anak</option>
                    <option value="Cuti istri melahirkan / keguguran">Cuti istri melahirkan / keguguran</option>
                    <option value="Cuti keluarga inti meninggal dunia">Cuti keluarga inti meninggal dunia</option>
                </select>
                <p class="text-[11px] text-slate-400 mt-1 ml-1">Pilih salah satu jenis cuti khusus sesuai kebutuhan.</p>
            </div>

            <!-- JAM CUTI SETENGAH HARI -->
            <div id="box-waktu-setengah-hari" class="hidden">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Mulai Jam</label>
                        <input type="time" name="jam_mulai" id="input-jam-mulai"
                            class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition-all hover:bg-white">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Sampai Jam</label>
                        <input type="time" name="jam_selesai" id="input-jam-selesai"
                            class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition-all hover:bg-white">
                    </div>
                </div>
            </div>

            <div>
                <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Keterangan / Alasan</label>
                <textarea name="alasan" rows="3" required placeholder="Jelaskan alasan izin Anda..."
                    class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm transition-all hover:bg-white resize-none"></textarea>
            </div>

            <!-- UPLOAD (2 FILE) -->
            <div id="box-upload">
              <label class="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Bukti Foto / Surat</label>

              <div class="space-y-4">
                <!-- Upload 1 -->
                <div>
                  <p class="text-[11px] font-semibold text-slate-500 ml-1 mb-2">Lampiran 1 (utama)</p>

                  <div class="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 p-6 text-center hover:bg-slate-100 transition cursor-pointer overflow-hidden group">
                    <input type="file" name="bukti" id="input-bukti" accept="image/*,.pdf"
                           class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                           onchange="previewImage(event, 1)">

                    <div id="default-view-1" class="flex flex-col items-center">
                      <div class="bg-white p-3 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform ring-1 ring-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span class="text-xs text-slate-600 font-semibold">Upload Lampiran 1</span>
                      <span class="text-[10px] text-slate-400 mt-1">Format: JPG, PNG, PDF (Max 2MB)</span>
                    </div>

                    <div id="preview-view-1" class="hidden relative z-10 flex flex-col items-center">
                      <div class="relative group-hover:opacity-90 transition-opacity">
                        <img id="img-preview-1" src="" class="h-32 object-contain rounded-lg shadow-sm border border-slate-200 bg-white">
                        <div class="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <span class="text-[10px] text-white font-bold bg-black/50 px-2 py-1 rounded">Ganti File</span>
                        </div>
                      </div>
                      <p id="file-name-1" class="text-xs font-bold text-slate-700 truncate mt-2 max-w-[200px]"></p>
                    </div>
                  </div>
                </div>

                <!-- Upload 2 -->
                <div>
                  <p class="text-[11px] font-semibold text-slate-500 ml-1 mb-2">Lampiran 2 (opsional)</p>

                  <div class="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 p-6 text-center hover:bg-slate-100 transition cursor-pointer overflow-hidden group">
                    <input type="file" name="bukti2" id="input-bukti-2" accept="image/*,.pdf"
                           class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                           onchange="previewImage(event, 2)">

                    <div id="default-view-2" class="flex flex-col items-center">
                      <div class="bg-white p-3 rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform ring-1 ring-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span class="text-xs text-slate-600 font-semibold">Upload Lampiran 2</span>
                      <span class="text-[10px] text-slate-400 mt-1">Format: JPG, PNG, PDF (Max 2MB)</span>
                    </div>

                    <div id="preview-view-2" class="hidden relative z-10 flex flex-col items-center">
                      <div class="relative group-hover:opacity-90 transition-opacity">
                        <img id="img-preview-2" src="" class="h-32 object-contain rounded-lg shadow-sm border border-slate-200 bg-white">
                        <div class="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <span class="text-[10px] text-white font-bold bg-black/50 px-2 py-1 rounded">Ganti File</span>
                        </div>
                      </div>
                      <p id="file-name-2" class="text-xs font-bold text-slate-700 truncate mt-2 max-w-[200px]"></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" id="btn-submit"
                class="w-full py-4 rounded-xl bg-rose-600 text-white font-bold shadow-lg shadow-rose-200 active:scale-[0.98] hover:bg-rose-700 transition-all flex items-center justify-center gap-2">
                <span>Kirim Pengajuan</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
            </button>
        </form>
    </div>

    <script>
        function gantiTab(tipe) {
            const btnSakit = document.getElementById('btn-sakit');
            const btnCuti = document.getElementById('btn-cuti');
            const btnCutiKhusus = document.getElementById('btn-cuti-khusus');
            const btnSetengahHari = document.getElementById('btn-setengah-hari');

            const inputTipe = document.getElementById('input-tipe');
            const judulForm = document.getElementById('judul-form');
            const descForm  = document.getElementById('desc-form');

            const boxUpload = document.getElementById('box-upload');
            const boxCutiKhusus = document.getElementById('box-cuti-khusus');
            const selectCutiKhusus = document.getElementById('jenis-cuti-khusus');

            const boxWaktuSetengahHari = document.getElementById('box-waktu-setengah-hari');
            const inputJamMulai = document.getElementById('input-jam-mulai');
            const inputJamSelesai = document.getElementById('input-jam-selesai');

            const activeClass = "border-2 border-rose-500 bg-rose-50 text-rose-600 shadow-md ring-2 ring-rose-100";
            const inactiveClass = "border border-slate-200 bg-white text-slate-400 hover:bg-slate-50";

            const activeCutiClass = "border-2 border-blue-500 bg-blue-50 text-blue-600 shadow-md ring-2 ring-blue-100";
            const activeCutiKhususClass = "border-2 border-violet-500 bg-violet-50 text-violet-700 shadow-md ring-2 ring-violet-100";
            const activeSetengahHariClass = "border-2 border-amber-500 bg-amber-50 text-amber-600 shadow-md ring-2 ring-amber-100";

            resetPreview();

            boxCutiKhusus.classList.add('hidden');
            selectCutiKhusus.disabled = true;
            selectCutiKhusus.required = false;
            selectCutiKhusus.value = "";

            boxWaktuSetengahHari.classList.add('hidden');
            inputJamMulai.required = false;
            inputJamSelesai.required = false;

            if (tipe === 'sakit') {
                inputTipe.value = "Sakit";
                judulForm.innerText = "Formulir Sakit";
                if (descForm) descForm.innerText = "Lampirkan surat dokter jika lebih dari 1 hari.";
                boxUpload.classList.remove('hidden');

                btnSakit.className = "flex flex-col items-center justify-center p-4 rounded-2xl transition-all " + activeClass;
                btnCuti.className = "flex flex-col items-center justify-center p-4 rounded-2xl transition-all " + inactiveClass;
                btnCutiKhusus.className = "flex flex-col items-center justify-center p-4 rounded-2xl transition-all text-center " + inactiveClass;
                btnSetengahHari.className = "flex flex-col items-center justify-center p-4 rounded-2xl transition-all text-center " + inactiveClass;
            }
            else if (tipe === 'cuti') {
                inputTipe.value = "Cuti";
                judulForm.innerText = "Formulir Cuti";
                if (descForm) descForm.innerText = "Upload lampiran bila diperlukan (misal: bukti tiket).";
                boxUpload.classList.remove('hidden');

                btnSakit.className = "flex flex-col items-center justify-center p-4 rounded-2xl transition-all " + inactiveClass;
                btnCuti.className = "flex flex-col items-center justify-center p-4 rounded-2xl transition-all " + activeCutiClass;
                btnCutiKhusus.className = "flex flex-col items-center justify-center p-4 rounded-2xl transition-all text-center " + inactiveClass;
                btnSetengahHari.className = "flex flex-col items-center justify-center p-4 rounded-2xl transition-all text-center " + inactiveClass;
            }
            else if (tipe === 'cuti_khusus') {
                inputTipe.value = "Cuti Khusus";
                judulForm.innerText = "Formulir Cuti Khusus";
                if (descForm) descForm.innerText = "Pilih jenis cuti khusus yang sesuai.";
                boxUpload.classList.add('hidden');

                boxCutiKhusus.classList.remove('hidden');
                selectCutiKhusus.disabled = false;
                selectCutiKhusus.required = true;

                btnSakit.className = "flex flex-col items-center justify-center p-4 rounded-2xl transition-all " + inactiveClass;
                btnCuti.className = "flex flex-col items-center justify-center p-4 rounded-2xl transition-all " + inactiveClass;
                btnCutiKhusus.className = "flex flex-col items-center justify-center p-4 rounded-2xl transition-all text-center " + activeCutiKhususClass;
                btnSetengahHari.className = "flex flex-col items-center justify-center p-4 rounded-2xl transition-all text-center " + inactiveClass;
            }
            else if (tipe === 'setengah_hari') {
                inputTipe.value = "Cuti Setengah Hari";
                judulForm.innerText = "Formulir Cuti Setengah Hari";
                if (descForm) descForm.innerText = "Masukkan estimasi jam cuti Anda.";
                boxUpload.classList.remove('hidden');

                boxWaktuSetengahHari.classList.remove('hidden');
                inputJamMulai.required = true;
                inputJamSelesai.required = true;

                btnSakit.className = "flex flex-col items-center justify-center p-4 rounded-2xl transition-all " + inactiveClass;
                btnCuti.className = "flex flex-col items-center justify-center p-4 rounded-2xl transition-all " + inactiveClass;
                btnCutiKhusus.className = "flex flex-col items-center justify-center p-4 rounded-2xl transition-all text-center " + inactiveClass;
                btnSetengahHari.className = "flex flex-col items-center justify-center p-4 rounded-2xl transition-all text-center " + activeSetengahHariClass;
            }
        }

        function previewImage(event, idx) {
            const input = event.target;

            const defaultView = document.getElementById(`default-view-${idx}`);
            const previewView = document.getElementById(`preview-view-${idx}`);
            const imgPreview  = document.getElementById(`img-preview-${idx}`);
            const fileName    = document.getElementById(`file-name-${idx}`);

            if (input.files && input.files[0]) {
                const file = input.files[0];
                fileName.innerText = file.name;

                if (file.type.match('image.*')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        imgPreview.src = e.target.result;
                    }
                    reader.readAsDataURL(file);
                } else {
                    imgPreview.src = "https://cdn-icons-png.flaticon.com/512/337/337946.png";
                }

                defaultView.classList.add('hidden');
                previewView.classList.remove('hidden');
            }
        }

        function resetPreview() {
            const input1 = document.getElementById('input-bukti');
            const def1 = document.getElementById('default-view-1');
            const prev1 = document.getElementById('preview-view-1');
            if (input1) input1.value = "";
            if (def1) def1.classList.remove('hidden');
            if (prev1) prev1.classList.add('hidden');

            const input2 = document.getElementById('input-bukti-2');
            const def2 = document.getElementById('default-view-2');
            const prev2 = document.getElementById('preview-view-2');
            if (input2) input2.value = "";
            if (def2) def2.classList.remove('hidden');
            if (prev2) prev2.classList.add('hidden');
        }
    </script>
</body>
</html>