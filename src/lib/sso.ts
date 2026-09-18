import { SignJWT } from 'jose';
import { UserSession } from './auth';

// Secret ini HARUS sama persis dengan SSO_SECRET di aplikasi ERP.
const SSO_SECRET = new TextEncoder().encode(
  process.env.SSO_SECRET || 'great-erp-sso-shared-secret-2026'
);

/**
 * Buat token SSO berumur pendek untuk mengantar user ke aplikasi ERP
 * tanpa perlu login ulang, memakai identitas (Nama + NIP) dari sesi Great.
 */
export async function createSsoToken(user: UserSession): Promise<string> {
  return await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('60s')
    .sign(SSO_SECRET);
}
