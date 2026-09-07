'use client';

import React, { useState } from 'react';
import Image from 'next/image';

function getInitials(name: string): string {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name || '??').substring(0, 2).toUpperCase();
}

interface KaryawanAvatarProps {
  name: string;
  photoUrl?: string;
  size?: number;
}

export default function KaryawanAvatar({ name, photoUrl, size = 48 }: KaryawanAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const style = { width: size, height: size };

  if (photoUrl && !imgError) {
    return (
      <Image
        src={photoUrl}
        alt={name}
        width={size}
        height={size}
        style={style}
        className="rounded-2xl object-cover border border-slate-100 shrink-0"
        unoptimized
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      style={style}
      className="rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center font-black text-violet-600 uppercase shrink-0"
    >
      {getInitials(name)}
    </div>
  );
}
