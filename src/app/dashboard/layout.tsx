import React from 'react';
import AppShell from '@/components/AppShell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell maxWidth="lg:max-w-[1400px]">
      {children}
    </AppShell>
  );
}
