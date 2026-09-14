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

async function syncSubscription(createIfMissing = false): Promise<boolean> {
  await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    if (!createIfMissing) return false;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
    if (!publicKey) throw new Error('Konfigurasi notifikasi belum tersedia. Hubungi admin.');
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
  }

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Gagal menyimpan subscription ke server.');
  }
  return true;
}

export default function PushNotificationPrompt() {
  const [state, setState] = useState<GateState>('checking');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requiredRef = useRef(true);
  const syncingRef = useRef(false);

  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    if (!supported) return;

    let cancelled = false;
    let settingsLoaded = false;

    const evaluate = async () => {
      if (cancelled || !settingsLoaded || syncingRef.current || document.visibilityState === 'hidden') return;
      if (Notification.permission !== 'granted') {
        setState(!requiredRef.current ? 'hidden' : Notification.permission === 'denied' ? 'denied' : 'ask');
        return;
      }

      // Permission alone does not guarantee a subscription exists in the browser or database.
      syncingRef.current = true;
      setLoading(true);
      try {
        const subscribed = await syncSubscription();
        if (!cancelled) {
          setError('');
          setState(subscribed || !requiredRef.current ? 'hidden' : 'ask');
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Gagal memeriksa notifikasi. Coba lagi.');
          setState(requiredRef.current ? 'ask' : 'hidden');
        }
      } finally {
        syncingRef.current = false;
        if (!cancelled) setLoading(false);
      }
    };

    fetch('/api/settings/push-required')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        requiredRef.current = data?.required !== false;
        settingsLoaded = true;
        evaluate();
      })
      .catch(() => {
        if (cancelled) return;
        requiredRef.current = true;
        settingsLoaded = true;
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
    if (syncingRef.current) return;
    syncingRef.current = true;
    setLoading(true);
    setError('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'ask');
        return;
      }

      await syncSubscription(true);

      setState('hidden');
    } catch (err: unknown) {
      console.error('[Push] Gagal mengaktifkan notifikasi:', err);
      setError(err instanceof Error ? err.message : 'Gagal mengaktifkan notifikasi. Coba lagi.');
      setState('ask');
    } finally {
      syncingRef.current = false;
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
