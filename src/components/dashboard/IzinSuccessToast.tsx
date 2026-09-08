'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export default function IzinSuccessToast() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('izin_success') === '1') {
      setShow(true);
      window.history.replaceState(null, '', window.location.pathname);
      const timer = setTimeout(() => setShow(false), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2.5rem)] max-w-sm animate-fade-in-up">
      <div className="bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-600/30 px-4 py-3.5 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black">Pengajuan Izin Berhasil</p>
          <p className="text-xs font-semibold text-emerald-100 mt-0.5">Sudah dikirim ke HR dan salinan ke email Anda.</p>
        </div>
        <button
          onClick={() => setShow(false)}
          className="text-emerald-200 hover:text-white transition-colors shrink-0"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
