'use client';

import React, { useEffect, useRef } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';

export default function CalendarStrip() {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const today = new Date();
  const days = Array.from({ length: 14 }).map((_, i) => addDays(today, i - 4));

  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector('.active-day') as HTMLElement;
      if (activeEl) {
        const scrollLeft = activeEl.offsetLeft - (scrollRef.current.clientWidth / 2) + (activeEl.clientWidth / 2);
        scrollRef.current.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, []);

  const monthLabel = format(today, 'MMMM yyyy', { locale: id });

  return (
    <div className="px-5 lg:px-0 pb-5 lg:pb-0 animate-fade-in-up [animation-delay:80ms] h-full">
      <div className="h-full lg:bg-white lg:rounded-[28px] lg:border lg:border-violet-100 lg:shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:p-5">
      {/* Month header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{monthLabel}</span>
      </div>

      <div
        ref={scrollRef}
        className="overflow-x-auto hide-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex lg:flex-wrap gap-2.5 w-max lg:w-full">
          {days.map((date, idx) => {
            const isActive = isSameDay(date, today);
            const dayName = format(date, 'EEE').toUpperCase();
            const dayNum = format(date, 'd');

            return (
              <div
                key={idx}
                className={`flex flex-col items-center justify-center gap-1 w-[50px] h-[68px] rounded-2xl cursor-pointer select-none transition-all duration-300 relative
                  ${isActive
                    ? 'active-day bg-gradient-to-br from-violet-600 to-purple-600 shadow-[0_8px_24px_rgba(124,58,237,0.35)]'
                    : 'bg-white border border-violet-100 hover:border-violet-300 hover:shadow-md'
                  }
                `}
              >
                <span className={`text-[9px] font-bold tracking-[1.5px] uppercase ${isActive ? 'text-violet-200' : 'text-slate-400'}`}>
                  {dayName}
                </span>
                <span className={`text-[20px] font-black leading-none tracking-tight ${isActive ? 'text-white' : 'text-slate-800'}`}>
                  {dayNum}
                </span>
                {isActive && (
                  <div className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-violet-500" />
                )}
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
}
