'use client';

import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';

const DISMISS_KEY = 'push_notif_dismissed';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
    if (!supported) return;

    if (Notification.permission !== 'default') return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    setVisible(true);
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    setError('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setVisible(false);
        localStorage.setItem(DISMISS_KEY, '1');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal menyimpan subscription ke server.');
      }

      setVisible(false);
    } catch (err: any) {
      console.error('[Push] Gagal mengaktifkan notifikasi:', err);
      setError(err.message || 'Gagal mengaktifkan notifikasi. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  if (!visible) return null;

  return (
    <div className="fixed top-5 right-5 left-5 lg:left-auto z-50 max-w-sm rounded-2xl bg-white border border-slate-200 shadow-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
        <Bell className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900">Aktifkan Notifikasi</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
          Dapatkan notifikasi untuk approval izin/lembur dan pengumuman dari HRD.
        </p>
        {error && <p className="text-xs text-red-600 font-medium mt-1.5">{error}</p>}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={handleEnable}
            disabled={loading}
            className="text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? 'Memproses...' : 'Aktifkan'}
          </button>
          <button
            onClick={handleDismiss}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            Nanti saja
          </button>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="text-slate-300 hover:text-slate-500 transition-colors shrink-0"
        aria-label="Tutup"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
