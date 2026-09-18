import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createSsoToken } from '@/lib/sso';

// Route ini WAJIB dinamis (per-user, tergantung cookie session) dan tidak boleh di-cache
// oleh proxy/CDN di depan Coolify — kalau ke-cache, semua orang akan dapat redirect
// hasil request pertama yang pernah masuk (bisa jadi dari user yang belum login).
export const dynamic = 'force-dynamic';

/**
 * Dipanggil saat user klik tombol "Masuk ke ERP" di dashboard.
 * Mengantar user yang sudah login di Great langsung masuk ke ERP tanpa login ulang.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  const noStore = { headers: { 'Cache-Control': 'no-store' } };

  if (!session) {
    const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? request.nextUrl.host;
    const proto = request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '');
    return NextResponse.redirect(`${proto}://${host}/`, noStore);
  }

  const token = await createSsoToken(session);
  const erpUrl = process.env.ERP_URL || 'http://localhost:3001';

  return NextResponse.redirect(`${erpUrl}/sso?token=${token}`, noStore);
}
