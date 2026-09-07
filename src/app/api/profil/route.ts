import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getSession, createSessionToken, UserSession } from '@/lib/auth';
import { query } from '@/lib/db';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesi tidak valid, silakan login ulang.' }, { status: 401 });
  }

  const userId = session.user_id;
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ success: false, error: 'Data form tidak valid.' }, { status: 400 });
  }

  const email = String(formData.get('email') || '').trim();
  const noHp = String(formData.get('no_hp') || '').trim();
  const password = String(formData.get('password') || '').trim();

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ success: false, error: 'Format email tidak valid.' }, { status: 400 });
  }

  let fotoFilename: string | null = null;
  const fotoFile = formData.get('foto');

  if (fotoFile instanceof File && fotoFile.size > 0) {
    const ext = ALLOWED_TYPES[fotoFile.type];
    if (!ext) {
      return NextResponse.json({ success: false, error: 'Format foto harus JPG, PNG, atau WEBP.' }, { status: 400 });
    }
    if (fotoFile.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: 'Ukuran foto maksimal 2MB.' }, { status: 400 });
    }

    const buffer = Buffer.from(await fotoFile.arrayBuffer());
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const rand = crypto.randomBytes(6).toString('hex');
    fotoFilename = `profile_${userId}_${Date.now()}_${rand}.${ext}`;
    await fs.writeFile(path.join(uploadDir, fotoFilename), buffer);
  }

  const updates: string[] = ['email = ?', 'no_hp = ?'];
  const params: any[] = [email, noHp];

  if (fotoFilename) {
    updates.push('foto = ?');
    params.push(fotoFilename);
  }

  if (password) {
    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password baru minimal 6 karakter.' }, { status: 400 });
    }
    const hash = await bcrypt.hash(password, 10);
    updates.push('password = ?');
    params.push(hash);
  }

  params.push(userId);
  await query(`UPDATE karyawan SET ${updates.join(', ')} WHERE id = ?`, params);

  const updatedSession: UserSession = {
    ...session,
    email,
    foto: fotoFilename || session.foto,
  };
  const token = await createSessionToken(updatedSession);
  const cookieStore = await cookies();
  cookieStore.set('session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });

  return NextResponse.json({
    success: true,
    message: 'Profil berhasil diperbarui.',
    foto: fotoFilename ? `/uploads/${fotoFilename}` : undefined,
  });
}
