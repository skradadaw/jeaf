'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import toast from 'react-hot-toast';
import DashboardCard from '@/components/DashboardCard';
import { supabase } from '@/lib/supabase';

type Registration = {
  id: string;
  created_at: string;
  no_peserta: string | null;
  nama_anak: string;
  asal_sekolah: string;
  cabang_lomba: string;
  status_kehadiran: string | null;
  waktu_kehadiran: string | null;
};

type AttendanceFilter = 'hadir' | 'belum' | 'semua';

type AttendanceToggleProps = {
  participantName: string;
  isPresent: boolean;
  isPending: boolean;
  onToggle: () => void;
};

const AttendanceToggle = ({ participantName, isPresent, isPending, onToggle }: AttendanceToggleProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={isPresent}
      aria-label={`${isPresent ? 'Batalkan kehadiran' : 'Tandai hadir'} untuk ${participantName}`}
      disabled={isPending}
      onClick={onToggle}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
      className={`relative inline-flex h-9 min-w-28 items-center rounded-full border px-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 ${isPresent ? 'border-emerald-600 bg-emerald-500 text-white' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`}
    >
      <motion.span
        initial={false}
        animate={{ x: isPresent ? 72 : 0, scale: isPending ? 0.9 : 1 }}
        transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 32 }}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-sm ${isPresent ? 'bg-white text-emerald-600' : 'bg-slate-100 text-slate-500'}`}
      >
        <i className={`fa-solid ${isPending ? 'fa-circle-notch fa-spin' : isPresent ? 'fa-check' : 'fa-minus'} text-[10px]`} aria-hidden="true"></i>
      </motion.span>
      <span className={`absolute text-[10px] font-extrabold ${isPresent ? 'left-3' : 'right-3'}`}>
        {isPending ? 'Menyimpan' : isPresent ? 'Hadir' : 'Belum'}
      </span>
    </motion.button>
  );
};

const getCategoryStyle = (category: string) => {
  switch (category) {
    case 'Adzan': return 'border-indigo-200 bg-indigo-50 text-indigo-700';
    case 'Fashion Show': return 'border-rose-200 bg-rose-50 text-rose-700';
    case 'MHQ': return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'Karya Kolase': return 'border-orange-200 bg-orange-50 text-orange-700';
    case 'Mewarnai': return 'border-amber-200 bg-amber-50 text-amber-800';
    case 'Tendangan Penalti': return 'border-sky-200 bg-sky-50 text-sky-700';
    case 'Menyanyi Solo': return 'border-purple-200 bg-purple-50 text-purple-700';
    default: return 'border-slate-200 bg-slate-50 text-slate-600';
  }
};

const formatAttendanceTime = (value: string | null) => {
  if (!value) return { date: '-', time: '-' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '-', time: '-' };
  return {
    date: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  };
};

export default function LiveAttendancePage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [databaseError, setDatabaseError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<AttendanceFilter>('hadir');
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [updatingAttendanceIds, setUpdatingAttendanceIds] = useState<Set<string>>(() => new Set());
  const [animatingAttendanceRows, setAnimatingAttendanceRows] = useState<Record<string, AttendanceFilter>>({});
  const animationTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    let active = true;

    const fetchRegistrations = async () => {
      const { data, error } = await supabase
        .from('pendaftar')
        .select('id, created_at, no_peserta, nama_anak, asal_sekolah, cabang_lomba, status_kehadiran, waktu_kehadiran')
        .order('created_at', { ascending: false });

      if (!active) return;
      if (error) {
        setDatabaseError('Data absensi gagal dimuat: ' + error.message);
      } else {
        setRegistrations((data || []) as Registration[]);
        setDatabaseError('');
      }
      setLoading(false);
    };

    void fetchRegistrations();

    const channel = supabase
      .channel('live-attendance-pendaftar')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pendaftar' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id as string;
            setRegistrations((current) => current.filter((registration) => registration.id !== deletedId));
            return;
          }

          const changed = payload.new as Registration;
          setRegistrations((current) => {
            const exists = current.some((registration) => registration.id === changed.id);
            return exists
              ? current.map((registration) => registration.id === changed.id ? changed : registration)
              : [changed, ...current];
          });
        }
      )
      .subscribe((status) => setIsRealtimeConnected(status === 'SUBSCRIBED'));

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => () => {
    animationTimersRef.current.forEach((timer) => clearTimeout(timer));
    animationTimersRef.current.clear();
  }, []);

  const toggleAttendance = async (registration: Registration) => {
    if (updatingAttendanceIds.has(registration.id)) return;

    const isCurrentlyPresent = registration.status_kehadiran === 'Hadir';
    const nextStatus = isCurrentlyPresent ? 'Belum Hadir' : 'Hadir';
    const nextAttendanceTime = nextStatus === 'Hadir' ? new Date().toISOString() : null;
    const previousStatus = registration.status_kehadiran;
    const previousAttendanceTime = registration.waktu_kehadiran;

    const previousTimer = animationTimersRef.current.get(registration.id);
    if (previousTimer) clearTimeout(previousTimer);
    setAnimatingAttendanceRows((current) => ({ ...current, [registration.id]: filter }));

    setUpdatingAttendanceIds((current) => new Set(current).add(registration.id));
    setRegistrations((current) => current.map((item) => item.id === registration.id
      ? { ...item, status_kehadiran: nextStatus, waktu_kehadiran: nextAttendanceTime }
      : item));

    const { error } = await supabase
      .from('pendaftar')
      .update({ status_kehadiran: nextStatus, waktu_kehadiran: nextAttendanceTime })
      .eq('id', registration.id);

    if (error) {
      const currentTimer = animationTimersRef.current.get(registration.id);
      if (currentTimer) clearTimeout(currentTimer);
      animationTimersRef.current.delete(registration.id);
      setAnimatingAttendanceRows((current) => {
        const next = { ...current };
        delete next[registration.id];
        return next;
      });
      setRegistrations((current) => current.map((item) => item.id === registration.id
        ? { ...item, status_kehadiran: previousStatus, waktu_kehadiran: previousAttendanceTime }
        : item));
      toast.error('Gagal mengubah status kehadiran.');
    } else {
      toast.success(nextStatus === 'Hadir'
        ? `${registration.nama_anak} ditandai hadir.`
        : `Kehadiran ${registration.nama_anak} dibatalkan.`);

      const animationTimer = setTimeout(() => {
        setAnimatingAttendanceRows((current) => {
          const next = { ...current };
          delete next[registration.id];
          return next;
        });
        animationTimersRef.current.delete(registration.id);
      }, shouldReduceMotion ? 0 : 650);
      animationTimersRef.current.set(registration.id, animationTimer);
    }

    setUpdatingAttendanceIds((current) => {
      const next = new Set(current);
      next.delete(registration.id);
      return next;
    });
  };

  const presentCount = registrations.filter((registration) => registration.status_kehadiran === 'Hadir').length;
  const absentCount = registrations.length - presentCount;
  const attendancePercentage = registrations.length > 0
    ? Number(((presentCount / registrations.length) * 100).toFixed(1))
    : 0;

  const filteredRegistrations = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('id-ID');
    return registrations
      .filter((registration) => {
        const isPresent = registration.status_kehadiran === 'Hadir';
        const matchesStatus = filter === 'semua'
          || (filter === 'hadir' && isPresent)
          || (filter === 'belum' && !isPresent)
          || animatingAttendanceRows[registration.id] === filter;
        const matchesQuery = !normalizedQuery
          || registration.nama_anak.toLocaleLowerCase('id-ID').includes(normalizedQuery)
          || (registration.no_peserta || '').toLocaleLowerCase('id-ID').includes(normalizedQuery)
          || registration.asal_sekolah.toLocaleLowerCase('id-ID').includes(normalizedQuery);
        return matchesStatus && matchesQuery;
      })
      .sort((first, second) => {
        const firstPresent = first.status_kehadiran === 'Hadir';
        const secondPresent = second.status_kehadiran === 'Hadir';
        if (firstPresent !== secondPresent) return firstPresent ? -1 : 1;
        if (firstPresent && secondPresent) {
          return new Date(second.waktu_kehadiran || second.created_at).getTime()
            - new Date(first.waktu_kehadiran || first.created_at).getTime();
        }
        return (first.no_peserta || '').localeCompare(second.no_peserta || '', 'id', { numeric: true });
      });
  }, [animatingAttendanceRows, filter, query, registrations]);

  const filterOptions: Array<{ value: AttendanceFilter; label: string; count: number }> = [
    { value: 'hadir', label: 'Sudah Hadir', count: presentCount },
    { value: 'belum', label: 'Belum Hadir', count: absentCount },
    { value: 'semua', label: 'Semua Peserta', count: registrations.length },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-5 text-white shadow-lg shadow-emerald-500/15 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-100">
              <span className={`h-2.5 w-2.5 rounded-full ${isRealtimeConnected ? 'bg-lime-300 shadow-[0_0_0_5px_rgba(190,242,100,0.16)]' : 'bg-amber-300'}`}></span>
              <span aria-live="polite">{isRealtimeConnected ? 'Pembaruan real-time aktif' : 'Menghubungkan real-time'}</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Live Absensi Peserta</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-emerald-50/90">
              Pantau peserta yang sudah melakukan check-in secara langsung dari meja registrasi.
            </p>
          </div>
          <Link
            href="/panitia/scan"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-emerald-700 shadow-md transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
          >
            <i className="fa-solid fa-qrcode" aria-hidden="true"></i>
            Buka Scanner
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4" aria-label="Ringkasan absensi">
        <DashboardCard title="Total Peserta" value={registrations.length} icon="fa-user-group" color="sky" />
        <DashboardCard title="Sudah Hadir" value={presentCount} icon="fa-user-check" color="emerald" />
        <DashboardCard title="Belum Hadir" value={absentCount} icon="fa-user-clock" color="amber" />
        <DashboardCard title="Persentase Hadir" value={`${attendancePercentage}%`} icon="fa-chart-pie" color="purple" progress={attendancePercentage} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter kehadiran">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={filter === option.value}
                  onClick={() => setFilter(option.value)}
                  className={`min-h-11 shrink-0 rounded-xl px-3.5 py-2 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${filter === option.value ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {option.label}
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${filter === option.value ? 'bg-white/20 text-white' : 'bg-white text-slate-500'}`}>{option.count}</span>
                </button>
              ))}
            </div>

            <label className="relative block w-full xl:max-w-sm">
              <span className="sr-only">Cari peserta</span>
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" aria-hidden="true"></i>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama, kode, atau sekolah..."
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>
        </div>

        {databaseError ? (
          <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700" role="alert">
            <i className="fa-solid fa-circle-exclamation mr-2" aria-hidden="true"></i>
            {databaseError}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm font-bold text-slate-500" role="status">
            <i className="fa-solid fa-circle-notch fa-spin text-emerald-500" aria-hidden="true"></i>
            Memuat data absensi...
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-400">
              <i className="fa-solid fa-clipboard-check" aria-hidden="true"></i>
            </span>
            <p className="mt-4 text-sm font-extrabold text-slate-700">Belum ada data yang sesuai</p>
            <p className="mt-1 text-xs font-medium text-slate-500">Data baru akan muncul otomatis setelah peserta melakukan check-in.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 md:hidden">
              <AnimatePresence initial={false} mode="popLayout">
                {filteredRegistrations.map((registration) => {
                  const isPresent = registration.status_kehadiran === 'Hadir';
                  const isAnimating = registration.id in animatingAttendanceRows;
                  const attendanceTime = formatAttendanceTime(registration.waktu_kehadiran);
                  return (
                  <motion.article
                    key={registration.id}
                    layout="position"
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      backgroundColor: isAnimating ? 'rgba(209, 250, 229, 0.72)' : 'rgba(255, 255, 255, 0)',
                    }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 28 }}
                    transition={shouldReduceMotion ? { duration: 0 } : {
                      layout: { type: 'spring', stiffness: 420, damping: 34 },
                      opacity: { duration: 0.2 },
                      x: { duration: 0.2 },
                      y: { duration: 0.2 },
                      backgroundColor: { duration: 0.35 },
                    }}
                    className="p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isPresent ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        <i className={`fa-solid ${isPresent ? 'fa-check' : 'fa-clock'}`} aria-hidden="true"></i>
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-extrabold text-slate-900">{registration.nama_anak}</h3>
                        <p className="mt-0.5 truncate font-mono text-[11px] font-semibold text-slate-500">{registration.no_peserta || registration.id.split('-')[0].toUpperCase()}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2 py-1 text-[9px] font-extrabold ${getCategoryStyle(registration.cabang_lomba)}`}>{registration.cabang_lomba}</span>
                          <span className={`rounded-full px-2 py-1 text-[9px] font-extrabold ${isPresent ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{isPresent ? 'Sudah Hadir' : 'Belum Hadir'}</span>
                        </div>
                        <div className="mt-3">
                          <AttendanceToggle
                            participantName={registration.nama_anak}
                            isPresent={isPresent}
                            isPending={updatingAttendanceIds.has(registration.id)}
                            onToggle={() => void toggleAttendance(registration)}
                          />
                        </div>
                      </div>
                      {isPresent && <time className="shrink-0 text-right text-[10px] font-bold text-slate-500" dateTime={registration.waktu_kehadiran || undefined}>{attendanceTime.time}<span className="mt-1 block text-[9px] font-medium text-slate-400">{attendanceTime.date}</span></time>}
                    </div>
                  </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Peserta</th>
                    <th className="px-5 py-3.5">Asal Sekolah</th>
                    <th className="px-5 py-3.5">Cabang Lomba</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-center">Aksi Kehadiran</th>
                    <th className="px-5 py-3.5 text-right">Waktu Check-in</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence initial={false} mode="popLayout">
                    {filteredRegistrations.map((registration) => {
                      const isPresent = registration.status_kehadiran === 'Hadir';
                      const isAnimating = registration.id in animatingAttendanceRows;
                      const attendanceTime = formatAttendanceTime(registration.waktu_kehadiran);
                      return (
                      <motion.tr
                        key={registration.id}
                        layout="position"
                        initial={shouldReduceMotion ? false : { opacity: 0, x: -12 }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          backgroundColor: isAnimating ? 'rgba(209, 250, 229, 0.72)' : 'rgba(255, 255, 255, 0)',
                        }}
                        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 28 }}
                        transition={shouldReduceMotion ? { duration: 0 } : {
                          layout: { type: 'spring', stiffness: 420, damping: 34 },
                          opacity: { duration: 0.2 },
                          x: { duration: 0.2 },
                          backgroundColor: { duration: 0.35 },
                        }}
                        className="hover:bg-slate-50/70"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isPresent ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                              <i className={`fa-solid ${isPresent ? 'fa-check' : 'fa-clock'}`} aria-hidden="true"></i>
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-extrabold text-slate-800">{registration.nama_anak}</p>
                              <p className="mt-0.5 font-mono text-[10px] font-semibold text-slate-400">{registration.no_peserta || registration.id.split('-')[0].toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="max-w-56 truncate px-5 py-3.5 text-xs font-semibold text-slate-600" title={registration.asal_sekolah}>{registration.asal_sekolah}</td>
                        <td className="px-5 py-3.5"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${getCategoryStyle(registration.cabang_lomba)}`}>{registration.cabang_lomba}</span></td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${isPresent ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isPresent ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                            {isPresent ? 'Sudah Hadir' : 'Belum Hadir'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <AttendanceToggle
                            participantName={registration.nama_anak}
                            isPresent={isPresent}
                            isPending={updatingAttendanceIds.has(registration.id)}
                            onToggle={() => void toggleAttendance(registration)}
                          />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {isPresent ? <time dateTime={registration.waktu_kehadiran || undefined}><span className="block text-xs font-extrabold text-slate-700">{attendanceTime.time}</span><span className="mt-0.5 block text-[10px] font-medium text-slate-400">{attendanceTime.date}</span></time> : <span className="text-xs font-semibold text-slate-300">—</span>}
                        </td>
                      </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            <footer className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-xs font-semibold text-slate-500 sm:px-5">
              Menampilkan {filteredRegistrations.length} dari {registrations.length} peserta
            </footer>
          </>
        )}
      </section>
    </div>
  );
}
