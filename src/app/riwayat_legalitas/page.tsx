import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { ArrowLeft, ExternalLink, Plus, FileText, CheckCircle2, XCircle } from 'lucide-react';
import AppShell from '@/components/AppShell';
import BackLink from '@/components/BackLink';
import LegalitasSuccessToast from '@/components/LegalitasSuccessToast';

export const dynamic = 'force-dynamic';

function formatTanggal(tgl: string) {
  if (!tgl || tgl === '0000-00-00') return '-';
  const date = new Date(tgl);
  if (isNaN(date.getTime())) return tgl;

  const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
  return `${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
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
  } else {
    return (
      <span className="bg-rose-100 text-rose-700 px-3 py-1.5 rounded-full text-[10px] font-black tracking-wide border border-rose-200 flex items-center gap-1 shadow-sm">
        <XCircle className="w-3 h-3" /> DITOLAK
      </span>
    );
  }
}

export default async function RiwayatLegalitasPage() {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  const userId = session.user_id;

  let rows: any[] = [];
  try {
    rows = await query(
      `SELECT id, jenis_dokumen, keterangan, file_pdf, status, created_at, catatan_admin
       FROM pengajuan_legalitas
       WHERE karyawan_id = ?
       ORDER BY created_at DESC`,
      [userId]
    ) as any[];
  } catch (e) {
    console.error('Gagal membaca riwayat legalitas:', e);
  }

  return (
    <AppShell maxWidth="lg:max-w-2xl">
    <div className="text-slate-900 font-sans selection:bg-indigo-200">
      <LegalitasSuccessToast />

      {/* HEADER */}
      <div className="bg-white/80 backdrop-blur-xl px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-4 sticky top-0 z-40 border-b border-slate-100">
        <BackLink>
          <Link
            href="/dashboard"
            className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition active:scale-95 text-slate-500 border border-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </BackLink>
        <h1 className="font-black text-[17px] text-slate-900 tracking-tight">Riwayat Legalitas</h1>
      </div>

      <div className="max-w-md mx-auto p-5 space-y-5">

        {/* BANNER PENGAJUAN BARU */}
        <Link href="/legalitas" className="block relative w-full bg-indigo-600 text-white p-5 rounded-[28px] shadow-[0_8px_30px_rgba(79,70,229,0.3)] hover:bg-indigo-700 transition-all transform hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-bl-full opacity-10 transition-transform group-hover:scale-110 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-inner">
                <Plus className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <p className="font-black text-[15px] tracking-wide">Ajukan Legalitas Baru</p>
                <p className="text-[12px] font-semibold text-indigo-200 mt-0.5">Upload dokumen PDF untuk dilegalisasi</p>
              </div>
            </div>
          </div>
        </Link>

        <div className="flex items-center justify-between px-1 mt-6 mb-2">
          <h2 className="font-bold text-slate-500 text-[11px] uppercase tracking-widest">Daftar Riwayat</h2>
          <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-sm">
            {rows.length} Data
          </span>
        </div>

        {rows.length > 0 ? (
          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.id} className="bg-white p-5 rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-4 transition-all hover:border-indigo-100 hover:shadow-indigo-500/5 group">

                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-[16px] ring-1 ring-inset bg-indigo-50 text-indigo-500 ring-indigo-100 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-[14px]">{row.jenis_dokumen}</h3>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                        {row.created_at ? formatTanggal(row.created_at instanceof Date ? row.created_at.toISOString().split('T')[0] : String(row.created_at).split(' ')[0]) : '-'}
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

                {row.file_pdf && (
                  <a href={`/uploads/legalitas/${row.file_pdf}`} target="_blank" rel="noreferrer"
                    className="text-[11px] font-black text-indigo-600 tracking-wide flex items-center justify-center gap-1.5 bg-indigo-50 border border-indigo-100 px-4 py-2.5 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95 w-full">
                    <ExternalLink className="w-4 h-4" />
                    LIHAT FILE PDF
                  </a>
                )}

              </div>
            ))}
          </div>
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

      </div>
    </div>
    </AppShell>
  );
}
