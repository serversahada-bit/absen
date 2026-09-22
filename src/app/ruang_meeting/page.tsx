'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import BackLink from '@/components/BackLink';
import TimeSelect from './TimeSelect';

export default function PengajuanRuangMeetingPage() {
  const router = useRouter();

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch('/api/ruang_meeting', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Terjadi kesalahan saat mengirim pengajuan.');
        return;
      }

      router.push('/riwayat_ruang_meeting');
      router.refresh();
      return;
    } catch {
      setErrorMsg('Terjadi masalah koneksi. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell maxWidth="lg:max-w-2xl">
      <div className="text-slate-900 font-sans selection:bg-indigo-200">
        {isSubmitting && (
          <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center animate-fade-in-up">
            <div className="bg-white rounded-[28px] shadow-2xl px-8 py-7 flex flex-col items-center gap-3">
              <Loader2 className="w-9 h-9 text-indigo-600 animate-spin" />
              <p className="text-sm font-black text-slate-800">Mengirim pengajuan...</p>
              <p className="text-xs font-semibold text-slate-400">Mohon tunggu sebentar</p>
            </div>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-xl px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-3 sticky top-0 z-40 border-b border-slate-100">
          <BackLink>
            <button
              onClick={() => router.push('/riwayat_ruang_meeting')}
              className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition active:scale-95 text-slate-500 border border-slate-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </BackLink>
          <h1 className="font-black text-[17px] text-slate-900 tracking-tight">Pengajuan Ruang Meeting</h1>
        </div>

        <div className="max-w-md mx-auto p-5">
          {errorMsg && (
            <div className="mb-5 rounded-[20px] bg-rose-500 border border-rose-400 p-4 flex items-start gap-3 shadow-lg shadow-rose-500/20 animate-fade-in-up">
              <AlertCircle className="w-5 h-5 text-white shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-white">Gagal</h3>
                <p className="text-[13px] font-medium text-white/90 leading-snug mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Formulir Ruang Meeting</h2>
              <p className="text-[12px] font-semibold text-slate-400 mt-1">Isi detail penggunaan ruang meeting.</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Tanggal Pengajuan</label>
              <input type="date" name="tanggal" required
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-[14px] font-bold text-slate-700 transition-all" />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Kegiatan</label>
              <input type="text" name="kegiatan" required placeholder="Misal: Rapat evaluasi bulanan"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-[14px] font-bold text-slate-700 transition-all" />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Jenis Aktifitas</label>
              <input type="text" name="jenis_aktifitas" required placeholder="Misal: Rapat Internal"
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-[14px] font-bold text-slate-700 transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Waktu Mulai</label>
                <TimeSelect name="jam_mulai" required />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Waktu Selesai</label>
                <TimeSelect name="jam_selesai" required />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Catatan (opsional)</label>
              <textarea name="catatan" rows={3} placeholder="Catatan tambahan..."
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-[14px] font-medium text-slate-700 transition-all resize-none placeholder:text-slate-400"></textarea>
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
