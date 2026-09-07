'use client';

import React from 'react';
import Image from 'next/image';
import LiveStatusBadge from '@/components/LiveStatusBadge';

export default function TopBar() {
  return (
    <div className="px-5 lg:px-0 pt-8 lg:pt-6 pb-4 animate-fade-in-up flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-white shadow-sm border border-blue-100">
          <Image
            src="/sasdw.png"
            alt="Logo"
            width={28}
            height={28}
            className="object-contain"
            unoptimized
          />
        </div>
        <div className="flex flex-col">
          <h1 className="text-[15px] font-black text-slate-900 leading-none tracking-tight">Great HRD</h1>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[1.5px] mt-0.5">Sistem Pegawai</p>
        </div>
      </div>
      <LiveStatusBadge />
    </div>
  );
}
