import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createDeveloperSsoToken } from '@/lib/sso';

// Per-user (tergantung cookie session), jangan di-cache — sama seperti sso-erp.
export const dynamic = 'force-dynamic';

/**
 * Dipanggil dari menu "Pengajuan Aplikasi" di bottom nav.
 * Mengantar user yang sudah login di Great ke portal pengajuan aplikasi Developer tanpa login ulang.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  const noStore = { headers: { 'Cache-Control': 'no-store' } };

  if (!session) {
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? request.nextUrl.host;
    const proto = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '');
    return NextResponse.redirect(`${proto}://${host}/`, noStore);
  }

  const token = await createDeveloperSsoToken(session);
  // Production: https://dev.ptslu.id. Lokal di-override lewat DEVELOPER_URL di .env.local.
  const developerUrl = (process.env.DEVELOPER_URL || 'https://dev.ptslu.id').replace(/\/+$/, '');

  // Tanpa ?next: Developer sendiri yang memilih halaman awal sesuai jabatan
  // (Admin ke dashboard, karyawan lain ke portal pengajuan).
  return NextResponse.redirect(`${developerUrl}/sso?token=${token}`, noStore);
}
