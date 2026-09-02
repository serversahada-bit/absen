'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, CalendarClock, User, LogOut } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  const navItems = [
    { id: 'home',  label: 'Home',  icon: Home,          href: '/dashboard' },
    { id: 'izin',  label: 'Izin',  icon: CalendarClock, href: '/izin' },
    { id: 'profil', label: 'Profil', icon: User,         href: '/profil' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="mb-5 mx-5 max-w-[360px] w-full pointer-events-auto">
        <div className="bg-white/90 backdrop-blur-xl border border-violet-100 shadow-[0_-4px_30px_rgba(124,58,237,0.10)] rounded-[28px] px-4 py-3 flex items-center">
          {/* Nav items */}
          <div className="flex items-center gap-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-2xl transition-all duration-200"
                >
                  <div className={`relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-200 ${isActive ? 'bg-gradient-to-br from-violet-600 to-purple-600 shadow-[0_4px_14px_rgba(124,58,237,0.4)]' : 'bg-transparent hover:bg-violet-50'}`}>
                    <Icon
                      className={`w-5 h-5 transition-all duration-200 ${isActive ? 'text-white' : 'text-slate-400'}`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </div>
                  <span className={`text-[9px] font-bold tracking-wide transition-all duration-200 ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="w-px h-10 bg-slate-100 mx-2" />

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-2xl hover:bg-rose-50 transition-all duration-200 group"
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-2xl">
              <LogOut className="w-5 h-5 text-slate-400 group-hover:text-rose-500 transition-colors" strokeWidth={2} />
            </div>
            <span className="text-[9px] font-bold text-slate-400 group-hover:text-rose-500 transition-colors tracking-wide">Keluar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
