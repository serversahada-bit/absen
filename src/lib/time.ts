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
