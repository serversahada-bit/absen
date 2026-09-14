'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bell, ShieldAlert } from 'lucide-react';

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

type GateState = 'checking' | 'hidden' | 'ask' | 'denied';

export default function PushNotificationPrompt() {
  const [state, setState] = useState<GateState>('checking');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requiredRef = useRef(true);

  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
    if (!supported) {
      setState('hidden');
      return;
    }

    let cancelled = false;

    const evaluate = () => {
      if (!requiredRef.current) {
        setState('hidden');
        return;
      }
      if (Notification.permission === 'granted') setState('hidden');
      else if (Notification.permission === 'denied') setState('denied');
      else setState('ask');
    };

    fetch('/api/settings/push-required')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        requiredRef.current = data?.required !== false;
        evaluate();
      })
      .catch(() => {
        if (cancelled) return;
        requiredRef.current = true;
        evaluate();
      });

    document.addEventListener('visibilitychange', evaluate);
    window.addEventListener('focus', evaluate);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', evaluate);
      window.removeEventListener('focus', evaluate);
    };
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    setError('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'ask');
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

      setState('hidden');
    } catch (err: any) {
      console.error('[Push] Gagal mengaktifkan notifikasi:', err);
      setError(err.message || 'Gagal mengaktifkan notifikasi. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecheck = () => {
    if (Notification.permission === 'granted') setState('ask');
    else setError('Izin masih diblokir. Ikuti langkah di atas lalu coba lagi.');
  };

  if (state === 'checking' || state === 'hidden') return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-5 bg-slate-900/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center">
          {state === 'denied' ? <ShieldAlert className="w-7 h-7" /> : <Bell className="w-7 h-7" />}
        </div>

        {state === 'ask' ? (
          <>
            <p className="text-base font-bold text-slate-900 mt-4">Aktifkan Notifikasi</p>
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
              Notifikasi wajib diaktifkan untuk bisa absen, supaya kamu menerima approval izin/lembur dan pengumuman dari HRD.
            </p>
            {error && <p className="text-xs text-red-600 font-medium mt-2">{error}</p>}
            <button
              onClick={handleEnable}
              disabled={loading}
              className="mt-4 w-full text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? 'Memproses...' : 'Izinkan Notifikasi'}
            </button>
          </>
        ) : (
          <>
            <p className="text-base font-bold text-slate-900 mt-4">Notifikasi Diblokir</p>
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
              Notifikasi wajib diaktifkan untuk bisa absen. Buka setting browser kamu, cari izin &quot;Notifications&quot; untuk situs ini, lalu ubah ke &quot;Allow&quot;. Setelah itu tekan tombol di bawah.
            </p>
            {error && <p className="text-xs text-red-600 font-medium mt-2">{error}</p>}
            <button
              onClick={handleRecheck}
              className="mt-4 w-full text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 px-4 py-2.5 rounded-xl transition-colors"
            >
              Sudah Diaktifkan, Cek Lagi
            </button>
          </>
        )}
      </div>
    </div>
  );
}
