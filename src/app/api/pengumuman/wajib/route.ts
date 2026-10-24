import { NextResponse } from 'next/server';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { getSession } from '@/lib/auth';
import { getPengumumanWajib, tandaiSudahBaca } from '@/lib/pengumumanWajib';

// Daftar pengumuman penting yang wajib dibaca user ini (popup di dashboard, satu per satu dari yang terlama).
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesi tidak valid.' }, { status: 401 });
  }

  try {
    const rows = await getPengumumanWajib(session.user_id);
    const items = rows.map((row) => ({
      id: row.id,
      judul: row.judul,
      isi: row.isi,
      versi: row.versi,
      // Lampiran ditulis dashboard-hris ke folder upload bersama (LEGACY_UPLOAD_DIR/pengumuman).
      lampiranUrl: row.lampiran ? `/api/uploads/pengumuman/${encodeURIComponent(row.lampiran)}` : null,
      lampiranIsImage: /\.(jpe?g|png|webp)$/i.test(String(row.lampiran || '')),
      tanggalLabel: row.tanggal ? format(new Date(`${row.tanggal}T00:00:00`), 'EEEE, dd MMMM yyyy', { locale: localeId }) : null,
    }));
    return NextResponse.json({ success: true, items });
  } catch (error) {
    // Tabel/kolom belum dibuat oleh dashboard-hris — tidak ada popup.
    console.error('[Pengumuman] Gagal memuat pengumuman wajib:', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: true, items: [] });
  }
}

// Tombol "Saya sudah membaca".
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesi tidak valid.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const pengumumanId = Number(body?.id);
  const versi = typeof body?.versi === 'string' ? body.versi : '';
  if (!pengumumanId || !versi) {
    return NextResponse.json({ success: false, error: 'Data tidak valid.' }, { status: 400 });
  }

  try {
    const ok = await tandaiSudahBaca(session.user_id, pengumumanId, versi);
    if (!ok) {
      return NextResponse.json({ success: false, stale: true, error: 'Pengumuman baru saja diperbarui HC. Silakan baca versi terbaru.' }, { status: 409 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Pengumuman] Gagal menyimpan status baca:', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: 'Gagal menyimpan. Coba lagi.' }, { status: 500 });
  }
}
