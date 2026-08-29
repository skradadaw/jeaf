'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Option {
  value: string;
  label: string;
  icon?: string;
  color?: string;
}

interface CustomSelectProps {
  options: Option[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  name?: string;
  required?: boolean;
}

export default function CustomSelect({ 
  options, 
  value: controlledValue, 
  onChange, 
  placeholder = "Pilih salah satu",
  name,
  required
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string>('');
  
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  
  const containerRef = useRef<HTMLDivElement>(null);

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
        className={`w-full rounded-2xl border-2 px-4 py-3 bg-slate-50 flex items-center justify-between transition-all outline-none font-bold text-slate-700
          ${isOpen ? 'border-amber-400 bg-white ring-4 ring-amber-400/20' : 'border-slate-200 hover:border-amber-300'}
        `}
      >
        <div className="flex items-center gap-3">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <div className={`w-8 h-8 rounded-full ${selectedOption.color || 'bg-amber-100 text-amber-600'} flex items-center justify-center text-sm`}>
                  <i className={selectedOption.icon}></i>
                </div>
              )}
              <span>{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-slate-400 font-medium">{placeholder}</span>
          )}
        </div>
        <div className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <i className="fa-solid fa-chevron-down"></i>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 mt-2 w-full bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-3 py-3 rounded-xl flex items-center gap-3 transition-colors mb-1 last:mb-0
                    ${value === option.value ? 'bg-amber-50 font-bold text-amber-700' : 'hover:bg-slate-50 text-slate-700 font-medium'}
                  `}
                >
                   {option.icon && (
                    <div className={`w-8 h-8 shrink-0 rounded-full ${option.color || 'bg-slate-100 text-slate-500'} flex items-center justify-center text-sm transition-colors
                      ${value === option.value ? 'bg-amber-200 text-amber-700' : ''}
                    `}>
                      <i className={option.icon}></i>
                    </div>
                  )}
                  <span>{option.label}</span>
                  {value === option.value && (
                    <i className="fa-solid fa-check text-amber-500 ml-auto text-lg"></i>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
