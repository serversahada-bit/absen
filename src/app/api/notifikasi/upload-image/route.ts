import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { isManagerRole } from '@/lib/roles';

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesi tidak valid.' }, { status: 401 });
  }

  const meRows: any = await query('SELECT peran, jabatan FROM karyawan WHERE id = ? LIMIT 1', [session.user_id]);
  const me = meRows?.[0];
  if (!me || !isManagerRole(me.peran, me.jabatan)) {
    return NextResponse.json({ success: false, error: 'Anda tidak memiliki akses.' }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('file');

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ success: false, error: 'File tidak ditemukan.' }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ success: false, error: 'Format gambar harus JPG, PNG, atau WEBP.' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ success: false, error: 'Ukuran gambar maksimal 3MB.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'notifikasi');
  await fs.mkdir(uploadDir, { recursive: true });

  const rand = crypto.randomBytes(6).toString('hex');
  const filename = `notif_${Date.now()}_${rand}.${ext}`;
  await fs.writeFile(path.join(uploadDir, filename), buffer);

  return NextResponse.json({ success: true, url: `/uploads/notifikasi/${filename}` });
}
