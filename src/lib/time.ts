/**
 * Server "now" dipaksa ke WIB (Asia/Jakarta, UTC+7, tanpa DST) supaya konsisten
 * di mana pun app di-deploy, tidak bergantung timezone OS/container (yang di
 * Coolify defaultnya UTC, beda dari asumsi lama PHP `date_default_timezone_set`).
 * Getter di bawah pakai method UTC supaya tidak ikut ke-geser lagi oleh
 * timezone lokal proses saat diformat.
 */
export function nowJakarta(): Date {
  return new Date(Date.now() + 7 * 60 * 60 * 1000);
}

export function formatJakartaDate(d: Date = nowJakarta()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatJakartaTime(d: Date = nowJakarta()): string {
  const h = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  const s = String(d.getUTCSeconds()).padStart(2, '0');
  return `${h}:${mi}:${s}`;
}

export function formatJakartaCompact(d: Date = nowJakarta()): string {
  return `${formatJakartaDate(d).replace(/-/g, '')}_${formatJakartaTime(d).replace(/:/g, '')}`;
}

/** 0 = Minggu, 1 = Senin, ... 6 = Sabtu — dihitung dari waktu WIB, bukan timezone lokal proses. */
export function jakartaDayOfWeek(d: Date = nowJakarta()): number {
  return d.getUTCDay();
}

/** Tanggal WIB mundur `days` hari dari `d`, dalam format yyyy-MM-dd. */
export function jakartaSubDaysString(days: number, d: Date = nowJakarta()): string {
  const shifted = new Date(d.getTime());
  shifted.setUTCDate(shifted.getUTCDate() - days);
  return formatJakartaDate(shifted);
}

/** Bulan (1-12) & tanggal WIB mundur `days` hari dari `d` — dipakai untuk cek ulang tahun. */
export function jakartaMonthDaySubDays(days: number, d: Date = nowJakarta()): { month: number; day: number } {
  const shifted = new Date(d.getTime());
  shifted.setUTCDate(shifted.getUTCDate() - days);
  return { month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
}

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;
const BULAN_SINGKAT_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/**
 * Helper di bawah menerima Date sebagai instant asli, lalu menampilkannya sebagai WIB.
 * Ini berbeda dari helper lama di atas yang memakai Date yang sudah digeser oleh
 * `nowJakarta()` dan sengaja dipertahankan agar alur absensi lama tidak berubah.
 */
function instantJakartaParts(d: Date) {
  const wib = new Date(d.getTime() + JAKARTA_OFFSET_MS);
  return {
    year: wib.getUTCFullYear(),
    month: wib.getUTCMonth() + 1,
    day: wib.getUTCDate(),
    hour: wib.getUTCHours(),
    minute: wib.getUTCMinutes(),
    second: wib.getUTCSeconds(),
  };
}

export function formatInstantJakartaDate(d: Date = new Date()): string {
  const p = instantJakartaParts(d);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

export function formatInstantJakartaTime(d: Date = new Date()): string {
  const p = instantJakartaParts(d);
  return `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}:${String(p.second).padStart(2, '0')}`;
}

export function formatInstantJakartaDb(d: Date = new Date()): string {
  return `${formatInstantJakartaDate(d)} ${formatInstantJakartaTime(d)}`;
}

export function formatInstantJakartaDisplay(d: Date): string {
  const p = instantJakartaParts(d);
  return `${String(p.day).padStart(2, '0')} ${BULAN_SINGKAT_ID[p.month - 1]} ${p.year} ${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;
}

/** Mengubah tanggal dan jam dinding WIB menjadi instant yang tidak ambigu. */
export function parseJakartaDateTime(tanggal: string, jam: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || !/^\d{2}:\d{2}$/.test(jam)) {
    return null;
  }

  const parsed = new Date(`${tanggal}T${jam}:00+07:00`);
  if (Number.isNaN(parsed.getTime())) return null;

  // Date akan menormalisasi nilai seperti 31 Februari; tolak nilai semacam itu.
  if (formatInstantJakartaDate(parsed) !== tanggal || formatInstantJakartaTime(parsed).slice(0, 5) !== jam) {
    return null;
  }

  return parsed;
}
