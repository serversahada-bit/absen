'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitMengajiAction, submitIzinAction, clearIzinAction } from './actions';
import { ArrowLeft, BookOpen, AlertCircle, CheckCircle2, History, ChevronRight, XCircle } from 'lucide-react';
import AppShell from '@/components/AppShell';

interface FlashMsg {
  ok: boolean;
  title: string;
  desc: string;
}

export default function HabitQClient({
  user,
  todayCount,
  todaySessions,
  isIzinToday,
  izinRow,
  riwayat
}: any) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [flash, setFlash] = useState<FlashMsg | null>(null);

  const lockInput = isIzinToday;
  const lockIzin = todayCount > 0;

  const handleAction = async (actionFn: any, formData?: FormData) => {
    setFlash(null);
    startTransition(async () => {
      const result = await actionFn(formData || new FormData());
      if (result) {
        setFlash(result);
        if (result.ok) {
          // Reset form on success (we can do this by reloading route or ref)
          const forms = document.querySelectorAll('form');
          forms.forEach(f => f.reset());
        }
      }
    });
  };

  function initials(name: string) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    const a = parts[0]?.charAt(0).toUpperCase() || '';
    const b = parts[1]?.charAt(0).toUpperCase() || '';
    return b ? a + b : name.substring(0, 2).toUpperCase();
  }

  function getIzinLabel(jenis: string) {
    if (jenis === 'HAID') return 'Haid';
    if (jenis === 'SAKIT') return 'Sakit';
    if (jenis === 'DINAS') return 'Dinas';
    if (jenis === 'CUTI') return 'Cuti';
    return 'Izin Lain';
  }

  return (
    <AppShell maxWidth="lg:max-w-2xl">
      <div className="mx-auto flex max-w-md flex-col px-5 pt-6 lg:px-0 relative space-y-5">

        {/* HEADER */}
        <div className="rounded-[28px] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            {user.foto ? (
              <img src={user.foto} className="h-12 w-12 rounded-full object-cover ring-4 ring-violet-50" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-sm uppercase ring-4 ring-violet-50">
                {initials(user.nama)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">HabitQ</p>
              <p className="text-[15px] font-bold text-slate-900 truncate leading-tight mt-0.5">{user.nama}</p>
              <p className="text-[11px] font-semibold text-slate-500 truncate">{user.jabatan} • {user.perusahaan}</p>
            </div>
          </div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* FLASH TOAST */}
        {flash && (
          <div className={`rounded-2xl p-4 flex items-start gap-3 shadow-lg animate-fade-in-up border ${flash.ok ? 'bg-emerald-500 border-emerald-400 shadow-emerald-500/20' : 'bg-rose-500 border-rose-400 shadow-rose-500/20'}`}>
            {flash.ok ? <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-white shrink-0 mt-0.5" />}
            <div>
              <h3 className="text-sm font-bold text-white">{flash.title}</h3>
              <p className="text-[13px] font-medium text-white/90 leading-snug mt-0.5">{flash.desc}</p>
            </div>
            <button onClick={() => setFlash(null)} className="ml-auto text-white/50 hover:text-white">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* INPUT MENGAJI CARD */}
        <div className="rounded-[32px] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 rounded-bl-full -z-0 opacity-50 pointer-events-none" />
          
          <div className="flex items-center justify-between gap-3 relative z-10 mb-4">
            <div>
              <h2 className="text-[15px] font-black text-slate-900">Catatan Mengaji</h2>
              <p className="text-[12px] font-semibold text-slate-500 mt-1">
                Sesi hari ini: <strong className="text-violet-600">{todayCount}</strong>
              </p>
            </div>
            {isIzinToday ? (
              <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 text-[10px] font-black tracking-widest uppercase shadow-sm">
                Izin
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-[10px] font-black tracking-widest uppercase shadow-sm">
                Aktif
              </span>
            )}
          </div>

          {todayCount > 0 && (
            <div className="mb-5 space-y-2 relative z-10">
              {todaySessions.slice(0, 3).map((s: any) => (
                <div key={s.id} className="rounded-xl bg-slate-50/50 border border-slate-100 px-4 py-2.5 flex justify-between items-center">
                  <span className="text-[13px] font-bold text-slate-700">
                    Juz <span className="text-violet-600">{s.juz}</span> • Hal {s.halaman_mulai}-{s.halaman_selesai}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">{new Date(s.created_at).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span>
                </div>
              ))}
              {todayCount > 3 && (
                <div className="text-[11px] font-semibold text-slate-400 text-center">+{todayCount - 3} sesi lainnya</div>
              )}
            </div>
          )}

          <form 
            action={(fd) => handleAction(submitMengajiAction, fd)} 
            className="space-y-4 relative z-10"
          >
            {lockInput && (
              <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center p-6 text-center border border-white/50">
                <p className="text-xs font-bold text-slate-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                  Input terkunci (Status IZIN).<br/>Batalkan izin di bawah jika ingin input.
                </p>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Juz Berapa?</label>
              <input type="number" name="juz" min="1" max="30" required disabled={lockInput}
                     className="mt-1.5 w-full rounded-2xl border-0 bg-slate-50 ring-1 ring-inset ring-slate-200 px-4 py-3.5 text-[15px] font-bold text-slate-900 focus:ring-2 focus:ring-inset focus:ring-violet-600 transition-all placeholder:font-normal placeholder:text-slate-400 disabled:opacity-50"
                     placeholder="Contoh: 2" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Hal Mulai</label>
                <input type="number" name="halaman_mulai" min="1" max="604" required disabled={lockInput}
                       className="mt-1.5 w-full rounded-2xl border-0 bg-slate-50 ring-1 ring-inset ring-slate-200 px-4 py-3.5 text-[15px] font-bold text-slate-900 focus:ring-2 focus:ring-inset focus:ring-violet-600 transition-all placeholder:font-normal placeholder:text-slate-400 disabled:opacity-50"
                       placeholder="120" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Hal Selesai</label>
                <input type="number" name="halaman_selesai" min="1" max="604" required disabled={lockInput}
                       className="mt-1.5 w-full rounded-2xl border-0 bg-slate-50 ring-1 ring-inset ring-slate-200 px-4 py-3.5 text-[15px] font-bold text-slate-900 focus:ring-2 focus:ring-inset focus:ring-violet-600 transition-all placeholder:font-normal placeholder:text-slate-400 disabled:opacity-50"
                       placeholder="125" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Keterangan (Opsional)</label>
              <input type="text" name="keterangan" maxLength={255} disabled={lockInput}
                     className="mt-1.5 w-full rounded-2xl border-0 bg-slate-50 ring-1 ring-inset ring-slate-200 px-4 py-3.5 text-[14px] font-medium text-slate-900 focus:ring-2 focus:ring-inset focus:ring-violet-600 transition-all placeholder:text-slate-400 disabled:opacity-50"
                     placeholder="Cth: Selesai setelah ashar" />
            </div>

            <button 
              disabled={lockInput || isPending}
              className="w-full mt-2 rounded-[20px] bg-violet-600 text-white py-4 text-[14px] font-black tracking-wide shadow-[0_8px_20px_rgba(124,58,237,0.3)] hover:bg-violet-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isPending ? (
                 <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><BookOpen className="w-5 h-5" /> SIMPAN SESI MENGAJI</>
              )}
            </button>
          </form>
        </div>

        {/* IZIN CARD */}
        {isIzinToday ? (
          <div className="rounded-[32px] bg-amber-50 border border-amber-100 p-6 shadow-sm relative overflow-hidden">
             <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 mb-3">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-[15px] font-black text-amber-900">Status Izin Aktif</h3>
                <p className="text-[13px] font-semibold text-amber-700 mt-1">Jenis: {getIzinLabel(izinRow?.jenis)}</p>
                {izinRow?.keterangan && (
                  <p className="text-[12px] font-medium text-amber-600/80 mt-1">"{izinRow.keterangan}"</p>
                )}
                
                <form action={() => handleAction(clearIzinAction)} className="w-full mt-5">
                  <button disabled={isPending} className="w-full py-3.5 rounded-2xl bg-white text-amber-700 font-bold text-sm border border-amber-200 shadow-sm hover:bg-amber-100 active:scale-95 transition-all">
                    {isPending ? 'Membatalkan...' : 'Batalkan Izin'}
                  </button>
                </form>
             </div>
          </div>
        ) : (
          <div className="rounded-[32px] bg-white border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h2 className="text-[15px] font-black text-slate-900">Halangan Hari Ini?</h2>
            <p className="text-[12px] font-semibold text-slate-500 mt-1 leading-relaxed">
              Ajukan izin jika berhalangan (haid, sakit, cuti). Input mengaji akan dikunci hari ini.
            </p>
            {lockIzin && (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-500 text-center">
                Tidak bisa izin karena Anda sudah input mengaji hari ini.
              </div>
            )}

            <form action={(fd) => handleAction(submitIzinAction, fd)} className="mt-5 space-y-4 relative">
              {lockIzin && <div className="absolute inset-0 z-10" />}
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Jenis</label>
                  <select name="jenis" disabled={lockIzin}
                    className="mt-1.5 w-full rounded-2xl border-0 bg-slate-50 ring-1 ring-inset ring-slate-200 px-4 py-3.5 text-[14px] font-bold text-slate-900 focus:ring-2 focus:ring-inset focus:ring-amber-500 transition-all disabled:opacity-50">
                    <option value="HAID">Haid</option>
                    <option value="SAKIT">Sakit</option>
                    <option value="DINAS">Dinas</option>
                    <option value="CUTI">Cuti</option>
                    <option value="LAIN">Izin Lain</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Keterangan</label>
                  <input name="keterangan" maxLength={255} disabled={lockIzin}
                         className="mt-1.5 w-full rounded-2xl border-0 bg-slate-50 ring-1 ring-inset ring-slate-200 px-4 py-3.5 text-[14px] font-medium text-slate-900 focus:ring-2 focus:ring-inset focus:ring-amber-500 transition-all placeholder:text-slate-400 disabled:opacity-50"
                         placeholder="Opsional" />
                </div>
              </div>

              <button 
                disabled={lockIzin || isPending}
                className="w-full rounded-[20px] bg-amber-500 text-white py-4 text-[14px] font-black tracking-wide shadow-[0_8px_20px_rgba(245,158,11,0.3)] hover:bg-amber-600 active:scale-[0.98] disabled:opacity-50 transition-all"
              >
                {isPending ? 'MENGIRIM...' : 'AJUKAN IZIN'}
              </button>
            </form>
          </div>
        )}

        {/* RIWAYAT */}
        <div className="rounded-[32px] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6">
          <div className="flex items-center justify-between mb-5">
             <div className="flex items-center gap-2">
               <History className="w-5 h-5 text-slate-400" />
               <h2 className="text-[15px] font-black text-slate-900">Riwayat</h2>
             </div>
             <span className="text-[11px] font-bold text-slate-400">30 Terakhir</span>
          </div>

          {riwayat.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs font-bold">Belum ada riwayat.</div>
          ) : (
            <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-[19px] before:w-0.5 before:bg-slate-100">
              {riwayat.map((r: any, idx: number) => {
                const isMengaji = r.tipe === 'MENGAJI';
                return (
                  <div key={idx} className="relative flex gap-4 items-start group">
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center relative z-10 border-[3px] border-white shadow-sm transition-transform group-hover:scale-110 ${isMengaji ? 'bg-violet-100 text-violet-600' : 'bg-amber-100 text-amber-500'}`}>
                      {isMengaji ? <BookOpen className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-3.5 group-hover:border-slate-200 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {new Date(r.tanggal).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}
                          </span>
                          {isMengaji ? (
                            <h4 className="text-[13px] font-black text-slate-900 mt-1">Juz {r.juz} <span className="text-slate-400 font-semibold mx-1">•</span> Hal {r.halaman_mulai}-{r.halaman_selesai}</h4>
                          ) : (
                            <h4 className="text-[13px] font-black text-slate-900 mt-1">Izin: {getIzinLabel(r.izin_jenis)}</h4>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100">
                           {new Date(r.created_at).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      {r.keterangan && (
                        <p className="text-[12px] font-semibold text-slate-500 mt-1.5 leading-relaxed bg-white/50 px-2 py-1 rounded-lg border border-slate-50">
                          {r.keterangan}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </AppShell>
  );
}
