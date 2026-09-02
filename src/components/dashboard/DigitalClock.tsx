'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Fingerprint, LogIn, LogOut, CheckCheck } from 'lucide-react';

interface DigitalClockProps {
  status: 'belum' | 'masuk' | 'selesai';
  isOff: boolean;
  timeIn: string;
  timeOut: string;
}

export default function DigitalClock({ status, isOff, timeIn, timeOut }: DigitalClockProps) {
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) return <div className="h-[220px]" />;

  const pad = (n: number) => String(n).padStart(2, '0');
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  let actionText = 'Check In';
  let targetTipe = 'masuk';
  let ButtonIcon = LogIn;
  let btnStyle = 'bg-white text-violet-700 hover:bg-violet-50 shadow-[0_8px_24px_rgba(0,0,0,0.15)]';

  if (isOff) {
    actionText = 'Hari Libur';
    ButtonIcon = CheckCheck;
    btnStyle = 'bg-slate-200 text-slate-400 cursor-not-allowed';
  } else if (status === 'masuk') {
    actionText = 'Check Out';
    targetTipe = 'pulang';
    ButtonIcon = LogOut;
    btnStyle = 'bg-rose-600 hover:bg-rose-700 text-white shadow-[0_8px_24px_rgba(220,38,38,0.4)]';
  } else if (status === 'selesai') {
    actionText = 'Selesai';
    ButtonIcon = CheckCheck;
    btnStyle = 'bg-emerald-600 text-white cursor-not-allowed shadow-[0_8px_24px_rgba(5,150,105,0.4)]';
  }

  const handleAction = () => {
    if (isOff || status === 'selesai') return;
    router.push(`/absen?tipe=${targetTipe}`);
  };

  return (
    <div className="px-5 lg:px-0 pt-2 pb-4 animate-fade-in-up [animation-delay:280ms] h-full">
      <div className="h-full flex flex-col justify-center bg-gradient-to-br from-violet-600 to-purple-600 rounded-[28px] p-6 relative overflow-hidden shadow-[0_10px_30px_rgba(124,58,237,0.25)]">
        {/* Decoration */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/[0.08] pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-fuchsia-400/10 pointer-events-none" />

        {/* Label */}
        <p className="text-[10px] font-bold text-violet-200 uppercase tracking-[2px] mb-4 relative z-10">
          Waktu Saat Ini
        </p>

        {/* Clock */}
        <div className="flex items-end gap-1 mb-6 relative z-10">
          <span className="text-[52px] font-black text-white leading-none tracking-tighter tabular-nums">{hours}</span>
          <span className="text-[52px] font-black text-white leading-none tracking-tighter tabular-nums animate-pulse">:</span>
          <span className="text-[52px] font-black text-white leading-none tracking-tighter tabular-nums">{minutes}</span>
          <span className="text-[28px] font-bold text-violet-200 leading-none tracking-tighter tabular-nums mb-1 ml-1">{seconds}</span>
        </div>

        {/* Divider */}
        <div className="border-t border-white/15 mb-5" />

        {/* Jadwal row */}
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div>
            <p className="text-[9px] font-bold text-violet-200 uppercase tracking-widest mb-0.5">Jadwal Masuk</p>
            <p className="text-sm font-black text-white tabular-nums">{timeIn}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {[1,2,3].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/25" />
            ))}
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-violet-200 uppercase tracking-widest mb-0.5">Jadwal Pulang</p>
            <p className="text-sm font-black text-white tabular-nums">{timeOut}</p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleAction}
          disabled={isOff || status === 'selesai'}
          className={`relative z-10 w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-[15px] tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${btnStyle}`}
        >
          <Fingerprint className="w-5 h-5" strokeWidth={2} />
          {actionText}
        </button>
      </div>
    </div>
  );
}
