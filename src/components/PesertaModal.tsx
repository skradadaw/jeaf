'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import CustomSelect from '@/components/CustomSelect';
import CustomDatePicker from '@/components/CustomDatePicker';

interface PesertaModalProps {
  isOpen: boolean;
  onClose: () => void;
  peserta: any;
  onUpdateSuccess: (updatedData: any) => void;
}

export default function PesertaModal({ isOpen, onClose, peserta, onUpdateSuccess }: PesertaModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (peserta) {
      setFormData(peserta);
      setIsEditing(false);
    }
  }, [peserta, isOpen]);

  const handleSave = async () => {
    if (!formData) return;
    setIsSaving(true);
    
    const { id, nama_anak, nama_ortu, asal_sekolah, tgl_lahir, no_wa, no_wa_pembimbing, cabang_lomba } = formData;
    
    const { error } = await supabase
      .from('pendaftar')
      .update({ nama_anak, nama_ortu, asal_sekolah, tgl_lahir, no_wa, no_wa_pembimbing, cabang_lomba })
      .eq('id', id);

    setIsSaving(false);

    if (error) {
      console.error('Error updating data:', error);
      toast.error(`Gagal menyimpan perubahan: ${error.message}`);
    } else {
      toast.success('Data berhasil diperbarui!');
      onUpdateSuccess(formData);
      onClose(); // Tutup modal otomatis jika sukses tersinkronisasi
    }
  };

  const cabangLombaList = ['Adzan', 'Fashion Show', 'MHQ', 'Karya Kolase', 'Mewarnai', 'Tendangan Penalti', 'Menyanyi Solo'];
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!peserta || !mounted || !formData) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300, mass: 0.8 }}
            className="bg-white rounded-[28px] shadow-2xl w-full max-w-md md:max-w-3xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              {/* Left Pane: Info */}
              <div className="md:w-[40%] flex flex-col shrink-0 border-b md:border-b-0 md:border-r border-slate-100 border-dashed bg-white p-5 md:p-6">
                
                {/* Avatar */}
                <div className="relative mb-6 w-fit mx-auto md:mx-0">
                  <div className="w-28 h-36 rounded-[20px] bg-sky-50 overflow-hidden flex items-center justify-center text-sky-500 text-5xl font-black border-4 border-sky-100 shadow-sm">
                    {peserta.foto_url ? (
                      <img src={peserta.foto_url} alt="Foto Peserta" className="w-full h-full object-cover" />
                    ) : (
                      peserta.nama_anak.charAt(0).toUpperCase()
                    )}
                  </div>
                  {peserta.foto_url && (
                    <button 
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          const toastId = toast.loading('Mengunduh foto...');
                          const response = await fetch(peserta.foto_url);
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `Foto_${peserta.nama_anak.replace(/\s+/g, '_')}_${peserta.no_peserta || peserta.id.split('-')[0]}.jpg`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(url);
                          toast.success('Foto berhasil diunduh!', { id: toastId });
                        } catch (err) {
                          toast.error('Gagal mengunduh foto peserta');
                        }
                      }}
                      title="Download Foto Peserta"
                      className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-[#0ea5e9] hover:bg-[#0284c7] transition-colors flex items-center justify-center shadow-md border-[3px] border-white text-white cursor-pointer group z-20"
                    >
                      <i className="fa-solid fa-download text-[11px] group-hover:scale-110 transition-transform"></i>
                    </button>
                  )}
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-2 gap-3 w-full">
                  <div className="col-span-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center text-[10px] shrink-0">
                        <i className="fa-regular fa-user"></i>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Nama Peserta</p>
                    </div>
                    <p className="font-bold text-slate-700 text-sm">{peserta.nama_anak}</p>
                  </div>


                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center text-[10px] shrink-0">
                        <i className="fa-solid fa-ticket"></i>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">No. Tiket</p>
                    </div>
                    <p className="font-bold text-slate-700 text-sm font-mono truncate">{peserta.no_peserta || peserta.id.split('-')[0].toUpperCase()}</p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center text-[10px] shrink-0">
                        <i className="fa-solid fa-trophy"></i>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Cabang</p>
                    </div>
                    <p className="font-bold text-slate-700 text-sm truncate">{peserta.cabang_lomba}</p>
                  </div>
                </div>

                {/* Barcode / QR Code */}
                <div className="mt-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center grow">
                  <div className="p-2 bg-white rounded-xl mb-2">
                    <QRCode value={peserta.id} size={90} level="M" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">QR Peserta</p>
                </div>
              </div>
            
              {/* Right Pane: Edit Form */}
              <div className="md:w-[60%] flex flex-col flex-1 overflow-hidden bg-white relative">
                {/* Close Button positioned in right pane */}
                <button 
                  onClick={onClose}
                  className="absolute top-3 right-3 md:top-4 md:right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors z-20 border border-slate-200/60"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>

                <div className="p-5 md:p-6 overflow-y-auto flex-1 custom-scrollbar pt-12 md:pt-6">
                  <div className="space-y-4">
                    {/* Alert */}
                    <div className="bg-[#f0f7ff] text-blue-700 p-3.5 rounded-[16px] text-xs font-medium border border-blue-100 flex items-start gap-3 md:pr-12">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <i className="fa-solid fa-pen text-[10px]"></i>
                      </div>
                      <p className="pt-0.5 leading-relaxed">Perbarui informasi peserta. Pastikan data seperti Nomor WhatsApp dan Cabang Lomba sesuai.</p>
                    </div>
                    
                    {/* Form Fields container */}
                    <div className="bg-white p-4 rounded-[20px] border border-slate-200/80 shadow-sm space-y-3.5">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Nama Lengkap Anak</label>
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><i className="fa-regular fa-user"></i></div>
                          <input type="text" value={formData.nama_anak} onChange={e => setFormData({...formData, nama_anak: e.target.value})} className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] outline-none transition-all" />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Nama Orang Tua</label>
                        <input type="text" value={formData.nama_ortu} onChange={e => setFormData({...formData, nama_ortu: e.target.value})} className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] outline-none transition-all" />
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Asal Sekolah</label>
                        <input type="text" value={formData.asal_sekolah} onChange={e => setFormData({...formData, asal_sekolah: e.target.value})} className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] outline-none transition-all" />
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Tanggal Lahir</label>
                        <CustomDatePicker 
                          size="sm"
                          value={formData.tgl_lahir ? new Date(formData.tgl_lahir) : null} 
                          onChange={(date) => setFormData({...formData, tgl_lahir: date ? date.toISOString().split('T')[0] : ''})} 
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">No. WA Ortu</label>
                          <div className="relative">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><i className="fa-brands fa-whatsapp"></i></div>
                            <input type="text" value={formData.no_wa || ''} onChange={e => setFormData({...formData, no_wa: e.target.value})} className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] outline-none transition-all" />
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">No. WA Guru</label>
                          <div className="relative">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><i className="fa-brands fa-whatsapp"></i></div>
                            <input type="text" value={formData.no_wa_pembimbing || ''} onChange={e => setFormData({...formData, no_wa_pembimbing: e.target.value})} className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] outline-none transition-all" />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Cabang Lomba</label>
                        <CustomSelect 
                          size="sm"
                          value={formData.cabang_lomba} 
                          onChange={val => setFormData({...formData, cabang_lomba: val})}
                          options={cabangLombaList.map(cab => ({ value: cab, label: cab, icon: 'fa-solid fa-trophy' }))}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer Actions */}
            <div className="px-5 py-4 md:px-6 md:py-4 border-t border-slate-100 bg-white flex items-center justify-between mt-auto shrink-0">
              <button onClick={onClose} disabled={isSaving} className="text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors disabled:opacity-50">
                Batal
              </button>
              <button onClick={handleSave} disabled={isSaving} className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-6 py-2.5 rounded-[12px] font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait">
                {isSaving ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-check"></i>} 
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
