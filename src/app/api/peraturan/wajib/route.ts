import { NextResponse } from 'next/server';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { getSession } from '@/lib/auth';
import { getPeraturanWajib, tandaiPeraturanSudahBaca } from '@/lib/peraturanWajib';

// Daftar dokumen Peraturan Perusahaan baru yang wajib dibaca user ini (satu popup berisi semua dokumen).
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesi tidak valid.' }, { status: 401 });
  }

  try {
    const rows = await getPeraturanWajib(session.user_id);
    const items = rows.map((row) => ({
      id: row.id,
      judul: row.judul || row.file,
      // PDF ditulis ke folder upload bersama (LEGACY_UPLOAD_DIR/peraturan), sama seperti halaman Peraturan.
      url: `/api/uploads/peraturan/${encodeURIComponent(String(row.file).split('/').pop() as string)}`,
      terbitLabel: format(new Date(row.terbit_at.replace(' ', 'T')), 'EEEE, dd MMMM yyyy HH:mm', { locale: localeId }),
    }));
    return NextResponse.json({ success: true, items });
  } catch (error) {
    // Tabel/kolom belum dibuat oleh dashboard-hris — tidak ada popup.
    console.error('[Peraturan] Gagal memuat peraturan wajib baca:', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: true, items: [] });
  }
}

// Tombol "Saya sudah membaca" — berlaku untuk semua dokumen yang tampil di popup.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesi tidak valid.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const ids = Array.isArray(body?.ids)
    ? Array.from(new Set((body.ids as unknown[]).map(Number).filter((id) => Number.isInteger(id) && id > 0))).slice(0, 100)
    : [];
  if (ids.length === 0) {
    return NextResponse.json({ success: false, error: 'Data tidak valid.' }, { status: 400 });
  }

  try {
    await tandaiPeraturanSudahBaca(session.user_id, ids);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Peraturan] Gagal menyimpan status baca:', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: 'Gagal menyimpan. Coba lagi.' }, { status: 500 });
  }
}
