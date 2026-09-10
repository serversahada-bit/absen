import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesi tidak valid, silakan login ulang.' }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ success: false, error: 'Data form tidak valid.' }, { status: 400 });
  }

  const penerimaId = parseInt(String(formData.get('penerima_id') || ''), 10);
  const tahun = parseInt(String(formData.get('tahun') || ''), 10);
  const komentar = String(formData.get('komentar') || '').trim().slice(0, 200);

  if (!penerimaId || !tahun) {
    return NextResponse.json({ success: false, error: 'Data ucapan tidak valid.' }, { status: 400 });
  }
  if (!komentar) {
    return NextResponse.json({ success: false, error: 'Ucapan tidak boleh kosong.' }, { status: 400 });
  }

  await query(
    `INSERT INTO ucapan_ultah (pengirim_id, penerima_id, tahun, komentar, created_at) VALUES (?, ?, ?, ?, NOW())`,
    [session.user_id, penerimaId, tahun, komentar]
  );

  const namaRows: any = await query('SELECT nama FROM karyawan WHERE id = ? LIMIT 1', [session.user_id]);
  const nama = namaRows?.[0]?.nama || '';

  return NextResponse.json({ success: true, comment: { name: nama, comment: komentar } });
}
