'use client';
import { useEffect, useState } from 'react';
import DashboardCard from '@/components/DashboardCard';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { TOTAL_KUOTA_TARGET, CABANG_LOMBA_LIST } from '@/lib/constants';

export default function DashboardPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('pendaftar')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setRegistrations(data);
      }
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

  const totalPendaftar = registrations.length;
  const targetPeserta = TOTAL_KUOTA_TARGET;
  const kuotaTersisa = Math.max(0, targetPeserta - totalPendaftar);
  const persentaseTarget = targetPeserta > 0 ? ((totalPendaftar / targetPeserta) * 100).toFixed(1) : "0";

  const minatPPDB = registrations.filter(r => r.minat_sekolah === 'Berminat' || r.minat_sekolah === 'Ya, Berminat').length;

  const CABANG_ICONS: Record<string, { icon: string; bg: string; text: string; bar: string }> = {
    'Adzan': { icon: 'fa-solid fa-volume-high', bg: 'bg-indigo-50 text-indigo-600', text: 'text-indigo-700', bar: 'bg-indigo-500' },
    'Fashion Show': { icon: 'fa-solid fa-vest-patches', bg: 'bg-rose-50 text-rose-600', text: 'text-rose-700', bar: 'bg-rose-500' },
    'MHQ': { icon: 'fa-solid fa-book-quran', bg: 'bg-emerald-50 text-emerald-600', text: 'text-emerald-700', bar: 'bg-emerald-500' },
    'Karya Kolase': { icon: 'fa-solid fa-scissors', bg: 'bg-orange-50 text-orange-600', text: 'text-orange-700', bar: 'bg-orange-500' },
    'Mewarnai': { icon: 'fa-solid fa-palette', bg: 'bg-amber-50 text-amber-600', text: 'text-amber-700', bar: 'bg-amber-500' },
    'Tendangan Penalti': { icon: 'fa-solid fa-futbol', bg: 'bg-sky-50 text-sky-600', text: 'text-sky-700', bar: 'bg-sky-500' },
    'Menyanyi Solo': { icon: 'fa-solid fa-microphone', bg: 'bg-purple-50 text-purple-600', text: 'text-purple-700', bar: 'bg-purple-500' },
  };

  // Kalkulasi statistik kuota real-time tersinkronisasi penuh dengan landing page & form
  const cabangStats = CABANG_LOMBA_LIST.map(item => {
    const cabang = item.dbValue;
    const terisi = registrations.filter(r => (r.cabang_lomba || '').trim() === cabang).length;
    const kuota = item.quota;
    const sisa = Math.max(0, kuota - terisi);
    const persentase = kuota > 0 ? ((terisi / kuota) * 100).toFixed(0) : 0;
    return { cabang, terisi, kuota, sisa, persentase };
  });

  return (
    <div className="space-y-6">
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <DashboardCard title="Total Pendaftar" value={totalPendaftar} icon="fa-user-group" color="sky" progress={Number(persentaseTarget)} trend={{ value: `${totalPendaftar}/${targetPeserta} Peserta`, isUp: true }} />
        <DashboardCard title="Kuota Tersisa" value={kuotaTersisa} icon="fa-ticket" color="amber" />
        <DashboardCard title="Minat PPDB SD Plus 3" value={minatPPDB} icon="fa-school" color="emerald" trend={{ value: 'Calon Siswa', isUp: true }} />
      </div>

      {/* Kuota Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">Statistik Kuota Lomba</h3>
            <div className="text-xs sm:text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3.5 py-1.5 sm:py-2 rounded-xl flex items-center gap-2 self-start sm:self-auto">
              <i className="fa-solid fa-chart-pie text-sky-500"></i> Total: {totalPendaftar} Pendaftar
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {cabangStats.map((stat, idx) => {
              const isLastOdd = idx === cabangStats.length - 1 && cabangStats.length % 2 !== 0;
              const cfg = CABANG_ICONS[stat.cabang] || { icon: 'fa-solid fa-trophy', bg: 'bg-slate-50 text-slate-500', text: 'text-slate-600', bar: 'bg-sky-500' };

              return (
                <div 
                  key={stat.cabang} 
                  className={`bg-white border border-slate-200/80 hover:border-sky-300 hover:shadow-md transition-all p-3.5 sm:p-5 rounded-2xl group relative overflow-hidden flex flex-col justify-between ${
                    isLastOdd ? 'col-span-2' : ''
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-1.5 mb-2 sm:mb-3">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] sm:text-xs ${cfg.bg}`}>
                          <i className={cfg.icon}></i>
                        </div>
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-sky-700 transition-colors leading-tight truncate" title={stat.cabang}>
                          {stat.cabang}
                        </h4>
                      </div>
                      <span className={`text-[9px] sm:text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                        stat.sisa === 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                        stat.sisa <= 10 ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {stat.sisa === 0 ? 'Penuh' : `Sisa ${stat.sisa}`}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between mb-2.5 sm:mb-3">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl sm:text-2xl font-extrabold text-slate-800 tracking-tight">{stat.terisi}</span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-400">/ {stat.kuota}</span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
                        {stat.persentase}%
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="w-full bg-slate-100 rounded-full h-2 sm:h-2.5 mb-2 overflow-hidden relative shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Number(stat.persentase))}%` }}
                        transition={{ duration: 0.8, type: "spring" }}
                        className={`absolute left-0 top-0 h-full rounded-full ${
                          stat.sisa === 0 ? 'bg-rose-500' : 
                          stat.sisa <= 10 ? 'bg-amber-500' : 
                          cfg.bar
                        }`} 
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-medium">
                      <span className="text-slate-400">Terisi {stat.terisi}</span>
                      <span className={`font-semibold ${
                        stat.sisa === 0 ? 'text-rose-500' : 
                        stat.sisa <= 10 ? 'text-amber-500' : 
                        'text-emerald-600'
                      }`}>
                        {stat.sisa === 0 ? 'Kapasitas Penuh' : 'Tersedia'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
      </div>
    </div>
  );
}
