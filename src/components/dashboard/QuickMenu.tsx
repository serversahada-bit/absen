'use client';

import React from 'react';
import Link from 'next/link';
import { useNavModal } from '@/components/NavModalContext';
import {
  Sparkles, 
  History, 
  CalendarCheck, 
  PlusSquare, 
  Briefcase, 
  Users, 
  BookOpen,
  CheckSquare,
  Clock
} from 'lucide-react';

interface QuickMenuProps {
  isManager: boolean;
  pendingIzinCount: number;
  pendingLemburCount: number;
}

const baseMenuItems = [
  {
    id: 'habitq',
    label: 'HabitQ',
    icon: Sparkles,
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    href: '/habitq',
  },
  {
    id: 'riwayat',
    label: 'Riwayat',
    icon: History,
    iconColor: 'text-orange-400',
    bgColor: 'bg-orange-50',
    href: '/riwayat',
  },
  {
    id: 'izin',
    label: 'Izin',
    icon: CalendarCheck,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50',
    href: '/riwayat_izin',
  },
  {
    id: 'pengajuan',
    label: 'Pengajuan',
    icon: PlusSquare,
    iconColor: 'text-teal-500',
    bgColor: 'bg-teal-50',
    href: 'https://finance.ptslu.id/',
  },
  {
    id: 'lembur',
    label: 'Lembur',
    icon: Briefcase,
    iconColor: 'text-rose-400',
    bgColor: 'bg-rose-50',
    href: '/lembur',
  },
  {
    id: 'karyawan',
    label: 'Karyawan',
    icon: Users,
    iconColor: 'text-violet-500',
    bgColor: 'bg-violet-50',
    href: '/karyawan',
  },
  {
    id: 'peraturan',
    label: 'Peraturan',
    icon: BookOpen,
    iconColor: 'text-slate-400',
    bgColor: 'bg-slate-100',
    href: '/peraturan',
  },
];

const managerOnlyItems = [
  {
    id: 'app_izin',
    label: 'App. Izin',
    icon: CheckSquare,
    iconColor: 'text-pink-500',
    bgColor: 'bg-pink-50',
    href: '/aproval_izin',
  },
  {
    id: 'app_lembur',
    label: 'App. Lembur',
    icon: Clock,
    iconColor: 'text-cyan-500',
    bgColor: 'bg-cyan-50',
    href: '/aproval_lembur',
  },
];

export default function QuickMenu({ isManager, pendingIzinCount, pendingLemburCount }: QuickMenuProps) {
  const openModal = useNavModal();
  const menuItems = isManager
    ? [...baseMenuItems, ...managerOnlyItems]
    : baseMenuItems;

  const isExternal = (href: string) => href.startsWith('http://') || href.startsWith('https://');

  const handleClick = (e: React.MouseEvent, item: { href: string; label: string }) => {
    if (item.href === '#' || isExternal(item.href)) return;
    // Popup on desktop; normal navigation on mobile (no popup UI there).
    if (window.matchMedia('(min-width: 1024px)').matches) {
      e.preventDefault();
      openModal(item.href, item.label);
    }
  };

  return (
    <div className="px-5 lg:px-0 pt-2 pb-4 animate-fade-in-up [animation-delay:360ms] h-full">
      <div className="h-full lg:bg-white lg:rounded-[28px] lg:border lg:border-violet-100 lg:shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:p-5">
      <div className="grid grid-cols-4 lg:grid-cols-3 gap-x-3 gap-y-5">
        {menuItems.map((item, idx) => {
          let badgeCount = 0;
          if (item.id === 'app_izin') badgeCount = pendingIzinCount;
          if (item.id === 'app_lembur') badgeCount = pendingLemburCount;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={(e) => handleClick(e, item)}
              target={isExternal(item.href) ? '_blank' : undefined}
              rel={isExternal(item.href) ? 'noopener noreferrer' : undefined}
              className="flex flex-col items-center gap-2 group"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              {/* Icon Card */}
              <div className={`relative w-[60px] h-[60px] rounded-[18px] flex items-center justify-center ${item.bgColor} transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md`}>
                <item.icon
                  className={`w-6 h-6 ${item.iconColor} transition-transform duration-300 group-hover:scale-110`}
                  strokeWidth={1.8}
                />
                {badgeCount > 0 && (
                  <div className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-black min-w-[18px] h-[18px] px-1.5 rounded-full flex items-center justify-center border-2 border-[#fbfaff] shadow-sm">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </div>
                )}
              </div>

              {/* Label */}
              <span className="text-[11px] font-semibold text-slate-600 text-center leading-tight group-hover:text-slate-900 transition-colors">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      </div>
    </div>
  );
}
