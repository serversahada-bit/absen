import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { ArrowLeft, Plus } from 'lucide-react';
import AppShell from '@/components/AppShell';
import BackLink from '@/components/BackLink';
import LegalitasSuccessToast from '@/components/LegalitasSuccessToast';
import RiwayatLegalitasList, { type RiwayatLegalitasRow } from '@/components/RiwayatLegalitasList';

export const dynamic = 'force-dynamic';

function formatTanggal(tgl: string) {
  if (!tgl || tgl === '0000-00-00') return '-';
  const date = new Date(tgl);
  if (isNaN(date.getTime())) return tgl;

  const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
  return `${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
}

export default async function RiwayatLegalitasPage() {
  const session = await getSession();

  if (!session) {
    redirect('/');
  }

  const userId = session.user_id;

  let rows: any[] = [];
  try {
    rows = await query(
      `SELECT id, jenis_dokumen, keterangan, file_pdf, status, created_at, catatan_admin,
              estimasi_hari, diproses_at, file_hasil, selesai_at,
              catatan_revisi, file_revisi, jumlah_revisi
       FROM pengajuan_legalitas
       WHERE karyawan_id = ?
       ORDER BY created_at DESC`,
      [userId]
    ) as any[];
  } catch (e) {
    console.error('Gagal membaca riwayat legalitas:', e);
  }

  const items: RiwayatLegalitasRow[] = rows.map((row) => ({
    id: row.id,
    jenis_dokumen: row.jenis_dokumen,
    keterangan: row.keterangan,
    file_pdf: row.file_pdf,
    status: row.status,
    tanggal: row.created_at ? formatTanggal(row.created_at instanceof Date ? row.created_at.toISOString().split('T')[0] : String(row.created_at).split(' ')[0]) : '-',
    catatan_admin: row.catatan_admin,
    estimasi_hari: row.estimasi_hari,
    file_hasil: row.file_hasil,
    catatan_revisi: row.catatan_revisi,
    file_revisi: row.file_revisi,
    jumlah_revisi: Number(row.jumlah_revisi ?? 0),
  }));

  return (
    <AppShell maxWidth="lg:max-w-2xl">
    <div className="text-slate-900 font-sans selection:bg-indigo-200">
      <LegalitasSuccessToast />

      {/* HEADER */}
      <div className="bg-white/80 backdrop-blur-xl px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-4 sticky top-0 z-40 border-b border-slate-100">
        <BackLink>
          <Link
            href="/dashboard"
            className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition active:scale-95 text-slate-500 border border-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </BackLink>
        <h1 className="font-black text-[17px] text-slate-900 tracking-tight">Riwayat Legalitas</h1>
      </div>

      <div className="max-w-md mx-auto p-5 space-y-5">

        {/* BANNER PENGAJUAN BARU */}
        <Link href="/legalitas" className="block relative w-full bg-indigo-600 text-white p-5 rounded-[28px] shadow-[0_8px_30px_rgba(79,70,229,0.3)] hover:bg-indigo-700 transition-all transform hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-bl-full opacity-10 transition-transform group-hover:scale-110 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shadow-inner">
                <Plus className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <p className="font-black text-[15px] tracking-wide">Ajukan Legalitas Baru</p>
                <p className="text-[12px] font-semibold text-indigo-200 mt-0.5">Upload dokumen PDF untuk dilegalisasi</p>
              </div>
            </div>
          </div>
        </Link>

        <RiwayatLegalitasList rows={items} />

      </div>
    </div>
    </AppShell>
  );
}
