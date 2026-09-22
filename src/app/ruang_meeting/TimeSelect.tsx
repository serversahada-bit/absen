'use client';

import React, { useState } from 'react';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

export default function TimeSelect({
  name,
  required = false,
  focusRing = 'focus:ring-indigo-500',
}: {
  name: string;
  required?: boolean;
  focusRing?: string;
}) {
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');

  const combined = hour && minute ? `${hour}:${minute}` : '';

  const selectClass = `w-full px-3 py-3.5 rounded-2xl bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset ${focusRing} text-[14px] font-bold text-slate-700 transition-all appearance-none text-center`;

  return (
    <div className="flex items-center gap-2">
      <select
        aria-label="Jam"
        value={hour}
        onChange={(e) => setHour(e.target.value)}
        className={selectClass}
        required={required}
      >
        <option value="" disabled>
          Jam
        </option>
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="font-black text-slate-400">:</span>
      <select
        aria-label="Menit"
        value={minute}
        onChange={(e) => setMinute(e.target.value)}
        className={selectClass}
        required={required}
      >
        <option value="" disabled>
          Menit
        </option>
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <input type="hidden" name={name} value={combined} />
    </div>
  );
}
