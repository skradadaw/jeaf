'use client';

import React, { useState, useEffect, useId, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Option {
  value: string;
  label: string;
  icon?: string;
  color?: string;
  badge?: string;
  badgeColor?: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  options: Option[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  name?: string;
  required?: boolean;
  size?: 'sm' | 'md';
  accent?: 'sky' | 'purple';
  ariaLabel?: string;
  dropdownClassName?: string;
}

export default function CustomSelect({ 
  options, 
  value: controlledValue, 
  onChange, 
  placeholder = "Pilih salah satu",
  name,
  required,
  size = 'md',
  accent = 'sky',
  ariaLabel,
  dropdownClassName = '',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string>('');
  
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const accentClasses = accent === 'purple'
    ? {
        open: 'border-purple-500 ring-purple-500/15',
        icon: 'text-purple-500',
        selected: 'border-purple-200/80 bg-purple-50 text-purple-900',
        selectedIcon: 'bg-purple-200 text-purple-800',
        check: 'text-purple-600',
      }
    : {
        open: 'border-sky-500 ring-sky-500/15',
        icon: 'text-sky-500',
        selected: 'border-amber-200/80 bg-amber-50 text-amber-900',
        selectedIcon: 'bg-amber-200 text-amber-800',
        check: 'text-amber-600',
      };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    if (onChange) {
      onChange(val);
    } else {
      setInternalValue(val);
    }
    setIsOpen(false);
  };

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={containerRef}>
      {name && <input type="hidden" name={name} value={value} required={required} />}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setIsOpen(false);
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        aria-label={ariaLabel || placeholder}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        className={`w-full flex items-center justify-between transition-all outline-none font-medium text-slate-800 text-left
          ${size === 'sm' ? 'rounded-lg border border-slate-200 px-3 py-2 text-xs' : 'rounded-xl border border-slate-200 px-4 py-2.5 sm:py-3 text-sm'}
          ${isOpen ? `bg-white ring-4 ${accentClasses.open}` : 'bg-slate-50/70 hover:bg-white focus:bg-white hover:border-slate-300 focus-visible:ring-4 focus-visible:ring-slate-200'}
        `}
      >
        <div className="flex items-center gap-2 sm:gap-2.5 truncate">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                selectedOption.icon.startsWith('fa-') ? (
                  <div className={`rounded-md flex items-center justify-center shrink-0 ${selectedOption.color || 'bg-sky-100 text-sky-600'} ${size === 'sm' ? 'w-5 h-5 text-[10px]' : 'w-5 h-5 sm:w-6 sm:h-6 text-xs'}`}>
                    <i className={selectedOption.icon}></i>
                  </div>
                ) : (
                  <span className="text-base sm:text-lg shrink-0 select-none leading-none">{selectedOption.icon}</span>
                )
              )}
              <span className="truncate text-slate-800 font-medium text-sm" title={selectedOption.label}>{selectedOption.label}</span>
              {selectedOption.badge && (
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                  selectedOption.badgeColor || (selectedOption.disabled ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                }`}>
                  {selectedOption.badge}
                </span>
              )}
            </>
          ) : (
            <span className="text-slate-400 font-medium truncate text-sm">{placeholder}</span>
          )}
        </div>
        <div className={`text-slate-400 text-xs transition-transform duration-200 ml-2 shrink-0 ${isOpen ? `rotate-180 ${accentClasses.icon}` : ''}`}>
          <i className="fa-solid fa-chevron-down"></i>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel || placeholder}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 mt-1.5 w-full bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-200/60 overflow-hidden ${dropdownClassName}`}
          >
            <div className="max-h-60 overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-slate-200">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={value === option.value}
                  disabled={option.disabled}
                  onClick={() => {
                    if (!option.disabled) {
                      handleSelect(option.value);
                    }
                  }}
                  className={`w-full text-left flex items-center justify-between gap-2.5 transition-all mb-0.5 last:mb-0
                    ${size === 'sm' ? 'px-2.5 py-1.5 rounded-md text-xs' : 'px-3 py-2 rounded-lg text-sm'}
                    ${option.disabled 
                      ? 'opacity-50 cursor-not-allowed bg-slate-50 text-slate-400 select-none' 
                      : value === option.value 
                        ? `${accentClasses.selected} font-semibold border shadow-xs`
                        : 'hover:bg-slate-50 text-slate-700 font-medium'
                    }
                  `}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    {option.icon && (
                      option.icon.startsWith('fa-') ? (
                        <div className={`shrink-0 rounded-md flex items-center justify-center transition-colors ${option.color || 'bg-slate-100 text-slate-500'}
                          ${size === 'sm' ? 'w-5 h-5 text-[10px]' : 'w-5 h-5 sm:w-6 sm:h-6 text-xs'}
                          ${value === option.value ? accentClasses.selectedIcon : ''}
                        `}>
                          <i className={option.icon}></i>
                        </div>
                      ) : (
                        <span className="text-base sm:text-lg shrink-0 select-none leading-none">{option.icon}</span>
                      )
                    )}
                    <span className="min-w-0 whitespace-nowrap text-xs sm:text-sm" title={option.label}>{option.label}</span>
                  </div>

                  <div className="ml-auto flex w-5 shrink-0 items-center justify-end gap-2">
                    {option.badge && (
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        option.badgeColor || (option.disabled ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                      }`}>
                        {option.badge}
                      </span>
                    )}
                    {value === option.value && !option.disabled && (
                      <i className={`fa-solid fa-check text-xs sm:text-sm ${accentClasses.check}`}></i>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
