import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createSsoToken } from '@/lib/sso';

/**
 * Dipanggil saat user klik tombol "Masuk ke ERP" di dashboard.
 * Mengantar user yang sudah login di Great langsung masuk ke ERP tanpa login ulang.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const token = await createSsoToken(session);
  const erpUrl = process.env.ERP_URL || 'http://localhost:3001';

  return NextResponse.redirect(`${erpUrl}/sso?token=${token}`);
}
