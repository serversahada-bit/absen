'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { isNavPopupRootPage } from '@/lib/embed';

/**
 * Wraps a page's own "back" control (icon button, link, whatever markup the
 * page already uses) and hides it on the first page of the desktop QuickMenu
 * popup (NavModal renders pages in an iframe) — the popup already has its own
 * close (X) affordance there, and the back target (usually /dashboard) can't
 * be shown inside the popup. On follow-up pages inside the popup (e.g. Ajukan
 * Legalitas opened from Riwayat Legalitas) the back control stays, since it
 * returns to the previous page within the popup.
 */
export default function BackLink({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isPopupRoot, setIsPopupRoot] = useState(false);

  useEffect(() => {
    setIsPopupRoot(isNavPopupRootPage(pathname));
  }, [pathname]);

  if (isPopupRoot) return null;
  return <>{children}</>;
}
