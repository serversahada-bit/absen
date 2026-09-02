'use client';

import React, { createContext, useContext, useState } from 'react';
import NavModal from '@/components/NavModal';

type OpenModalFn = (href: string, label: string) => void;

const NavModalContext = createContext<OpenModalFn | null>(null);

/**
 * Returns a function that opens `href` as a desktop popup (via an iframe) instead of
 * navigating. Callers should only invoke it on desktop widths — on mobile there is no
 * popup, so fall back to a normal `router.push`/`<Link>` there.
 */
export function useNavModal(): OpenModalFn {
  const ctx = useContext(NavModalContext);
  if (!ctx) {
    throw new Error('useNavModal must be used within AppShell');
  }
  return ctx;
}

export function NavModalProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<{ href: string; label: string } | null>(null);

  return (
    <NavModalContext.Provider value={(href, label) => setModal({ href, label })}>
      {children}
      {modal && (
        <NavModal
          src={`${modal.href}?embed=1`}
          title={modal.label}
          onClose={() => setModal(null)}
        />
      )}
    </NavModalContext.Provider>
  );
}
