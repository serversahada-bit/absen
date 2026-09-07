import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { isManagerRole } from '@/lib/roles';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import AppShell from '@/components/AppShell';
import BackLink from '@/components/BackLink';
import AprovalLemburCard, { AprovalLemburRow } from './AprovalLemburCard';

export const dynamic = 'force-dynamic';

const FILTERS = ['pending', 'approved', 'rejected', 'all'] as const;
type FilterKey = (typeof FILTERS)[number];

const FILTER_LABEL: Record<FilterKey, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  all: 'Semua',
};

const MGR_STATUS_MAP: Record<Exclude<FilterKey, 'all'>, string> = {
  pending: 'PENDING',
  approved: 'APPROVED',
  rejected: 'REJECTED',
};

function fmtDateTime(v: unknown): string {
  if (!v) return '-';
  try {
    return format(new Date(v as string), 'dd MMM yyyy HH:mm', { locale: id });
  } catch {
    return String(v);
  }
}

function fmtDurasi(menit: number): string {
  const jam = Math.floor(menit / 60);
  const sisa = menit % 60;
  return `${jam} jam ${String(sisa).padStart(2, '0')} menit`;
}

export default async function AprovalLemburPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect('/');
  }

  const userId = session.user_id;
  const params = await searchParams;
  const filter: FilterKey = FILTERS.includes(params.filter as FilterKey) ? (params.filter as FilterKey) : 'pending';

  const meRows: any = await query('SELECT peran, jabatan FROM karyawan WHERE id = ? LIMIT 1', [userId]);
  const me = meRows?.[0] || {};
  const isLeader = isManagerRole(me.peran, me.jabatan);

  let where = 'WHERE 1=1';
  const sqlParams: any[] = [userId];
  if (filter !== 'all') {
    where += ' AND l.manager_status = ?';
    sqlParams.push(MGR_STATUS_MAP[filter]);
  }

  const rows: any = await query(
    `SELECT
       l.id, l.karyawan_id,
       l.mulai_at, l.selesai_at, l.durasi_menit,
       l.alasan,
       l.status AS status_final,
       l.manager_status, l.manager_at, l.manager_notes,
       l.created_at,
       k.nama AS nama_karyawan, k.jabatan AS jabatan_karyawan, k.organisasi AS organisasi_karyawan
     FROM lembur l
     LEFT JOIN karyawan k ON k.id = l.karyawan_id
     JOIN tim_saya ts ON ts.anggota_id = l.karyawan_id AND ts.manager_id = ?
     ${where}
     ORDER BY l.id DESC
     LIMIT 200`,
    sqlParams
  );

  const items: AprovalLemburRow[] = (rows || []).map((r: any) => ({
    id: Number(r.id),
    namaKaryawan: r.nama_karyawan || 'Karyawan',
    jabatanKaryawan: r.jabatan_karyawan || '-',
    organisasiKaryawan: r.organisasi_karyawan || '-',
    mulai: fmtDateTime(r.mulai_at),
    selesai: fmtDateTime(r.selesai_at),
    durasi: fmtDurasi(Number(r.durasi_menit) || 0),
    diajukan: fmtDateTime(r.created_at),
    alasan: r.alasan || '',
    finalStatus: (r.status_final || 'PENDING').toString().toUpperCase(),
    managerStatus: (r.manager_status || 'PENDING').toString().toUpperCase(),
    managerNotes: r.manager_notes || '',
  }));

  const buildHref = (f: FilterKey) => `/aproval_lembur?filter=${f}`;

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
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Lembur</p>
            <h1 className="font-black text-[17px] text-slate-900 tracking-tight leading-none">Approval Manager/SPV</h1>
          </div>
        </div>

        <div className="max-w-md mx-auto p-5">
          {!isLeader && (
            <div className="mb-4 rounded-[20px] bg-amber-50 border border-amber-100 p-4">
              <p className="text-[13px] font-semibold text-amber-800">
                Halaman ini khusus <span className="font-black">Manager / SPV / Supervisor</span>. Anda hanya bisa melihat, tidak bisa memproses.
              </p>
            </div>
          )}

          <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-black text-slate-900">Daftar Pengajuan Lembur (Anggota Tim)</p>
              <p className="text-[11px] font-semibold text-slate-500">Total: {items.length}</p>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
              {FILTERS.map((f) => (
                <Link
                  key={f}
                  href={buildHref(f)}
                  className={`shrink-0 px-3.5 py-2 rounded-2xl text-[12px] font-bold border transition-all ${
                    filter === f
                      ? 'bg-gradient-to-br from-violet-600 to-purple-600 text-white border-transparent shadow-[0_6px_16px_rgba(124,58,237,0.3)]'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-violet-300'
                  }`}
                >
                  {FILTER_LABEL[f]}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {items.length === 0 ? (
              <div className="bg-white rounded-[24px] border border-dashed border-slate-200 p-8 text-center">
                <p className="text-[12px] font-bold text-slate-400">Belum ada pengajuan lembur dari anggota tim Anda.</p>
              </div>
            ) : (
              items.map((row) => <AprovalLemburCard key={row.id} row={row} isLeader={isLeader} />)
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
