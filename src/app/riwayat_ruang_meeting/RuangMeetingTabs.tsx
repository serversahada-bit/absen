'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarClock, CheckCircle2, Clock, DoorOpen, FileText, Plus, XCircle } from 'lucide-react';
import BackLink from '@/components/BackLink';

export interface JadwalRow {
  id: number;
  karyawan_id: number;
  nama: string | null;
  tanggal: string | Date;
  kegiatan: string;
  jenis_aktifitas: string;
  jam_mulai: string;
  jam_selesai: string;
}

export interface RiwayatRow {
  id: number;
  tanggal: string | Date;
  kegiatan: string;
  jenis_aktifitas: string;
  jam_mulai: string;
  jam_selesai: string;
  catatan: string | null;
  status: string;
  catatan_admin: string | null;
  created_at: string | Date;
}

function formatTanggal(tgl: string | Date) {
  if (!tgl || tgl === '0000-00-00') return '-';
  const date = new Date(tgl);
  if (isNaN(date.getTime())) return String(tgl);

  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
}

function formatJam(jam: string) {
  return (jam || '-').slice(0, 5);
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

export default function RuangMeetingTabs({ jadwalRows, riwayatRows }: { jadwalRows: JadwalRow[]; riwayatRows: RiwayatRow[] }) {
  const [activeTab, setActiveTab] = useState<'jadwal' | 'riwayat'>('jadwal');

  return (
    <div className="text-slate-900 font-sans selection:bg-indigo-200">
      <div className="bg-white/80 backdrop-blur-xl px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-4 sticky top-0 z-40 border-b border-slate-100">
        <BackLink>
          <Link
            href="/dashboard"
            className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition active:scale-95 text-slate-500 border border-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </BackLink>
        <h1 className="font-black text-[17px] text-slate-900 tracking-tight">Ruang Meeting</h1>
      </div>

      <div className="max-w-md mx-auto p-5 space-y-5">
        <Link href="/ruang_meeting" className="block relative w-full bg-indigo-600 text-white p-5 rounded-[28px] shadow-[0_8px_30px_rgba(79,70,229,0.3)] hover:bg-indigo-700 transition-all transform hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-bl-full opacity-10 transition-transform group-hover:scale-110 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-inner">
                <Plus className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <p className="font-black text-[15px] tracking-wide">Ajukan Ruang Meeting</p>
                <p className="text-[12px] font-semibold text-indigo-200 mt-0.5">Booking ruang untuk kegiatan Anda</p>
              </div>
            </div>
          </div>
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('jadwal')}
            className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 font-black text-[13px] tracking-tight transition-all active:scale-95 ${
              activeTab === 'jadwal'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-600 shadow-md'
                : 'border-transparent bg-white text-slate-400 hover:bg-slate-50 shadow-[0_4px_20px_rgb(0,0,0,0.03)]'
            }`}
          >
            <CalendarClock className="w-4 h-4" /> Jadwal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('riwayat')}
            className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 font-black text-[13px] tracking-tight transition-all active:scale-95 ${
              activeTab === 'riwayat'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-600 shadow-md'
                : 'border-transparent bg-white text-slate-400 hover:bg-slate-50 shadow-[0_4px_20px_rgb(0,0,0,0.03)]'
            }`}
          >
            <FileText className="w-4 h-4" /> Riwayat Saya
          </button>
        </div>

        {activeTab === 'jadwal' ? (
          jadwalRows.length > 0 ? (
            <div className="space-y-4">
              {jadwalRows.map((row) => (
                <div key={row.id} className="bg-white p-5 rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-3">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 rounded-[16px] ring-1 ring-inset bg-indigo-50 text-indigo-500 ring-indigo-100">
                        <DoorOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-[14px]">{row.kegiatan}</h3>
                        <div className="text-[11px] font-bold text-slate-400 mt-1">{row.nama || `ID: ${row.karyawan_id}`}</div>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                      {row.jenis_aktifitas}
                    </span>
                  </div>
                  <div className="bg-[#f8f9fc] p-4 rounded-[20px] border border-slate-100 flex items-center justify-between text-[12px] font-bold text-slate-600">
                    <span>{formatTanggal(row.tanggal)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatJam(row.jam_mulai)} - {formatJam(row.jam_selesai)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 animate-fade-in-up">
              <div className="bg-slate-50 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center mb-5 ring-1 ring-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <DoorOpen className="h-10 w-10 text-slate-300" strokeWidth={1.5} />
              </div>
              <h3 className="text-[15px] font-black text-slate-900">Belum ada jadwal</h3>
              <p className="text-[12px] font-semibold text-slate-400 mt-1 max-w-[220px] mx-auto leading-relaxed">
                Belum ada booking ruang meeting yang disetujui.
              </p>
            </div>
          )
        ) : riwayatRows.length > 0 ? (
          <div className="space-y-4">
            {riwayatRows.map((row) => (
              <div key={row.id} className="bg-white p-5 rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col gap-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-[16px] ring-1 ring-inset bg-indigo-50 text-indigo-500 ring-indigo-100">
                      <DoorOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-[14px]">{row.kegiatan}</h3>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        {formatTanggal(row.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={row.status} />
                  </div>
                </div>

                <div className="bg-[#f8f9fc] p-4 rounded-[20px] border border-slate-100">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-3 border-b border-slate-200/60 pb-3 uppercase tracking-widest">
                    <span>{formatTanggal(row.tanggal)}</span>
                    <span>{formatJam(row.jam_mulai)} - {formatJam(row.jam_selesai)}</span>
                  </div>
                  <p className="text-[13px] text-slate-600 font-medium leading-relaxed">
                    <span className="font-bold text-slate-800">{row.jenis_aktifitas}</span>
                    {row.catatan && <> — <span className="italic">"{row.catatan}"</span></>}
                  </p>

                  {row.status === 'Ditolak' && row.catatan_admin && (
                    <div className="mt-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl p-3.5 text-[12px] leading-relaxed relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-rose-400" />
                      <div className="font-black mb-1 uppercase tracking-wider text-[10px]">Alasan Penolakan</div>
                      <div className="font-medium">{row.catatan_admin}</div>
                    </div>
                  )}
                </div>
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
              Pengajuan ruang meeting Anda akan muncul di sini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
