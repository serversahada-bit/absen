'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CheckCircle2, XCircle, ImageOff } from 'lucide-react';

export interface AprovalIzinRow {
  id: number;
  namaKaryawan: string;
  jabatanKaryawan: string;
  organisasiKaryawan: string;
  tipeIzin: string;
  mulaiTanggal: string;
  sampaiTanggal: string;
  durasiHari: number | null;
  alasan: string;
  buktiFoto: string;
  finalStatus: string;
  managerStatus: string;
  managerNote: string;
}

const badgeClass = (statusRaw: string) => {
  const s = statusRaw.toLowerCase();
  if (s === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (s === 'disetujui') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'ditolak') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

export default function AprovalIzinCard({ row, isLeader }: { row: AprovalIzinRow; isLeader: boolean }) {
  const router = useRouter();
  const [catatan, setCatatan] = useState(row.managerNote || '');
  const [isSubmitting, setIsSubmitting] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const managerStatusNorm = (row.managerStatus || 'Pending').toLowerCase();
  const isApproved = managerStatusNorm === 'disetujui';
  const isRejected = managerStatusNorm === 'ditolak';

  const handleAction = async (aksi: 'approve' | 'reject') => {
    setError(null);
    if (aksi === 'reject' && catatan.trim() === '') {
      setError('Alasan penolakan wajib diisi sebelum Reject.');
      return;
    }

    setIsSubmitting(aksi);
    try {
      const res = await fetch('/api/aproval_izin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, aksi, catatan }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.refresh();
      } else {
        setError(data.message || 'Gagal memproses pengajuan.');
      }
    } catch {
      setError('Terjadi kesalahan jaringan. Coba lagi.');
    } finally {
      setIsSubmitting(null);
    }
  };

  const buktiUrl = row.buktiFoto ? `/uploads/izin/${row.buktiFoto}` : null;

  return (
    <div className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-slate-900 truncate">{row.namaKaryawan}</p>
          <p className="text-[11px] font-semibold text-slate-500 truncate mt-0.5">
            {row.jabatanKaryawan || '-'} &bull; {row.organisasiKaryawan || '-'}
          </p>
          <p className="text-[11px] font-semibold text-slate-400 mt-1">
            Status final (HC): <span className="font-bold text-slate-600">{row.finalStatus}</span>
          </p>
        </div>
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${badgeClass(row.managerStatus)}`}>
          {row.managerStatus}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tipe Izin</div>
          <div className="mt-1 text-[13px] font-bold text-slate-800">{row.tipeIzin || '-'}</div>
        </div>
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tanggal</div>
          <div className="mt-1 text-[13px] font-bold text-slate-800">
            {row.mulaiTanggal} &ndash; {row.sampaiTanggal}
          </div>
        </div>
      </div>

      {row.durasiHari !== null && (
        <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-100 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Durasi</div>
          <div className="mt-1 text-[13px] font-bold text-slate-800">
            {row.durasiHari % 1 === 0 ? row.durasiHari : row.durasiHari.toFixed(1)} Hari
          </div>
        </div>
      )}

      {row.alasan && (
        <div className="mt-3 rounded-2xl bg-white border border-slate-100 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Alasan Pengajuan</div>
          <p className="text-[13px] text-slate-700 leading-relaxed">{row.alasan}</p>
        </div>
      )}

      {isRejected && row.managerNote && (
        <div className="mt-3 rounded-2xl bg-rose-50 border border-rose-100 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mb-1">Alasan Ditolak (Manager/SPV)</div>
          <p className="text-[13px] text-rose-800 leading-relaxed">{row.managerNote}</p>
        </div>
      )}

      {buktiUrl && (
        <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-100 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Bukti Foto</div>
          {!imgError ? (
            <a href={buktiUrl} target="_blank" rel="noopener noreferrer" className="block">
              <Image
                src={buktiUrl}
                alt="Bukti"
                width={400}
                height={220}
                unoptimized
                className="w-full max-h-[220px] object-cover rounded-2xl border border-slate-200"
                onError={() => setImgError(true)}
              />
            </a>
          ) : (
            <a
              href={buktiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[12px] font-semibold text-slate-500"
            >
              <ImageOff className="w-4 h-4" />
              File tidak bisa ditampilkan. Klik untuk membuka: <span className="font-bold">{row.buktiFoto}</span>
            </a>
          )}
        </div>
      )}

      {isLeader && (
        <div className="mt-3 space-y-2">
          {error && <p className="text-[11px] font-bold text-rose-600">{error}</p>}
          <input
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Catatan (wajib diisi jika Reject)"
            className="w-full rounded-2xl border-0 ring-1 ring-inset ring-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] font-medium text-slate-700 outline-none focus:ring-2 focus:ring-violet-300 transition-all"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleAction('approve')}
              disabled={isApproved || isSubmitting !== null}
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 py-2.5 text-[13px] font-bold text-white hover:bg-emerald-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <CheckCircle2 className="w-4 h-4" strokeWidth={2.25} />
              {isSubmitting === 'approve' ? 'Memproses...' : 'Approve'}
            </button>
            <button
              type="button"
              onClick={() => handleAction('reject')}
              disabled={isRejected || isSubmitting !== null}
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-rose-500 py-2.5 text-[13px] font-bold text-white hover:bg-rose-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <XCircle className="w-4 h-4" strokeWidth={2.25} />
              {isSubmitting === 'reject' ? 'Memproses...' : 'Reject'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
