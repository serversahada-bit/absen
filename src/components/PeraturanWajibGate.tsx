'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpenCheck, ExternalLink, FileText } from 'lucide-react';

interface PeraturanWajibItem {
  id: number;
  judul: string;
  url: string;
  terbitLabel: string;
}

const RECHECK_MS = 5 * 60 * 1000;

/**
 * Popup Dokumen Baru Peraturan Perusahaan: dokumen yang disetujui HC terbit bersamaan jam 15:00 WIB,
 * jadi semua dokumen yang belum dibaca tampil dalam satu popup. Tidak bisa ditutup sampai karyawan klik
 * "Saya sudah membaca". Absen juga ditolak di /api/absen selama masih ada yang belum dibaca.
 */
async function fetchPeraturanWajib(): Promise<PeraturanWajibItem[] | null> {
  try {
    const res = await fetch('/api/peraturan/wajib', { cache: 'no-store' });
    const data = await res.json();
    return res.ok && Array.isArray(data.items) ? data.items : null;
  } catch {
    // Coba lagi saat focus / interval berikutnya.
    return null;
  }
}

export default function PeraturanWajibGate() {
  const [items, setItems] = useState<PeraturanWajibItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const loadingRef = useRef(false);

  const load = useCallback(() => {
    if (loadingRef.current || document.visibilityState === 'hidden') return;
    loadingRef.current = true;
    fetchPeraturanWajib().then((list) => {
      loadingRef.current = false;
      if (list) setItems(list);
    });
  }, []);

  useEffect(() => {
    load();
    // Cek ulang saat app dibuka lagi / tiap 5 menit, supaya batch yang terbit jam 15:00 ikut muncul.
    const interval = window.setInterval(load, RECHECK_MS);
    document.addEventListener('visibilitychange', load);
    window.addEventListener('focus', load);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', load);
      window.removeEventListener('focus', load);
    };
  }, [load]);

  if (items.length === 0) return null;

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/peraturan/wajib', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: items.map((item) => item.id) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setItems([]);
        // Dokumen yang terbit saat popup terbuka ikut dimuat ulang.
        load();
      } else {
        setError(data.error || 'Gagal menyimpan. Coba lagi.');
      }
    } catch {
      setError('Terjadi masalah koneksi. Coba lagi.');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[998] flex items-center justify-center p-5 bg-slate-900/70 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[85vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-slate-100">
          <span className="text-[10px] font-black text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Peraturan Perusahaan
          </span>
          <div className="flex items-start gap-3 mt-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shrink-0">
              <BookOpenCheck className="w-4 h-4 text-white" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-slate-900 leading-snug">
                {items.length === 1 ? 'Ada Dokumen Baru' : `Ada ${items.length} Dokumen Baru`}
              </p>
              <p className="text-[12px] font-semibold text-slate-500 mt-1 leading-snug">
                Dokumen berikut baru terbit di Peraturan Perusahaan dan wajib kamu baca sebelum absen.
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
          {items.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-violet-50 hover:border-violet-100 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-violet-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 truncate">{item.judul}</p>
                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Terbit {item.terbitLabel}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-600 shrink-0">
                Buka PDF <ExternalLink className="w-3 h-3" />
              </span>
            </a>
          ))}
        </div>

        <div className="px-5 pt-3 pb-5 border-t border-slate-100">
          {error && <p className="text-xs text-red-600 font-medium text-center mb-2.5">{error}</p>}
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Menyimpan...' : 'Saya sudah membaca'}
          </button>
        </div>
      </div>
    </div>
  );
}
