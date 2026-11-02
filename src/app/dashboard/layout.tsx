import React from 'react';
import AppShell from '@/components/AppShell';
import PushNotificationPrompt from '@/components/PushNotificationPrompt';
import PengumumanWajibGate from '@/components/PengumumanWajibGate';
import PeraturanWajibGate from '@/components/PeraturanWajibGate';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell maxWidth="lg:max-w-none">
      {children}
      {/* z-index sama: Pengumuman Penting dirender sesudahnya jadi tampil di atas & dibaca dulu. */}
      <PeraturanWajibGate />
      <PengumumanWajibGate />
      <PushNotificationPrompt />
    </AppShell>
  );
}
