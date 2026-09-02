import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { ArrowLeft, Clock, History, ChevronRight } from 'lucide-react';
import AppShell from '@/components/AppShell';

export const dynamic = 'force-dynamic';

function formatTanggal(tgl: any) {
  if (!tgl || tgl === '0000-00-00') return '-';
  const date = tgl instanceof Date ? tgl : new Date(tgl);
  if (isNaN(date.getTime())) return String(tgl);
  
  const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
  return `${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
}

function formatJam(jam: any) {
  if (!jam) return '--:--';
  if (jam instanceof Date) {
    return jam.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  const jamStr = String(jam);
  const parts = jamStr.split(':');
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return jamStr;
}

function StatusBadge({ status }: { status: string }) {
  if (!status) {
    return <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-200">-</span>;
  }
  
  if (status === 'Terlambat') {
    return <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-rose-200">Terlambat</span>;
  }
  
  if (status === 'Tepat Waktu') {
    return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-200">Tepat Waktu</span>;
  }
  
  return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-200">{status}</span>;
}

export default async function RiwayatAbsenPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/request_login');
  }

  const userId = session.user_id;

  // Coba query semua kolom yang mungkin ada di presensi
  let rows: any[] = [];
  try {
    // Kita lakukan fallback deteksi kolom manual atau query generik
    // Asumsi tabel presensi memiliki struktur standar
    rows = await query(
      "SELECT * FROM presensi WHERE karyawan_id = ? ORDER BY tanggal DESC LIMIT 60",
      [userId]
    ) as any[];
  } catch (e) {
    console.error("Gagal membaca riwayat absen:", e);
    // Mungkin kolom karyawan_id tidak ada, coba pakai user_id atau pegawai_id jika perlu
    // Tapi karena codebase PHP sudah mensyaratkan karyawan_id, ini harusnya aman.
  }

  return (
    <AppShell maxWidth="lg:max-w-2xl">
    <div className="text-slate-900 font-sans">
      
      {/* HEADER */}
      <div className="bg-white/80 backdrop-blur-xl px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-4 sticky top-0 z-40 border-b border-slate-100">
        <Link 
          href="/dashboard"
          className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition active:scale-95 text-slate-500 border border-slate-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-black text-[17px] text-slate-900 tracking-tight">Riwayat Absen</h1>
      </div>

      <div className="max-w-md mx-auto p-5 space-y-4">
        
        <div className="flex items-center justify-between px-1">
          <h2 className="font-bold text-slate-500 text-[11px] uppercase tracking-widest">Daftar Harian</h2>
          <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-sm">
            {rows.length} Data
          </span>
        </div>

        {rows.length > 0 ? (
          <div className="space-y-3">
            {rows.map((row, idx) => {
              const tgl = row.tanggal || row.tgl || row.date || '';
              const jamMasuk = row.jam_masuk || row.jam_in || row.waktu_masuk || '';
              const jamPulang = row.jam_pulang || row.jam_out || row.waktu_pulang || '';
              const status = row.status || row.status_kehadiran || '';

              return (
                <Link
                  key={idx}
                  href={`/riwayat_absen_detail?tanggal=${encodeURIComponent(tgl)}`}
                  className="block bg-white p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-start justify-between gap-3 hover:border-violet-100 hover:shadow-violet-500/5 transition-all active:scale-[0.98] group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="bg-orange-50 text-orange-500 p-2.5 rounded-[14px] ring-1 ring-inset ring-orange-100 mt-0.5 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                      <Clock className="h-5 w-5" strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-slate-900 text-[14px]">{formatTanggal(tgl)}</p>
                      <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                        Masuk: <b className="text-slate-700">{formatJam(jamMasuk)}</b> <span className="mx-1">•</span> Pulang: <b className="text-slate-700">{formatJam(jamPulang)}</b>
                      </p>
                      <p className="text-[10px] font-bold text-violet-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Ketuk untuk lihat detail
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right flex flex-col items-end gap-2">
                    <StatusBadge status={status} />
                    <div className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 font-bold group-hover:text-violet-600 transition-colors">
                      Detail
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 animate-fade-in-up">
            <div className="bg-slate-50 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-5 ring-1 ring-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <History className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
            </div>
            <h3 className="text-[15px] font-black text-slate-900">Belum ada riwayat</h3>
            <p className="text-[12px] font-semibold text-slate-400 mt-1 max-w-[220px] mx-auto leading-relaxed">
              Data absensi harian Anda akan muncul di sini.
            </p>
          </div>
        )}
      </div>
    </div>
    </AppShell>
  );
}
