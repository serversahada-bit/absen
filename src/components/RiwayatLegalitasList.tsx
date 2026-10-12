'use client';

import React, { useMemo, useState } from 'react';
import { ExternalLink, FileText, CheckCircle2, XCircle, Loader2, Download } from 'lucide-react';
import SearchInput, { SearchEmptyState } from '@/components/SearchInput';

export type RiwayatLegalitasRow = {
  id: number;
  jenis_dokumen: string;
  keterangan: string | null;
  file_pdf: string | null;
  status: string | null;
  tanggal: string;
  catatan_admin: string | null;
  estimasi_hari: number | null;
  file_hasil: string | null;
};

function StatusBadge({ status }: { status: string }) {
  if (status === 'Diproses') {
    return (
      <span className="bg-sky-100 text-sky-700 px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide border border-sky-200 flex items-center gap-1.5 shadow-sm">
        <Loader2 className="w-3 h-3 animate-spin" /> DIPROSES
      </span>
    );
  } else if (status === 'Selesai') {
    return (
      <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide border border-emerald-200 flex items-center gap-1 shadow-sm">
        <CheckCircle2 className="w-3 h-3" /> SELESAI
      </span>
    );
  } else if (status === 'Ditolak') {
    return (
      <span className="bg-rose-100 text-rose-700 px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide border border-rose-200 flex items-center gap-1 shadow-sm">
        <XCircle className="w-3 h-3" /> DITOLAK
      </span>
    );
  } else {
    return (
      <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide border border-amber-200 flex items-center gap-1.5 shadow-sm">
        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
        MENUNGGU
      </span>
    );
  }
}

export default function RiwayatLegalitasList({ rows }: { rows: RiwayatLegalitasRow[] }) {
  const [keyword, setKeyword] = useState('');

  // Cari berdasarkan kategori (jenis dokumen) atau nama legal (keterangan)
  const filteredRows = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      (row.jenis_dokumen || '').toLowerCase().includes(q) ||
      (row.keterangan || '').toLowerCase().includes(q)
    );
  }, [rows, keyword]);

  return (
    <>
      <div className="flex items-center justify-between px-1 mt-6 mb-2">
        <h2 className="font-bold text-slate-500 text-[11px] uppercase tracking-widest">Daftar Riwayat</h2>
        <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-sm">
          {keyword.trim() ? `${filteredRows.length} / ${rows.length}` : rows.length} Data
        </span>
      </div>

      {rows.length > 0 && (
        <SearchInput value={keyword} onChange={setKeyword} placeholder="Cari kategori atau nama legal..." />
      )}

      {filteredRows.length > 0 ? (
        <div className="space-y-4">
          {filteredRows.map((row) => (
            <div key={row.id} className="bg-white p-5 rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-4 transition-all hover:border-indigo-100 hover:shadow-indigo-500/5 group">

              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-[16px] ring-1 ring-inset bg-indigo-50 text-indigo-500 ring-indigo-100 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-[14px]">{row.jenis_dokumen}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                      {row.tanggal}
                    </div>
                  </div>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={row.status || 'Pending'} />
                </div>
              </div>

              {row.keterangan && (
                <div className="bg-[#f8f9fc] p-4 rounded-[20px] border border-slate-100">
                  <p className="text-[13px] text-slate-600 font-medium leading-relaxed italic">
                    "{row.keterangan}"
                  </p>
                </div>
              )}

              {row.status === 'Ditolak' && row.catatan_admin && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl p-3.5 text-[12px] leading-relaxed relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-rose-400" />
                  <div className="font-black mb-1 uppercase tracking-wider text-[10px]">Alasan Penolakan</div>
                  <div className="font-medium">{row.catatan_admin}</div>
                </div>
              )}

              {row.status === 'Diproses' && (
                <div className="bg-sky-50 border border-sky-100 text-sky-700 rounded-2xl p-3.5 text-[12px] leading-relaxed relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-sky-400" />
                  <div className="font-black mb-1 uppercase tracking-wider text-[10px]">Sedang Diproses HRD</div>
                  <div className="font-medium">
                    {row.estimasi_hari ? `Estimasi selesai dalam ${row.estimasi_hari} hari kerja.` : 'Sedang dikerjakan oleh HRD.'}
                  </div>
                </div>
              )}

              {row.status === 'Selesai' && row.file_hasil && (
                <a href={`/uploads/legalitas_hasil/${row.file_hasil}`} target="_blank" rel="noreferrer"
                  className="text-[11px] font-black text-white tracking-wide flex items-center justify-center gap-1.5 bg-emerald-600 border border-emerald-600 px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-all active:scale-95 w-full">
                  <Download className="w-4 h-4" />
                  DOWNLOAD HASIL LEGALISASI
                </a>
              )}

              {row.file_pdf && (
                <a href={`/api/uploads/legalitas/${row.file_pdf}`} target="_blank" rel="noreferrer"
                  className="text-[11px] font-black text-indigo-600 tracking-wide flex items-center justify-center gap-1.5 bg-indigo-50 border border-indigo-100 px-4 py-2.5 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95 w-full">
                  <ExternalLink className="w-4 h-4" />
                  LIHAT FILE PDF ASLI
                </a>
              )}

            </div>
          ))}
        </div>
      ) : rows.length > 0 ? (
        <SearchEmptyState keyword={keyword} label="pengajuan dengan kategori atau nama legal" />
      ) : (
        <div className="text-center py-20 animate-fade-in-up">
          <div className="bg-slate-50 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-5 ring-1 ring-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <FileText className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
          </div>
          <h3 className="text-[15px] font-black text-slate-900">Belum ada riwayat</h3>
          <p className="text-[12px] font-semibold text-slate-400 mt-1 max-w-[220px] mx-auto leading-relaxed">
            Data pengajuan legalitas Anda akan muncul di sini.
          </p>
        </div>
      )}
    </>
  );
}
