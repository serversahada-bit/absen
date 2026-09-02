'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LiveStatusBadge from '@/components/LiveStatusBadge';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState<'identifier' | 'password' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, remember }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Login gagal, silakan coba lagi.');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError('Terjadi masalah koneksi. Silakan periksa jaringan Anda.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full app-bg text-slate-900 flex items-center justify-center font-poppins selection:bg-violet-500/30 py-6 md:py-0">
      {/* Background abstract gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-500/10 blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-400/10 blur-[120px] mix-blend-multiply" />
      </div>

      <div className="relative z-10 flex w-full max-w-6xl overflow-hidden rounded-[2rem] md:rounded-[2rem] bg-white border border-slate-200 shadow-2xl shadow-slate-200/50 mx-4 my-0 md:my-8 md:min-h-[600px]">
        
        {/* LEFT: FORM SECTION */}
        <div className="flex w-full flex-col justify-center px-6 py-6 md:w-1/2 md:px-8 md:py-12 lg:px-16 relative">

          <div className="w-full max-w-sm mx-auto">
            {/* Header: Logo and Live Status Indicator */}
            <div className="flex items-center justify-between mb-5 md:mb-10">
              {/* Logo Area */}
              <div className="flex items-center gap-3 font-semibold tracking-wide text-slate-900">
                <Image
                  src="/sasdw.png"
                  alt="Company Logo"
                  width={40}
                  height={40}
                  className="object-contain rounded-lg"
                />
                <span className="text-xl">GreatHR</span>
              </div>

              {/* Realtime Live Status Badge */}
              <LiveStatusBadge />
            </div>

            <div className="mb-5 md:mb-10 text-center md:text-left">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2 md:text-4xl">
                Welcome Back
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Masuk untuk mengakses Absensi, Slip Gaji, dan Pengajuan Izin.
              </p>
            </div>

            {/* ERROR ALERT */}
            {error && (
              <div className="mb-4 md:mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <svg className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="font-medium leading-relaxed">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 md:space-y-5">
              {/* IDENTIFIER FIELD */}
              <div className="space-y-1.5">
                <label htmlFor="identifier" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                  Email / Username
                </label>
                <div 
                  className={`relative flex items-center overflow-hidden rounded-xl border bg-slate-50 transition-all duration-300 ease-out
                  ${isFocused === 'identifier' ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="pl-4 pr-3 text-slate-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onFocus={() => setIsFocused('identifier')}
                    onBlur={() => setIsFocused(null)}
                    placeholder="nama@gmail.com"
                    autoComplete="username"
                    required
                    className="w-full bg-transparent py-3.5 pr-4 text-[15px] font-medium text-slate-900 outline-none placeholder:text-slate-400 transition-colors"
                  />
                </div>
              </div>

              {/* PASSWORD FIELD */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
                  Password
                </label>
                <div 
                  className={`relative flex items-center overflow-hidden rounded-xl border bg-slate-50 transition-all duration-300 ease-out
                  ${isFocused === 'password' ? 'border-violet-500 ring-2 ring-violet-500/20' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="pl-4 pr-3 text-slate-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsFocused('password')}
                    onBlur={() => setIsFocused(null)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full bg-transparent py-3.5 pr-12 text-[15px] font-medium text-slate-900 outline-none placeholder:text-slate-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 p-2 text-slate-400 hover:text-violet-600 transition-colors rounded-lg focus:outline-none"
                    aria-label="Toggle password"
                  >
                    {!showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3l18 18M10.477 10.49a3 3 0 004.04 4.03M9.88 5.09A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.97 9.97 0 01-4.132 5.411M6.228 6.228A9.97 9.97 0 002.458 12C3.732 16.057 7.523 19 12 19c.705 0 1.392-.073 2.055-.212" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* OPTIONS */}
              <div className="flex items-center justify-between pt-1 pb-2">
                <label className="flex items-center gap-2.5 text-sm text-slate-500 select-none cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 rounded-md border border-slate-300 bg-slate-50 peer-checked:bg-violet-600 peer-checked:border-violet-600 transition-all duration-200 shadow-sm group-hover:border-violet-400"></div>
                    <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200 scale-50 peer-checked:scale-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="group-hover:text-slate-700 transition-colors">Ingat saya</span>
                </label>
                
                <a href="#" className="text-sm font-medium text-violet-600 hover:text-violet-500 transition-colors">
                  Lupa Password?
                </a>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-xl bg-violet-600 px-4 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-violet-500/30 transition-all duration-300 hover:shadow-violet-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
                
                <div className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Sistem</span>
                      <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </div>
              </button>
            </form>

            <footer className="mt-6 md:mt-12 text-center md:text-left text-xs font-medium text-slate-400">
              &copy; {new Date().getFullYear()} Great HRD System. All rights reserved.
            </footer>
          </div>
        </div>

        {/* RIGHT: IMAGE SECTION (Hidden on mobile) */}
        <div className="relative hidden w-1/2 md:block overflow-hidden bg-slate-100">
          {/* Subtle overlay gradient to blend image with theme */}
          <div className="absolute inset-0 z-10 bg-gradient-to-l from-transparent via-transparent to-white/40"></div>
          
          <Image
            src="/assets/pak_ceo.webp"
            alt="Hero CEO"
            fill
            priority
            className="object-cover object-[center_20%] scale-[1.02] transition-transform duration-1000 hover:scale-105"
            sizes="(max-width: 768px) 0vw, 50vw"
          />
          
          {/* Decorative elements over image */}
          <div className="absolute bottom-12 right-12 z-20 max-w-sm rounded-2xl bg-white/90 backdrop-blur-md border border-white/50 p-6 shadow-xl">
            <div className="flex items-center gap-4 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-slate-900 font-semibold">HR Excellence</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              &quot;Membangun tim yang solid dan profesional untuk masa depan yang lebih baik.&quot;
            </p>
          </div>
        </div>
      </div>
      
      {/* Custom Keyframes for Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}} />
    </div>
  );
}
