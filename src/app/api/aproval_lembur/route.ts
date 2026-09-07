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

  const newMgrStatus = aksi === 'approve' ? 'APPROVED' : 'REJECTED';

  if (newMgrStatus === 'REJECTED' && catatan === '') {
    return NextResponse.json({ success: false, message: 'Alasan penolakan wajib diisi sebelum Reject.' }, { status: 400 });
  }

  const ownRows: any = await query(
    `SELECT 1
     FROM lembur l
     JOIN tim_saya ts ON ts.anggota_id = l.karyawan_id AND ts.manager_id = ?
     WHERE l.id = ?
     LIMIT 1`,
    [userId, id]
  );
  if (!ownRows || ownRows.length === 0) {
    return NextResponse.json({ success: false, message: 'Akses ditolak. Lembur ini bukan dari anggota tim Anda.' }, { status: 403 });
  }

  // Hanya boleh diproses kalau manager_status & status final masih PENDING —
  // supaya manager tidak bisa mengubah keputusan yang sudah final diproses HC.
  const result: any = await query(
    `UPDATE lembur
     SET manager_status = ?, manager_id = ?, manager_at = NOW(), manager_notes = ?
     WHERE id = ? AND manager_status = 'PENDING' AND status = 'PENDING'
     LIMIT 1`,
    [newMgrStatus, userId, catatan || null, id]
  );

  if (!result || result.affectedRows < 1) {
    return NextResponse.json(
      { success: false, message: 'Gagal update. Mungkin sudah diproses sebelumnya atau status sudah final.' },
      { status: 409 }
    );
  }

  return NextResponse.json({ success: true, message: `Berhasil: MANAGER ${newMgrStatus}.` });
}
