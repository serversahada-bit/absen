import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import HabitQClient from './HabitQClient';

function getTodayString() {
  const d = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });
  return formatter.format(d);
}

export const dynamic = 'force-dynamic';

export default async function HabitQPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/request_login');
  }

  const userId = session.user_id;
  const today = getTodayString();

  // 1. Get User Profile
  const userRows = await query(
    "SELECT nama, jabatan, organisasi, foto FROM karyawan WHERE id = ? LIMIT 1",
    [userId]
  ) as any[];
  
  let user = {
    nama: session.nama,
    jabatan: session.role,
    perusahaan: session.perusahaan,
    foto: session.foto
  };
  
  if (userRows && userRows.length > 0) {
    user = {
      nama: userRows[0].nama || 'Karyawan',
      jabatan: userRows[0].jabatan || '-',
      perusahaan: userRows[0].organisasi || 'PT. Great HRD',
      foto: userRows[0].foto ? `/uploads/profile/${userRows[0].foto}` : ''
    };
  }

  // 2. Cek Izin Hari Ini
  const izinRows = await query(
    "SELECT id, jenis, keterangan, created_at FROM mengaji_izin WHERE karyawan_id = ? AND tanggal = ? LIMIT 1",
    [userId, today]
  ) as any[];
  const isIzinToday = izinRows && izinRows.length > 0;
  const izinRow = isIzinToday ? izinRows[0] : null;

  // 3. Cek Mengaji Hari Ini
  const todaySessions = await query(
    `SELECT id, juz, halaman_mulai, halaman_selesai, keterangan, created_at
     FROM mengaji_baca
     WHERE karyawan_id = ? AND tanggal = ?
     ORDER BY created_at DESC, id DESC`,
    [userId, today]
  ) as any[];
  const todayCount = todaySessions?.length || 0;

  // 4. Riwayat Terakhir (30 data)
  const riwayat = await query(
    `(SELECT tanggal, created_at, 'MENGAJI' AS tipe, juz, halaman_mulai, halaman_selesai, keterangan, NULL AS izin_jenis
      FROM mengaji_baca
      WHERE karyawan_id = ?
     )
     UNION ALL
     (SELECT tanggal, created_at, 'IZIN' AS tipe, NULL AS juz, NULL AS halaman_mulai, NULL AS halaman_selesai, keterangan, jenis AS izin_jenis
      FROM mengaji_izin
      WHERE karyawan_id = ?
     )
     ORDER BY tanggal DESC, created_at DESC
     LIMIT 30`,
    [userId, userId]
  ) as any[];

  return (
    <HabitQClient 
      user={user}
      todayCount={todayCount}
      todaySessions={todaySessions || []}
      isIzinToday={isIzinToday}
      izinRow={izinRow}
      riwayat={riwayat || []}
    />
  );
}
