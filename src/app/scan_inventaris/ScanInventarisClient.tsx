'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Camera, RotateCcw, AlertTriangle, PackageSearch } from 'lucide-react';
import { lookupAsetByKode, type AsetScanResult } from './actions';

QrScanner.WORKER_PATH = '/qr-scanner-worker.min.js';

type Status = 'starting' | 'scanning' | 'looking_up' | 'result' | 'error';

export default function ScanInventarisClient() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [status, setStatus] = useState<Status>('starting');
  const [errorMessage, setErrorMessage] = useState('');
  const [aset, setAset] = useState<AsetScanResult | null>(null);

  const handleDecoded = useCallback(async (kode: string) => {
    scannerRef.current?.stop();
    setStatus('looking_up');

    try {
      const res = await lookupAsetByKode(kode);
      if (res.ok) {
        setAset(res.aset);
        setStatus('result');
      } else {
        setErrorMessage(res.desc);
        setStatus('error');
      }
    } catch (err) {
      console.error('Gagal mencari aset:', err);
      setErrorMessage('Terjadi kesalahan saat mencari data aset. Coba lagi.');
      setStatus('error');
    }
  }, []);

  // No setState before the first await here, so this is safe to call
  // synchronously from the mount effect below.
  const runScanner = useCallback(async () => {
    if (!videoRef.current) return;

    if (!scannerRef.current) {
      scannerRef.current = new QrScanner(
        videoRef.current,
        (result) => handleDecoded(result.data),
        {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5,
        }
      );
    }

    try {
      await scannerRef.current.start();
      setStatus('scanning');
    } catch (err) {
      console.error('Gagal mengakses kamera:', err);
      setErrorMessage('Tidak bisa mengakses kamera. Pastikan izin kamera sudah diaktifkan untuk browser ini.');
      setStatus('error');
    }
  }, [handleDecoded]);

  // Used by the "Coba Lagi" / "Scan Aset Lain" buttons to reset the view
  // before restarting the camera.
  const startScanning = useCallback(() => {
    setErrorMessage('');
    setAset(null);
    setStatus('starting');
    runScanner();
  }, [runScanner]);

  useEffect(() => {
    runScanner();
    return () => {
      scannerRef.current?.stop();
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showCamera = status === 'starting' || status === 'scanning';

  return (
    <div className="space-y-4">
      <div className="relative bg-slate-900 rounded-[28px] overflow-hidden aspect-square shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${showCamera ? '' : 'invisible'}`}
          muted
          playsInline
        />

        {status === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80">
            <Camera className="w-8 h-8 animate-pulse" />
            <p className="text-xs font-semibold">Menyiapkan kamera...</p>
          </div>
        )}

        {status === 'looking_up' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/80 text-white">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-xs font-semibold">Mencari data aset...</p>
          </div>
        )}
      </div>

      {status === 'scanning' && (
        <p className="text-center text-[12px] font-semibold text-slate-400">
          Arahkan kamera ke QR Code yang tertempel di aset.
        </p>
      )}

      {status === 'error' && (
        <div className="bg-white rounded-[24px] border border-rose-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-500" strokeWidth={1.8} />
          </div>
          <p className="text-sm font-bold text-slate-800">{errorMessage}</p>
          <button
            type="button"
            onClick={startScanning}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-900 px-4 py-2.5 text-[12px] font-bold text-white active:scale-95 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.25} />
            Coba Lagi
          </button>
        </div>
      )}

      {status === 'result' && aset && (
        <div className="bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
              <PackageSearch className="w-5 h-5 text-violet-500" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-sm leading-snug break-words">{aset.nama_aset}</p>
              <p className="text-[11px] font-semibold text-slate-400 mt-1">{aset.kategori}</p>
            </div>
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-3 border-b border-slate-50 pb-2">
              <dt className="text-slate-400 font-semibold">Kode Aset</dt>
              <dd className="text-slate-800 font-bold text-right">{aset.kode_aset || '-'}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-slate-50 pb-2">
              <dt className="text-slate-400 font-semibold">Merk</dt>
              <dd className="text-slate-800 font-bold text-right">{aset.merk || '-'}</dd>
            </div>
            <div>
              <dt className="text-slate-400 font-semibold mb-1">Deskripsi</dt>
              <dd className="text-slate-700">{aset.deskripsi || '-'}</dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={startScanning}
            className="mt-5 w-full inline-flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 px-4 py-2.5 text-[12px] font-bold text-white active:scale-[0.98] transition-all shadow-[0_6px_16px_rgba(124,58,237,0.3)]"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={2.25} />
            Scan Aset Lain
          </button>
        </div>
      )}
    </div>
  );
}
