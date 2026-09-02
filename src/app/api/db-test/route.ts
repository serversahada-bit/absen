import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query('SELECT 1 + 1 AS test_result');
    return NextResponse.json({
      success: true,
      message: 'Koneksi ke database Hostinger MySQL berhasil!',
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Gagal terhubung ke database. Periksa DB_PASSWORD di .env.local',
        error: error.message || error,
      },
      { status: 500 }
    );
  }
}
