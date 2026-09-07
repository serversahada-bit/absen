import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, IdCard, Briefcase, Layers } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import AppShell from '@/components/AppShell';
import BackLink from '@/components/BackLink';
import KaryawanAvatar from '@/components/karyawan/KaryawanAvatar';

export const dynamic = 'force-dynamic';

function showVal(v: unknown): string {
  const s = String(v ?? '').trim();
  return s !== '' ? s : '-';
}

export default async function KaryawanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/');
  }

  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);
  if (!id || id <= 0) {
    redirect('/karyawan');
  }

  const rows: any = await query(
    `SELECT id, nama, organisasi, foto, id_karyawan, jabatan, posisi, status_karyawan
     FROM karyawan
     WHERE id = ?
     LIMIT 1`,
    [id]
  );
  const k = rows?.[0];

  if (!k || k.status_karyawan === 'Non-Aktif') {
    redirect('/karyawan');
  }

  const fields = [
    { label: 'ID Karyawan', value: showVal(k.id_karyawan), icon: IdCard },
    { label: 'Jabatan', value: showVal(k.jabatan), icon: Briefcase },
    { label: 'Posisi', value: showVal(k.posisi), icon: Layers },
  ];

  return (
    <AppShell maxWidth="lg:max-w-2xl">
      <div className="text-slate-900 font-sans selection:bg-violet-200">
        {/* HEADER */}
        <div className="bg-white/80 backdrop-blur-xl px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] sticky top-0 z-40 border-b border-slate-100">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <KaryawanAvatar name={k.nama || ''} photoUrl={k.foto ? `/uploads/${k.foto}` : undefined} size={56} />
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Detail</p>
                <h1 className="text-lg font-black text-slate-900 truncate leading-tight">{k.nama || '-'}</h1>
                <p className="text-[12px] font-semibold text-slate-500 truncate mt-0.5">
                  {showVal(k.jabatan)} &bull; {showVal(k.organisasi)}
                </p>
              </div>
            </div>
            <BackLink>
              <Link
                href="/karyawan"
                className="shrink-0 flex items-center gap-1.5 text-[11px] font-bold text-violet-600 hover:text-violet-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
                Kembali
              </Link>
            </BackLink>
          </div>
        </div>

        <div className="max-w-md mx-auto p-5">
          <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-5 space-y-3">
            {fields.map((f) => (
              <div key={f.label} className="rounded-2xl border border-slate-100 px-4 py-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                  <f.icon className="w-4 h-4 text-violet-600" strokeWidth={2.25} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{f.label}</div>
                  <div className="mt-0.5 text-sm font-bold text-slate-900 break-words">{f.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
