import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { ArrowLeft, Clock, MapPin, Image as ImageIcon } from 'lucide-react';
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
    return <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-[11px] font-bold border border-slate-200 shadow-sm">-</span>;
  }
  
  if (status === 'Terlambat') {
    return <span className="bg-rose-100 text-rose-700 px-3 py-1.5 rounded-full text-[11px] font-black border border-rose-200 shadow-sm">Terlambat</span>;
  }
  
  if (status === 'Tepat Waktu') {
    return <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-[11px] font-black border border-emerald-200 shadow-sm">Tepat Waktu</span>;
  }
  
  return <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-[11px] font-black border border-slate-200 shadow-sm">{status}</span>;
}

function imgSrc(path: string) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path;
  return path.startsWith('/') ? path : `/${path}`;
}

interface PageProps {
  searchParams: { tanggal?: string };
}

export default async function RiwayatDetail(props: any) {
  const session = await getSession();
  
  if (!session) {
    redirect('/request_login');
  }

  const searchParams = await props.searchParams;
  const userId = session.user_id;
  const tanggal = searchParams?.tanggal;

  if (!tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    redirect('/riwayat');
  }

  // Coba query semua kolom yang mungkin ada di presensi
  let row: any = null;
  try {
    const rows = await query(
      "SELECT * FROM presensi WHERE karyawan_id = ? AND tanggal = ? LIMIT 1",
      [userId, tanggal]
    ) as any[];
    
    if (rows && rows.length > 0) {
      row = rows[0];
    }
  } catch (e) {
    console.error("Gagal membaca detail absen:", e);
  }

  const jamMasuk = row?.jam_masuk || row?.jam_in || row?.waktu_masuk || '';
  const jamPulang = row?.jam_pulang || row?.jam_out || row?.waktu_pulang || '';
  const status = row?.status || row?.status_kehadiran || '';
  const fotoMasuk = row?.foto_masuk || row?.foto_in || row?.foto || '';
  const fotoPulang = row?.foto_pulang || row?.foto_out || '';
  const lokMasuk = row?.lokasi_masuk || row?.lokasi_in || row?.lokasi || '';
  const lokPulang = row?.lokasi_pulang || row?.lokasi_out || '';

  return (
    <AppShell maxWidth="lg:max-w-2xl">
    <div className="text-slate-900 font-sans">
      
      {/* HEADER */}
      <div className="bg-white/80 backdrop-blur-xl px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-4 sticky top-0 z-40 border-b border-slate-100">
        <Link 
          href="/riwayat"
          className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition active:scale-95 text-slate-500 border border-slate-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-black text-[17px] text-slate-900 tracking-tight">Detail Absen</h1>
      </div>

      <div className="max-w-md mx-auto p-5">
        <div className="bg-white p-5 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 animate-fade-in-up">
          
          <div className="flex items-start justify-between gap-3 mb-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Tanggal</p>
              <p className="mt-1 text-xl font-black text-slate-900 tracking-tight">{formatTanggal(tanggal)}</p>
            </div>
            <div className="shrink-0 mt-1">
              <StatusBadge status={status} />
            </div>
          </div>

          {!row ? (
            <div className="mt-4 bg-slate-50 border border-slate-100 p-8 rounded-3xl text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                <Clock className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm font-black text-slate-700">Data tidak ditemukan</p>
              <p className="text-xs font-semibold text-slate-400 mt-1 leading-relaxed">Belum ada catatan absensi<br/>pada tanggal ini.</p>
            </div>
          ) : (
            <>
              {/* JAM INFO CARDS */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="rounded-[24px] bg-violet-50 border border-violet-100/50 p-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-violet-100 rounded-bl-full -z-0 opacity-50 transition-transform group-hover:scale-110" />
                  <p className="relative z-10 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400/80 mb-1">Masuk</p>
                  <p className="relative z-10 text-[26px] font-black text-violet-600 tracking-tighter leading-none mb-2">{formatJam(jamMasuk)}</p>
                  {lokMasuk ? (
                    <div className="relative z-10 flex items-center gap-1 text-violet-500 bg-white/60 px-2 py-1 rounded-lg">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <p className="text-[9px] font-bold truncate" title={lokMasuk}>{lokMasuk}</p>
                    </div>
                  ) : (
                    <div className="h-[22px]" />
                  )}
                </div>

                <div className="rounded-[24px] bg-rose-50 border border-rose-100/50 p-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-rose-100 rounded-bl-full -z-0 opacity-50 transition-transform group-hover:scale-110" />
                  <p className="relative z-10 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-400/80 mb-1">Pulang</p>
                  <p className="relative z-10 text-[26px] font-black text-rose-600 tracking-tighter leading-none mb-2">{formatJam(jamPulang)}</p>
                  {lokPulang ? (
                    <div className="relative z-10 flex items-center gap-1 text-rose-500 bg-white/60 px-2 py-1 rounded-lg">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <p className="text-[9px] font-bold truncate" title={lokPulang}>{lokPulang}</p>
                    </div>
                  ) : (
                    <div className="h-[22px]" />
                  )}
                </div>
              </div>

              {/* FOTO CARDS */}
              <div className="space-y-4">
                {/* Foto Masuk */}
                <div className="bg-slate-50 rounded-[28px] border border-slate-100 overflow-hidden p-1.5">
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-violet-500" />
                      <p className="font-black text-[13px] text-slate-800 tracking-wide">Foto Masuk</p>
                    </div>
                    <span className="text-[10px] font-bold bg-white px-2 py-1 rounded-md text-slate-500 shadow-sm border border-slate-100">{formatJam(jamMasuk)} WIB</span>
                  </div>
                  
                  <div className="p-1.5 pt-0">
                    {fotoMasuk ? (
                      <a href={imgSrc(fotoMasuk)} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-[20px]">
                        <img src={imgSrc(fotoMasuk)} alt="Foto Masuk" className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-[11px] font-black tracking-widest uppercase bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">Lihat Penuh</span>
                        </div>
                      </a>
                    ) : (
                      <div className="bg-white border border-slate-100 rounded-[20px] p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
                        <ImageIcon className="w-8 h-8 text-slate-200 mb-2" />
                        <p className="text-[12px] font-bold text-slate-400">Belum ada foto masuk.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Foto Pulang */}
                <div className="bg-slate-50 rounded-[28px] border border-slate-100 overflow-hidden p-1.5">
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-rose-500" />
                      <p className="font-black text-[13px] text-slate-800 tracking-wide">Foto Pulang</p>
                    </div>
                    <span className="text-[10px] font-bold bg-white px-2 py-1 rounded-md text-slate-500 shadow-sm border border-slate-100">{formatJam(jamPulang)} WIB</span>
                  </div>
                  
                  <div className="p-1.5 pt-0">
                    {fotoPulang ? (
                      <a href={imgSrc(fotoPulang)} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-[20px]">
                        <img src={imgSrc(fotoPulang)} alt="Foto Pulang" className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-[11px] font-black tracking-widest uppercase bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">Lihat Penuh</span>
                        </div>
                      </a>
                    ) : (
                      <div className="bg-white border border-slate-100 rounded-[20px] p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
                        <ImageIcon className="w-8 h-8 text-slate-200 mb-2" />
                        <p className="text-[12px] font-bold text-slate-400">Belum ada foto pulang.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </>
          )}
        </div>
      </div>
    </div>
    </AppShell>
  );
}
