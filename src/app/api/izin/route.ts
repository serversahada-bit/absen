import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { sendPushToKaryawan } from '@/lib/push';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

const VALID_TIPE = ['Sakit', 'Cuti', 'Cuti Khusus', 'Cuti Setengah Hari'];

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function kirimEmailIzin(params: {
  namaKaryawan: string;
  tipeIzin: string;
  mulaiTanggal: string;
  sampaiTanggal: string;
  alasan: string;
  managerEmail?: string | null;
  managerNama?: string | null;
}) {
  const { namaKaryawan, tipeIzin, mulaiTanggal, sampaiTanggal, alasan, managerEmail, managerNama } = params;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn('[Izin] SMTP_USER / SMTP_PASSWORD belum diatur, email notifikasi dilewati.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const recipients = ['hcsahada@gmail.com', 'serversahada@gmail.com'];
  if (managerEmail) recipients.push(managerEmail);

  const html = `
    <html><body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:16px;">
      <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden;">
        <div style="padding:16px; text-align:center; background:#e11d48; color:#ffffff;">
          <strong>Pengajuan Izin/Cuti</strong>
        </div>
        <div style="padding:16px; color:#0f172a;">
          <p>Yth Tim HC,</p>
          <p>Terdapat pengajuan izin/cuti baru dengan detail sebagai berikut</p>
          <table cellpadding="6" cellspacing="0" style="width:100%; border-collapse:collapse; font-size:14px;">
            <tr><td style="width:160px; font-weight:bold;">Nama Karyawan</td><td>${escapeHtml(namaKaryawan)}</td></tr>
            <tr><td style="font-weight:bold;">Jenis</td><td>${escapeHtml(tipeIzin)}</td></tr>
            <tr><td style="font-weight:bold;">Mulai</td><td>${escapeHtml(mulaiTanggal)}</td></tr>
            <tr><td style="font-weight:bold;">Sampai</td><td>${escapeHtml(sampaiTanggal)}</td></tr>
            <tr><td style="font-weight:bold; vertical-align:top;">Alasan</td><td>${escapeHtml(alasan).replace(/\n/g, '<br>')}</td></tr>
          </table>
          <p style="margin-top:16px; font-size:12px; color:#64748b;">Email ini dikirim otomatis dari sistem Great HRD.</p>
          <p style="margin-top:8px;">
            <a href="https://great.ptslu.id/aproval_izin"
               style="display:inline-block; padding:10px 18px; background:#e11d48; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:bold; font-size:13px;">
              Buka Halaman Approval
            </a>
          </p>
        </div>
      </div>
    </body></html>
  `;

  try {
    await transporter.sendMail({
      from: `"Portal Izin - ${namaKaryawan}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: recipients.join(', '),
      replyTo: managerNama && managerEmail ? `${managerNama} <${managerEmail}>` : undefined,
      subject: `Pengajuan Izin baru dari ${namaKaryawan}`,
      html,
    });
  } catch (error) {
    console.error('[Izin] Gagal kirim email notifikasi:', error);
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sesi tidak valid, silakan login ulang.' }, { status: 401 });
  }

  try {
    return await handleSubmit(request, session.user_id);
  } catch (error: any) {
    console.error('[Izin] Gagal memproses pengajuan:', error);
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

  const tipe = String(formData.get('tipe') || '').trim();
  const mulai = String(formData.get('mulai') || '').trim();
  const sampai = String(formData.get('sampai') || '').trim();
  const jenisCutiKhusus = String(formData.get('jenis_cuti_khusus') || '').trim();
  const jamMulai = String(formData.get('jam_mulai') || '').trim();
  const jamSelesai = String(formData.get('jam_selesai') || '').trim();
  let alasan = String(formData.get('alasan') || '').trim();

  if (!VALID_TIPE.includes(tipe)) {
    return NextResponse.json({ success: false, error: 'Jenis pengajuan tidak valid.' }, { status: 400 });
  }
  if (!mulai || !sampai) {
    return NextResponse.json({ success: false, error: 'Tanggal mulai & sampai wajib diisi.' }, { status: 400 });
  }
  if (!alasan) {
    return NextResponse.json({ success: false, error: 'Alasan wajib diisi.' }, { status: 400 });
  }
  if (new Date(sampai) < new Date(mulai)) {
    return NextResponse.json({ success: false, error: 'Tanggal sampai tidak boleh sebelum tanggal mulai.' }, { status: 400 });
  }

  if (tipe === 'Cuti Khusus' && jenisCutiKhusus) {
    alasan = `Jenis Cuti Khusus: ${jenisCutiKhusus}\n\n${alasan}`;
  }
  if (tipe === 'Cuti Setengah Hari' && jamMulai && jamSelesai) {
    alasan = `${alasan}\n\n(Waktu Cuti: ${jamMulai} s/d ${jamSelesai})`;
  }

  let buktiFilename: string | null = null;
  const buktiFile = formData.get('bukti');

  if (buktiFile instanceof File && buktiFile.size > 0) {
    const ext = ALLOWED_TYPES[buktiFile.type];
    if (!ext) {
      return NextResponse.json({ success: false, error: 'Format lampiran harus JPG, PNG, WEBP, atau PDF.' }, { status: 400 });
    }
    if (buktiFile.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: 'Ukuran lampiran maksimal 2MB.' }, { status: 400 });
    }

    const buffer = Buffer.from(await buktiFile.arrayBuffer());
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'izin');
    await fs.mkdir(uploadDir, { recursive: true });

    const rand = crypto.randomBytes(6).toString('hex');
    buktiFilename = `izin_${userId}_${Date.now()}_${rand}.${ext}`;
    await fs.writeFile(path.join(uploadDir, buktiFilename), buffer);
  }

  const userRows: any = await query('SELECT nama FROM karyawan WHERE id = ? LIMIT 1', [userId]);
  const namaKaryawan = userRows?.[0]?.nama || 'Karyawan';

  const managerRows: any = await query(
    `SELECT m.id, m.email_login, m.email, m.nama
     FROM tim_saya ts
     JOIN karyawan m ON ts.manager_id = m.id
     WHERE ts.anggota_id = ?
     LIMIT 1`,
    [userId]
  );
  const managerRow = managerRows?.[0];
  const managerEmail = managerRow ? (managerRow.email_login || managerRow.email || null) : null;
  const managerNama = managerRow?.nama || null;

  await query(
    `INSERT INTO pengajuan_izin (karyawan_id, tipe_izin, mulai_tanggal, sampai_tanggal, alasan, bukti_foto, status, manager_status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'Pending', 'Pending', NOW())`,
    [userId, tipe, mulai, sampai, alasan, buktiFilename]
  );

  const mulaiFmt = format(new Date(mulai), 'dd MMM yyyy', { locale: id });
  const sampaiFmt = format(new Date(sampai), 'dd MMM yyyy', { locale: id });

  await kirimEmailIzin({
    namaKaryawan,
    tipeIzin: tipe,
    mulaiTanggal: mulaiFmt,
    sampaiTanggal: sampaiFmt,
    alasan,
    managerEmail,
    managerNama,
  });

  if (managerRow?.id) {
    await sendPushToKaryawan(managerRow.id, {
      title: 'Pengajuan Izin Baru',
      body: `${namaKaryawan} mengajukan ${tipe} (${mulaiFmt} - ${sampaiFmt})`,
      url: '/aproval_izin',
    });
  }

  return NextResponse.json({ success: true, message: 'Pengajuan izin berhasil dikirim ke HR dan salinan ke email Anda.' });
}
