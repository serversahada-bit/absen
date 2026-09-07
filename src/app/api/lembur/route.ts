import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

function menitToJamMenit(menit: number): string {
  const jam = Math.floor(menit / 60);
  const sisaMenit = menit % 60;
  return `${jam} jam ${String(sisaMenit).padStart(2, '0')} menit`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function kirimEmailLembur(params: {
  namaKaryawan: string;
  tanggal: string;
  mulaiAt: Date;
  selesaiAt: Date;
  durasiMenit: number;
  alasan: string;
  managerEmail?: string | null;
  managerNama?: string | null;
}) {
  const { namaKaryawan, tanggal, mulaiAt, selesaiAt, durasiMenit, alasan, managerEmail, managerNama } = params;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.warn('[Lembur] SMTP_USER / SMTP_PASSWORD belum diatur, email notifikasi dilewati.');
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

  const mulaiFmt = format(mulaiAt, 'dd MMM yyyy HH:mm', { locale: id });
  const selesaiFmt = format(selesaiAt, 'dd MMM yyyy HH:mm', { locale: id });

  const html = `
    <html><body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:16px;">
      <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:8px; overflow:hidden;">
        <div style="padding:16px; text-align:center; background:#7c3aed; color:#ffffff;">
          <strong>Pengajuan Lembur</strong>
        </div>
        <div style="padding:16px; color:#0f172a;">
          <p>Yth Tim HC,</p>
          <p>Terdapat pengajuan lembur baru dengan detail sebagai berikut</p>
          <table cellpadding="6" cellspacing="0" style="width:100%; border-collapse:collapse; font-size:14px;">
            <tr><td style="width:160px; font-weight:bold;">Nama Karyawan</td><td>${escapeHtml(namaKaryawan)}</td></tr>
            <tr><td style="font-weight:bold;">Tanggal</td><td>${escapeHtml(tanggal)}</td></tr>
            <tr><td style="font-weight:bold;">Mulai</td><td>${mulaiFmt}</td></tr>
            <tr><td style="font-weight:bold;">Selesai</td><td>${selesaiFmt}</td></tr>
            <tr><td style="font-weight:bold;">Durasi</td><td>${menitToJamMenit(durasiMenit)}</td></tr>
            <tr><td style="font-weight:bold; vertical-align:top;">Alasan</td><td>${escapeHtml(alasan).replace(/\n/g, '<br>')}</td></tr>
          </table>
          <p style="margin-top:16px; font-size:12px; color:#64748b;">Email ini dikirim otomatis dari sistem Great HRD.</p>
          <p style="margin-top:8px;">
            <a href="https://great.ptslu.id/aproval_lembur"
               style="display:inline-block; padding:10px 18px; background:#7c3aed; color:#ffffff; text-decoration:none; border-radius:6px; font-weight:bold; font-size:13px;">
              Buka Halaman Approval
            </a>
          </p>
        </div>
      </div>
    </body></html>
  `;

  try {
    await transporter.sendMail({
      from: `"Portal Lembur - ${namaKaryawan}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: recipients.join(', '),
      replyTo: managerNama && managerEmail ? `${managerNama} <${managerEmail}>` : undefined,
      subject: `Pengajuan Lembur baru dari ${namaKaryawan}`,
      html,
    });
  } catch (error) {
    console.error('[Lembur] Gagal kirim email notifikasi:', error);
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, errors: ['Sesi tidak valid, silakan login ulang.'] }, { status: 401 });
  }

  const userId = session.user_id;
  const body = await request.json().catch(() => ({}));

  const tanggal = String(body.tanggal || '').trim();
  const mulai = String(body.mulai || '').trim();
  const selesai = String(body.selesai || '').trim();
  const alasan = String(body.alasan || '').trim();

  const errors: string[] = [];
  if (!tanggal) errors.push('Tanggal wajib diisi.');
  if (!mulai) errors.push('Jam mulai wajib diisi.');
  if (!selesai) errors.push('Jam selesai wajib diisi.');
  if (!alasan) errors.push('Alasan wajib diisi.');

  if (errors.length > 0) {
    return NextResponse.json({ success: false, errors }, { status: 400 });
  }

  const dtMulai = new Date(`${tanggal}T${mulai}:00`);
  const dtSelesai = new Date(`${tanggal}T${selesai}:00`);
  if (dtSelesai < dtMulai) {
    dtSelesai.setDate(dtSelesai.getDate() + 1);
  }

  if (isNaN(dtMulai.getTime()) || isNaN(dtSelesai.getTime())) {
    return NextResponse.json({ success: false, errors: ['Format tanggal/jam tidak valid.'] }, { status: 400 });
  }

  const durasiMenit = Math.round((dtSelesai.getTime() - dtMulai.getTime()) / 60000);

  if (durasiMenit < 30) {
    return NextResponse.json({ success: false, errors: ['Durasi lembur minimal 30 menit.'] }, { status: 400 });
  }
  if (durasiMenit > 18 * 60) {
    return NextResponse.json({ success: false, errors: ['Durasi lembur terlalu lama (maks 18 jam).'] }, { status: 400 });
  }

  const userRows: any = await query('SELECT nama FROM karyawan WHERE id = ? LIMIT 1', [userId]);
  const namaKaryawan = userRows?.[0]?.nama || 'Karyawan';

  const managerRows: any = await query(
    `SELECT m.email_login, m.email, m.nama
     FROM tim_saya ts
     JOIN karyawan m ON ts.manager_id = m.id
     WHERE ts.anggota_id = ?
     LIMIT 1`,
    [userId]
  );
  const managerRow = managerRows?.[0];
  const managerEmail = managerRow ? (managerRow.email_login || managerRow.email || null) : null;
  const managerNama = managerRow?.nama || null;

  const mulaiAtStr = format(dtMulai, 'yyyy-MM-dd HH:mm:ss');
  const selesaiAtStr = format(dtSelesai, 'yyyy-MM-dd HH:mm:ss');

  await query(
    `INSERT INTO lembur (karyawan_id, mulai_at, selesai_at, durasi_menit, alasan, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'PENDING', NOW())`,
    [userId, mulaiAtStr, selesaiAtStr, durasiMenit, alasan]
  );

  await kirimEmailLembur({
    namaKaryawan,
    tanggal,
    mulaiAt: dtMulai,
    selesaiAt: dtSelesai,
    durasiMenit,
    alasan,
    managerEmail,
    managerNama,
  });

  return NextResponse.json({ success: true, message: 'Pengajuan lembur berhasil dikirim.' });
}
