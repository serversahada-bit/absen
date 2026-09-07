export function isManagerRole(peran?: string | null, jabatan?: string | null): boolean {
  const peranLower = (peran || '').toLowerCase();
  const jabatanLower = (jabatan || '').toLowerCase();
  return (
    ['manager', 'spv', 'supervisor'].includes(peranLower) ||
    jabatanLower.includes('manager') ||
    jabatanLower.includes('spv') ||
    jabatanLower.includes('supervisor')
  );
}
