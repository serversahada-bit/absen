'use client';

import React, { useState } from 'react';
import { TrendingUp, Clock3, UserCircle2 } from 'lucide-react';
import Image from 'next/image';

interface StatusCardsProps {
  user: {
    name: string;
    role: string;
    photoUrl?: string;
  };
  attendance: {
    status: 'belum' | 'masuk' | 'selesai';
    timeIn: string;
    description: string;
  };
  shift: {
    label: string;
    timeIn: string;
    timeOut: string;
  };
}

export default function StatusCards({ user, attendance, shift }: StatusCardsProps) {
  const [imgError, setImgError] = useState(false);
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const statusColor = attendance.status === 'belum'
    ? { dot: 'bg-amber-400', text: 'text-amber-600', bg: 'bg-amber-50', label: 'Belum Absen' }
    : attendance.status === 'selesai'
    ? { dot: 'bg-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Selesai' }
    : { dot: 'bg-blue-400', text: 'text-blue-600', bg: 'bg-blue-50', label: 'Di Kantor' };

  return (
    <div className="flex flex-col gap-3 px-5 lg:px-0 mt-4 animate-fade-in-up [animation-delay:160ms]">

      {/* Employee Banner */}
      <div className="bg-gradient-to-br from-violet-600 to-purple-600 rounded-[24px] p-5 flex items-center gap-4 relative overflow-hidden shadow-[0_10px_30px_rgba(124,58,237,0.25)]">
        {/* Decoration */}
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/[0.06]" />
        <div className="absolute -right-2 -bottom-6 w-24 h-24 rounded-full bg-fuchsia-400/10" />

        {/* Avatar */}
        <div className="relative w-14 h-14 rounded-[16px] overflow-hidden bg-white/15 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg shrink-0 ring-1 ring-inset ring-white/30">
          {(user.photoUrl && !imgError) ? (
            <Image
              src={user.photoUrl}
              alt="Profil"
              width={56}
              height={56}
              className="object-cover w-full h-full"
              unoptimized
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="drop-shadow">{getInitials(user.name || 'NA')}</span>
          )}
          <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-violet-600" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 z-10">
          <p className="text-[11px] font-bold text-violet-100 uppercase tracking-[1.5px] mb-0.5">Selamat datang</p>
          <h2 className="text-[15px] font-black text-white truncate leading-snug">{user.name}</h2>
          <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/10 backdrop-blur-sm">
            <UserCircle2 className="w-3 h-3 text-violet-200" />
            <span className="text-[10px] font-bold text-violet-100 truncate">{user.role}</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Status Absen */}
        <div className="bg-white border border-violet-100/70 rounded-[20px] p-4 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-violet-50 border border-violet-100">
              <TrendingUp className="w-4 h-4 text-violet-600" strokeWidth={2.5} />
            </div>
            <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full ${statusColor.bg} ${statusColor.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusColor.dot} ${attendance.status === 'belum' ? 'animate-pulse' : ''}`} />
              {attendance.status === 'selesai' ? 'Selesai' : attendance.status === 'masuk' ? 'Di Kantor' : 'Belum'}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Jam Masuk</p>
            <p className="text-2xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">{attendance.timeIn}</p>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">{attendance.description}</p>
          </div>
        </div>

        {/* Shift */}
        <div className="bg-white border border-violet-100/70 rounded-[20px] p-4 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-xl bg-violet-50 border border-violet-100">
              <Clock3 className="w-4 h-4 text-violet-600" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-bold text-violet-600 px-2 py-1 rounded-full bg-violet-50">Aktif</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Jadwal Shift</p>
            <p className="text-[15px] font-black text-slate-900 leading-snug">{shift.label}</p>
            <p className="text-[11px] font-bold text-violet-600 mt-1 tabular-nums">{shift.timeIn} — {shift.timeOut}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
