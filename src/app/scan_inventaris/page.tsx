import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/lib/auth';
import AppShell from '@/components/AppShell';
import BackLink from '@/components/BackLink';
import ScanInventarisClient from './ScanInventarisClient';

export const dynamic = 'force-dynamic';

export default async function ScanInventarisPage() {
  const session = await getSession();
  if (!session) {
    redirect('/');
  }

  return (
    <AppShell maxWidth="lg:max-w-2xl">
      <div className="text-slate-900 font-sans selection:bg-violet-200">
        {/* HEADER */}
        <div className="bg-white/80 backdrop-blur-xl px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-3 sticky top-0 z-40 border-b border-slate-100">
          <BackLink>
            <Link
              href="/dashboard"
              className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition active:scale-95 text-slate-500 border border-slate-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </BackLink>
          <div>
            <h1 className="font-black text-[17px] text-slate-900 tracking-tight leading-none">Scan Inventaris</h1>
            <p className="text-[11px] font-semibold text-slate-400 mt-1">Arahkan kamera ke QR Code aset</p>
          </div>
        </div>

        <div className="max-w-md mx-auto p-5">
          <ScanInventarisClient />
        </div>
      </div>
    </AppShell>
  );
}
