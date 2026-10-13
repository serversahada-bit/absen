'use client';

import React, { useState } from 'react';
import { Megaphone, CalendarDays, Paperclip } from 'lucide-react';

export interface PengumumanItem {
  id: number;
  judul: string;
  isi: string;
  lampiranUrl: string | null;
  lampiranIsImage: boolean;
  tanggalLabel: string;
  daysLeft: number;
}

interface PengumumanProps {
  items: PengumumanItem[];
}

function countdownLabel(daysLeft: number) {
  if (daysLeft <= 0) return 'Hari Ini';
  if (daysLeft === 1) return 'Besok';
  return `${daysLeft} hari lagi`;
}

export default function Pengumuman({ items }: PengumumanProps) {
  if (items.length === 0) return null;

  return (
    <div className="px-5 lg:px-0 pt-4 animate-fade-in-up [animation-delay:420ms]">
      <div className="mb-4">
        <h2 className="text-sm font-black text-slate-900 tracking-tight">Pengumuman</h2>
        <p className="text-[10px] font-semibold text-slate-400 mt-0.5">Agenda terdekat dari HC</p>
      </div>

      <div className="flex flex-col gap-2.5">
        {items.map((item) => (
          <PengumumanCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function PengumumanCard({ item }: { item: PengumumanItem }) {
  const [expanded, setExpanded] = useState(false);
  const isToday = item.daysLeft <= 0;
  const isLong = item.isi.length > 140 || item.isi.split('\n').length > 3;

  return (
    <div className="bg-white border border-violet-100 rounded-[20px] p-4 relative overflow-hidden hover:border-violet-200 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shrink-0">
            <Megaphone className="w-4 h-4 text-white" strokeWidth={2.2} />
          </div>
          <span className="text-xs font-black text-slate-800 leading-snug">{item.judul}</span>
        </div>
        <span
          className={`shrink-0 text-[9px] font-black border px-2.5 py-1 rounded-full uppercase tracking-wider ${
            isToday ? 'text-white bg-gradient-to-br from-violet-600 to-purple-600 border-transparent' : 'text-violet-700 bg-violet-50 border-violet-200'
          }`}
        >
          {countdownLabel(item.daysLeft)}
        </span>
      </div>

      <p className={`text-[11px] font-semibold text-slate-500 leading-relaxed whitespace-pre-wrap ${expanded ? '' : 'line-clamp-3'}`}>
        {item.isi}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-[10px] font-black text-violet-600 hover:text-violet-700"
        >
          {expanded ? 'Tutup' : 'Selengkapnya'}
        </button>
      )}

      {item.lampiranUrl && item.lampiranIsImage && (
        <a href={item.lampiranUrl} target="_blank" rel="noopener noreferrer" className="block mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.lampiranUrl}
            alt={`Lampiran ${item.judul}`}
            loading="lazy"
            className="w-full max-h-56 object-cover rounded-[14px] border border-slate-100"
          />
        </a>
      )}

      <div className="flex items-center justify-between gap-2 pt-2.5 mt-2.5 border-t border-slate-100">
        <div className="flex items-center gap-1.5 min-w-0">
          <CalendarDays className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="text-[10px] font-bold text-slate-500 truncate">{item.tanggalLabel}</span>
        </div>
        {item.lampiranUrl && (
          <a
            href={item.lampiranUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1 text-[10px] font-black text-violet-600 bg-violet-50 border border-violet-100 hover:bg-violet-100 px-2.5 py-1 rounded-full transition-colors"
          >
            <Paperclip className="w-3 h-3" />
            Lihat Lampiran
          </a>
        )}
      </div>
    </div>
  );
}
