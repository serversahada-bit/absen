import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import AppShell from '@/components/AppShell';
import RuangMeetingTabs, { type JadwalRow, type RiwayatRow } from './RuangMeetingTabs';

export const dynamic = 'force-dynamic';

export default async function RiwayatRuangMeetingPage() {
  const session = await getSession();

  if (!session) {
    redirect('/request_login');
  }

  const userId = session.user_id;

  let jadwalRows: JadwalRow[] = [];
  let riwayatRows: RiwayatRow[] = [];

  try {
    jadwalRows = await query(
      `SELECT r.id, r.karyawan_id, k.nama, r.tanggal, r.kegiatan, r.jenis_aktifitas, r.jam_mulai, r.jam_selesai
       FROM pengajuan_ruang_meeting r
       LEFT JOIN karyawan k ON k.id = r.karyawan_id
       WHERE r.status = 'Disetujui' AND r.tanggal >= CURDATE()
       ORDER BY r.tanggal ASC, r.jam_mulai ASC`
    ) as JadwalRow[];
  } catch (e) {
    console.error('Gagal membaca jadwal ruang meeting:', e);
  }

  try {
    riwayatRows = await query(
      `SELECT id, tanggal, kegiatan, jenis_aktifitas, jam_mulai, jam_selesai, catatan, status, catatan_admin, created_at
       FROM pengajuan_ruang_meeting
       WHERE karyawan_id = ?
       ORDER BY created_at DESC`,
      [userId]
    ) as RiwayatRow[];
  } catch (e) {
    console.error('Gagal membaca riwayat ruang meeting:', e);
  }

  return (
    <AppShell maxWidth="lg:max-w-2xl">
      <RuangMeetingTabs jadwalRows={jadwalRows} riwayatRows={riwayatRows} />
    </AppShell>
  );
}
