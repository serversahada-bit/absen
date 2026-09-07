'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, AlertCircle, Fingerprint, History } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import BackLink from '@/components/BackLink';

export interface LemburHistoryItem {
  mulaiAt: string;
  selesaiAt: string;
  durasiMenit: number;
  status: string;
}

interface LemburClientProps {
  userName: string;
  userRole: string;
  initialHistory: LemburHistoryItem[];
}

function menitToJamMenit(menit: number): string {
  const jam = Math.floor(menit / 60);
  const sisaMenit = menit % 60;
  return `${jam} jam ${String(sisaMenit).padStart(2, '0')} menit`;
}

function statusBadgeClass(statusRaw: string): string {
  const status = statusRaw.toUpperCase();
  if (status === 'APPROVED') return 'bg-emerald-50 text-emerald-700';
  if (status === 'REJECTED') return 'bg-rose-50 text-rose-700';
  return 'bg-amber-50 text-amber-700';
}

export default function LemburClient({ userName, userRole, initialHistory }: LemburClientProps) {
  const router = useRouter();

  const [tanggal, setTanggal] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mulai, setMulai] = useState('');
  const [selesai, setSelesai] = useState('');
  const [alasan, setAlasan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const durasiPreview = useMemo(() => {
    if (!mulai || !selesai) return null;
    const [h1, m1] = mulai.split(':').map(Number);
    const [h2, m2] = selesai.split(':').map(Number);
    if ([h1, m1, h2, m2].some((n) => Number.isNaN(n))) return null;
    let dur = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (dur < 0) dur += 24 * 60;
    return dur;
  }, [mulai, selesai]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/lembur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tanggal, mulai, selesai, alasan }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: 'success', text: data.message || 'Pengajuan lembur berhasil dikirim.' });
        setMulai('');
        setSelesai('');
        setAlasan('');
        router.refresh();
      } else {
        setMessage({ type: 'error', text: (data.errors || []).join(' ') || 'Gagal mengirim pengajuan.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan jaringan. Coba lagi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="text-slate-900 font-sans selection:bg-violet-200">
      {/* HEADER */}
      <div className="bg-white/80 backdrop-blur-xl px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between sticky top-0 z-40 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <BackLink>
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition active:scale-95 text-slate-500 border border-slate-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </BackLink>
          <div>
            <h1 className="font-black text-[17px] text-slate-900 tracking-tight leading-none">Pengajuan Lembur</h1>
            <p className="text-[11px] font-semibold text-slate-400 mt-1">{userName} &bull; {userRole}</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-5">
        {message && (
          <div
            className={`mb-5 rounded-[20px] p-4 flex items-start gap-3 shadow-lg animate-fade-in-up ${
              message.type === 'success'
                ? 'bg-emerald-500 shadow-emerald-500/20'
                : 'bg-rose-500 shadow-rose-500/20'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-white shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className="text-sm font-bold text-white">{message.type === 'success' ? 'Berhasil' : 'Gagal'}</h3>
              <p className="text-[13px] font-medium text-white/90 leading-snug mt-0.5">{message.text}</p>
            </div>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Form Pengajuan</h2>
              <p className="text-[12px] font-semibold text-slate-400 mt-1">Durasi dihitung otomatis, boleh lewat tengah malam.</p>
            </div>
            {durasiPreview !== null && (
              <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 whitespace-nowrap">
                {menitToJamMenit(durasiPreview)}
              </span>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Tanggal</label>
            <input
              type="date"
              required
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-violet-500 text-[14px] font-bold text-slate-700 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Mulai</label>
              <input
                type="time"
                required
                value={mulai}
                onChange={(e) => setMulai(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-violet-500 text-[14px] font-bold text-slate-700 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Selesai</label>
              <input
                type="time"
                required
                value={selesai}
                onChange={(e) => setSelesai(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-violet-500 text-[14px] font-bold text-slate-700 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Alasan / Keterangan</label>
            <textarea
              rows={3}
              required
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Contoh: Closing laporan, support event, dll..."
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-violet-500 text-[14px] font-medium text-slate-700 transition-all resize-none placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-4 rounded-[20px] bg-gradient-to-br from-violet-600 to-purple-600 text-white font-black tracking-widest text-[14px] shadow-[0_8px_20px_rgba(124,58,237,0.3)] active:scale-[0.98] hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
          >
            <Fingerprint className="w-4 h-4" strokeWidth={2.25} />
            {isSubmitting ? 'Mengirim...' : 'KIRIM PENGAJUAN'}
          </button>
        </form>

        {/* RIWAYAT */}
        <div className="mt-5 bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100">
          <div className="mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-violet-500" strokeWidth={2.25} />
            <p className="font-black text-slate-900 text-sm">Riwayat Terbaru</p>
          </div>

          {initialHistory.length > 0 ? (
            <div className="space-y-2.5">
              {initialHistory.map((item, idx) => {
                const mulaiDt = new Date(item.mulaiAt);
                const selesaiDt = new Date(item.selesaiAt);
                const statusUpper = (item.status || 'PENDING').toUpperCase();
                return (
                  <div key={idx} className="rounded-2xl border border-slate-100 px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-[12px] font-bold text-slate-900">
                        {format(mulaiDt, 'dd MMM yyyy', { locale: id })}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                        {format(mulaiDt, 'HH:mm')} - {format(selesaiDt, 'HH:mm')} &bull; {menitToJamMenit(item.durasiMenit)}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${statusBadgeClass(statusUpper)}`}>
                      {statusUpper}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[12px] font-semibold text-slate-400 text-center py-4">Belum ada pengajuan lembur.</p>
          )}
        </div>
      </div>
    </div>
  );
}
