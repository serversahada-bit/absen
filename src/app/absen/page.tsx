'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, Camera, MapPin, AlertCircle, Focus, ScanFace } from 'lucide-react';

function AbsenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tipe = searchParams.get('tipe') || 'masuk';

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const [location, setLocation] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState('Menginisiasi Sistem...');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isLocReady, setIsLocReady] = useState(false);

  // 1. Dapatkan Lokasi GPS
  useEffect(() => {
    if (!navigator.geolocation) {
      setErrorMsg('Browser tidak mendukung GPS.');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lon = pos.coords.longitude.toFixed(6);
        setLocation(`${lat},${lon}`);
        setIsLocReady(true);
      },
      (err) => {
        setErrorMsg(`GPS gagal: ${err.message}. Mohon aktifkan izin lokasi.`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  // 2. Akses Kamera
  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play();
          setIsCameraReady(true);
          setStatusMsg('Face ID Siap');
        }
      } catch (err: any) {
        setErrorMsg(`Kamera gagal: ${err.message}`);
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // 3. Ambil Foto & Submit
  const handleCapture = () => {
    if (isCapturing) return;
    if (!isCameraReady) {
      setErrorMsg('Kamera belum siap.');
      return;
    }
    if (!isLocReady) {
      setErrorMsg('Lokasi GPS belum didapatkan.');
      return;
    }

    setIsCapturing(true);
    setStatusMsg('Memproses Kehadiran...');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Set ukuran kanvas (target lebar 720px)
    const targetW = 720;
    const scale = targetW / (video.videoWidth || 640);
    const targetH = Math.round((video.videoHeight || 480) * scale);
    
    canvas.width = targetW;
    canvas.height = targetH;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror image supaya sama dengan preview
    ctx.translate(targetW, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, targetW, targetH);

    // Ambil base64 (kompresi)
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    setStatusMsg('Mengirim Data Aman...');

    // Buat form untuk post ke /actions/proses_absen.php lama
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/actions/proses_absen.php';
    form.style.display = 'none';

    const tipeInput = document.createElement('input');
    tipeInput.type = 'hidden';
    tipeInput.name = 'tipe';
    tipeInput.value = tipe;

    const fotoInput = document.createElement('input');
    fotoInput.type = 'hidden';
    fotoInput.name = 'foto';
    fotoInput.value = imageData;

    const lokasiInput = document.createElement('input');
    lokasiInput.type = 'hidden';
    lokasiInput.name = 'lokasi';
    lokasiInput.value = location;
    
    // CSRF dummy jika diperlukan oleh PHP lama
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = 'csrf_token';
    csrfInput.value = 'nextjs_bypass';

    form.appendChild(tipeInput);
    form.appendChild(fotoInput);
    form.appendChild(lokasiInput);
    form.appendChild(csrfInput);

    document.body.appendChild(form);
    form.submit();
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-between overflow-hidden selection:bg-transparent font-sans">
      
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video 
          ref={videoRef}
          className="w-full h-full object-cover scale-x-[-1]"
          playsInline 
          muted 
          autoPlay 
        />
        {/* Soft Vignette Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />
        
        {/* Futuristic Face Guide */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[340px] pointer-events-none">
          {/* Scanning Line Animation */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-[scan_3s_ease-in-out_infinite]" />
          
          {/* Corner Brackets */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-[4px] border-l-[4px] border-white/90 rounded-tl-3xl drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t-[4px] border-r-[4px] border-white/90 rounded-tr-3xl drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[4px] border-l-[4px] border-white/90 rounded-bl-3xl drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[4px] border-r-[4px] border-white/90 rounded-br-3xl drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Top Bar */}
      <div className="relative z-10 w-full px-6 pt-10 flex items-center justify-between">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full flex items-center gap-2">
          <Focus className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="text-xs font-black text-white tracking-widest uppercase">
            Absen {tipe}
          </span>
        </div>
        <button 
          onClick={() => router.push('/dashboard')}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 text-white hover:bg-white/20 transition-all active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Panel */}
      <div className="relative z-10 w-full px-5 pb-8 animate-fade-in-up">
        
        {/* Error Toast */}
        {errorMsg && (
          <div className="mb-4 bg-rose-500/90 backdrop-blur-md rounded-2xl p-4 flex items-start gap-3 border border-rose-400 shadow-[0_10px_40px_rgba(225,29,72,0.4)]">
            <AlertCircle className="w-5 h-5 text-white shrink-0" />
            <p className="text-xs font-bold text-white leading-relaxed">{errorMsg}</p>
          </div>
        )}

        <div className="bg-[#111111]/80 backdrop-blur-3xl rounded-[36px] p-6 shadow-2xl border border-white/10 relative overflow-hidden">
          {/* Glass glare effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />

          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[2px]">Great HRD • Face Check</p>
              <h2 className="text-[17px] font-black text-white mt-1 tracking-tight">{statusMsg}</h2>
            </div>
            
            <div className="flex gap-2">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${isLocReady ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-amber-500/20 border-amber-500/50 text-amber-400 animate-pulse'}`}>
                <MapPin className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border ${isCameraReady ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-slate-500/20 border-slate-500/50 text-slate-400 animate-pulse'}`}>
                <Camera className="w-4 h-4" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-400 text-center mb-6 relative z-10">
            Posisikan wajah Anda pada area frame<br/>pastikan pencahayaan cukup
          </p>

          <button 
            onClick={handleCapture}
            disabled={isCapturing || !isCameraReady || !isLocReady}
            className={`relative z-10 w-full py-4 rounded-[24px] font-black tracking-widest text-[14px] flex items-center justify-center gap-2.5 transition-all duration-300
              ${(isCapturing || !isCameraReady || !isLocReady) 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                : 'bg-white text-black hover:bg-slate-200 active:scale-95 shadow-[0_10px_30px_rgba(255,255,255,0.2)]'
              }
            `}
          >
            {isCapturing ? (
              <>
                <ScanFace className="w-5 h-5 animate-spin" /> MENGANALISA...
              </>
            ) : (
              <>
                <ScanFace className="w-5 h-5" /> REKAM WAJAH
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Global Style for Scan Animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0%, 100% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          50% { transform: translateY(340px); }
        }
      `}} />
    </div>
  );
}

export default function AbsenPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><p className="text-white font-bold tracking-widest uppercase">Memuat Sensor...</p></div>}>
      <AbsenContent />
    </Suspense>
  );
}
