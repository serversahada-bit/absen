import path from 'path';
import 'server-only';

// File upload (foto profil, bukti izin/presensi, PDF legalitas) sebelumnya
// ditulis ke public/uploads, yang ikut ter-reset/tertimpa setiap kali server
// di-redeploy. Set env var LEGACY_UPLOAD_DIR di server ke folder persisten
// (mis. /data/data_kantor/hrd/upload, sama seperti yang dipakai project
// dashboard-hris) supaya file tidak hilang lagi tiap deploy. Kalau env var
// belum di-set, perilaku tetap sama seperti sebelumnya (public/uploads).
export const PERSISTENT_UPLOAD_DIR =
  process.env.LEGACY_UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
