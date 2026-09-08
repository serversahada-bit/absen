'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Stethoscope, CalendarDays, CalendarClock, Clock, UploadCloud, CheckCircle2, AlertCircle, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import BackLink from '@/components/BackLink';

export default function PengajuanIzinPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('sakit');
  const [bukti1Url, setBukti1Url] = useState<string | null>(null);
  const [bukti2Url, setBukti2Url] = useState<string | null>(null);
  const [bukti1Name, setBukti1Name] = useState<string>('');
  const [bukti2Name, setBukti2Name] = useState<string>('');

  const [statusParam, setStatusParam] = useState('');
  const [msgParam, setMsgParam] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Read query params for status
    const params = new URLSearchParams(window.location.search);
    if (params.get('status')) setStatusParam(params.get('status')!);
    if (params.get('msg')) setMsgParam(params.get('msg')!);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setStatusParam('');
    setMsgParam('');

    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch('/api/izin', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setStatusParam('error');
        setMsgParam(data.error || 'Terjadi kesalahan saat mengirim pengajuan.');
        return;
      }

      setStatusParam('success');
      setMsgParam(data.message || 'Pengajuan izin berhasil dikirim.');
      e.currentTarget.reset();
      setBukti1Url(null);
      setBukti2Url(null);
      setBukti1Name('');
      setBukti2Name('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setStatusParam('error');
      setMsgParam('Terjadi masalah koneksi. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (idx === 1) setBukti1Name(file.name);
      if (idx === 2) setBukti2Name(file.name);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (idx === 1) setBukti1Url(ev.target?.result as string);
          if (idx === 2) setBukti2Url(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // PDF or other
        if (idx === 1) setBukti1Url('pdf');
        if (idx === 2) setBukti2Url('pdf');
      }
    }
  };

  const tabs = [
    { id: 'sakit', label: 'Izin Sakit', icon: Stethoscope, activeColor: 'text-rose-600', activeBg: 'bg-rose-50', activeBorder: 'border-rose-500', iconColor: 'text-rose-500' },
    { id: 'cuti', label: 'Cuti Tahunan', icon: CalendarDays, activeColor: 'text-blue-600', activeBg: 'bg-blue-50', activeBorder: 'border-blue-500', iconColor: 'text-blue-500' },
    { id: 'cuti_khusus', label: 'Cuti Khusus', icon: FileText, activeColor: 'text-violet-700', activeBg: 'bg-violet-50', activeBorder: 'border-violet-500', iconColor: 'text-violet-500' },
    { id: 'setengah_hari', label: 'Cuti 1/2 Hari', icon: Clock, activeColor: 'text-amber-600', activeBg: 'bg-amber-50', activeBorder: 'border-amber-500', iconColor: 'text-amber-500' },
  ];

  let formTitle = '';
  let formDesc = '';
  let inputValue = '';
  
  switch(activeTab) {
    case 'sakit': 
      formTitle = 'Formulir Sakit'; 
      formDesc = 'Lampirkan surat dokter jika lebih dari 1 hari.';
      inputValue = 'Sakit';
      break;
    case 'cuti': 
      formTitle = 'Formulir Cuti'; 
      formDesc = 'Upload lampiran bila diperlukan (misal: bukti tiket).';
      inputValue = 'Cuti';
      break;
    case 'cuti_khusus': 
      formTitle = 'Formulir Cuti Khusus'; 
      formDesc = 'Pilih jenis cuti khusus yang sesuai.';
      inputValue = 'Cuti Khusus';
      break;
    case 'setengah_hari': 
      formTitle = 'Formulir Cuti Setengah Hari'; 
      formDesc = 'Masukkan estimasi jam cuti Anda.';
      inputValue = 'Cuti Setengah Hari';
      break;
  }

  const showUpload = activeTab !== 'cuti_khusus';
  const showCutiKhusus = activeTab === 'cuti_khusus';
  const showJamSetengahHari = activeTab === 'setengah_hari';

  return (
    <AppShell maxWidth="lg:max-w-2xl">
    <div className="text-slate-900 font-sans selection:bg-rose-200">

      {/* LOADING OVERLAY */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center animate-fade-in-up">
          <div className="bg-white rounded-[28px] shadow-2xl px-8 py-7 flex flex-col items-center gap-3">
            <Loader2 className="w-9 h-9 text-rose-600 animate-spin" />
            <p className="text-sm font-black text-slate-800">Mengirim pengajuan...</p>
            <p className="text-xs font-semibold text-slate-400">Mohon tunggu sebentar</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white/80 backdrop-blur-xl px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between sticky top-0 z-40 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <BackLink>
            <button
              onClick={() => router.push('/riwayat_izin')}
              className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition active:scale-95 text-slate-500 border border-slate-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </BackLink>
          <h1 className="font-black text-[17px] text-slate-900 tracking-tight">Pengajuan Izin</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-5">
        
        {statusParam === 'success' && (
          <div className="mb-5 rounded-[20px] bg-emerald-500 border border-emerald-400 p-4 flex items-start gap-3 shadow-lg shadow-emerald-500/20 animate-fade-in-up">
            <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-white">Berhasil</h3>
              <p className="text-[13px] font-medium text-white/90 leading-snug mt-0.5">{msgParam || 'Pengajuan izin berhasil dikirim ke HR dan salinan ke email Anda.'}</p>
            </div>
          </div>
        )}

        {statusParam === 'error' && (
          <div className="mb-5 rounded-[20px] bg-rose-500 border border-rose-400 p-4 flex items-start gap-3 shadow-lg shadow-rose-500/20 animate-fade-in-up">
            <AlertCircle className="w-5 h-5 text-white shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-white">Gagal</h3>
              <p className="text-[13px] font-medium text-white/90 leading-snug mt-0.5">{msgParam || 'Terjadi kesalahan saat mengirim pengajuan.'}</p>
            </div>
          </div>
        )}

        {/* TAB BUTTONS */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setBukti1Url(null);
                  setBukti2Url(null);
                }}
                className={`flex flex-col items-center justify-center p-4 rounded-[24px] border-2 transition-all active:scale-95 ${
                  isActive 
                  ? `${tab.activeBorder} ${tab.activeBg} ${tab.activeColor} shadow-md` 
                  : 'border-transparent bg-white text-slate-400 hover:bg-slate-50 shadow-[0_4px_20px_rgb(0,0,0,0.03)]'
                }`}
              >
                <div className={`p-3 rounded-2xl mb-2.5 transition-colors ${isActive ? 'bg-white shadow-sm' : 'bg-slate-50'}`}>
                  <Icon className={`w-6 h-6 ${isActive ? tab.iconColor : 'text-slate-400'}`} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="font-black text-[13px] tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 space-y-6">
          
          <input type="hidden" name="tipe" value={inputValue} />

          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-800 tracking-tight">{formTitle}</h2>
            <p className="text-[12px] font-semibold text-slate-400 mt-1">{formDesc}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Mulai Tgl</label>
              <input type="date" name="mulai" required
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-rose-500 text-[14px] font-bold text-slate-700 transition-all" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Sampai Tgl</label>
              <input type="date" name="sampai" required
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-rose-500 text-[14px] font-bold text-slate-700 transition-all" />
            </div>
          </div>

          {showCutiKhusus && (
            <div className="animate-fade-in-up">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Jenis Cuti Khusus</label>
              <select name="jenis_cuti_khusus" required
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-violet-500 text-[14px] font-bold text-slate-700 transition-all appearance-none"
              >
                <option value="" disabled selected>Pilih jenis cuti...</option>
                <option value="Cuti haid">Cuti haid</option>
                <option value="Cuti melahirkan">Cuti melahirkan</option>
                <option value="Cuti keguguran">Cuti keguguran</option>
                <option value="Cuti menikah">Cuti menikah</option>
                <option value="Cuti menikahkan anak">Cuti menikahkan anak</option>
                <option value="Cuti mengkhitankan anak">Cuti mengkhitankan anak</option>
                <option value="Cuti istri melahirkan / keguguran">Cuti istri melahirkan / keguguran</option>
                <option value="Cuti keluarga inti meninggal dunia">Cuti keluarga inti meninggal dunia</option>
              </select>
            </div>
          )}

          {showJamSetengahHari && (
            <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Mulai Jam</label>
                <input type="time" name="jam_mulai" required
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-amber-500 text-[14px] font-bold text-slate-700 transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Sampai Jam</label>
                <input type="time" name="jam_selesai" required
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-amber-500 text-[14px] font-bold text-slate-700 transition-all" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Alasan / Keterangan</label>
            <textarea name="alasan" rows={3} required placeholder="Jelaskan secara singkat..."
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-rose-500 text-[14px] font-medium text-slate-700 transition-all resize-none placeholder:text-slate-400"></textarea>
          </div>

          {showUpload && (
            <div className="space-y-4 animate-fade-in-up">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2">Lampiran Berkas (Max 2MB)</label>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Upload 1 */}
                <div className="relative group">
                  <input type="file" name="bukti" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 1)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                  <div className={`h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${bukti1Url ? 'border-violet-300 bg-violet-50/30' : 'border-slate-200 bg-slate-50 group-hover:border-slate-300 group-hover:bg-slate-100'}`}>
                    {bukti1Url ? (
                      bukti1Url === 'pdf' ? (
                        <div className="text-center">
                           <FileText className="w-8 h-8 text-violet-500 mx-auto mb-1" />
                           <p className="text-[10px] font-bold text-violet-700 truncate w-24 px-2">{bukti1Name}</p>
                        </div>
                      ) : (
                        <div className="relative w-full h-full p-2">
                          <img src={bukti1Url} className="w-full h-full object-cover rounded-xl shadow-sm" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity m-2">
                             <span className="text-[9px] font-bold text-white bg-black/50 px-2 py-1 rounded">Ubah</span>
                          </div>
                        </div>
                      )
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-rose-500">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500">Lampiran 1</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Upload 2 */}
                <div className="relative group">
                  <input type="file" name="bukti2" accept="image/*,.pdf" onChange={(e) => handleFileChange(e, 2)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                  <div className={`h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${bukti2Url ? 'border-violet-300 bg-violet-50/30' : 'border-slate-200 bg-slate-50 group-hover:border-slate-300 group-hover:bg-slate-100'}`}>
                    {bukti2Url ? (
                      bukti2Url === 'pdf' ? (
                        <div className="text-center">
                           <FileText className="w-8 h-8 text-violet-500 mx-auto mb-1" />
                           <p className="text-[10px] font-bold text-violet-700 truncate w-24 px-2">{bukti2Name}</p>
                        </div>
                      ) : (
                        <div className="relative w-full h-full p-2">
                          <img src={bukti2Url} className="w-full h-full object-cover rounded-xl shadow-sm" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity m-2">
                             <span className="text-[9px] font-bold text-white bg-black/50 px-2 py-1 rounded">Ubah</span>
                          </div>
                        </div>
                      )
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-slate-400">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500">Lampiran 2</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={isSubmitting}
            className="w-full mt-4 py-4 rounded-[20px] bg-rose-600 text-white font-black tracking-widest text-[14px] shadow-[0_8px_20px_rgba(225,29,72,0.3)] active:scale-[0.98] hover:bg-rose-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                MENGIRIM...
              </>
            ) : (
              'KIRIM PENGAJUAN'
            )}
          </button>
        </form>
      </div>
    </div>
    </AppShell>
  );
}
