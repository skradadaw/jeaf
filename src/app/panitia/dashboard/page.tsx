'use client';
import { useEffect, useState } from 'react';
import DashboardCard from '@/components/DashboardCard';
import BadgeStatus from '@/components/BadgeStatus';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('pendaftar')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setRegistrations(data);
      }
      setLoading(false);
    }
    fetchData();

    // Subscribe ke realtime changes untuk update otomatis tanpa reload
    const channel = supabase
      .channel('realtime-dashboard-pendaftar')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pendaftar' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRegistrations((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setRegistrations((prev) => prev.map(reg => reg.id === payload.new.id ? payload.new : reg));
          } else if (payload.eventType === 'DELETE') {
            setRegistrations((prev) => prev.filter(reg => reg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusType = (status: string) => {
    if (status?.toLowerCase() === 'lunas') return 'lunas';
    if (status?.toLowerCase() === 'batal') return 'batal';
    return 'pending';
  };

  const totalPendaftar = registrations.length;
  const targetPeserta = 500;
  const kuotaTersisa = Math.max(0, targetPeserta - totalPendaftar);
  const persentaseTarget = targetPeserta > 0 ? ((totalPendaftar / targetPeserta) * 100).toFixed(1) : "0";

  const minatPPDB = registrations.filter(r => r.minat_sekolah === 'Ya, Berminat').length;

  const hadirCount = registrations.filter(r => r.status_kehadiran === 'Hadir').length;
  const persentaseHadir = totalPendaftar > 0 ? ((hadirCount / totalPendaftar) * 100).toFixed(1) : "0";
  
  // Mengambil riwayat yang hadir, diurutkan berdasarkan waktu_kehadiran (jika ada) atau created_at
  const riwayatKehadiran = [...registrations]
    .filter(r => r.status_kehadiran === 'Hadir')
    .sort((a, b) => {
      const timeA = a.waktu_kehadiran ? new Date(a.waktu_kehadiran).getTime() : new Date(a.created_at).getTime();
      const timeB = b.waktu_kehadiran ? new Date(b.waktu_kehadiran).getTime() : new Date(b.created_at).getTime();
      return timeB - timeA; // Descending
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Total Pendaftar" value={totalPendaftar} icon="fa-user-group" color="sky" progress={Number(persentaseTarget)} trend={{ value: `${totalPendaftar}/${targetPeserta} Peserta`, isUp: true }} />
        <DashboardCard title="Persentase Kehadiran" value={`${persentaseHadir}%`} icon="fa-qrcode" color="purple" progress={Number(persentaseHadir)} trend={{ value: `${hadirCount}/${totalPendaftar} Hadir`, isUp: true }} />
        <DashboardCard title="Kuota Tersisa" value={kuotaTersisa} icon="fa-ticket" color="amber" />
        <DashboardCard title="Minat PPDB SD Plus 3" value={minatPPDB} icon="fa-school" color="emerald" trend={{ value: 'Calon Siswa', isUp: true }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table Section */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold tracking-tight text-slate-900">Pendaftar Terbaru</h3>
            <button className="text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200 hover:bg-slate-100 px-4 py-2 rounded-xl transition-all">Lihat Semua</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase tracking-wider bg-slate-50 border-y border-slate-200">
                <tr>
                  <th className="px-4 py-4 font-semibold">ID / Peserta</th>
                  <th className="px-4 py-4 font-semibold">Cabang Lomba</th>
                  <th className="px-4 py-4 font-semibold">Tanggal</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Memuat data pendaftar...
                    </td>
                  </tr>
                ) : registrations.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      Belum ada pendaftar.
                    </td>
                  </tr>
                ) : (
                  registrations.map((reg, index) => (
                    <tr key={index} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900 mb-0.5">{reg.nama_anak}</div>
                        <div className="text-[11px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded inline-block">
                          {reg.id.split('-')[0].toUpperCase()}
                        </div>
                        <span className="text-xs text-slate-500 ml-2">{reg.asal_sekolah}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-600">{reg.cabang_lomba}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {new Date(reg.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <BadgeStatus status="Terdaftar" type="lunas" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stats / Info */}
        <div className="space-y-6">

          {/* Quick Action */}
          <Link href="/panitia/scan" className="block w-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-6 rounded-2xl shadow-lg hover:shadow-indigo-500/25 transition-all hover:-translate-y-1 group relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl backdrop-blur-sm border border-white/10">
                <i className="fa-solid fa-qrcode"></i>
              </div>
              <div>
                <h3 className="font-bold text-lg tracking-tight mb-0.5">Mulai Pemindaian</h3>
                <p className="text-indigo-100 text-sm">Scan tiket untuk absensi</p>
              </div>
            </div>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
              <i className="fa-solid fa-chevron-right text-xl"></i>
            </div>
          </Link>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h3 className="text-base font-bold tracking-tight text-slate-900 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-clock-rotate-left text-slate-400"></i> Riwayat Kehadiran
            </h3>
            
            <div className="space-y-3 overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                {riwayatKehadiran.length === 0 ? (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-6 text-slate-500 text-sm"
                  >
                    Belum ada peserta yang hadir
                  </motion.div>
                ) : (
                  riwayatKehadiran.map((reg) => (
                    <motion.div 
                      layout
                      key={reg.id} 
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className="flex items-center justify-between p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 transition-colors mb-3"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                          <i className="fa-solid fa-check"></i>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-800 truncate">{reg.nama_anak}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{reg.id.split('-')[0].toUpperCase()}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
