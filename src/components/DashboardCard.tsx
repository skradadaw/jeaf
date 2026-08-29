import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'sky' | 'amber' | 'emerald' | 'purple' | 'rose';
  trend?: {
    value: string;
    isUp: boolean;
  };
  progress?: number;
}

export default function DashboardCard({ title, value, icon, color, trend, progress }: DashboardCardProps) {
  const colorMap = {
    sky: 'bg-sky-100 text-sky-600',
    amber: 'bg-amber-100 text-amber-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    purple: 'bg-purple-100 text-purple-600',
    rose: 'bg-rose-100 text-rose-600',
  };

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      {/* Subtle Background Glow */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${colorMap[color].split(' ')[0]}`}></div>
      
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1.5">{title}</p>
          <h3 className="text-3xl font-bold tracking-tight text-slate-900">{value}</h3>
          
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${trend.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
              <i className={`fa-solid ${trend.isUp ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}></i>
              <span>{trend.value}</span>
            </div>
          )}
          
          {progress !== undefined && (
            <div className="mt-4">
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className={`${colorMap[color].split(' ')[0].replace('100', '500')} h-1.5 rounded-full`} style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}
        </div>
        
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm border border-white/50 ${colorMap[color]}`}>
          <i className={`fa-solid ${icon}`}></i>
        </div>
      </div>
    </div>
  );
}
