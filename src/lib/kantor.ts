import { query } from '@/lib/db';

/**
 * Lokasi kantor dikelola dari dashboard-hris (menu Lokasi Kantor, tabel `kantor` + kolom jarak di `presensi`,
 * dibuat oleh src/lib/kantorDb.ts di sana). Acuan absen = kantor aktif terdekat dari GPS karyawan.
 * Di luar radius hanya peringatan — absen tetap diterima.
 */
export interface KantorTerdekat {
  nama: string;
  jarak: number; // meter, dibulatkan
  radius: number;
  diLuar: boolean;
}

/** Lokasi absen disimpan sebagai "lat,lon" (lihat src/app/absen/page.tsx). */
function parseLokasi(lokasi: string) {
  const match = lokasi.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lon = Number(match[2]);
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}

// Haversine, dalam meter.
function jarakMeter(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const h =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

/** null = lokasi tidak valid, belum ada kantor aktif, atau tabel belum dibuat dashboard-hris (cek jarak dilewati). */
export async function cariKantorTerdekat(lokasi: string): Promise<KantorTerdekat | null> {
  const titik = parseLokasi(lokasi);
  if (!titik) return null;

  let rows: { nama: string; latitude: string; longitude: string; radius_meter: number }[];
  try {
    rows = (await query('SELECT nama, latitude, longitude, radius_meter FROM kantor WHERE is_aktif = 1')) || [];
  } catch {
    return null;
  }

  let terdekat: KantorTerdekat | null = null;
  for (const row of rows) {
    const jarak = jarakMeter(titik.lat, titik.lon, Number(row.latitude), Number(row.longitude));
    if (!terdekat || jarak < terdekat.jarak) {
      terdekat = { nama: row.nama, jarak, radius: Number(row.radius_meter), diLuar: jarak > Number(row.radius_meter) };
    }
  }
  return terdekat && { ...terdekat, jarak: Math.round(terdekat.jarak) };
}

/** Dipanggil setelah presensi tersimpan; gagal di sini tidak membatalkan absen. */
export async function simpanJarakAbsen(userId: number, tanggal: string, tipe: 'masuk' | 'pulang', kantor: KantorTerdekat | null) {
  if (!kantor) return;
  try {
    await query(
      `UPDATE presensi SET kantor_${tipe} = ?, jarak_${tipe} = ?, luar_kantor_${tipe} = ? WHERE karyawan_id = ? AND tanggal = ?`,
      [kantor.nama, kantor.jarak, kantor.diLuar ? 1 : 0, userId, tanggal]
    );
  } catch (error) {
    console.error('[Absen] Gagal simpan jarak kantor:', error instanceof Error ? error.message : error);
  }
}
