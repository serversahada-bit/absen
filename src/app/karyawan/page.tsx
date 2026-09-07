import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Search, Users } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import AppShell from '@/components/AppShell';
import BackLink from '@/components/BackLink';
import KaryawanAvatar from '@/components/karyawan/KaryawanAvatar';

export const dynamic = 'force-dynamic';

const PER_PAGE = 24;

interface KaryawanRow {
  id: number;
  nama: string;
  jabatan: string;
  organisasi: string;
  foto: string | null;
  id_karyawan: string;
}

export default async function KaryawanPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/');
  }

  const userId = session.user_id;
  const params = await searchParams;
  const q = (params.q || '').trim();
  let page = parseInt(params.page || '1', 10);
  if (!page || page < 1) page = 1;

  const meRows: any = await query('SELECT nama, jabatan, organisasi FROM karyawan WHERE id = ? LIMIT 1', [userId]);
  const me = meRows?.[0] || {};

  // Perbandingan LIKE dipaksa ke collation yang sama dengan kolom, biar tidak
  // "Illegal mix of collations" (kolom di DB ini utf8mb4_general_ci).
  let where = "WHERE status_karyawan != 'Non-Aktif'";
  const likeParams: string[] = [];
  if (q !== '') {
    where += ` AND (
      nama COLLATE utf8mb4_general_ci LIKE CONCAT('%', CONVERT(? USING utf8mb4) COLLATE utf8mb4_general_ci, '%')
      OR jabatan COLLATE utf8mb4_general_ci LIKE CONCAT('%', CONVERT(? USING utf8mb4) COLLATE utf8mb4_general_ci, '%')
      OR organisasi COLLATE utf8mb4_general_ci LIKE CONCAT('%', CONVERT(? USING utf8mb4) COLLATE utf8mb4_general_ci, '%')
      OR id_karyawan COLLATE utf8mb4_general_ci LIKE CONCAT('%', CONVERT(? USING utf8mb4) COLLATE utf8mb4_general_ci, '%')
    )`;
    likeParams.push(q, q, q, q);
  }

  const countRows: any = await query(`SELECT COUNT(*) AS total FROM karyawan ${where}`, likeParams);
  const total = Number(countRows?.[0]?.total) || 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  if (page > totalPages) page = totalPages;
  const offset = (page - 1) * PER_PAGE;

  const rows: KaryawanRow[] = await query(
    `SELECT id, nama, jabatan, organisasi, foto, id_karyawan
     FROM karyawan
     ${where}
     ORDER BY nama ASC
     LIMIT ${PER_PAGE} OFFSET ${offset}`,
    likeParams
  );

  const buildHref = (targetPage: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    sp.set('page', String(targetPage));
    return `/karyawan?${sp.toString()}`;
  };

  return (
    <AppShell maxWidth="lg:max-w-2xl">
      <div className="text-slate-900 font-sans selection:bg-violet-200">
        {/* HEADER */}
        <div className="bg-white/80 backdrop-blur-xl px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between sticky top-0 z-40 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <BackLink>
              <Link
                href="/dashboard"
                className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition active:scale-95 text-slate-500 border border-slate-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </BackLink>
            <div>
              <h1 className="font-black text-[17px] text-slate-900 tracking-tight leading-none">Direktori Karyawan</h1>
              <p className="text-[11px] font-semibold text-slate-400 mt-1">
                {me.nama || 'Karyawan'} &bull; {me.organisasi || '-'}
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto p-5">
          {/* SEARCH */}
          <form method="GET" className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Cari nama / jabatan / organisasi
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="contoh: Nurul / FAT / Marketing"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-0 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-violet-500 text-[14px] font-semibold text-slate-700 transition-all"
              />
              <button
                type="submit"
                className="shrink-0 px-4 py-3 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 text-white flex items-center justify-center shadow-[0_6px_16px_rgba(124,58,237,0.3)] active:scale-95 transition-all"
              >
                <Search className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
            <p className="text-[11px] font-semibold text-slate-400 mt-3">
              Total: {total} &bull; Halaman {page}/{totalPages}
            </p>
          </form>

          {/* LIST */}
          <div className="mt-4 space-y-2.5">
            {rows.length > 0 ? (
              rows.map((r) => (
                <Link
                  key={r.id}
                  href={`/karyawan/${r.id}`}
                  className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-4 flex items-center gap-3 hover:border-violet-200 hover:shadow-md active:scale-[0.99] transition-all"
                >
                  <KaryawanAvatar name={r.nama} photoUrl={r.foto ? `/uploads/${r.foto}` : undefined} />
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-900 truncate">{r.nama}</p>
                    <p className="text-[12px] font-semibold text-slate-500 truncate mt-0.5">
                      {r.jabatan || '-'} &bull; {r.organisasi || '-'}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-400 truncate mt-0.5">
                      {r.id_karyawan || `ID: ${r.id}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] font-bold text-violet-600">Detail &rarr;</span>
                </Link>
              ))
            ) : (
              <div className="bg-white rounded-[24px] border border-dashed border-slate-200 p-8 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-slate-300" strokeWidth={1.5} />
                </div>
                <p className="text-xs font-bold text-slate-400 text-center">Tidak ada data.</p>
              </div>
            )}
          </div>

          {/* PAGINATION */}
          <div className="mt-4 bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-4 flex items-center justify-between">
            {page <= 1 ? (
              <span className="px-4 py-2 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-300">Prev</span>
            ) : (
              <Link href={buildHref(page - 1)} className="px-4 py-2 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:border-violet-300 hover:text-violet-700 transition-all">
                Prev
              </Link>
            )}
            {page >= totalPages ? (
              <span className="px-4 py-2 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-300">Next</span>
            ) : (
              <Link href={buildHref(page + 1)} className="px-4 py-2 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:border-violet-300 hover:text-violet-700 transition-all">
                Next
              </Link>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
