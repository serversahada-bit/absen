import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import AppShell from '@/components/AppShell';
import BackLink from '@/components/BackLink';
import { ArrowLeft } from 'lucide-react';
import ProfilForm from './ProfilForm';

export const dynamic = 'force-dynamic';

export default async function ProfilPage() {
  const session = await getSession();
  if (!session) {
    redirect('/');
  }

  const rows: any = await query(
    'SELECT nama, jabatan, email, no_hp, foto FROM karyawan WHERE id = ? LIMIT 1',
    [session.user_id]
  );
  const data = rows?.[0];
  if (!data) {
    redirect('/dashboard');
  }

  return (
    <AppShell maxWidth="lg:max-w-2xl">
      <div className="bg-white/80 backdrop-blur-xl px-5 py-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center gap-4 sticky top-0 z-40 border-b border-slate-100">
        <BackLink>
          <a
            href="/dashboard"
            className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition active:scale-95 text-slate-500 border border-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </a>
        </BackLink>
        <h1 className="font-black text-[17px] text-slate-900 tracking-tight">Profil Saya</h1>
      </div>

      <div className="max-w-md mx-auto p-5">
        <ProfilForm
          nama={data.nama || ''}
          jabatan={data.jabatan || ''}
          email={data.email || ''}
          noHp={data.no_hp || ''}
          fotoUrl={data.foto ? `/uploads/${data.foto}` : undefined}
        />
      </div>
    </AppShell>
  );
}
