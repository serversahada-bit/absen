import { query } from '@/lib/db';
import { formatInstantJakartaDb } from '@/lib/time';

/**
 * Dokumen Peraturan Perusahaan dari dashboard-hris (tabel peraturan_perusahaan + peraturan_perusahaan_baca)
 * terbit bersamaan di batch jam 15:00 WIB (kolom terbit_at). Sejak terbit, karyawan wajib membacanya
 * sebelum bisa absen, kecuali karyawan yang baru bergabung setelah tanggal terbit. terbit_at NULL =
 * dokumen lama sebelum fitur ini, tidak wajib dibaca. Kondisi ini sama dengan
 * KARYAWAN_WAJIB_BACA_PERATURAN_SQL di dashboard-hris (src/lib/peraturanDb.ts) — ubah keduanya bersamaan.
 */
const WAJIB_BACA_SQL = `
  FROM peraturan_perusahaan p
  JOIN karyawan k ON k.id = ?
  LEFT JOIN peraturan_perusahaan_baca b ON b.peraturan_id = p.id AND b.karyawan_id = k.id
  WHERE p.terbit_at IS NOT NULL
    AND p.terbit_at <= ?
    AND p.file <> ''
    AND b.id IS NULL
    AND (k.status_karyawan IS NULL OR k.status_karyawan <> 'Non-Aktif')
    AND (
      k.tanggal_bergabung IS NULL
      OR k.tanggal_bergabung NOT REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      OR k.tanggal_bergabung <= DATE_FORMAT(p.terbit_at, '%Y-%m-%d')
    )
`;

export interface PeraturanWajibRow {
  id: number;
  judul: string;
  file: string;
  terbit_at: string;
}

export async function getPeraturanWajib(karyawanId: number): Promise<PeraturanWajibRow[]> {
  const rows = (await query(
    `SELECT p.id, p.judul, p.file, DATE_FORMAT(p.terbit_at, '%Y-%m-%d %H:%i:%s') AS terbit_at
     ${WAJIB_BACA_SQL}
     ORDER BY p.terbit_at ASC, p.id ASC`,
    [karyawanId, formatInstantJakartaDb()]
  )) as PeraturanWajibRow[] | undefined;
  return rows || [];
}

/**
 * Dipakai API absen untuk menolak absen selama masih ada dokumen peraturan baru yang belum dibaca.
 * Kalau tabel/kolom belum dibuat dashboard-hris (atau query gagal), absen tetap diizinkan.
 */
export async function adaPeraturanWajib(karyawanId: number): Promise<boolean> {
  try {
    const rows = (await query(`SELECT 1 AS ada ${WAJIB_BACA_SQL} LIMIT 1`, [karyawanId, formatInstantJakartaDb()])) as unknown[] | undefined;
    return Boolean(rows?.length);
  } catch (error) {
    console.error('[Peraturan] Gagal cek peraturan wajib baca, absen tetap diizinkan:', error instanceof Error ? error.message : error);
    return false;
  }
}

/** Catat "sudah membaca" untuk semua dokumen yang tampil di popup. Dokumen yang sudah dihapus HC dilewati. */
export async function tandaiPeraturanSudahBaca(karyawanId: number, peraturanIds: number[]): Promise<void> {
  if (peraturanIds.length === 0) return;
  const now = formatInstantJakartaDb();
  await query(
    `INSERT IGNORE INTO peraturan_perusahaan_baca (peraturan_id, karyawan_id, dibaca_at)
     SELECT p.id, ?, ? FROM peraturan_perusahaan p
     WHERE p.id IN (${peraturanIds.map(() => '?').join(', ')}) AND p.terbit_at IS NOT NULL AND p.terbit_at <= ?`,
    [karyawanId, now, ...peraturanIds, now]
  );
}
