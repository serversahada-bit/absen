import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Search } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import AppShell from '@/components/AppShell';
import BackLink from '@/components/BackLink';
import PeraturanList, { PeraturanDoc } from './PeraturanList';

export const dynamic = 'force-dynamic';

// Folder PDF peraturan di-hosting di subdomain lama (bukan di app ini).
const PDF_BASE_URL = 'https://absen.ptslu.id/config/uploads/peraturan/';

export default async function PeraturanPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/');
  }

  const userId = session.user_id;
  const params = await searchParams;
  const q = (params.q || '').trim();

  const meRows: any = await query('SELECT nama, organisasi FROM karyawan WHERE id = ? LIMIT 1', [userId]);
  const me = meRows?.[0] || {};

  let where = "WHERE file IS NOT NULL AND file <> ''";
  const likeParams: string[] = [];
  if (q !== '') {
    where += ' AND (judul LIKE ? OR file LIKE ?)';
    likeParams.push(`%${q}%`, `%${q}%`);
  }

  const rows: any = await query(
    `SELECT id, judul, file, uploaded_at
     FROM peraturan_perusahaan
     ${where}
     ORDER BY uploaded_at DESC, id DESC`,
    likeParams
  );

  const docs: PeraturanDoc[] = (rows || [])
    .filter((r: any) => /\.pdf$/i.test(String(r.file || '')))
    .map((r: any) => {
      const fileBase = String(r.file).split('/').pop() as string;
      return {
        id: Number(r.id) || 0,
        judul: r.judul || fileBase,
        file: fileBase,
        url: PDF_BASE_URL + encodeURIComponent(fileBase),
        date: r.uploaded_at ? format(new Date(r.uploaded_at), 'dd MMM yyyy HH:mm', { locale: id }) : '',
      };
    });

  return (
    <AppShell maxWidth="lg:max-w-2xl">
      <div className="text-slate-900 font-sans selection:bg-violet-200">
        {/* HEADER */}
        <div className="bg-white/80 backdrop-blur-xl px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-3 sticky top-0 z-40 border-b border-slate-100">
          <BackLink>
            <Link
              href="/dashboard"
              className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition active:scale-95 text-slate-500 border border-slate-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </BackLink>
          <div>
            <h1 className="font-black text-[17px] text-slate-900 tracking-tight leading-none">Peraturan Perusahaan</h1>
            <p className="text-[11px] font-semibold text-slate-400 mt-1">
              {me.nama || 'Karyawan'} &bull; {me.organisasi || '-'}
            </p>
          </div>
        </div>

        <div className="max-w-md mx-auto p-5">
          {/* SEARCH */}
          <form method="GET" className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Cari judul / nama file PDF
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="contoh: SOP Cuti"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-violet-500 text-[14px] font-semibold text-slate-700 transition-all"
              />
              <button
                type="submit"
                className="shrink-0 px-4 py-3 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 text-white flex items-center justify-center shadow-[0_6px_16px_rgba(124,58,237,0.3)] active:scale-95 transition-all"
              >
                <Search className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
            <p className="text-[11px] font-semibold text-slate-400 mt-3">Total: {docs.length} dokumen</p>
          </form>

          <div className="mt-4">
            <PeraturanList docs={docs} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
