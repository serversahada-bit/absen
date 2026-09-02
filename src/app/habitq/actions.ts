'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

function getTodayString() {
  const d = new Date();
  // Ensure we get the correct date in Asia/Jakarta timezone
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });
  return formatter.format(d); // YYYY-MM-DD
}

function getNowString() {
  const d = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'Asia/Jakarta', 
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  });
  
  // Format from Intl.DateTimeFormat is somewhat tricky, let's just parse the parts
  const parts = formatter.formatToParts(d);
  const partMap: Record<string, string> = {};
  parts.forEach(p => { partMap[p.type] = p.value; });
  
  // YYYY-MM-DD HH:mm:ss
  return `${partMap.year}-${partMap.month}-${partMap.day} ${partMap.hour}:${partMap.minute}:${partMap.second}`;
}

export async function submitMengajiAction(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { ok: false, title: 'Gagal', desc: 'Sesi Anda telah berakhir. Silakan login ulang.' };
  }

  const userId = session.user_id;
  const today = getTodayString();
  const now = getNowString();

  // Check if Izin today
  const izinRows = await query(
    "SELECT id FROM mengaji_izin WHERE karyawan_id = ? AND tanggal = ? LIMIT 1",
    [userId, today]
  );
  if (Array.isArray(izinRows) && izinRows.length > 0) {
    return { ok: false, title: 'Tidak bisa', desc: 'Hari ini status kamu IZIN. Batalkan izin jika ingin input mengaji.' };
  }

  // Parse Form
  const juz = parseInt(formData.get('juz') as string) || 1;
  const mulai = parseInt(formData.get('halaman_mulai') as string) || 1;
  const selesai = parseInt(formData.get('halaman_selesai') as string) || 1;
  const keterangan = (formData.get('keterangan') as string || '').substring(0, 255);

  if (selesai < mulai) {
    return { ok: false, title: 'Gagal', desc: 'Halaman selesai tidak boleh lebih kecil dari halaman mulai.' };
  }

  try {
    await query(
      "INSERT INTO mengaji_baca (karyawan_id, tanggal, juz, halaman_mulai, halaman_selesai, keterangan, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [userId, today, Math.min(Math.max(juz, 1), 30), Math.min(Math.max(mulai, 1), 604), Math.min(Math.max(selesai, 1), 604), keterangan, now]
    );

    revalidatePath('/habitq');
    return { ok: true, title: 'Berhasil', desc: 'Catatan mengaji tersimpan. Kamu masih bisa input lagi hari ini.' };
  } catch (err: any) {
    console.error('Error insert mengaji:', err);
    return { ok: false, title: 'Gagal', desc: 'Tabel belum ada atau error database.' };
  }
}

export async function submitIzinAction(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { ok: false, title: 'Gagal', desc: 'Sesi Anda telah berakhir. Silakan login ulang.' };
  }

  const userId = session.user_id;
  const today = getTodayString();
  const now = getNowString();

  // Check if already mengaji today
  const mengajiRows = await query(
    "SELECT id FROM mengaji_baca WHERE karyawan_id = ? AND tanggal = ? LIMIT 1",
    [userId, today]
  );
  if (Array.isArray(mengajiRows) && mengajiRows.length > 0) {
    return { ok: false, title: 'Tidak bisa', desc: 'Hari ini kamu sudah mulai mengaji, jadi tidak bisa mengajukan izin.' };
  }

  let jenis = (formData.get('jenis') as string || 'LAIN').toUpperCase();
  const allowed = ['HAID','SAKIT','DINAS','CUTI','LAIN'];
  if (!allowed.includes(jenis)) jenis = 'LAIN';

  const keterangan = (formData.get('keterangan') as string || '').substring(0, 255);

  try {
    await query(
      `INSERT INTO mengaji_izin (karyawan_id, tanggal, jenis, keterangan, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE jenis=VALUES(jenis), keterangan=VALUES(keterangan), created_at=VALUES(created_at)`,
      [userId, today, jenis, keterangan, now]
    );

    revalidatePath('/habitq');
    let label = 'Izin Lain';
    if (jenis === 'HAID') label = 'Haid';
    if (jenis === 'SAKIT') label = 'Sakit';
    if (jenis === 'DINAS') label = 'Dinas';
    if (jenis === 'CUTI') label = 'Cuti';
    return { ok: true, title: 'Izin Tersimpan', desc: `Hari ini ditandai izin: ${label}.` };
  } catch (err: any) {
    console.error('Error insert izin:', err);
    return { ok: false, title: 'Gagal', desc: 'Tabel belum ada atau error database.' };
  }
}

export async function clearIzinAction() {
  const session = await getSession();
  if (!session) {
    return { ok: false, title: 'Gagal', desc: 'Sesi Anda telah berakhir.' };
  }

  const userId = session.user_id;
  const today = getTodayString();

  try {
    await query(
      "DELETE FROM mengaji_izin WHERE karyawan_id = ? AND tanggal = ? LIMIT 1",
      [userId, today]
    );

    revalidatePath('/habitq');
    return { ok: true, title: 'Izin Dibatalkan', desc: 'Silakan input mengaji hari ini.' };
  } catch (err: any) {
    console.error('Error delete izin:', err);
    return { ok: false, title: 'Gagal', desc: 'Tabel belum ada atau error database.' };
  }
}
