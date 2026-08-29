import React from 'react';

type StatusType = 'lunas' | 'pending' | 'batal' | 'default';

interface BadgeStatusProps {
  status: string;
  type?: StatusType;
}

export default function BadgeStatus({ status, type = 'default' }: BadgeStatusProps) {
  const styles = {
    lunas: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    batal: 'bg-rose-100 text-rose-700 border-rose-200',
    default: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const icons = {
    lunas: 'fa-check-circle',
    pending: 'fa-clock',
    batal: 'fa-times-circle',
    default: 'fa-circle-info',
  };

  const selectedStyle = styles[type];
  const selectedIcon = icons[type];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${selectedStyle}`}>
      <i className={`fa-solid ${selectedIcon}`}></i>
      {status}
    </span>
  );
}
