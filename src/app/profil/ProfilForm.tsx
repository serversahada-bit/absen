'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, CheckCircle2, AlertCircle } from 'lucide-react';

function getInitials(name: string): string {
  const parts = (name || '').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name || '??').substring(0, 2).toUpperCase();
}

interface ProfilFormProps {
  nama: string;
  jabatan: string;
  email: string;
  noHp: string;
  fotoUrl?: string;
}

export default function ProfilForm({ nama, jabatan, email, noHp, fotoUrl }: ProfilFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(fotoUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch('/api/profil', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setResult({ ok: false, message: data.error || 'Gagal menyimpan perubahan.' });
        return;
      }

      setResult({ ok: true, message: data.message || 'Profil berhasil diperbarui.' });
      const passwordInput = e.currentTarget.elements.namedItem('password') as HTMLInputElement | null;
      if (passwordInput) passwordInput.value = '';
      router.refresh();
    } catch {
      setResult({ ok: false, message: 'Terjadi masalah koneksi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {result && (
        <div
          className={`rounded-2xl border p-4 text-sm flex items-start gap-3 shadow-sm ${
            result.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          {result.ok ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
          <div>
            <p className="font-bold">{result.ok ? 'Berhasil' : 'Gagal'}</p>
            <p className="mt-0.5">{result.message}</p>
          </div>
        </div>
      )}

      {/* FOTO */}
      <div className="flex flex-col items-center justify-center">
        <div className="relative group">
          {previewUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={previewUrl}
              alt={nama}
              className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg ring-1 ring-slate-200"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-violet-50 border-4 border-white shadow-lg ring-1 ring-slate-200 flex items-center justify-center font-black text-3xl text-violet-600 uppercase">
              {getInitials(nama)}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-violet-600 text-white p-2 rounded-full shadow-md hover:bg-violet-700 transition transform hover:scale-110 border-2 border-white"
            aria-label="Ubah foto"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            name="foto"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        <p className="text-xs text-slate-400 mt-3 font-medium">Ketuk ikon kamera untuk ubah foto</p>
      </div>

      {/* INFORMASI PEKERJAAN */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">Informasi Pekerjaan</h2>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Nama Lengkap</label>
          <input
            type="text"
            value={nama}
            readOnly
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 text-slate-600 text-sm border border-transparent focus:outline-none cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Jabatan</label>
          <input
            type="text"
            value={jabatan}
            readOnly
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 text-slate-600 text-sm border border-transparent focus:outline-none cursor-not-allowed"
          />
        </div>
      </div>

      {/* KONTAK & AKUN */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">Kontak & Akun</h2>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Email</label>
          <input
            type="email"
            name="email"
            defaultValue={email}
            required
            className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">No. Handphone</label>
          <input
            type="text"
            name="no_hp"
            defaultValue={noHp}
            placeholder="08..."
            className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
          />
        </div>

        <div className="pt-2">
          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
            Ganti Password <span className="text-slate-400 font-normal normal-case">(Opsional)</span>
          </label>
          <input
            type="password"
            name="password"
            placeholder="Password Baru"
            minLength={6}
            className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 mb-1.5 transition-all"
          />
          <p className="text-[10px] text-rose-500 italic">*Biarkan kosong jika tidak ingin mengganti. Minimal 6 karakter.</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 rounded-xl bg-violet-600 text-white font-bold shadow-lg shadow-violet-200 active:scale-[0.98] hover:bg-violet-700 transition-all flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <CheckCircle2 className="w-5 h-5" />
        {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
      </button>
    </form>
  );
}
