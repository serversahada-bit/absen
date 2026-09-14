import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { PERSISTENT_UPLOAD_DIR } from '@/lib/uploadDir';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  if (!segments || segments.length === 0) {
    return new NextResponse(null, { status: 404 });
  }

  const relativePath = segments.join('/');
  if (relativePath.split('/').some((segment) => segment === '..')) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const buffer = await readFile(path.join(PERSISTENT_UPLOAD_DIR, relativePath));
    const ext = path.extname(relativePath).toLowerCase();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
