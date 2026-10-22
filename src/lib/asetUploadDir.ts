import path from 'path';
import 'server-only';
import { PERSISTENT_UPLOAD_DIR } from '@/lib/uploadDir';

// Foto aset diunggah dari dashboard-hris (Inventaris HC) ke folder ASET_UPLOAD_DIR
// milik dashboard-hris. absen-main hanya membacanya untuk ditampilkan di hasil
// Scan Inventaris, jadi ASET_UPLOAD_DIR di sini harus menunjuk ke folder yang sama.
// Default: <LEGACY_UPLOAD_DIR>/aset — cocok bila dashboard-hris di server memakai
// ASET_UPLOAD_DIR=/data/data_kantor/hrd/upload/aset.
export const ASET_UPLOAD_DIR =
  process.env.ASET_UPLOAD_DIR || path.join(PERSISTENT_UPLOAD_DIR, 'aset');
