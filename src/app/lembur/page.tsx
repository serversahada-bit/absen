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
    `SELECT
       DATE_FORMAT(mulai_at, '%Y-%m-%dT%H:%i:%s+07:00') AS mulai_at,
       DATE_FORMAT(selesai_at, '%Y-%m-%dT%H:%i:%s+07:00') AS selesai_at,
       durasi_menit, status
     FROM lembur
     WHERE karyawan_id = ?
     ORDER BY id DESC
     LIMIT 5`,
    [userId]
  );

  const initialHistory: LemburHistoryItem[] = (historyRows || []).map((row: any) => ({
    mulaiAt: String(row.mulai_at),
    selesaiAt: String(row.selesai_at),
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
