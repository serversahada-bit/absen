import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { isItCoordinatorRole } from '@/lib/roles';

const SETTING_KEY = 'push_notif_required';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesi tidak valid.' }, { status: 401 });
  }

  try {
    const rows: any = await query('SELECT setting_value FROM hc_settings WHERE setting_key = ? LIMIT 1', [SETTING_KEY]);
    const required = rows.length === 0 || rows[0].setting_value === '1';
    return NextResponse.json({ success: true, required });
  } catch (error: any) {
    console.error('[Settings] Gagal ambil push_notif_required:', error.message || error);
    return NextResponse.json({ success: true, required: true });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesi tidak valid.' }, { status: 401 });
  }

  if (!isItCoordinatorRole(null, session.role)) {
    return NextResponse.json({ success: false, error: 'Tidak punya akses.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.required !== 'boolean') {
    return NextResponse.json({ success: false, error: 'Data tidak valid.' }, { status: 400 });
  }

  try {
    await query(
      `INSERT INTO hc_settings (setting_key, setting_value) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [SETTING_KEY, body.required ? '1' : '0']
    );
    return NextResponse.json({ success: true, required: body.required });
  } catch (error: any) {
    console.error('[Settings] Gagal ubah push_notif_required:', error.message || error);
    return NextResponse.json({ success: false, error: 'Gagal menyimpan setting.' }, { status: 500 });
  }
}
