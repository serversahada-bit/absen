import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isGmail, verifyPasswordMigration, createSessionToken, UserSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = (body.identifier || '').trim();
    const passwordInput = String(body.password || '');

    // 1. Validasi input kosong
    if (!identifier || !passwordInput) {
      return NextResponse.json(
        { success: false, error: 'Identitas dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const isEmail = identifier.includes('@');
    let rows: any[] = [];

    if (isEmail) {
      // Opsi 1: Login pakai Gmail (dibatasi)
      if (!isGmail(identifier)) {
        return NextResponse.json(
          { success: false, error: 'Silakan gunakan email Gmail (contoh: nama@gmail.com).' },
          { status: 400 }
        );
      }

      rows = (await query(
        `SELECT id, id_karyawan, nama, nama_user, jabatan, organisasi, foto, password, status_karyawan, email 
         FROM karyawan 
         WHERE email = ? 
         LIMIT 1`,
        [identifier]
      )) as any[];
    } else {
      // Opsi 2: Login pakai username (kolom: nama_user)
      rows = (await query(
        `SELECT id, id_karyawan, nama, nama_user, jabatan, organisasi, foto, password, status_karyawan, email 
         FROM karyawan 
         WHERE nama_user = ? 
         LIMIT 1`,
        [identifier]
      )) as any[];
    }

    // 2. Cek apakah akun ditemukan
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Akun tidak ditemukan di sistem.' },
        { status: 400 }
      );
    }

    const row = rows[0];

    // 3. Cek password (hash modern / fallback polos)
    const validPassword = await verifyPasswordMigration(passwordInput, String(row.password || ''));
    if (!validPassword) {
      return NextResponse.json(
        { success: false, error: 'Password salah. Silakan coba lagi.' },
        { status: 400 }
      );
    }

    // 4. Cek status aktif karyawan
    if ((row.status_karyawan || '') === 'Non-Aktif') {
      return NextResponse.json(
        { success: false, error: 'Akun Anda telah dinonaktifkan. Silakan hubungi HRD.' },
        { status: 400 }
      );
    }

    // 5. Buat data session persis seperti $_SESSION di index.php
    const userPayload: UserSession = {
      user_id: Number(row.id),
      id_karyawan: row.id_karyawan || '',
      nama: row.nama || '',
      nama_user: row.nama_user || '',
      role: row.jabatan || '',
      perusahaan: row.organisasi || '',
      foto: row.foto || '',
      email: row.email || '',
    };

    // Buat JWT Token & Simpan Cookie (selalu berlaku 30 hari)
    const token = await createSessionToken(userPayload);
    const cookieStore = await cookies();

    cookieStore.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return NextResponse.json({
      success: true,
      message: 'Login berhasil',
      user: userPayload,
      redirectUrl: '/dashboard',
    });
  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan pada server. ' + (error.message || ''),
      },
      { status: 500 }
    );
  }
}
