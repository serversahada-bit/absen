'use client';

import React, { useRef, useState } from 'react';
import { Send, CheckCircle2, AlertCircle, ImagePlus, X } from 'lucide-react';

export default function NotifikasiBroadcastForm() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/notifikasi/upload-image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setResult({ ok: false, message: data.error || 'Gagal upload gambar.' });
        return;
      }

      setImageUrl(data.url);
    } catch {
      setResult({ ok: false, message: 'Terjadi masalah koneksi saat upload gambar.' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/push/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, url: url || undefined, image: imageUrl || undefined }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setResult({ ok: false, message: data.error || 'Gagal mengirim notifikasi.' });
        return;
      }

      setResult({ ok: true, message: `Notifikasi terkirim ke ${data.sent} perangkat.` });
      setTitle('');
      setBody('');
      setUrl('');
      setImageUrl('');
    } catch {
      setResult({ ok: false, message: 'Terjadi masalah koneksi.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-5 space-y-4">
      {result && (
        <div
          className={`rounded-xl border p-3 text-sm flex items-start gap-2 ${
            result.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'
          }`}
        >
          {result.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{result.message}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Judul</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={80}
          placeholder="Contoh: Pengumuman Libur Nasional"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] font-medium text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Isi Pesan</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={4}
          maxLength={200}
          placeholder="Tulis isi pengumuman di sini..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] font-medium text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Gambar (opsional)</label>

        {imageUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Preview" className="w-full max-h-48 object-cover" />
            <button
              type="button"
              onClick={() => setImageUrl('')}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              aria-label="Hapus gambar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm font-semibold text-slate-500 hover:border-violet-300 hover:text-violet-600 transition-colors disabled:opacity-60"
          >
            <ImagePlus className="w-4 h-4" />
            {uploading ? 'Mengunggah...' : 'Upload Gambar (JPG/PNG/WEBP, maks 3MB)'}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <p className="text-[11px] text-slate-400 leading-relaxed">
          Catatan: gambar tidak muncul di notifikasi iPhone (keterbatasan iOS).
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Link Tujuan (opsional)</label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="/dashboard"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] font-medium text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={loading || uploading}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/40 transition-all disabled:opacity-60"
      >
        <Send className="w-4 h-4" />
        {loading ? 'Mengirim...' : 'Kirim Notifikasi'}
      </button>
    </form>
  );
}
