import React from 'react';
import { CheckCircle2, Clock, Eye, FileText, XCircle } from 'lucide-react';

export interface RiwayatPengajuanRow {
  id: number;
  judul: string;
  url: string;
  catatan: string | null;
  status: string;
  catatan_admin: string | null;
  date: string;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'Pending') {
    return (
      <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide border border-amber-200 flex items-center gap-1.5 shadow-sm">
        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
        MENUNGGU
      </span>
    );
  } else if (status === 'Disetujui') {
    return (
      <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide border border-emerald-200 flex items-center gap-1 shadow-sm">
        <CheckCircle2 className="w-3 h-3" /> DISETUJUI
      </span>
    );
  }
  return (
    <span className="bg-rose-100 text-rose-700 px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide border border-rose-200 flex items-center gap-1 shadow-sm">
      <XCircle className="w-3 h-3" /> DITOLAK
    </span>
  );
}

export default function RiwayatPengajuan({ rows }: { rows: RiwayatPengajuanRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="text-center py-20 animate-fade-in-up">
        <div className="bg-slate-50 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-5 ring-1 ring-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <FileText className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
        </div>
        <h3 className="text-[15px] font-black text-slate-900">Belum ada riwayat</h3>
        <p className="text-[12px] font-semibold text-slate-400 mt-1 max-w-[220px] mx-auto leading-relaxed">
          Pengajuan dokumen Anda akan muncul di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.id} className="bg-white p-5 rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-4">
          <div className="flex justify-between items-start gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-3 rounded-[16px] ring-1 ring-inset bg-rose-50 text-rose-500 ring-rose-100 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-slate-900 text-[14px] break-words">{row.judul}</h3>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                  <Clock className="w-3 h-3" />
                  {row.date || '-'}
                </div>
              </div>
            </div>
            <div className="shrink-0">
              <StatusBadge status={row.status} />
            </div>
          </div>

          {(row.catatan || (row.status === 'Ditolak' && row.catatan_admin) || (row.status !== 'Ditolak' && row.url)) && (
            <div className="bg-[#f8f9fc] p-4 rounded-[20px] border border-slate-100">
              {row.catatan && (
                <p className="text-[13px] text-slate-600 font-medium leading-relaxed italic">&ldquo;{row.catatan}&rdquo;</p>
              )}

              {row.status === 'Ditolak' && row.catatan_admin && (
                <div className={`${row.catatan ? 'mt-4 ' : ''}bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl p-3.5 text-[12px] leading-relaxed relative overflow-hidden`}>
                  <div className="absolute top-0 left-0 w-1 h-full bg-rose-400" />
                  <div className="font-black mb-1 uppercase tracking-wider text-[10px]">Alasan Penolakan</div>
                  <div className="font-medium">{row.catatan_admin}</div>
                </div>
              )}

              {/* File pengajuan yang ditolak sudah dihapus HC, jadi tidak ada link preview. */}
              {row.status !== 'Ditolak' && row.url && (
                <a
                  href={row.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${row.catatan ? 'mt-3 ' : ''}inline-flex items-center gap-1.5 text-[12px] font-bold text-violet-600`}
                >
                  <Eye className="w-3.5 h-3.5" strokeWidth={2.25} />
                  Lihat PDF
                </a>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
