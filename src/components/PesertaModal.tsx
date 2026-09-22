'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import CustomSelect from '@/components/CustomSelect';
import CustomDatePicker from '@/components/CustomDatePicker';
import { PREFIX_PER_CABANG, KUOTA_PER_CABANG, CABANG_CONFIG } from '@/lib/constants';

interface PesertaModalProps {
  isOpen: boolean;
  onClose: () => void;
  peserta: any;
  onUpdateSuccess: (updatedData: any) => void;
}

const normalizeMinat = (val?: string | null): string => {
  if (!val) return '';
  const clean = val.trim();
  if (clean === 'Ya, Berminat' || clean.toLowerCase().includes('berminat')) return 'Berminat';
  if (clean === 'Masih dalam pertimbangan' || clean.toLowerCase().includes('timbang') || clean === 'Mungkin') return 'Masih Dipertimbangkan';
  return clean;
};

const parseDateString = (str?: string | null): Date | null => {
  if (!str) return null;
  const parts = str.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const CABANG_ICONS = CABANG_CONFIG;

const formatTanggalDaftar = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
};

export default function PesertaModal({ isOpen, onClose, peserta, onUpdateSuccess }: PesertaModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'card'>('form');

  useEffect(() => {
    if (peserta) {
      setFormData({
        ...peserta,
        tempat_lahir: peserta.tempat_lahir || '',
        jenis_kelamin: peserta.jenis_kelamin || 'Laki-laki',
        minat_sekolah: normalizeMinat(peserta.minat_sekolah)
      });
      setIsEditing(false);
      setActiveTab('form');
    }
  }, [peserta, isOpen]);

  const handleSave = async () => {
    if (!formData) return;
    setIsSaving(true);
    
    const { id, nama_anak, nama_ortu, asal_sekolah, tempat_lahir, tgl_lahir, no_wa, no_wa_pembimbing, cabang_lomba, minat_sekolah, jenis_kelamin } = formData;
    
    const isCabangChanged = peserta.cabang_lomba !== cabang_lomba;
    let newNoPeserta = formData.no_peserta || peserta.no_peserta;

    if (isCabangChanged) {
      // 1. Validasi kuota cabang lomba tujuan
      const targetQuota = KUOTA_PER_CABANG[cabang_lomba] || 60;
      const { count: currentTargetCount, error: countErr } = await supabase
        .from('pendaftar')
        .select('*', { count: 'exact', head: true })
        .eq('cabang_lomba', cabang_lomba);

      if (countErr) {
        console.error('Error checking target quota:', countErr);
      }

      if ((currentTargetCount || 0) >= targetQuota) {
        toast.error(`Gagal pindah lomba: Kuota cabang "${cabang_lomba}" sudah PENUH (${targetQuota}/${targetQuota} peserta)!`);
        setIsSaving(false);
        return;
      }

      const prefix = PREFIX_PER_CABANG[cabang_lomba] || 'JEA';
      const confirmMsg = `Anda akan memindahkan cabang lomba "${nama_anak}" dari "${peserta.cabang_lomba}" ke "${cabang_lomba}".\n\nNomor peserta akan otomatis diperbarui dengan kode prefix "${prefix}-2026-xxx".\n\nLanjutkan perubahan?`;
      if (!window.confirm(confirmMsg)) {
        setIsSaving(false);
        return;
      }

      // 2. Cari nomor urut terbesar di cabang baru agar nomor selalu urut dan tidak duplikat
      const { data: existingInCabang } = await supabase
        .from('pendaftar')
        .select('no_peserta')
        .eq('cabang_lomba', cabang_lomba);

      let maxSeq = 0;
      if (existingInCabang && existingInCabang.length > 0) {
        for (const item of existingInCabang) {
          if (item.no_peserta) {
            const match = item.no_peserta.match(/-(\d+)$/);
            if (match) {
              const num = parseInt(match[1], 10);
              if (!isNaN(num) && num > maxSeq) {
                maxSeq = num;
              }
            }
          }
        }
      }
      const newSeq = Math.max(maxSeq + 1, (existingInCabang?.length || 0) + 1);
      newNoPeserta = `${prefix}-2026-${String(newSeq).padStart(3, '0')}`;
    }

    const updatePayload: any = { 
      nama_anak, 
      nama_ortu, 
      asal_sekolah, 
      tempat_lahir, 
      tgl_lahir, 
      no_wa, 
      no_wa_pembimbing, 
      cabang_lomba, 
      minat_sekolah,
      jenis_kelamin
    };

    if (isCabangChanged) {
      updatePayload.no_peserta = newNoPeserta;
      // Reset penilaian lomba sebelumnya jika ada
      updatePayload.nilai_total = null;
      updatePayload.detail_nilai = null;
      updatePayload.catatan_juri = null;
    }

    const { error } = await supabase
      .from('pendaftar')
      .update(updatePayload)
      .eq('id', id);

    setIsSaving(false);

    if (error) {
      console.error('Error updating data:', error);
      toast.error(`Gagal menyimpan perubahan: ${error.message}`);
    } else {
      const finalData = { ...formData, ...updatePayload };
      if (isCabangChanged) {
        toast.success(
          `Cabang lomba diubah ke ${cabang_lomba}!\nNomor peserta baru: ${newNoPeserta}`,
          { duration: 6000 }
        );
      } else {
        toast.success('Data berhasil diperbarui!');
      }
      onUpdateSuccess(finalData);
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
            className="bg-white rounded-[24px] sm:rounded-[28px] shadow-2xl w-full max-w-md md:max-w-3xl overflow-hidden relative z-10 flex flex-col h-[90vh] sm:h-auto sm:max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Mobile Top Header */}
            <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 overflow-hidden font-bold text-xs border border-sky-200 shadow-xs">
                  {peserta.foto_url ? (
                    <img src={peserta.foto_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    peserta.nama_anak.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs sm:text-sm text-slate-800 truncate">{peserta.nama_anak}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Link 
                      href={`/tiket/${peserta.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-sky-600 hover:text-sky-700 font-mono bg-white hover:bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 flex items-center gap-1 font-bold cursor-pointer transition-colors"
                      title="Buka tiket di tab baru"
                    >
                      <span>{peserta.no_peserta || peserta.id.split('-')[0].toUpperCase()}</span>
                      <i className="fa-solid fa-arrow-up-right-from-square text-[8px]"></i>
                    </Link>
                    {(() => {
                      const cfg = CABANG_CONFIG[peserta.cabang_lomba] || {
                        icon: 'fa-solid fa-trophy',
                        bg: 'bg-slate-50',
                        text: 'text-slate-700',
                        border: 'border-slate-200',
                      };
                      return (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          <i className={`${cfg.icon} text-[9px]`}></i>
                          <span>{peserta.cabang_lomba}</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-slate-500 hover:bg-slate-100 shadow-xs border border-slate-200 shrink-0 cursor-pointer"
                title="Tutup Modal"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Mobile Tab Switcher */}
            <div className="md:hidden grid grid-cols-2 p-1.5 bg-slate-100/80 border-b border-slate-200/60 shrink-0 gap-1.5 text-xs font-bold">
              <button 
                type="button"
                onClick={() => setActiveTab('form')}
                className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'form' 
                    ? 'bg-white text-sky-600 shadow-sm border border-slate-200/60 font-bold' 
                    : 'text-slate-500 hover:text-slate-700 font-semibold'
                }`}
              >
                <i className="fa-solid fa-pen-to-square text-[11px]"></i>
                <span>Edit Formulir</span>
              </button>
              <button 
                type="button"
                onClick={() => setActiveTab('card')}
                className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'card' 
                    ? 'bg-white text-sky-600 shadow-sm border border-slate-200/60 font-bold' 
                    : 'text-slate-500 hover:text-slate-700 font-semibold'
                }`}
              >
                <i className="fa-solid fa-qrcode text-[11px]"></i>
                <span>Kartu & QR</span>
              </button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              {/* Left Pane: Info (Kartu & QR) */}
              <div className={`md:w-[40%] flex-col shrink-0 border-b md:border-b-0 md:border-r border-slate-100 border-dashed bg-white p-5 md:p-6 overflow-y-auto ${
                activeTab === 'card' ? 'flex flex-1' : 'hidden md:flex'
              }`}>
                
                {/* Avatar */}
                <div className="relative mb-5 w-fit mx-auto md:mx-0">
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
                  <div className="col-span-2 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center text-[10px] shrink-0">
                        <i className="fa-regular fa-user"></i>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Nama Peserta</p>
                    </div>
                    <p className="font-bold text-slate-700 text-sm">{peserta.nama_anak}</p>
                  </div>

                  <Link
                    href={`/tiket/${peserta.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white hover:bg-sky-50/70 p-3.5 sm:p-4 rounded-2xl border border-slate-100 hover:border-sky-300 shadow-sm hover:shadow-md flex flex-col justify-center transition-all group cursor-pointer"
                    title="Klik untuk membuka & mencetak tiket resmi peserta (Tab baru)"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-slate-50 group-hover:bg-sky-100 text-slate-500 group-hover:text-sky-600 flex items-center justify-center text-[10px] shrink-0 transition-colors">
                          <i className="fa-solid fa-ticket"></i>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 group-hover:text-sky-600 uppercase tracking-wider truncate transition-colors">No. Tiket</p>
                      </div>
                      <i className="fa-solid fa-arrow-up-right-from-square text-[10px] text-slate-300 group-hover:text-sky-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"></i>
                    </div>
                    <p className="font-bold text-slate-700 group-hover:text-sky-700 text-sm font-mono truncate transition-colors">
                      {peserta.no_peserta || peserta.id.split('-')[0].toUpperCase()}
                    </p>
                    <span className="text-[9px] text-slate-400 group-hover:text-sky-600 font-semibold mt-0.5 flex items-center gap-1">
                      <i className="fa-solid fa-print text-[9px]"></i> Buka Tiket ↗
                    </span>
                  </Link>

                  {(() => {
                    const cfg = CABANG_CONFIG[peserta.cabang_lomba] || {
                      icon: 'fa-solid fa-trophy',
                      iconBg: 'bg-slate-50 text-slate-500',
                    };
                    return (
                      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 ${cfg.iconBg}`}>
                            <i className={cfg.icon}></i>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Cabang</p>
                        </div>
                        <p className="font-bold text-slate-700 text-sm truncate">{peserta.cabang_lomba}</p>
                        {peserta.created_at && (
                          <div className="inline-flex items-center gap-1.5 text-[10px] text-slate-500 font-medium bg-slate-50 border border-slate-200/70 px-2 py-0.5 rounded-md mt-1.5">
                            <i className="fa-regular fa-calendar-days text-[9px] text-slate-400"></i>
                            <span>{formatTanggalDaftar(peserta.created_at)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Barcode / QR Code */}
                <div className="mt-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center grow">
                  <div className="p-2 bg-white rounded-xl mb-2">
                    <QRCode value={peserta.id} size={90} level="M" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">QR Peserta</p>
                  
                  {peserta.no_wa && (
                    <a
                      href={`https://wa.me/62${peserta.no_wa.replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(
                        `Halo Ayah/Bunda dari ananda *${peserta.nama_anak}*,\nBerikut informasi e-tiket terbaru JinGa Festival 2026:\n\n• Cabang Lomba: *${peserta.cabang_lomba}*\n• No. Peserta: *${peserta.no_peserta || '-'}\n\nSilakan akses dan cetak e-tiket resmi melalui tautan ini:\n${typeof window !== 'undefined' ? window.location.origin : ''}/tiket/${peserta.id}\n\nTerima kasih!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      title="Kirim link tiket terbaru ke nomor WhatsApp orang tua"
                    >
                      <i className="fa-brands fa-whatsapp text-emerald-600 text-sm"></i>
                      <span>Kirim Tiket ke WA Ortu</span>
                    </a>
                  )}
                </div>
              </div>
            
              {/* Right Pane: Edit Form */}
              <div className={`md:w-[60%] flex-col flex-1 overflow-hidden bg-white relative ${
                activeTab === 'form' ? 'flex' : 'hidden md:flex'
              }`}>
                {/* Desktop Close Button */}
                <button 
                  onClick={onClose}
                  className="hidden md:flex absolute top-3 right-3 md:top-4 md:right-4 w-8 h-8 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors z-20 border border-slate-200/60 cursor-pointer"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>

                <div className="p-4 sm:p-5 md:p-6 overflow-y-auto overflow-x-hidden flex-1 custom-scrollbar md:pt-6">
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
                      
                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Asal Sekolah</label>
                          <input type="text" value={formData.asal_sekolah} onChange={e => setFormData({...formData, asal_sekolah: e.target.value})} className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] outline-none transition-all" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Jenis Kelamin</label>
                          <CustomSelect 
                            size="sm"
                            value={formData.jenis_kelamin || 'Laki-laki'} 
                            onChange={val => setFormData({...formData, jenis_kelamin: val})}
                            options={[
                              { value: 'Laki-laki', label: 'Laki-laki', icon: 'fa-solid fa-mars', color: 'bg-blue-100 text-blue-600' },
                              { value: 'Perempuan', label: 'Perempuan', icon: 'fa-solid fa-venus', color: 'bg-pink-100 text-pink-600' }
                            ]}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Tempat Lahir</label>
                          <input type="text" value={formData.tempat_lahir || ''} placeholder="Contoh: Purwakarta" onChange={e => setFormData({...formData, tempat_lahir: e.target.value})} className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#0ea5e9]/20 focus:border-[#0ea5e9] outline-none transition-all placeholder:text-slate-300 placeholder:font-normal" />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Tanggal Lahir</label>
                          <CustomDatePicker 
                            size="sm"
                            value={parseDateString(formData.tgl_lahir)} 
                            onChange={(date) => {
                              if (!date) {
                                setFormData({...formData, tgl_lahir: ''});
                                return;
                              }
                              const localStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                              setFormData({...formData, tgl_lahir: localStr});
                            }} 
                          />
                        </div>
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
                          options={cabangLombaList.map(cab => ({ 
                            value: cab, 
                            label: cab, 
                            icon: CABANG_ICONS[cab]?.icon || 'fa-solid fa-trophy',
                            color: CABANG_ICONS[cab]?.color || 'bg-slate-100 text-slate-600'
                          }))}
                        />

                        {formData.cabang_lomba !== peserta.cabang_lomba && (
                          <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 shadow-xs">
                            <i className="fa-solid fa-circle-exclamation text-amber-500 mt-0.5 text-sm shrink-0"></i>
                            <div className="space-y-1">
                              <p className="font-bold text-amber-950">Perubahan Cabang Lomba Terdeteksi</p>
                              <p className="text-[11px] text-amber-800 leading-relaxed">
                                Nomor peserta akan otomatis diubah dari <strong>{peserta.no_peserta || '-'}</strong> ke prefix <strong>{PREFIX_PER_CABANG[formData.cabang_lomba] || 'JEA'}-2026-xxx</strong> saat disimpan.
                              </p>
                              <p className="text-[10px] text-amber-700 font-medium">
                                💡 QR Code kehadiran tetap sama (menggunakan ID), namun orang tua disarankan mengunduh e-tiket terbaru.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Minat Masuk SD Plus 3 (SPMB)</label>
                        <CustomSelect 
                          size="sm"
                          value={formData.minat_sekolah || ''} 
                          onChange={val => setFormData({...formData, minat_sekolah: val})}
                          placeholder="Pilih status minat..."
                          options={[
                            { value: 'Berminat', label: 'Berminat', icon: 'fa-solid fa-circle-check', color: 'bg-emerald-100 text-emerald-600' },
                            { value: 'Masih Dipertimbangkan', label: 'Masih Dipertimbangkan', icon: 'fa-solid fa-clock-rotate-left', color: 'bg-amber-100 text-amber-600' }
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer Actions */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-100 bg-white flex items-center justify-between mt-auto shrink-0 gap-3">
              <button 
                type="button"
                onClick={onClose} 
                disabled={isSaving} 
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-600 active:bg-slate-200 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <i className="fa-solid fa-xmark text-xs text-slate-400"></i>
                <span>Batal</span>
              </button>

              {activeTab === 'form' ? (
                <button 
                  type="button"
                  onClick={handleSave} 
                  disabled={isSaving} 
                  className="bg-[#0ea5e9] hover:bg-[#0284c7] active:bg-[#0369a1] text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait shadow-sm shadow-sky-500/25 hover:shadow-md cursor-pointer"
                >
                  {isSaving ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-check"></i>} 
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={() => setActiveTab('form')} 
                  className="md:hidden bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-200 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <i className="fa-solid fa-pen-to-square"></i>
                  <span>Edit Data Ini</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
