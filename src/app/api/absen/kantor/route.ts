import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { cariKantorTerdekat } from '@/lib/kantor';

// Pratinjau di layar absen: kantor terdekat & apakah lokasi GPS saat ini di luar radiusnya.
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesi tidak valid.' }, { status: 401 });
  }

  const lokasi = new URL(request.url).searchParams.get('lokasi') || '';
  return NextResponse.json({ success: true, kantor: await cariKantorTerdekat(lokasi) });
}
