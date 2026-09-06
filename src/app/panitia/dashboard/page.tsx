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
  
  const getCabangColor = (cabang: string) => {
    switch (cabang) {
      case 'Adzan': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Fashion Show': return 'bg-pink-50 text-pink-600 border-pink-200';
      case 'MHQ': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'Karya Kolase': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'Mewarnai': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'Tendangan Penalti': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Menyanyi Solo': return 'bg-rose-50 text-rose-600 border-rose-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  // Konfigurasi kuota per cabang lomba (disamakan dengan landing page)
  const kuotaPerCabang: Record<string, number> = {
    'MHQ': 60,
    'Karya Kolase': 60,
    'Mewarnai': 130,
    'Menyanyi Solo': 60,
    'Fashion Show': 60,
    'Adzan': 60,
    'Tendangan Penalti': 70
  };

  // Kalkulasi statistik kuota real-time
  const cabangStats = Object.keys(kuotaPerCabang).map(cabang => {
    const terisi = registrations.filter(r => r.cabang_lomba === cabang).length;
    const kuota = kuotaPerCabang[cabang];
    const sisa = Math.max(0, kuota - terisi);
    const persentase = kuota > 0 ? ((terisi / kuota) * 100).toFixed(0) : 0;
    return { cabang, terisi, kuota, sisa, persentase };
  });

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <DashboardCard title="Total Pendaftar" value={totalPendaftar} icon="fa-user-group" color="sky" progress={Number(persentaseTarget)} trend={{ value: `${totalPendaftar}/${targetPeserta} Peserta`, isUp: true }} />
        <DashboardCard title="Persentase Kehadiran" value={`${persentaseHadir}%`} icon="fa-qrcode" color="purple" progress={Number(persentaseHadir)} trend={{ value: `${hadirCount}/${totalPendaftar} Hadir`, isUp: true }} />
        <DashboardCard title="Kuota Tersisa" value={kuotaTersisa} icon="fa-ticket" color="amber" />
        <DashboardCard title="Minat PPDB SD Plus 3" value={minatPPDB} icon="fa-school" color="emerald" trend={{ value: 'Calon Siswa', isUp: true }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kuota Section */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h3 className="text-lg font-bold tracking-tight text-slate-900">Statistik Kuota Lomba</h3>
            <div className="text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2">
              <i className="fa-solid fa-chart-pie text-sky-500"></i> Total: {totalPendaftar} Pendaftar
            </div>
          </div>
          
          <div className="flex sm:grid sm:grid-cols-2 gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar -mx-6 px-6 sm:mx-0 sm:px-0">
            {cabangStats.map(stat => (
              <div key={stat.cabang} className="min-w-[85%] sm:min-w-0 snap-center shrink-0 bg-white border border-slate-100 hover:border-sky-200 hover:shadow-md transition-all p-5 rounded-2xl group relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-sky-700 transition-colors leading-tight">{stat.cabang}</h4>
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                      stat.sisa === 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                      stat.sisa <= 10 ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                      'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {stat.sisa === 0 ? 'KUOTA PENUH' : `SISA ${stat.sisa}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-end mb-4">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-slate-700">{stat.terisi}</span>
                      <span className="text-xs font-bold text-slate-400">/ {stat.kuota}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="w-full bg-slate-100 rounded-full h-3 mb-2.5 overflow-hidden relative shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Number(stat.persentase))}%` }}
                      transition={{ duration: 1, type: "spring" }}
                      className={`absolute left-0 top-0 h-full rounded-full ${
                        stat.sisa === 0 ? 'bg-rose-500' : 
                        stat.sisa <= 10 ? 'bg-amber-500' : 
                        'bg-sky-500'
                      }`} 
                    />
                  </div>
                  
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400">Terisi {stat.persentase}%</span>
                    <span className={stat.sisa === 0 ? 'text-rose-500' : stat.sisa <= 10 ? 'text-amber-500' : 'text-emerald-500'}>
                      {stat.sisa === 0 ? 'Kapasitas Maksimal' : 'Masih Tersedia'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats / Info */}
        <div className="space-y-6">


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
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[11px] text-slate-500 font-mono">{reg.no_peserta || reg.id.split('-')[0].toUpperCase()}</p>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${getCabangColor(reg.cabang_lomba)}`}>{reg.cabang_lomba}</span>
                          </div>
                        </div>
                      </div>
                      
                      {reg.waktu_kehadiran && (
                        <div className="shrink-0 ml-3 text-right">
                          <p className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-lg shadow-sm">
                            <i className="fa-regular fa-clock mr-1"></i>
                            {new Date(reg.waktu_kehadiran).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      )}
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
