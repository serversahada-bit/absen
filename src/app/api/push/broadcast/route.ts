import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { isManagerRole } from '@/lib/roles';
import { sendPushBroadcast } from '@/lib/push';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesi tidak valid.' }, { status: 401 });
  }

  const meRows: any = await query('SELECT peran, jabatan FROM karyawan WHERE id = ? LIMIT 1', [session.user_id]);
  const me = meRows?.[0];
  if (!me || !isManagerRole(me.peran, me.jabatan)) {
    return NextResponse.json({ success: false, error: 'Anda tidak memiliki akses.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const title = String(body.title || '').trim();
  const messageBody = String(body.body || '').trim();
  const url = body.url ? String(body.url).trim() : undefined;

  if (!title || !messageBody) {
    return NextResponse.json({ success: false, error: 'Judul dan isi pesan wajib diisi.' }, { status: 400 });
  }

  const sent = await sendPushBroadcast({ title, body: messageBody, url });

  return NextResponse.json({ success: true, sent });
}
