'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface NavModalProps {
  src: string;
  title: string;
  onClose: () => void;
}

export default function NavModal({ src, title, onClose }: NavModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] hidden lg:flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in-up"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl h-[85vh] bg-white rounded-[32px] shadow-[0_30px_80px_-20px_rgba(124,58,237,0.35)] border border-violet-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md shadow-md text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors border border-violet-100"
        >
          <X className="w-4 h-4" />
        </button>
        <iframe src={src} title={title} className="w-full h-full border-0" />
      </div>
    </div>
  );
}
