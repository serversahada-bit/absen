import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { isNotifikasiAdminRole } from '@/lib/roles';
import AppShell from '@/components/AppShell';
import BackLink from '@/components/BackLink';
import { ArrowLeft } from 'lucide-react';
import NotifikasiBroadcastForm from './NotifikasiBroadcastForm';

export const dynamic = 'force-dynamic';

export default async function NotifikasiPage() {
  const session = await getSession();
  if (!session) {
    redirect('/');
  }

  const meRows: any = await query('SELECT jabatan FROM karyawan WHERE id = ? LIMIT 1', [session.user_id]);
  const me = meRows?.[0] || {};

  if (!isNotifikasiAdminRole(me.jabatan)) {
    redirect('/dashboard');
  }

  return (
    <AppShell>
      <div className="bg-white/80 backdrop-blur-xl px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-4 sticky top-0 z-40 border-b border-slate-100">
        <BackLink>
          <a
            href="/dashboard"
            className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition active:scale-95 text-slate-500 border border-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </a>
        </BackLink>
        <h1 className="font-black text-[17px] text-slate-900 tracking-tight">Kirim Notifikasi</h1>
      </div>

      <div className="p-5 max-w-lg mx-auto">
        <p className="text-sm text-slate-500 mb-5 leading-relaxed">
          Notifikasi akan dikirim ke semua karyawan yang sudah mengaktifkan notifikasi di perangkat mereka.
        </p>
        <NotifikasiBroadcastForm />
      </div>
    </AppShell>
  );
}
