import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesi tidak valid, silakan login ulang.' }, { status: 401 });
  }

  try {
    return await handleSubmit(request, session.user_id);
  } catch (error: any) {
    console.error('[RuangMeeting] Gagal memproses pengajuan:', error);
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

  const tanggal = String(formData.get('tanggal') || '').trim();
  const kegiatan = String(formData.get('kegiatan') || '').trim();
  const jenisAktifitas = String(formData.get('jenis_aktifitas') || '').trim();
  const jamMulai = String(formData.get('jam_mulai') || '').trim();
  const jamSelesai = String(formData.get('jam_selesai') || '').trim();
  const catatan = String(formData.get('catatan') || '').trim();

  if (!tanggal || !kegiatan || !jenisAktifitas || !jamMulai || !jamSelesai) {
    return NextResponse.json({ success: false, error: 'Semua field wajib diisi kecuali catatan.' }, { status: 400 });
  }

  if (jamSelesai <= jamMulai) {
    return NextResponse.json({ success: false, error: 'Waktu selesai harus setelah waktu mulai.' }, { status: 400 });
  }

  const bentrokRows: any = await query(
    `SELECT id FROM pengajuan_ruang_meeting
     WHERE tanggal = ? AND status = 'Disetujui' AND jam_mulai < ? AND jam_selesai > ?
     LIMIT 1`,
    [tanggal, jamSelesai, jamMulai]
  );

  if (bentrokRows && bentrokRows.length > 0) {
    return NextResponse.json(
      { success: false, error: 'Ruang meeting sudah dibooking pada jam tersebut. Silakan pilih waktu lain.' },
      { status: 409 }
    );
  }

  await query(
    `INSERT INTO pengajuan_ruang_meeting (karyawan_id, tanggal, kegiatan, jenis_aktifitas, jam_mulai, jam_selesai, catatan, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', NOW())`,
    [userId, tanggal, kegiatan, jenisAktifitas, jamMulai, jamSelesai, catatan || null]
  );

  return NextResponse.json({ success: true, message: 'Pengajuan ruang meeting berhasil dikirim ke HC.' });
}
