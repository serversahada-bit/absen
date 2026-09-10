'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UploadCloud, AlertCircle, FileText, Loader2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import BackLink from '@/components/BackLink';

const JENIS_DOKUMEN = ['Perjanjian', 'Sewa Menyewa', 'MoU', 'Lainnya'];

export default function PengajuanLegalitasPage() {
  const router = useRouter();

  const [jenisDokumen, setJenisDokumen] = useState('');
  const [fileName, setFileName] = useState('');
  const [statusParam, setStatusParam] = useState('');
  const [msgParam, setMsgParam] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileName(file ? file.name : '');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setStatusParam('');
    setMsgParam('');

    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch('/api/legalitas', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setStatusParam('error');
        setMsgParam(data.error || 'Terjadi kesalahan saat mengirim pengajuan.');
        return;
      }

      router.push('/riwayat_legalitas?legalitas_success=1');
      router.refresh();
      return;
    } catch {
      setStatusParam('error');
      setMsgParam('Terjadi masalah koneksi. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell maxWidth="lg:max-w-2xl">
    <div className="text-slate-900 font-sans selection:bg-indigo-200">

      {/* LOADING OVERLAY */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center animate-fade-in-up">
          <div className="bg-white rounded-[28px] shadow-2xl px-8 py-7 flex flex-col items-center gap-3">
            <Loader2 className="w-9 h-9 text-indigo-600 animate-spin" />
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
              onClick={() => router.push('/riwayat_legalitas')}
              className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition active:scale-95 text-slate-500 border border-slate-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </BackLink>
          <h1 className="font-black text-[17px] text-slate-900 tracking-tight">Pengajuan Legalitas</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-5">

        {statusParam === 'error' && (
          <div className="mb-5 rounded-[20px] bg-rose-500 border border-rose-400 p-4 flex items-start gap-3 shadow-lg shadow-rose-500/20 animate-fade-in-up">
            <AlertCircle className="w-5 h-5 text-white shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-white">Gagal</h3>
              <p className="text-[13px] font-medium text-white/90 leading-snug mt-0.5">{msgParam || 'Terjadi kesalahan saat mengirim pengajuan.'}</p>
            </div>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 space-y-6">

          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-800 tracking-tight">Formulir Legalitas</h2>
            <p className="text-[12px] font-semibold text-slate-400 mt-1">Ajukan legalisasi dokumen dengan upload file PDF.</p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Jenis Dokumen</label>
            <select name="jenis_dokumen" required value={jenisDokumen} onChange={(e) => setJenisDokumen(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-[14px] font-bold text-slate-700 transition-all appearance-none"
            >
              <option value="" disabled>Pilih jenis dokumen...</option>
              {JENIS_DOKUMEN.map((jenis) => (
                <option key={jenis} value={jenis}>{jenis}</option>
              ))}
            </select>
          </div>

          {jenisDokumen === 'Lainnya' && (
            <div className="animate-fade-in-up">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Sebutkan Jenis Dokumen</label>
              <input type="text" name="jenis_dokumen_lainnya" required maxLength={50} placeholder="Contoh: Surat Kuasa"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-[14px] font-bold text-slate-700 transition-all placeholder:text-slate-400 placeholder:font-medium" />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Keterangan (Opsional)</label>
            <textarea name="keterangan" rows={3} placeholder="Jelaskan keperluan legalisasi..."
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-[14px] font-medium text-slate-700 transition-all resize-none placeholder:text-slate-400"></textarea>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2">File PDF (Max 5MB)</label>
            <div className="relative group">
              <input type="file" name="file_pdf" accept="application/pdf" required onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
              <div className={`h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${fileName ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-200 bg-slate-50 group-hover:border-slate-300 group-hover:bg-slate-100'}`}>
                {fileName ? (
                  <div className="text-center px-4">
                    <FileText className="w-8 h-8 text-indigo-500 mx-auto mb-1" />
                    <p className="text-[11px] font-bold text-indigo-700 truncate max-w-[220px]">{fileName}</p>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-2 text-indigo-500">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500">Pilih file PDF</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting}
            className="w-full mt-4 py-4 rounded-[20px] bg-indigo-600 text-white font-black tracking-widest text-[14px] shadow-[0_8px_20px_rgba(79,70,229,0.3)] active:scale-[0.98] hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
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
