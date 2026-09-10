import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

const MAX_BYTES = 5 * 1024 * 1024;

const VALID_JENIS = ['Perjanjian', 'Sewa Menyewa', 'MoU', 'Lainnya'];

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesi tidak valid, silakan login ulang.' }, { status: 401 });
  }

  try {
    return await handleSubmit(request, session.user_id);
  } catch (error: any) {
    console.error('[Legalitas] Gagal memproses pengajuan:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan di server. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}

async function handleSubmit(request: Request, userId: number) {
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ success: false, error: 'Data form tidak valid.' }, { status: 400 });
  }

  let jenisDokumen = String(formData.get('jenis_dokumen') || '').trim();
  const keterangan = String(formData.get('keterangan') || '').trim();

  if (!VALID_JENIS.includes(jenisDokumen)) {
    return NextResponse.json({ success: false, error: 'Jenis dokumen tidak valid.' }, { status: 400 });
  }

  if (jenisDokumen === 'Lainnya') {
    const jenisLainnya = String(formData.get('jenis_dokumen_lainnya') || '').trim().slice(0, 50);
    if (!jenisLainnya) {
      return NextResponse.json({ success: false, error: 'Sebutkan jenis dokumen.' }, { status: 400 });
    }
    jenisDokumen = jenisLainnya;
  }

  const file = formData.get('file_pdf');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ success: false, error: 'File PDF wajib diupload.' }, { status: 400 });
  }
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ success: false, error: 'File harus berformat PDF.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ success: false, error: 'Ukuran file maksimal 5MB.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'legalitas');
  await fs.mkdir(uploadDir, { recursive: true });

  const rand = crypto.randomBytes(6).toString('hex');
  const filename = `legalitas_${userId}_${Date.now()}_${rand}.pdf`;
  await fs.writeFile(path.join(uploadDir, filename), buffer);

  await query(
    `INSERT INTO pengajuan_legalitas (karyawan_id, jenis_dokumen, keterangan, file_pdf, status, created_at)
     VALUES (?, ?, ?, ?, 'Pending', NOW())`,
    [userId, jenisDokumen, keterangan || null, filename]
  );

  return NextResponse.json({ success: true, message: 'Pengajuan legalitas berhasil dikirim.' });
}
