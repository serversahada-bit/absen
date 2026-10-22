import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { getSession } from '@/lib/auth';
import { ASET_UPLOAD_DIR } from '@/lib/asetUploadDir';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

// Menyajikan foto aset untuk hasil Scan Inventaris (hanya untuk karyawan yang login).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  const session = await getSession();
  if (!session) {
    return new NextResponse(null, { status: 401 });
  }

  const { file } = await params;
  const filename = path.basename(file || '');
  const contentType = MIME_TYPES[path.extname(filename).toLowerCase()];
  if (!filename || !contentType) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const buffer = await readFile(path.join(ASET_UPLOAD_DIR, filename));
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
