import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import AppShell from '@/components/AppShell';
import LemburClient, { LemburHistoryItem } from './LemburClient';

export const dynamic = 'force-dynamic';

export default async function LemburPage() {
  const session = await getSession();
  if (!session) {
    redirect('/');
  }

  const userId = session.user_id;

  const userRows: any = await query('SELECT nama, jabatan FROM karyawan WHERE id = ? LIMIT 1', [userId]);
  const userData = userRows?.[0] || {};

  const historyRows: any = await query(
    `SELECT mulai_at, selesai_at, durasi_menit, status
     FROM lembur
     WHERE karyawan_id = ?
     ORDER BY id DESC
     LIMIT 5`,
    [userId]
  );

  const initialHistory: LemburHistoryItem[] = (historyRows || []).map((row: any) => ({
    mulaiAt: new Date(row.mulai_at).toISOString(),
    selesaiAt: new Date(row.selesai_at).toISOString(),
    durasiMenit: Number(row.durasi_menit) || 0,
    status: row.status || 'PENDING',
  }));

  return (
    <AppShell maxWidth="lg:max-w-2xl">
      <LemburClient
        userName={userData.nama || 'Karyawan'}
        userRole={userData.jabatan || '-'}
        initialHistory={initialHistory}
      />
    </AppShell>
  );
}
