'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

// Kotak search live (filter di sisi client) yang dipakai di Legalitas & Peraturan.
export default function SearchInput({
  value,
  onChange,
  placeholder,
  focusRingClass = 'focus:ring-indigo-500',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  focusRingClass?: string;
}) {
  return (
    <div className="relative">
      <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-11 pr-11 py-3.5 rounded-2xl bg-white border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset ${focusRingClass} text-[13px] font-semibold text-slate-700 transition-all placeholder:text-slate-400 placeholder:font-medium shadow-sm [&::-webkit-search-cancel-button]:hidden`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Hapus pencarian"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function SearchEmptyState({ keyword, label }: { keyword: string; label: string }) {
  return (
    <div className="text-center py-14 animate-fade-in-up">
      <div className="bg-slate-50 p-5 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-4 ring-1 ring-slate-100">
        <Search className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
      </div>
      <h3 className="text-[15px] font-black text-slate-900">Tidak ditemukan</h3>
      <p className="text-[12px] font-semibold text-slate-400 mt-1 max-w-[240px] mx-auto leading-relaxed">
        Tidak ada {label} &quot;{keyword.trim()}&quot;.
      </p>
    </div>
  );
}
