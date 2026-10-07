import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { PERSISTENT_UPLOAD_DIR } from '@/lib/uploadDir';

// Sama dengan batas upload PDF peraturan di dashboard-hris.
const MAX_BYTES = 20 * 1024 * 1024;

const PDF_MAGIC = Buffer.from('%PDF-', 'ascii');

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesi tidak valid, silakan login ulang.' }, { status: 401 });
  }

  try {
    return await handleSubmit(request, session.user_id);
  } catch (error: any) {
    console.error('[Peraturan] Gagal memproses pengajuan dokumen:', error);
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

  const judul = String(formData.get('judul') || '').trim().slice(0, 255);
  const catatan = String(formData.get('catatan') || '').trim();

  if (!judul) {
    return NextResponse.json({ success: false, error: 'Judul dokumen wajib diisi.' }, { status: 400 });
  }

  const file = formData.get('file_pdf');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ success: false, error: 'File PDF wajib diupload.' }, { status: 400 });
  }
  if (path.extname(file.name || '').toLowerCase() !== '.pdf') {
    return NextResponse.json({ success: false, error: 'File harus berformat PDF.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ success: false, error: 'Ukuran file maksimal 20MB.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!buffer.subarray(0, 5).equals(PDF_MAGIC)) {
    return NextResponse.json({ success: false, error: 'File terdeteksi bukan PDF yang valid.' }, { status: 400 });
  }

  // Disimpan langsung di folder peraturan (yang juga dibaca dashboard-hris lewat
  // PERATURAN_UPLOAD_DIR), tapi baru tampil di daftar setelah HC approve karena
  // daftar hanya membaca tabel peraturan_perusahaan.
  const uploadDir = path.join(PERSISTENT_UPLOAD_DIR, 'peraturan');
  await fs.mkdir(uploadDir, { recursive: true });

  const rand = crypto.randomBytes(6).toString('hex');
  const filename = `pengajuan_${userId}_${Date.now()}_${rand}.pdf`;
  await fs.writeFile(path.join(uploadDir, filename), buffer);

  try {
    await query(
      `INSERT INTO pengajuan_peraturan (karyawan_id, judul, file, catatan, status, created_at)
       VALUES (?, ?, ?, ?, 'Pending', NOW())`,
      [userId, judul, filename, catatan || null]
    );
  } catch (error) {
    await fs.unlink(path.join(uploadDir, filename)).catch(() => {});
    throw error;
  }

  return NextResponse.json({ success: true, message: 'Pengajuan dokumen berhasil dikirim ke HC.' });
}
