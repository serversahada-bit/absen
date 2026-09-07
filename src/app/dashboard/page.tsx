import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { isManagerRole, isNotifikasiAdminRole } from '@/lib/roles';
import TopBar from '@/components/dashboard/TopBar';
import CalendarStrip from '@/components/dashboard/CalendarStrip';
import StatusCards from '@/components/dashboard/StatusCards';
import DigitalClock from '@/components/dashboard/DigitalClock';
import QuickMenu from '@/components/dashboard/QuickMenu';
import Timeline from '@/components/dashboard/Timeline';
import { Building2, ArrowUpRight } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { nowJakarta, formatJakartaDate, jakartaDayOfWeek, jakartaSubDaysString, jakartaMonthDaySubDays } from '@/lib/time';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/');
  }

  const userId = session.user_id;

  // 1. CEK DATA USER
  const userRows: any = await query('SELECT nama, jabatan, organisasi, foto, peran FROM karyawan WHERE id = ? LIMIT 1', [userId]);
  if (!userRows || userRows.length === 0) {
    redirect('/');
  }
  
  const userData = userRows[0];
  const user = {
    name: userData.nama || '',
    role: userData.jabatan || '',
    photoUrl: userData.foto ? `/uploads/${userData.foto}` : undefined,
  };

  const isManager = isManagerRole(userData.peran, userData.jabatan);
  const canNotifikasi = isNotifikasiAdminRole(userData.jabatan);

  const nowWib = nowJakarta();

  // 2. JADWAL SHIFT
  const dow = jakartaDayOfWeek(nowWib); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  let shiftLabel = 'Minggu';
  let shiftMasuk = '08:00';
  let shiftPulang = '16:15';
  
  if (dow >= 1 && dow <= 4) {
    shiftLabel = 'Senin - Kamis';
  } else if (dow === 5) {
    shiftLabel = 'Jumat';
    shiftPulang = '16:00';
  } else if (dow === 6) {
    shiftLabel = 'Sabtu';
    shiftPulang = '12:00';
  }

  const shift = {
    isOff: false, // Minggu tidak libur lagi sesuai instruksi
    timeIn: shiftMasuk,
    timeOut: shiftPulang,
    label: shiftLabel,
  };

  // 3. CEK PRESENSI
  const todayStr = formatJakartaDate(nowWib);
  const absenRows: any = await query('SELECT jam_masuk, jam_pulang, status FROM presensi WHERE karyawan_id = ? AND tanggal = ? LIMIT 1', [userId, todayStr]);
  const dataAbsen = absenRows && absenRows.length > 0 ? absenRows[0] : null;

  let attStatus: 'belum' | 'masuk' | 'selesai' = 'belum';
  let attTimeIn = '--:--';
  let attDesc = 'Belum absen';
  let attBadge: 'Tepat Waktu' | 'Terlambat' | 'Di Kantor' | 'Selesai' | undefined = undefined;

  if (dataAbsen) {
    if (dataAbsen.jam_masuk) {
      attTimeIn = dataAbsen.jam_masuk.substring(0, 5); // "08:15:00" -> "08:15"
      attDesc = 'Tercatat';
      attStatus = 'masuk';
      
      const statusDB = dataAbsen.status || '';
      if (statusDB === 'Tepat Waktu') attBadge = 'Tepat Waktu';
      if (statusDB === 'Terlambat') attBadge = 'Terlambat';
    }

    if (dataAbsen.jam_pulang) {
      attStatus = 'selesai';
      attBadge = 'Selesai';
    }
  }

  const attendance = {
    status: attStatus,
    timeIn: attTimeIn,
    description: attDesc,
    badge: attBadge,
  };

  // 4. NOTIFIKASI PENDING (MANAGER)
  let pendingIzinCount = 0;
  let pendingLemburCount = 0;

  if (isManager) {
    const izinRows: any = await query(`
      SELECT COUNT(*) AS c FROM pengajuan_izin i 
      JOIN tim_saya ts ON ts.anggota_id = i.karyawan_id 
      WHERE ts.manager_id = ? AND i.manager_status = 'Pending'
    `, [userId]);
    pendingIzinCount = izinRows?.[0]?.c || 0;

    const lemburRows: any = await query(`
      SELECT COUNT(*) AS c FROM lembur l 
      JOIN tim_saya ts ON ts.anggota_id = l.karyawan_id 
      WHERE ts.manager_id = ? AND l.manager_status = 'PENDING'
    `, [userId]);
    pendingLemburCount = lemburRows?.[0]?.c || 0;
  }

  // 5. TIMELINE (6 Hari Kebelakang)
  const timelineByDate: Record<string, any[]> = {};
  for (let i = 0; i < 6; i++) {
    const d = jakartaSubDaysString(i, nowWib);
    timelineByDate[d] = [];
  }

  // Ultah Timeline
  const ultahRows: any = await query(`SELECT id, nama, tanggal_lahir FROM karyawan WHERE status_karyawan != 'Non-Aktif' AND tanggal_lahir IS NOT NULL AND tanggal_lahir != '0000-00-00'`);

  if (ultahRows) {
    ultahRows.forEach((row: any) => {
      const birth = new Date(row.tanggal_lahir);
      for (let i = 0; i < 6; i++) {
        const { month: targetMonth, day: targetDay } = jakartaMonthDaySubDays(i, nowWib);
        if (targetMonth === birth.getMonth() + 1 && targetDay === birth.getDate()) {
          const dStr = jakartaSubDaysString(i, nowWib);
          if (timelineByDate[dStr]) {
            timelineByDate[dStr].push({
              id: 'ultah_' + row.id,
              type: 'ultah',
              title: row.nama,
              comments: [], // Todo: fetch comments
            });
          }
        }
      }
    });
  }

  // Cuti/Izin Timeline (SEMUA ORANG melihat yang disetujui)
  const approvedIzinRows: any = await query(`
    SELECT i.id, i.mulai_tanggal, i.sampai_tanggal, i.tipe_izin, k.nama 
    FROM pengajuan_izin i 
    JOIN karyawan k ON k.id = i.karyawan_id
    WHERE (i.status = 'Disetujui' OR i.manager_status = 'Disetujui')
      AND i.sampai_tanggal >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      AND k.status_karyawan != 'Non-Aktif'
  `);

  if (approvedIzinRows) {
    approvedIzinRows.forEach((row: any) => {
      let current = new Date(row.mulai_tanggal);
      const end = new Date(row.sampai_tanggal);
      while (current <= end) {
        const dStr = format(current, 'yyyy-MM-dd');
        if (timelineByDate[dStr]) {
          timelineByDate[dStr].push({
            id: 'izin_' + row.id + '_' + dStr,
            type: 'izin',
            title: row.nama,
            subtitle: row.tipe_izin,
            meta: `${format(new Date(row.mulai_tanggal), 'dd MMM yyyy', {locale: id})} – ${format(new Date(row.sampai_tanggal), 'dd MMM yyyy', {locale: id})}`,
            badge: 'Disetujui'
          });
        }
        current = addDays(current, 1);
      }
    });
  }

  // Manager: TAMBAHAN Izin pending anggota tim
  if (isManager) {
    const teamIzinRows: any = await query(`
      SELECT i.id, i.mulai_tanggal, i.sampai_tanggal, i.tipe_izin, k.nama 
      FROM pengajuan_izin i 
      JOIN tim_saya ts ON ts.anggota_id = i.karyawan_id
      JOIN karyawan k ON k.id = i.karyawan_id
      WHERE ts.manager_id = ? AND i.manager_status = 'Pending'
        AND k.status_karyawan != 'Non-Aktif'
    `, [userId]);

    if (teamIzinRows) {
      teamIzinRows.forEach((row: any) => {
        let current = new Date(row.mulai_tanggal);
        const end = new Date(row.sampai_tanggal);
        while (current <= end) {
          const dStr = format(current, 'yyyy-MM-dd');
          if (timelineByDate[dStr]) {
            timelineByDate[dStr].push({
              id: 'izin_pending_' + row.id + '_' + dStr,
              type: 'izin',
              title: row.nama,
              subtitle: row.tipe_izin,
              meta: `${format(new Date(row.mulai_tanggal), 'dd MMM yyyy', {locale: id})} – ${format(new Date(row.sampai_tanggal), 'dd MMM yyyy', {locale: id})}`,
              badge: 'Pending'
            });
          }
          current = addDays(current, 1);
        }
      });
    }
  }

  // Format ke bentuk Array prop untuk Timeline
  const timelineDays = Object.keys(timelineByDate)
    .sort((a, b) => b.localeCompare(a)) // Sort Descending
    .map(date => ({
      date,
      items: timelineByDate[date]
    }));

  return (
    <div className="lg:px-8 lg:pt-6">
      <div className="lg:hidden">
        <TopBar />
      </div>

      {/*
        Mobile: everything stacks in plain DOM order (top to bottom, unchanged look).
        Desktop: 2-column grid — main column (col 1, rows 1-3) vs. one sidebar column
        (col 2) that spans all 3 rows and stays sticky while the main column scrolls.
        Each item only ever claims ONE grid cell, so nothing can overlap.
      */}
      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-6 lg:items-start">
        <div className="lg:col-start-1 lg:row-start-1">
          <StatusCards
            user={user}
            attendance={attendance}
            shift={shift}
          />
        </div>

        <div className="lg:col-start-1 lg:row-start-2">
          <DigitalClock
            status={attendance.status}
            isOff={shift.isOff}
            timeIn={shift.timeIn}
            timeOut={shift.timeOut}
          />
        </div>

        {/* Sidebar: calendar + quick menu. Sits early on mobile, sticky beside content on desktop. */}
        <div className="lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:sticky lg:top-6 lg:space-y-6">
          <CalendarStrip />
          <QuickMenu
            isManager={isManager}
            canNotifikasi={canNotifikasi}
            pendingIzinCount={pendingIzinCount}
            pendingLemburCount={pendingLemburCount}
          />

          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center justify-between gap-3 bg-gradient-to-br from-violet-600 to-purple-600 rounded-[24px] p-5 shadow-[0_10px_30px_rgba(124,58,237,0.25)] hover:shadow-[0_14px_36px_rgba(124,58,237,0.35)] transition-all duration-300 group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-black text-white leading-tight truncate">Masuk ke ERP</p>
                <p className="text-[10px] font-semibold text-violet-200 mt-0.5">Sistem ERP Perusahaan</p>
              </div>
            </div>
            <ArrowUpRight
              className="w-4 h-4 text-violet-200 shrink-0 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200"
              strokeWidth={2.5}
            />
          </a>
        </div>

        <div className="lg:col-start-1 lg:row-start-3">
          <Timeline
            isManager={isManager}
            days={timelineDays}
          />
        </div>
      </div>
    </div>
  );
}
