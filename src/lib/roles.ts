export function isManagerRole(peran?: string | null, jabatan?: string | null): boolean {
  const peranLower = (peran || '').toLowerCase();
  const jabatanLower = (jabatan || '').toLowerCase();
  return (
    ['manager', 'spv', 'supervisor', 'koordinator'].includes(peranLower) ||
    jabatanLower.includes('manager') ||
    jabatanLower.includes('spv') ||
    jabatanLower.includes('supervisor') ||
    jabatanLower.includes('koordinator')
  );
}

/** Akses fitur kirim notifikasi broadcast dibatasi khusus jabatan ini. */
export function isNotifikasiAdminRole(jabatan?: string | null): boolean {
  return (jabatan || '').trim().toLowerCase() === 'koordinator it spesialis';
}
