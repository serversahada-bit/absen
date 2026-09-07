import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { isManagerRole } from '@/lib/roles';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Sesi tidak valid, silakan login ulang.' }, { status: 401 });
  }

  const userId = session.user_id;

  const meRows: any = await query('SELECT peran, jabatan FROM karyawan WHERE id = ? LIMIT 1', [userId]);
  const me = meRows?.[0];
  if (!me || !isManagerRole(me.peran, me.jabatan)) {
    return NextResponse.json({ success: false, message: 'Akses ditolak. Halaman ini khusus Manager/SPV.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const id = Number(body.id) || 0;
  const aksi = body.aksi === 'approve' ? 'approve' : body.aksi === 'reject' ? 'reject' : null;
  const catatan = String(body.catatan || '').trim();

  if (id <= 0 || !aksi) {
    return NextResponse.json({ success: false, message: 'Data tidak valid.' }, { status: 400 });
  }

  const managerStatus = aksi === 'approve' ? 'Disetujui' : 'Ditolak';

  if (managerStatus === 'Ditolak' && catatan === '') {
    return NextResponse.json({ success: false, message: 'Alasan penolakan wajib diisi sebelum Reject.' }, { status: 400 });
  }

  const ownRows: any = await query(
    `SELECT 1
     FROM pengajuan_izin pi
     JOIN tim_saya ts ON ts.anggota_id = pi.karyawan_id AND ts.manager_id = ?
     WHERE pi.id = ?
     LIMIT 1`,
    [userId, id]
  );
  if (!ownRows || ownRows.length === 0) {
    return NextResponse.json({ success: false, message: 'Akses ditolak. Izin ini bukan dari anggota tim Anda.' }, { status: 403 });
  }

  await query(
    `UPDATE pengajuan_izin
     SET manager_status = ?, manager_note = ?, manager_id = ?, manager_at = NOW()
     WHERE id = ?
     LIMIT 1`,
    [managerStatus, catatan || null, userId, id]
  );

  return NextResponse.json({
    success: true,
    message: `Berhasil (Manager/SPV): ${managerStatus}. Selanjutnya diproses HC.`,
  });
}
