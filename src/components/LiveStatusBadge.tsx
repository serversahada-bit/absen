'use client';

import React, { useState, useEffect } from 'react';

export default function LiveStatusBadge() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Cek status online browser secara real
    setIsOnline(navigator.onLine);

    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-100 cursor-default select-none"
      title={isOnline ? 'Sistem Online' : 'Tidak ada koneksi'}
    >
      <span className="relative flex h-1.5 w-1.5">
        {isOnline ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </>
        ) : (
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
        )}
      </span>
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        {isOnline ? 'Live' : 'Off'}
      </span>
    </div>
  );
}
