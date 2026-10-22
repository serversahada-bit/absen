import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { PERSISTENT_UPLOAD_DIR } from '@/lib/uploadDir';

const MAX_BYTES = 5 * 1024 * 1024;

// Karyawan mengunggah ulang PDF untuk pengajuan yang diminta revisi oleh HC
// (status 'Revisi'). File lama diganti, pengajuan kembali ke 'Pending'.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesi tidak valid, silakan login ulang.' }, { status: 401 });
  }

  try {
    return await handleRevisi(request, session.user_id);
  } catch (error: any) {
    console.error('[Legalitas] Gagal memproses revisi:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan di server. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}

async function handleRevisi(request: Request, userId: number) {
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ success: false, error: 'Data form tidak valid.' }, { status: 400 });
  }

  const id = Number(formData.get('legalitas_id'));
  if (!id) {
    return NextResponse.json({ success: false, error: 'ID pengajuan tidak valid.' }, { status: 400 });
  }

  const rows = (await query(
    'SELECT status FROM pengajuan_legalitas WHERE id = ? AND karyawan_id = ? LIMIT 1',
    [id, userId]
  )) as Array<{ status: string }>;
  if (rows.length === 0) {
    return NextResponse.json({ success: false, error: 'Pengajuan tidak ditemukan.' }, { status: 404 });
  }
  if (rows[0].status !== 'Revisi') {
    return NextResponse.json({ success: false, error: 'Pengajuan ini tidak sedang diminta revisi.' }, { status: 400 });
  }

  const file = formData.get('file_pdf');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ success: false, error: 'File PDF hasil revisi wajib diupload.' }, { status: 400 });
  }
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ success: false, error: 'File harus berformat PDF.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ success: false, error: 'Ukuran file maksimal 5MB.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(PERSISTENT_UPLOAD_DIR, 'legalitas');
  await fs.mkdir(uploadDir, { recursive: true });

  const rand = crypto.randomBytes(6).toString('hex');
  const filename = `legalitas_${userId}_${Date.now()}_${rand}.pdf`;
  await fs.writeFile(path.join(uploadDir, filename), buffer);

  // Kondisi status di WHERE mencegah dobel submit menimpa pengajuan yang sudah kembali ke Pending.
  await query(
    `UPDATE pengajuan_legalitas
     SET file_pdf = ?, status = 'Pending', revisi_dikirim_at = NOW()
     WHERE id = ? AND karyawan_id = ? AND status = 'Revisi' LIMIT 1`,
    [filename, id, userId]
  );

  return NextResponse.json({ success: true, message: 'Revisi berhasil dikirim. Pengajuan akan dicek ulang oleh HRD.' });
}
