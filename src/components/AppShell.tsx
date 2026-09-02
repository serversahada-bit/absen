'use client';

import React, { useEffect, useState } from 'react';
import TopNav from '@/components/dashboard/TopNav';
import BottomNav from '@/components/dashboard/BottomNav';
import { NavModalProvider } from '@/components/NavModalContext';

interface AppShellProps {
  children: React.ReactNode;
  /** Tailwind max-w-* class for the content column on large screens. */
  maxWidth?: string;
}

export default function AppShell({ children, maxWidth = 'lg:max-w-3xl' }: AppShellProps) {
  // Set when this page is being rendered inside another page's nav popup (iframe) —
  // detected client-side so no page needs to thread a searchParams prop through.
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('embed') === '1') {
      setIsEmbedded(true);
    }
  }, []);

  if (isEmbedded) {
    return (
      <div className="min-h-screen w-full app-bg">
        {children}
      </div>
    );
  }

  return (
    <NavModalProvider>
      <div className="min-h-screen w-full app-bg">
        <TopNav />
        <main className={`w-full ${maxWidth} lg:mx-auto pb-24 lg:pb-16 lg:pt-2`}>
          {children}
        </main>
        <BottomNav />
      </div>
    </NavModalProvider>
  );
}
