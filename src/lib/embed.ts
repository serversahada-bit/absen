// Deteksi halaman yang sedang dirender di dalam popup desktop (NavModal me-render
// halaman di iframe dengan `?embed=1`). Param itu hanya ada di halaman pertama
// popup — begitu user pindah halaman di dalam popup (mis. Riwayat Legalitas ->
// Ajukan Legalitas -> kembali), param hilang, jadi deteksi tidak boleh hanya
// bergantung pada URL. Hanya dipanggil di client (useEffect).

function getSameOriginFrame(): Element | null {
  try {
    if (window.self === window.top) return null;
    if (window.top?.location.origin !== window.location.origin) return null;
    // Jangan pakai `instanceof HTMLIFrameElement`: elemen iframe milik dokumen induk
    // (realm berbeda), jadi instanceof dari dalam iframe selalu false.
    const frame = window.frameElement;
    return frame && frame.tagName === 'IFRAME' ? frame : null;
  } catch {
    // Diakses dari iframe beda origin -> browser melempar SecurityError; bukan popup kita.
    return null;
  }
}

/** True kalau halaman ini ada di dalam popup (halaman mana pun di dalamnya). */
export function isInsideNavPopup(): boolean {
  return new URLSearchParams(window.location.search).get('embed') === '1' || getSameOriginFrame() !== null;
}

/**
 * True kalau `pathname` adalah halaman pertama yang dibuka popup (yang punya tombol X).
 * Halaman lanjutan di dalam popup (mis. Ajukan Legalitas) mengembalikan false.
 */
export function isNavPopupRootPage(pathname: string): boolean {
  const frame = getSameOriginFrame();
  if (!frame) return new URLSearchParams(window.location.search).get('embed') === '1';
  const src = frame.getAttribute('src');
  if (!src) return false;
  return new URL(src, window.location.origin).pathname === pathname;
}
