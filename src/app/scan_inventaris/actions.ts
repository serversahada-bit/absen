'use server';

import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export type AsetScanResult = {
  nama_aset: string;
  kode_aset: string | null;
  kategori: string;
  merk: string | null;
  deskripsi: string | null;
};

type LookupResult =
  | { ok: true; aset: AsetScanResult }
  | { ok: false; title: string; desc: string };

// aset_kantor lives in the database dashboard-hris also connects to, so this
// reads it directly instead of calling out to that app over HTTP.
export async function lookupAsetByKode(kodeSistem: string): Promise<LookupResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, title: 'Gagal', desc: 'Sesi Anda telah berakhir. Silakan login ulang.' };
  }

  const kode = (kodeSistem || '').trim();
  if (!kode) {
    return { ok: false, title: 'Gagal', desc: 'Kode QR tidak valid.' };
  }

  try {
    const rows: any = await query(
      'SELECT nama_aset, kode_aset, kategori, merk, deskripsi FROM aset_kantor WHERE kode_sistem = ? LIMIT 1',
      [kode]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return { ok: false, title: 'Tidak ditemukan', desc: 'Aset tidak ditemukan untuk QR Code ini.' };
    }

    const row = rows[0];
    return {
      ok: true,
      aset: {
        nama_aset: row.nama_aset,
        kode_aset: row.kode_aset,
        kategori: row.kategori,
        merk: row.merk,
        deskripsi: row.deskripsi,
      },
    };
  } catch (err) {
    console.error('Gagal mencari aset dari kode_sistem:', err);
    return { ok: false, title: 'Gagal', desc: 'Terjadi kesalahan saat mengambil data aset.' };
  }
}
