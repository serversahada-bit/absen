import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { ArrowLeft, Stethoscope, CalendarDays, ExternalLink, Plus, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import AppShell from '@/components/AppShell';
import BackLink from '@/components/BackLink';

export const dynamic = 'force-dynamic';

function formatDurasi(durasi: unknown): string | null {
  if (durasi === null || durasi === undefined) return null;
  const n = Number(durasi);
  if (isNaN(n)) return null;
  return `${n % 1 === 0 ? n : n.toFixed(1)} Hari`;
}

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

export default async function RiwayatIzinPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/request_login');
  }

  const userId = session.user_id;

  let rows: any[] = [];
  try {
    rows = await query(
      `SELECT id, karyawan_id, tipe_izin, mulai_tanggal, sampai_tanggal, durasi_hari, alasan, bukti_foto, status, created_at, catatan_admin
       FROM pengajuan_izin
       WHERE karyawan_id = ?
       ORDER BY created_at DESC`,
      [userId]
    ) as any[];
  } catch (e) {
    console.error("Gagal membaca riwayat izin:", e);
  }

  return (
    <AppShell maxWidth="lg:max-w-2xl">
    <div className="text-slate-900 font-sans selection:bg-violet-200">
      
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
        <h1 className="font-black text-[17px] text-slate-900 tracking-tight">Riwayat Pengajuan</h1>
      </div>

      <div className="max-w-md mx-auto p-5 space-y-5">
        
        {/* BANNER PENGAJUAN BARU */}
        <Link href="/izin" className="block relative w-full bg-violet-600 text-white p-5 rounded-[28px] shadow-[0_8px_30px_rgba(124,58,237,0.3)] hover:bg-violet-700 transition-all transform hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-bl-full opacity-10 transition-transform group-hover:scale-110 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-inner">
                <Plus className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <p className="font-black text-[15px] tracking-wide">Buat Pengajuan Baru</p>
                <p className="text-[12px] font-semibold text-violet-200 mt-0.5">Sakit, Cuti, atau Izin Lainnya</p>
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
            {rows.map((row) => {
              const tipe = row.tipe_izin || '';
              const isSakit = tipe === 'Sakit';
              const durasiLabel = formatDurasi(row.durasi_hari);

              return (
                <div key={row.id} className="bg-white p-5 rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-4 transition-all hover:border-violet-100 hover:shadow-violet-500/5 group">
                  
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className={`p-3 rounded-[16px] ring-1 ring-inset ${isSakit ? 'bg-rose-50 text-rose-500 ring-rose-100 group-hover:bg-rose-500 group-hover:text-white' : 'bg-blue-50 text-blue-500 ring-blue-100 group-hover:bg-blue-500 group-hover:text-white'} transition-colors`}>
                        {isSakit ? <Stethoscope className="w-5 h-5" /> : <CalendarDays className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-[14px]">{tipe}</h3>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                          <Clock className="w-3 h-3" />
                          {row.created_at ? formatTanggal(row.created_at instanceof Date ? row.created_at.toISOString().split('T')[0] : String(row.created_at).split(' ')[0]) : '-'}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={row.status || 'Pending'} />
                    </div>
                  </div>

                  <div className="bg-[#f8f9fc] p-4 rounded-[20px] border border-slate-100">
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-3 border-b border-slate-200/60 pb-3 uppercase tracking-widest">
                      <span>Mulai: <b className="text-slate-800">{formatTanggal(row.mulai_tanggal)}</b></span>
                      <span>Sampai: <b className="text-slate-800">{formatTanggal(row.sampai_tanggal)}</b></span>
                    </div>

                    {durasiLabel && (
                      <div className="text-[11px] font-bold text-slate-500 mb-3 uppercase tracking-widest">
                        Durasi: <b className="text-slate-800">{durasiLabel}</b>
                      </div>
                    )}

                    <p className="text-[13px] text-slate-600 font-medium leading-relaxed italic">
                      "{row.alasan}"
                    </p>

                    {row.status === 'Ditolak' && row.catatan_admin && (
                      <div className="mt-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl p-3.5 text-[12px] leading-relaxed relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-rose-400" />
                        <div className="font-black mb-1 uppercase tracking-wider text-[10px]">Alasan Penolakan</div>
                        <div className="font-medium">{row.catatan_admin}</div>
                      </div>
                    )}
                  </div>

                  {row.bukti_foto && (
                    <a href={`/uploads/izin/${row.bukti_foto}`} target="_blank" rel="noreferrer" 
                      className="text-[11px] font-black text-violet-600 tracking-wide flex items-center justify-center gap-1.5 bg-violet-50 border border-violet-100 px-4 py-2.5 rounded-xl hover:bg-violet-600 hover:text-white transition-all active:scale-95 w-full">
                      <ExternalLink className="w-4 h-4" />
                      LIHAT LAMPIRAN BUKTI
                    </a>
                  )}

                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 animate-fade-in-up">
            <div className="bg-slate-50 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-5 ring-1 ring-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <FileText className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
            </div>
            <h3 className="text-[15px] font-black text-slate-900">Belum ada riwayat</h3>
            <p className="text-[12px] font-semibold text-slate-400 mt-1 max-w-[220px] mx-auto leading-relaxed">
              Data pengajuan izin Anda akan muncul di sini.
            </p>
          </div>
        )}

      </div>
    </div>
    </AppShell>
  );
}
