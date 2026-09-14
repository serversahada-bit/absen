'use client';

import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

export default function PushRequirementToggle({ initialRequired }: { initialRequired: boolean }) {
  const [required, setRequired] = useState(initialRequired);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleToggle = async () => {
    const next = !required;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/settings/push-required', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ required: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan setting.');
      }
      setRequired(next);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan setting.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[24px] bg-white border border-slate-200 shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900">Wajib Notifikasi untuk Absen</p>
          <p className="text-xs text-slate-500 mt-0.5">Blokir absen sampai karyawan aktifkan notifikasi.</p>
        </div>
        <button
          onClick={handleToggle}
          disabled={loading}
          role="switch"
          aria-checked={required}
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-60 ${
            required ? 'bg-violet-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              required ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
      {error && <p className="text-xs text-red-600 font-medium mt-2">{error}</p>}
    </div>
  );
}
