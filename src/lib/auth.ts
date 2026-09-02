import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'great-hrd-secret-key-nurul-app-2026-super-secure'
);

export interface UserSession {
  user_id: number;
  id_karyawan: string;
  nama: string;
  nama_user: string;
  role: string;
  perusahaan: string;
  foto: string;
  email: string;
}

/**
 * Validasi domain Gmail / Googlemail sesuai fungsi is_gmail() di index.php
 */
export function isGmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;

  const parts = email.split('@');
  if (parts.length !== 2) return false;

  const domain = parts[1].toLowerCase();
  return domain === 'gmail.com' || domain === 'googlemail.com';
}

/**
 * Verifikasi password modern (bcrypt $2y$, $2a$, argon2) atau fallback password lama (plain text)
 * Sesuai fungsi verify_password_migration() di index.php
 */
export async function verifyPasswordMigration(input: string, stored: string): Promise<boolean> {
  if (!stored) return false;

  // Hash modern (bcrypt/argon)
  if (stored.startsWith('$2y$') || stored.startsWith('$2a$') || stored.startsWith('$argon2')) {
    try {
      const normalizedHash = stored.replace(/^\$2y\$/, '$2a$');
      return await bcrypt.compare(input, normalizedHash);
    } catch {
      return false;
    }
  }

  // Fallback: password lama masih polos (hash_equals)
  return input === stored;
}

/**
 * Buat JWT Session Token
 */
export async function createSessionToken(user: UserSession, remember: boolean): Promise<string> {
  const expiration = remember ? '30d' : '1d';
  return await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(JWT_SECRET);
}

/**
 * Verifikasi JWT Session Token
 */
export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as UserSession;
  } catch {
    return null;
  }
}

/**
 * Ambil session user aktif dari Cookie HTTP
 */
export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}
