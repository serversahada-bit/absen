'use client';

import React, { useEffect, useState } from 'react';

/**
 * Wraps a page's own "back" control (icon button, link, whatever markup the
 * page already uses) and hides it when the page is loaded inside the desktop
 * QuickMenu popup (NavModal renders pages in an iframe with `?embed=1`) — the
 * popup already has its own close (X) affordance, so an in-page back button
 * there is redundant and just navigates the iframe in place.
 */
export default function BackLink({ children }: { children: React.ReactNode }) {
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('embed') === '1') {
      setIsEmbedded(true);
    }
  }, []);

  if (isEmbedded) return null;
  return <>{children}</>;
}
