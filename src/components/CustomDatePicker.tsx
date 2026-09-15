'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MONTHS_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

interface CustomDatePickerProps {
  value?: Date | null;
  onChange?: (date: Date) => void;
  placeholder?: string;
  name?: string;
  required?: boolean;
  size?: 'sm' | 'md';
  align?: 'left' | 'right';
}

export default function CustomDatePicker({ 
  value: controlledValue, 
  onChange, 
  placeholder = "Pilih tanggal",
  name,
  required,
  size = 'md',
  align = 'right'
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');
  const [internalValue, setInternalValue] = useState<Date | null>(null);
  
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  
  const [currentMonth, setCurrentMonth] = useState(value ? value.getMonth() : new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(value ? value.getFullYear() : new Date().getFullYear());
  const [yearPage, setYearPage] = useState(Math.floor((value ? value.getFullYear() : new Date().getFullYear()) / 12) * 12);
  const popupRef = useRef<HTMLDivElement>(null);

  // Sync internal state when value changes
  useEffect(() => {
    if (value) {
      setCurrentMonth(value.getMonth());
      setCurrentYear(value.getFullYear());
      setYearPage(Math.floor(value.getFullYear() / 12) * 12);
    }
  }, [value]);

  // Reset view mode when opening
  useEffect(() => {
    if (isOpen) {
      setViewMode('days');
      if (value) {
        setYearPage(Math.floor(value.getFullYear() / 12) * 12);
      } else {
        setYearPage(Math.floor(currentYear / 12) * 12);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDate = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    if (onChange) {
      onChange(newDate);
    } else {
      setInternalValue(newDate);
    }
    setIsOpen(false);
  };

  const handleSelectMonth = (monthIndex: number) => {
    setCurrentMonth(monthIndex);
    setViewMode('days');
  };

  const handleSelectYear = (year: number) => {
    setCurrentYear(year);
    setViewMode('days');
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const today = new Date();

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const isSelected = value && value.getDate() === i && value.getMonth() === currentMonth && value.getFullYear() === currentYear;
    const isToday = today.getDate() === i && today.getMonth() === currentMonth && today.getFullYear() === currentYear;

    days.push(
      <button
        key={i}
        type="button"
        onClick={() => handleSelectDate(i)}
        className={`h-8 w-8 mx-auto rounded-md flex items-center justify-center text-xs font-normal transition-all cursor-pointer
          ${isSelected 
            ? 'bg-sky-600 text-white font-medium hover:bg-sky-600 shadow-xs' 
            : isToday 
              ? 'bg-slate-100 text-slate-900 font-semibold border border-slate-200 hover:bg-slate-200' 
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }
        `}
      >
        {i}
      </button>
    );
  }

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="relative" ref={popupRef}>
      {name && <input type="hidden" name={name} value={value ? value.toISOString().split('T')[0] : ''} required={required} />}
      
      {/* Shadcn-style trigger input */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between transition-all outline-none font-medium text-left cursor-pointer
          ${size === 'sm' ? 'rounded-lg border border-slate-200 px-3 py-2 text-xs' : 'rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm'}
          ${isOpen ? 'border-sky-500 bg-white ring-2 ring-sky-500/20' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'}
        `}
      >
        <span className={value ? 'text-slate-800 font-medium' : 'text-slate-400 font-normal'}>
          {value ? formatDate(value) : placeholder}
        </span>
        <i className={`fa-regular fa-calendar text-slate-400 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}></i>
      </button>

      {/* Shadcn-style Popover Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute z-50 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl p-3
              ${align === 'left' ? 'left-0' : 'right-0'}
              ${size === 'sm' ? 'w-[264px]' : 'w-[276px]'}
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 mb-1 border-b border-slate-100">
              {viewMode === 'days' ? (
                <>
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="h-7 w-7 bg-transparent hover:bg-slate-100 text-slate-600 rounded-md border border-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Bulan sebelumnya"
                  >
                    <i className="fa-solid fa-chevron-left text-[10px]"></i>
                  </button>

                  <div className="flex items-center gap-1">
                    {/* Interactive Month Picker Trigger */}
                    <button
                      type="button"
                      onClick={() => setViewMode('months')}
                      className="px-2 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                      title="Pilih Bulan"
                    >
                      <span>{MONTHS_FULL[currentMonth]}</span>
                      <i className="fa-solid fa-chevron-down text-[8px] text-slate-400"></i>
                    </button>

                    {/* Interactive Year Picker Trigger */}
                    <button
                      type="button"
                      onClick={() => {
                        setYearPage(Math.floor(currentYear / 12) * 12);
                        setViewMode('years');
                      }}
                      className="px-2 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                      title="Pilih Tahun"
                    >
                      <span>{currentYear}</span>
                      <i className="fa-solid fa-chevron-down text-[8px] text-slate-400"></i>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="h-7 w-7 bg-transparent hover:bg-slate-100 text-slate-600 rounded-md border border-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Bulan berikutnya"
                  >
                    <i className="fa-solid fa-chevron-right text-[10px]"></i>
                  </button>
                </>
              ) : viewMode === 'months' ? (
                <>
                  <span className="text-xs font-semibold text-slate-800 pl-1">Pilih Bulan ({currentYear})</span>
                  <button
                    type="button"
                    onClick={() => setViewMode('days')}
                    className="text-xs font-medium text-sky-600 hover:text-sky-700 px-2 py-1 rounded hover:bg-sky-50 cursor-pointer"
                  >
                    Kembali
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setYearPage(p => p - 12)}
                      className="h-6 w-6 rounded hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
                      title="12 Tahun Sebelumnya"
                    >
                      <i className="fa-solid fa-chevron-left text-[9px]"></i>
                    </button>
                    <span className="text-xs font-semibold text-slate-800 px-1">
                      {yearPage} - {yearPage + 11}
                    </span>
                    <button
                      type="button"
                      onClick={() => setYearPage(p => p + 12)}
                      className="h-6 w-6 rounded hover:bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
                      title="12 Tahun Berikutnya"
                    >
                      <i className="fa-solid fa-chevron-right text-[9px]"></i>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode('days')}
                    className="text-xs font-medium text-sky-600 hover:text-sky-700 px-2 py-1 rounded hover:bg-sky-50 cursor-pointer"
                  >
                    Kembali
                  </button>
                </>
              )}
            </div>
            
            {/* View Content based on viewMode */}
            {viewMode === 'days' && (
              <>
                {/* Days of Week (Muted Shadcn Typography) */}
                <div className="grid grid-cols-7 gap-1 mt-2 mb-1 text-center">
                  {DAYS.map(day => (
                    <div key={day} className="text-[11px] font-medium text-slate-400 h-6 flex items-center justify-center">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Date Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {days}
                </div>
              </>
            )}

            {viewMode === 'months' && (
              <div className="grid grid-cols-3 gap-1.5 py-2">
                {MONTHS_SHORT.map((m, idx) => {
                  const isCurMonth = currentMonth === idx;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectMonth(idx)}
                      className={`h-11 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center
                        ${isCurMonth
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        }
                      `}
                    >
                      {MONTHS_FULL[idx]}
                    </button>
                  );
                })}
              </div>
            )}

            {viewMode === 'years' && (
              <div className="grid grid-cols-3 gap-1.5 py-2">
                {Array.from({ length: 12 }, (_, i) => yearPage + i).map((yr) => {
                  const isCurYear = currentYear === yr;
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => handleSelectYear(yr)}
                      className={`h-11 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center
                        ${isCurYear
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        }
                      `}
                    >
                      {yr}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
