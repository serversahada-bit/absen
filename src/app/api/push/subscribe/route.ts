import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesi tidak valid.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const sub = body?.subscription;

  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ success: false, error: 'Data subscription tidak valid.' }, { status: 400 });
  }

  await query(
    `INSERT INTO push_subscriptions (karyawan_id, endpoint, p256dh, auth)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE karyawan_id = VALUES(karyawan_id), p256dh = VALUES(p256dh), auth = VALUES(auth)`,
    [session.user_id, sub.endpoint, sub.keys.p256dh, sub.keys.auth]
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesi tidak valid.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const endpoint = body?.endpoint;
  if (!endpoint) {
    return NextResponse.json({ success: false, error: 'Endpoint wajib diisi.' }, { status: 400 });
  }

  await query('DELETE FROM push_subscriptions WHERE karyawan_id = ? AND endpoint = ?', [session.user_id, endpoint]);

  return NextResponse.json({ success: true });
}
