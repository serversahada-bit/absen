import { query } from '@/lib/db';
import { nowJakarta, formatJakartaDate, formatInstantJakartaDb } from '@/lib/time';

/**
 * Pengumuman Penting dibuat dari dashboard-hris (tabel pengumuman_hc + pengumuman_hc_baca).
 * Karyawan wajib membaca pengumuman penting yang tgl_notifikasi-nya (WIB) sudah tiba, kecuali
 * karyawan yang baru bergabung setelah tanggal itu. tanggal_bergabung berupa VARCHAR yyyy-mm-dd;
 * kosong/format lain = tetap wajib baca. Kondisi ini sama dengan KARYAWAN_WAJIB_BACA_SQL di
 * dashboard-hris (src/lib/pengumumanDb.ts) — ubah keduanya bersamaan.
 */
const WAJIB_BACA_SQL = `
  FROM pengumuman_hc p
  JOIN karyawan k ON k.id = ?
  LEFT JOIN pengumuman_hc_baca b ON b.pengumuman_id = p.id AND b.karyawan_id = k.id
  WHERE p.is_penting = 1
    AND p.tgl_notifikasi <= ?
    AND b.id IS NULL
    AND (k.status_karyawan IS NULL OR k.status_karyawan <> 'Non-Aktif')
    AND (
      k.tanggal_bergabung IS NULL
      OR k.tanggal_bergabung NOT REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      OR k.tanggal_bergabung <= DATE_FORMAT(p.tgl_notifikasi, '%Y-%m-%d')
    )
`;

// Versi isi pengumuman: berubah setiap HC mengedit, supaya klik "sudah membaca" untuk isi lama tidak tercatat.
const VERSI_SQL = `DATE_FORMAT(COALESCE(p.updated_at, p.created_at), '%Y-%m-%d %H:%i:%s')`;

export interface PengumumanWajibRow {
  id: number;
  judul: string;
  isi: string;
  lampiran: string | null;
  tanggal: string | null;
  versi: string;
}

export async function getPengumumanWajib(karyawanId: number): Promise<PengumumanWajibRow[]> {
  const rows = (await query(
    `SELECT p.id, p.judul, p.isi, p.lampiran, DATE_FORMAT(p.tanggal_pelaksanaan, '%Y-%m-%d') AS tanggal, ${VERSI_SQL} AS versi
     ${WAJIB_BACA_SQL}
     ORDER BY p.tgl_notifikasi ASC, p.id ASC`,
    [karyawanId, formatJakartaDate(nowJakarta())]
  )) as PengumumanWajibRow[] | undefined;
  return rows || [];
}

/**
 * Dipakai API absen untuk menolak absen selama masih ada pengumuman wajib yang belum dibaca.
 * Kalau tabel/kolom belum dibuat dashboard-hris (atau query gagal), absen tetap diizinkan.
 */
export async function adaPengumumanWajib(karyawanId: number): Promise<boolean> {
  try {
    const rows = (await query(`SELECT 1 AS ada ${WAJIB_BACA_SQL} LIMIT 1`, [karyawanId, formatJakartaDate(nowJakarta())])) as unknown[] | undefined;
    return Boolean(rows?.length);
  } catch (error) {
    console.error('[Pengumuman] Gagal cek pengumuman wajib, absen tetap diizinkan:', error instanceof Error ? error.message : error);
    return false;
  }
}

/** Catat "sudah membaca". Mengembalikan false kalau pengumuman sudah diedit HC (versi beda) atau tidak berlaku. */
export async function tandaiSudahBaca(karyawanId: number, pengumumanId: number, versi: string): Promise<boolean> {
  const result = (await query(
    `INSERT IGNORE INTO pengumuman_hc_baca (pengumuman_id, karyawan_id, dibaca_at)
     SELECT p.id, ?, ? FROM pengumuman_hc p
     WHERE p.id = ? AND p.is_penting = 1 AND p.tgl_notifikasi <= ? AND ${VERSI_SQL} = ?`,
    [karyawanId, formatInstantJakartaDb(), pengumumanId, formatJakartaDate(nowJakarta()), versi]
  )) as { affectedRows?: number } | undefined;
  if ((result?.affectedRows ?? 0) > 0) return true;

  // Klik ganda / tab lain: sudah tercatat sebelumnya juga dianggap berhasil.
  const existing = (await query(
    `SELECT 1 FROM pengumuman_hc_baca b JOIN pengumuman_hc p ON p.id = b.pengumuman_id
     WHERE b.pengumuman_id = ? AND b.karyawan_id = ? AND ${VERSI_SQL} = ? LIMIT 1`,
    [pengumumanId, karyawanId, versi]
  )) as unknown[] | undefined;
  return Boolean(existing?.length);
}
