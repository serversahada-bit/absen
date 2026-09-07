'use client';

import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';

interface AbsenPhotoProps {
  src: string;
  alt: string;
  emptyLabel: string;
}

export default function AbsenPhoto({ src, alt, emptyLabel }: AbsenPhotoProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="bg-white border border-slate-100 rounded-[20px] p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
        <ImageIcon className="w-8 h-8 text-slate-200 mb-2" />
        <p className="text-[12px] font-bold text-slate-400">{src ? 'Foto tidak tersedia.' : emptyLabel}</p>
      </div>
    );
  }

  return (
    <a href={src} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-[20px]">
      <img
        src={src}
        alt={alt}
        onError={() => setFailed(true)}
        className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-white text-[11px] font-black tracking-widest uppercase bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">Lihat Penuh</span>
      </div>
    </a>
  );
}
