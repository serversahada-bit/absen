'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';

export default function NotifikasiBroadcastForm() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/push/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, url: url || undefined }),
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
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/40 transition-all disabled:opacity-60"
      >
        <Send className="w-4 h-4" />
        {loading ? 'Mengirim...' : 'Kirim Notifikasi'}
      </button>
    </form>
  );
}
