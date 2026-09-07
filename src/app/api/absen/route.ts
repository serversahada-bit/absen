import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { format } from 'date-fns';

const MAX_BYTES = 2 * 1024 * 1024;

function decodeDataUrl(dataUrl: string): { buffer: Buffer; ext: string } | null {
  const match = dataUrl.match(/^data:image\/(webp|jpeg|jpg|png);base64,/i);
  if (!match) return null;

  let type = match[1].toLowerCase();
  if (type === 'jpg') type = 'jpeg';
  const ext = type === 'jpeg' ? 'jpg' : type;

  const base64Data = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const buffer = Buffer.from(base64Data, 'base64');
  return { buffer, ext };
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesi tidak valid, silakan login ulang.' }, { status: 401 });
  }

  const userId = session.user_id;
  const body = await request.json().catch(() => ({}));

  const tipe: 'masuk' | 'pulang' = body.tipe === 'pulang' ? 'pulang' : 'masuk';
  const fotoDataUrl = String(body.foto || '');
  const lokasi = String(body.lokasi || '').trim();

  if (!fotoDataUrl || fotoDataUrl.length < 50) {
    return NextResponse.json({ success: false, error: 'Foto kosong / tidak terkirim.' }, { status: 400 });
  }

  const decoded = decodeDataUrl(fotoDataUrl);
  if (!decoded) {
    return NextResponse.json({ success: false, error: 'Format foto tidak valid.' }, { status: 400 });
  }
  if (decoded.buffer.length > MAX_BYTES) {
    return NextResponse.json(
      { success: false, error: 'Ukuran foto terlalu besar. Coba ulang (izin kamera/lokasi) atau buka lewat Safari/Chrome.' },
      { status: 400 }
    );
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'presensi');
  await fs.mkdir(uploadDir, { recursive: true });

  const rand = crypto.randomBytes(4).toString('hex');
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
  const filename = `absen_${userId}_${timestamp}_${rand}.${decoded.ext}`;
  const fileAbs = path.join(uploadDir, filename);
  const fileRel = `uploads/presensi/${filename}`;

  await fs.writeFile(fileAbs, decoded.buffer);
  const cleanupFile = () => fs.unlink(fileAbs).catch(() => {});

  const kRows: any = await query('SELECT jam_jadwal_masuk FROM karyawan WHERE id = ? LIMIT 1', [userId]);
  const jamJadwalMasuk = kRows?.[0]?.jam_jadwal_masuk || '08:00:00';

  const tanggal = format(new Date(), 'yyyy-MM-dd');
  const jamNow = format(new Date(), 'HH:mm:ss');

  const presRows: any = await query(
    'SELECT jam_masuk, jam_pulang FROM presensi WHERE karyawan_id = ? AND tanggal = ? LIMIT 1',
    [userId, tanggal]
  );
  const pres = presRows?.[0];

  if (tipe === 'masuk') {
    if (pres?.jam_masuk) {
      await cleanupFile();
      return NextResponse.json({ success: false, error: 'Anda sudah absen masuk hari ini.' }, { status: 400 });
    }

    const [jh, jm, js] = jamJadwalMasuk.split(':').map(Number);
    const limitTelat = new Date(`${tanggal}T00:00:00`);
    limitTelat.setHours(jh, jm + 1, js || 0, 0);
    const now = new Date(`${tanggal}T${jamNow}`);
    const statusMasuk = now >= limitTelat ? 'Terlambat' : 'Tepat Waktu';

    await query(
      `INSERT INTO presensi (karyawan_id, tanggal, jam_masuk, lokasi_masuk, foto_masuk, status)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         jam_masuk = IF(jam_masuk IS NULL OR jam_masuk = '00:00:00', VALUES(jam_masuk), jam_masuk),
         lokasi_masuk = IF(lokasi_masuk IS NULL OR lokasi_masuk = '', VALUES(lokasi_masuk), lokasi_masuk),
         foto_masuk = IF(foto_masuk IS NULL OR foto_masuk = '', VALUES(foto_masuk), foto_masuk),
         status = VALUES(status)`,
      [userId, tanggal, jamNow, lokasi, fileRel, statusMasuk]
    );

    return NextResponse.json({
      success: true,
      title: 'Absen masuk berhasil',
      desc: 'Data absensi kamu sudah tersimpan.',
      status: statusMasuk === 'Terlambat' ? 'telat' : 'sukses',
      foto: fileRel,
    });
  }

  if (!pres?.jam_masuk) {
    await cleanupFile();
    return NextResponse.json({ success: false, error: 'Anda belum absen masuk hari ini.' }, { status: 400 });
  }
  if (pres.jam_pulang) {
    await cleanupFile();
    return NextResponse.json({ success: false, error: 'Anda sudah absen pulang hari ini.' }, { status: 400 });
  }

  await query(
    'UPDATE presensi SET jam_pulang = ?, lokasi_pulang = ?, foto_pulang = ? WHERE karyawan_id = ? AND tanggal = ?',
    [jamNow, lokasi, fileRel, userId, tanggal]
  );

  return NextResponse.json({
    success: true,
    title: 'Absen pulang berhasil',
    desc: 'Data absensi kamu sudah tersimpan.',
    status: 'sukses',
    foto: fileRel,
  });
}
