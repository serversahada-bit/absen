'use client';

import React, { useState } from 'react';
import { CalendarDays, Send } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface TimelineItem {
  id: string;
  type: 'izin' | 'ultah';
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: string;
  karyawanId?: number;
  tahun?: number;
  comments?: Array<{ name: string; comment: string }>;
}

interface TimelineDay {
  date: string;
  items: TimelineItem[];
}

interface TimelineProps {
  isManager: boolean;
  days: TimelineDay[];
}

export default function Timeline({ isManager, days }: TimelineProps) {
  const hasAnyItems = days.some(day => day.items.length > 0);

  return (
    <div className="px-5 lg:px-0 py-4 pb-8 animate-fade-in-up [animation-delay:480ms]">

      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-black text-slate-900 tracking-tight">Timeline</h2>
          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
            {isManager ? 'Izin Tim & Ulang Tahun' : 'Cuti/Izin & Ulang Tahun'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-br from-violet-600 to-purple-600">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[9px] font-bold text-violet-100 tracking-widest uppercase">
            {format(new Date(), 'dd MMM', { locale: id })}
          </span>
        </div>
      </div>

      {!hasAnyItems ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-[20px] p-8 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            <CalendarDays className="w-6 h-6 text-slate-300" strokeWidth={1.5} />
          </div>
          <p className="text-xs font-bold text-slate-400 text-center">Tidak ada agenda 6 hari terakhir</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {days.map((day, idx) => (
            <div key={idx} className="relative">
              {/* Date label */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-black text-slate-700">
                  {format(new Date(day.date), 'EEEE, dd MMM', { locale: id })}
                </span>
                {day.date === format(new Date(), 'yyyy-MM-dd') && (
                  <span className="text-[9px] font-black text-white bg-gradient-to-br from-violet-600 to-purple-600 px-2 py-0.5 rounded-full tracking-wider uppercase">
                    Hari Ini
                  </span>
                )}
              </div>

              {day.items.length === 0 ? (
                <div className="bg-slate-50 border border-slate-100 rounded-[16px] px-4 py-3 text-[11px] font-semibold text-slate-400 text-center">
                  Tidak ada agenda
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {day.items.map((item) => {
                    if (item.type === 'ultah') {
                      return <BirthdayCard key={item.id} item={item} />;
                    }

                    // Izin / Cuti
                    const isPending = item.badge === 'Pending';
                    const cardStyle = isPending
                      ? 'border-amber-100 hover:border-amber-200'
                      : 'border-emerald-100 hover:border-emerald-200';
                    const dotColor = isPending ? 'bg-amber-400' : 'bg-emerald-400';
                    const badgeStyle = isPending
                      ? 'text-amber-700 bg-amber-50 border-amber-200'
                      : 'text-emerald-700 bg-emerald-50 border-emerald-200';

                    return (
                      <div key={item.id} className={`bg-white border ${cardStyle} rounded-[20px] p-4 group hover:shadow-md hover:-translate-y-0.5 transition-all`}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className={`w-2 h-2 rounded-full ${dotColor} shrink-0 ${isPending ? 'animate-pulse' : ''}`} />
                            <span className="text-xs font-black text-slate-800 truncate">{item.title}</span>
                          </div>
                          <span className={`shrink-0 text-[9px] font-black border px-2.5 py-1 rounded-full uppercase tracking-wider ${badgeStyle}`}>
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-500 mb-2">{item.subtitle}</p>
                        <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-100">
                          <CalendarDays className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-500">{item.meta}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BirthdayCard({ item }: { item: TimelineItem }) {
  const [comments, setComments] = useState(item.comments || []);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const komentar = text.trim();
    if (!komentar || !item.karyawanId || !item.tahun) return;

    setSending(true);
    setError('');

    const formData = new FormData();
    formData.append('penerima_id', String(item.karyawanId));
    formData.append('tahun', String(item.tahun));
    formData.append('komentar', komentar);

    try {
      const res = await fetch('/api/ucapan_ultah', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setComments((prev) => [...prev, data.comment]);
        setText('');
      } else {
        setError(data.error || 'Gagal mengirim ucapan.');
      }
    } catch {
      setError('Gagal mengirim ucapan.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border border-rose-100 rounded-[20px] p-4 relative overflow-hidden group hover:border-rose-200 transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="absolute -right-3 -top-3 text-[60px] opacity-10 rotate-12 select-none pointer-events-none">🎉</div>
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
            <span className="text-xs font-black text-slate-800 truncate">{item.title}</span>
          </div>
          <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
            Barakallah fii umrik! Semoga Allah SWT senantiasa melimpahkan kesehatan, keberkahan rezeki, dan kemudahan dalam setiap langkahmu. 🤲🎂
          </p>
        </div>
        <span className="shrink-0 text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-full tracking-wider uppercase">
          🎉 Ultah
        </span>
      </div>

      {comments.length > 0 && (
        <div className="relative z-10 mt-3 pt-3 border-t border-rose-50 flex flex-col gap-1.5 max-h-32 overflow-y-auto">
          {comments.map((c, i) => (
            <p key={i} className="text-[11px] text-slate-600 leading-snug">
              <span className="font-black text-slate-800">{c.name?.split(' ')[0]}</span>{' '}
              <span className="font-semibold">{c.comment}</span>
            </p>
          ))}
        </div>
      )}

      {item.karyawanId && item.tahun && (
        <form onSubmit={handleSubmit} className="relative z-10 mt-3 flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tulis ucapan selamat..."
            maxLength={200}
            disabled={sending}
            className="flex-1 min-w-0 text-[11px] font-semibold bg-rose-50/60 border border-rose-100 rounded-full px-3.5 py-2 outline-none focus:border-rose-300 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="shrink-0 w-8 h-8 rounded-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 flex items-center justify-center transition-colors"
            aria-label="Kirim ucapan"
          >
            <Send className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </button>
        </form>
      )}
      {error && <p className="relative z-10 text-[10px] font-bold text-rose-600 mt-1.5">{error}</p>}
    </div>
  );
}
