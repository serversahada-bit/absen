'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Megaphone, CalendarDays, Paperclip, ChevronsDown } from 'lucide-react';

interface PengumumanWajibItem {
  id: number;
  judul: string;
  isi: string;
  versi: string;
  lampiranUrl: string | null;
  lampiranIsImage: boolean;
  tanggalLabel: string | null;
}

const RECHECK_MS = 5 * 60 * 1000;

/**
 * Popup Pengumuman Penting dari HC: tidak bisa ditutup sampai karyawan scroll sampai bawah
 * lalu klik "Saya sudah membaca". Absen juga ditolak di /api/absen selama masih ada yang belum dibaca.
 */
async function fetchPengumumanWajib(): Promise<PengumumanWajibItem[] | null> {
  try {
    const res = await fetch('/api/pengumuman/wajib', { cache: 'no-store' });
    const data = await res.json();
    return res.ok && Array.isArray(data.items) ? data.items : null;
  } catch {
    // Coba lagi saat focus / interval berikutnya.
    return null;
  }
}

export default function PengumumanWajibGate() {
  const [items, setItems] = useState<PengumumanWajibItem[]>([]);
  const loadingRef = useRef(false);

  const load = useCallback(() => {
    if (loadingRef.current || document.visibilityState === 'hidden') return;
    loadingRef.current = true;
    fetchPengumumanWajib().then((list) => {
      loadingRef.current = false;
      if (list) setItems(list);
    });
  }, []);

  useEffect(() => {
    load();
    // Cek ulang saat app dibuka lagi / tiap 5 menit, supaya pengumuman yang mulai berlaku jam 00:00 ikut muncul.
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

  const item = items[0];
  return (
    <PengumumanWajibModal
      key={`${item.id}-${item.versi}`}
      item={item}
      total={items.length}
      onDone={() => setItems((prev) => prev.slice(1))}
      onStale={load}
    />
  );
}

interface ModalProps {
  item: PengumumanWajibItem;
  total: number;
  onDone: () => void;
  onStale: () => void;
}

function PengumumanWajibModal({ item, total, onDone, onStale }: ModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [sudahSampaiBawah, setSudahSampaiBawah] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const cekPosisiScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight <= 8) setSudahSampaiBawah(true);
  }, []);

  // ResizeObserver langsung terpanggil sekali saat observe: isi pendek (tanpa scroll) otomatis dianggap sampai bawah.
  // Juga terpanggil ulang saat gambar lampiran selesai dimuat dan isinya jadi lebih panjang.
  useEffect(() => {
    const scrollEl = scrollRef.current;
    const contentEl = contentRef.current;
    if (!scrollEl || !contentEl) return;
    const observer = new ResizeObserver(cekPosisiScroll);
    observer.observe(scrollEl);
    observer.observe(contentEl);
    return () => observer.disconnect();
  }, [cekPosisiScroll]);

  const handleConfirm = async () => {
    if (!sudahSampaiBawah || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/pengumuman/wajib', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, versi: item.versi }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        onDone();
        return;
      }
      setError(data.error || 'Gagal menyimpan. Coba lagi.');
      if (data.stale) onStale();
    } catch {
      setError('Terjadi masalah koneksi. Coba lagi.');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[998] flex items-center justify-center p-5 bg-slate-900/70 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[85vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Pengumuman Penting
            </span>
            {total > 1 && <span className="text-[10px] font-bold text-slate-400">1 dari {total}</span>}
          </div>
          <div className="flex items-start gap-3 mt-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shrink-0">
              <Megaphone className="w-4 h-4 text-white" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-slate-900 leading-snug">{item.judul}</p>
              {item.tanggalLabel && (
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mt-1">
                  <CalendarDays className="w-3 h-3 shrink-0" />
                  {item.tanggalLabel}
                </p>
              )}
            </div>
          </div>
        </div>

        <div ref={scrollRef} onScroll={cekPosisiScroll} className="flex-1 overflow-y-auto px-5 py-4">
          <div ref={contentRef}>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{item.isi}</p>

            {item.lampiranUrl && item.lampiranIsImage && (
              <a href={item.lampiranUrl} target="_blank" rel="noopener noreferrer" className="block mt-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.lampiranUrl} alt={`Lampiran ${item.judul}`} className="w-full rounded-[14px] border border-slate-100" />
              </a>
            )}
            {item.lampiranUrl && (
              <a
                href={item.lampiranUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 bg-violet-50 border border-violet-100 hover:bg-violet-100 px-3 py-1.5 rounded-full transition-colors"
              >
                <Paperclip className="w-3.5 h-3.5" />
                Lihat Lampiran
              </a>
            )}
          </div>
        </div>

        <div className="px-5 pt-3 pb-5 border-t border-slate-100">
          {!sudahSampaiBawah && (
            <p className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-2.5">
              <ChevronsDown className="w-3.5 h-3.5 animate-bounce" />
              Scroll sampai bawah untuk melanjutkan
            </p>
          )}
          {error && <p className="text-xs text-red-600 font-medium text-center mb-2.5">{error}</p>}
          <button
            onClick={handleConfirm}
            disabled={!sudahSampaiBawah || submitting}
            className="w-full text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Menyimpan...' : 'Saya sudah membaca'}
          </button>
        </div>
      </div>
    </div>
  );
}
