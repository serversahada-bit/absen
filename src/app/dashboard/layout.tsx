import React from 'react';
import AppShell from '@/components/AppShell';
import PushNotificationPrompt from '@/components/PushNotificationPrompt';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell maxWidth="lg:max-w-none">
      {children}
      <PushNotificationPrompt />
    </AppShell>
  );
}
