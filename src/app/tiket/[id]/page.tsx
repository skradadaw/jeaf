'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import QRCode from 'react-qr-code';
import Link from 'next/link';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { toast } from 'react-hot-toast';

export default function TiketPesertaPage() {
  const params = useParams();
  const rawId = params?.id as string;
  const [peserta, setPeserta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rawId) return;

    const fetchPeserta = async () => {
      setLoading(true);
      try {
        const decodedId = decodeURIComponent(rawId);
        
        // Coba cari berdasarkan id (UUID) atau no_peserta
        const { data, error } = await supabase
          .from('pendaftar')
          .select('*')
          .or(`id.eq.${decodedId},no_peserta.eq.${decodedId}`)
          .maybeSingle();

        if (error) {
          console.error('Error fetching ticket:', error);
          setPeserta(null);
        } else {
          setPeserta(data);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setPeserta(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPeserta();
  }, [rawId]);

  const handleDownloadPDF = async () => {
    const ticketElement = document.getElementById('ticket-container');
    if (!ticketElement) return;

    setIsDownloading(true);
    const toastId = toast.loading('Membuat PDF Tiket...');

    try {
      const width = ticketElement.offsetWidth * 2;
      const height = ticketElement.offsetHeight * 2;

      const imgData = await toPng(ticketElement, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        style: { margin: '0', transform: 'none' }
      });

      const pdf = new jsPDF({
        orientation: width > height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [width, height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      const safeName = peserta?.nama_anak?.replace(/\s+/g, '_') || 'Peserta';
      pdf.save(`Tiket_JinGa_${safeName}.pdf`);

      toast.success('Tiket berhasil diunduh!', { id: toastId });
    } catch (error) {
      console.error('Error generating PDF', error);
      toast.error('Gagal mengunduh PDF, silakan screenshot layar ini.', { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-lg border border-slate-100 flex items-center justify-center mb-4">
          <i className="fa-solid fa-ticket text-2xl text-sky-500 fa-bounce"></i>
        </div>
        <p className="text-slate-700 font-bold text-base mb-1">Memuat Tiket...</p>
        <p className="text-slate-400 text-xs">Mohon tunggu sebentar</p>
      </div>
    );
  }

  if (!peserta) {
    return (
      <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-500 border-2 border-rose-100 flex items-center justify-center text-3xl mb-5 shadow-sm">
          <i className="fa-solid fa-ticket-simple"></i>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Tiket Tidak Ditemukan</h1>
        <p className="text-slate-500 text-sm max-w-sm mb-6 leading-relaxed">
          Data tiket dengan ID atau nomor pendaftaran tersebut tidak ditemukan dalam sistem.
        </p>
        <div className="flex items-center gap-3">
          <Link 
            href="/"
            className="px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-sm hover:bg-sky-700 transition-colors"
          >
            Halaman Utama
          </Link>
          <Link 
            href="/panitia/peserta"
            className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            Panel Panitia
          </Link>
        </div>
      </div>
    );
  }

  const noPesertaDisplay = peserta.no_peserta || peserta.id.split('-')[0].toUpperCase();

  return (
    <div className="bg-sky-50 min-h-screen font-sans overflow-x-hidden">
      
      {/* Header Sederhana (Hidden on Print) */}
      <div className="print:hidden bg-white border-b-4 border-amber-300 px-4 py-4 shadow-sm relative z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-12 h-12 group-hover:scale-105 transition-transform flex-shrink-0">
              <img src="/assets/logo.png" alt="Logo JinGa" className="w-full h-full object-contain drop-shadow-sm" />
            </div>
            <span className="text-xl font-bold font-bubbly text-sky-600 tracking-wide group-hover:text-amber-500 transition-colors">JinGa <span className="text-amber-400">2026</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/panitia/peserta" className="text-sm font-bold text-slate-500 hover:text-sky-600 px-4 py-2 bg-slate-100 hover:bg-sky-100 rounded-full transition-colors flex items-center gap-2">
              <i className="fa-solid fa-arrow-left"></i>
              <span className="hidden sm:inline">Kembali</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14 relative">
        <div className="bg-white p-6 sm:p-10 rounded-3xl border-4 border-white shadow-bubbly relative z-10">
          
          <div className="text-center space-y-6">
            
            {/* Success Icon & Title (Hidden on Print) */}
            <div className="print:hidden">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-emerald-400 to-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-4xl sm:text-5xl mb-4 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <i className="fa-solid fa-check"></i>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold font-bubbly text-slate-900 tracking-tight">
                Yeay! Pendaftaran Berhasil! 🎉
              </h2>
              <p className="text-slate-600 mt-2 mb-8 max-w-md mx-auto leading-relaxed text-sm sm:text-base">
                Tiket petualangan ananda sudah siap. Silakan unduh tiket ini atau <em>screenshot</em> untuk ditunjukkan ke panitia saat acara.
              </p>
            </div>

            {/* Tiket Container - PERSIS SEPERTI DI FORM PENDAFTARAN */}
            <div className="max-w-sm mx-auto mb-8 print:m-0 print:max-w-none">
              <div 
                id="ticket-container" 
                ref={ticketRef}
                className="bg-white p-0 rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden relative ticket-cutout w-full text-left"
              >
                {/* Ticket Header */}
                <div className="bg-gradient-to-br from-sky-500 to-sky-700 p-6 sm:p-8 text-white text-left relative overflow-hidden">
                  <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-10 transform rotate-12">
                    <i className="fa-solid fa-ticket text-8xl"></i>
                  </div>
                  <div className="relative z-10">
                    <span className="bg-amber-400 text-slate-900 text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-widest mb-3 inline-block shadow-sm">
                      Official Ticket
                    </span>
                    <h3 className="font-bubbly text-3xl font-bold leading-tight mb-1 text-white">
                      JinGa Festival 2026
                    </h3>
                    <p className="text-sky-200 text-xs font-medium tracking-wide flex items-center gap-1.5">
                      <i className="fa-solid fa-location-dot"></i> SD Plus 3 Al-Muhajirin
                    </p>
                  </div>
                </div>

                {/* Dashed Separator */}
                <div className="relative flex items-center justify-between -mt-4 -mb-4 z-10">
                  <div className="w-8 h-8 bg-slate-50 rounded-full border border-slate-200 border-l-0 -ml-4 shadow-inner"></div>
                  <div className="flex-1 border-t-2 border-dashed border-slate-300 mx-2"></div>
                  <div className="w-8 h-8 bg-slate-50 rounded-full border border-slate-200 border-r-0 -mr-4 shadow-inner"></div>
                </div>

                {/* Ticket Body */}
                <div className="bg-white p-6 sm:p-8 relative text-center">
                  <div className="bg-slate-50 p-4 rounded-2xl inline-block shadow-inner mb-8 border border-slate-100">
                    <QRCode value={peserta.id} size={150} level="H" />
                  </div>

                  <div className="space-y-5 text-left bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nama Penjelajah</p>
                      <p className="font-extrabold text-slate-800 text-xl leading-none">{peserta.nama_anak}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Kategori Lomba</p>
                        <p className="font-bold text-amber-600 text-sm bg-amber-50 px-2.5 py-1 rounded-lg inline-block border border-amber-100">
                          {peserta.cabang_lomba}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">ID Tiket</p>
                        <p className="font-mono font-bold text-slate-700 text-sm bg-slate-200/50 px-2.5 py-1 rounded-lg inline-block">
                          {noPesertaDisplay}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tombol Aksi Download & Print (Hidden on Print) */}
            <div className="print:hidden flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="w-full sm:flex-1 bg-gradient-to-r from-sky-500 to-sky-600 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <i className={`fa-solid ${isDownloading ? 'fa-circle-notch fa-spin' : 'fa-download'}`}></i>
                <span>{isDownloading ? 'Menyiapkan PDF...' : 'Unduh PDF Tiket'}</span>
              </button>
              <button
                onClick={handlePrint}
                className="w-full sm:flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <i className="fa-solid fa-print"></i>
                <span>Cetak Tiket</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
