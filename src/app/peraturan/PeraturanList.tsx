'use client';

import React, { useState } from 'react';
import { FileText, Eye, Download, X } from 'lucide-react';

export interface PeraturanDoc {
  id: number;
  judul: string;
  file: string;
  url: string;
  date: string;
}

export default function PeraturanList({ docs }: { docs: PeraturanDoc[] }) {
  const [active, setActive] = useState<PeraturanDoc | null>(null);

  if (docs.length === 0) {
    return (
      <div className="bg-white rounded-[24px] border border-dashed border-slate-200 p-8 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
          <FileText className="w-6 h-6 text-slate-300" strokeWidth={1.5} />
        </div>
        <p className="text-xs font-bold text-slate-400 text-center">Belum ada dokumen.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2.5">
        {docs.map((d) => (
          <div key={d.id} className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-rose-500" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 text-sm leading-snug break-words">{d.judul}</p>
                <p className="text-[11px] font-semibold text-slate-400 mt-1 truncate">{d.date || '-'}</p>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setActive(d)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-slate-900 px-3 py-2.5 text-[12px] font-bold text-white active:scale-[0.98] transition-all"
              >
                <Eye className="w-3.5 h-3.5" strokeWidth={2.25} />
                Preview
              </button>
              <a
                href={d.url}
                download
                className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-bold text-slate-700 active:scale-[0.98] transition-all"
              >
                <Download className="w-3.5 h-3.5" strokeWidth={2.25} />
                Download
              </a>
            </div>
          </div>
        ))}
      </div>

      {active && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-3" onClick={() => setActive(null)}>
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-[28px] bg-white shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Preview</p>
                <p className="text-sm font-black text-slate-900 truncate">{active.judul}</p>
              </div>
              <button
                onClick={() => setActive(null)}
                className="shrink-0 w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center active:scale-95 transition-all"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div className="bg-slate-100">
              <div className="relative w-full" style={{ paddingTop: '140%' }}>
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`${active.url}#toolbar=0&navpanes=0&view=FitH`}
                  title={active.judul}
                />
              </div>
            </div>

            <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
              <a
                href={active.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-2xl bg-slate-900 px-3 py-2.5 text-[12px] font-bold text-white text-center active:scale-[0.98] transition-all"
              >
                Buka Tab Baru
              </a>
              <a
                href={active.url}
                download
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-bold text-slate-700 text-center active:scale-[0.98] transition-all"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
