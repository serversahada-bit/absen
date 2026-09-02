'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LogOut } from 'lucide-react';
import LiveStatusBadge from '@/components/LiveStatusBadge';

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  const isHomeActive = pathname === '/dashboard';

  return (
    <header className="hidden lg:block sticky top-0 z-40 w-full bg-white/90 backdrop-blur-xl border-b border-violet-100">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-6 px-8 h-[72px]">
        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-sm border border-violet-100">
            <Image src="/sasdw.png" alt="Logo" width={26} height={26} className="object-contain" unoptimized />
          </div>
          <span className="text-[15px] font-black text-slate-900 tracking-tight">Great HRD</span>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          <Link
            href="/dashboard"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-bold whitespace-nowrap transition-all duration-200 ${
              isHomeActive
                ? 'bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-[0_6px_16px_rgba(124,58,237,0.35)]'
                : 'text-slate-500 hover:bg-violet-50 hover:text-violet-700'
            }`}
          >
            <Home className="w-4 h-4" strokeWidth={2.25} />
            Home
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          <LiveStatusBadge />
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Keluar"
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200 border border-violet-100"
          >
            <LogOut className="w-4 h-4" strokeWidth={2.25} />
          </button>
        </div>
      </div>
    </header>
  );
}
