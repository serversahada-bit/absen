import React from 'react';
import AppShell from '@/components/AppShell';
import PushNotificationPrompt from '@/components/PushNotificationPrompt';
import PengumumanWajibGate from '@/components/PengumumanWajibGate';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell maxWidth="lg:max-w-none">
      {children}
      <PengumumanWajibGate />
      <PushNotificationPrompt />
    </AppShell>
  );
}
