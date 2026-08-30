'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

interface CustomDatePickerProps {
  value?: Date | null;
  onChange?: (date: Date) => void;
  placeholder?: string;
  name?: string;
  required?: boolean;
  size?: 'sm' | 'md';
}

export default function CustomDatePicker({ 
  value: controlledValue, 
  onChange, 
  placeholder = "Pilih tanggal",
  name,
  required,
  size = 'md'
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<Date | null>(null);
  
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  
  const [currentMonth, setCurrentMonth] = useState(value ? value.getMonth() : new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(value ? value.getFullYear() : new Date().getFullYear());
  const popupRef = useRef<HTMLDivElement>(null);

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

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className={`w-8 h-8 ${size === 'sm' ? '' : 'sm:w-10 sm:h-10'}`}></div>);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const isSelected = value && value.getDate() === i && value.getMonth() === currentMonth && value.getFullYear() === currentYear;
    days.push(
      <button
        key={i}
        type="button"
        onClick={() => handleSelectDate(i)}
        className={`w-8 h-8 ${size === 'sm' ? '' : 'sm:w-10 sm:h-10'} rounded-full flex items-center justify-center text-sm font-semibold transition-all
          ${isSelected ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30 hover:bg-sky-600' : 'text-slate-700 hover:bg-sky-100 hover:text-sky-600'}
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
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between transition-all outline-none font-medium text-left
          ${size === 'sm' ? 'rounded-xl border px-3 py-2 text-sm' : 'rounded-2xl border-2 px-4 py-3'}
          ${isOpen ? 'border-sky-400 bg-white ring-4 ring-sky-400/20' : 'border-slate-200 bg-slate-50 hover:border-sky-300'}
        `}
      >
        <span className={value ? 'text-slate-700' : 'text-slate-400'}>
          {value ? formatDate(value) : placeholder}
        </span>
        <i className={`fa-regular fa-calendar text-sky-500 ${size === 'sm' ? 'text-base' : 'text-lg'}`}></i>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-50 mt-2 w-full sm:w-auto bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 
              ${size === 'sm' ? 'min-w-[280px] p-3' : 'min-w-[320px] p-4'}
            `}
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <i className="fa-solid fa-chevron-left text-sm"></i>
              </button>
              <div className="font-bold text-slate-800 text-sm">
                {MONTHS[currentMonth]} {currentYear}
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <i className="fa-solid fa-chevron-right text-sm"></i>
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2 px-2 text-center">
              {DAYS.map(day => (
                <div key={day} className={`text-[10px] font-bold text-slate-400 uppercase tracking-wider w-8 ${size === 'sm' ? '' : 'sm:w-10'}`}>
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 px-2">
              {days}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between gap-2">
                 <select 
                   value={currentMonth} 
                   onChange={(e) => setCurrentMonth(Number(e.target.value))}
                   className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 outline-none focus:border-sky-300 font-medium"
                 >
                   {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                 </select>
                 <input 
                   type="number" 
                   value={currentYear} 
                   onChange={(e) => setCurrentYear(Number(e.target.value))}
                   className="text-xs w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 outline-none focus:border-sky-300 text-center font-medium"
                 />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
