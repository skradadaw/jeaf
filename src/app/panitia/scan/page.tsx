'use client';

import { useState } from 'react';
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

type ScanStatus = 'idle' | 'loading' | 'success' | 'error' | 'duplicate';

const playSound = (type: 'success' | 'error') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'success') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime); 
      gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } else {
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    }
  } catch (e) {
    // Ignore if AudioContext is blocked by browser policies
  }
};

export default function ScanPage() {
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [scannedData, setScannedData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  // to prevent rapid multiple scans of the same code
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);

  const handleScan = async (detectedCodes: IDetectedBarcode[]) => {
    if (scanStatus === 'loading' || detectedCodes.length === 0) return;
    
    const code = detectedCodes[0].rawValue;
    
    // Prevent double-scanning the same code rapidly
    if (code === lastScannedId && scanStatus !== 'idle') return;
    
    setScanStatus('loading');
    setLastScannedId(code);

    try {
      // 1. Fetch user data by ID
      const { data: userData, error: fetchError } = await supabase
        .from('pendaftar')
        .select('*')
        .eq('id', code)
        .single();

      if (fetchError || !userData) {
        setScanStatus('error');
        setErrorMessage('Tiket tidak ditemukan atau tidak valid.');
        playSound('error');
        return;
      }

      // 2. Check if already attended
      if (userData.status_kehadiran === 'Hadir') {
        setScanStatus('duplicate');
        setScannedData(userData);
        playSound('error');
        return;
      }

      // 3. Mark as attended
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('pendaftar')
        .update({ status_kehadiran: 'Hadir', waktu_kehadiran: now })
        .eq('id', code);

      if (updateError) {
        setScanStatus('error');
        setErrorMessage('Gagal memperbarui data kehadiran.');
        playSound('error');
        return;
      }

      setScanStatus('success');
      setScannedData(userData);
      playSound('success');

    } catch (err) {
      setScanStatus('error');
      setErrorMessage('Terjadi kesalahan jaringan.');
    }
  };

  const resetScanner = () => {
    setScanStatus('idle');
    setScannedData(null);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4 sticky top-0 z-50">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <h1 className="text-white font-bold text-lg tracking-tight">Scan Kehadiran</h1>
          <Link href="/panitia/dashboard" className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-2">
            <i className="fa-solid fa-xmark"></i> Tutup
          </Link>
        </div>
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full p-4 relative">
        
        {/* Scanner Area */}
        <div className={`relative rounded-3xl overflow-hidden bg-black aspect-[3/4] shadow-2xl transition-all ${scanStatus !== 'idle' ? 'opacity-30 scale-95' : 'opacity-100 scale-100'}`}>
          {scanStatus === 'idle' && (
            <Scanner 
              onScan={handleScan}
              formats={['qr_code']}
              components={{
                onOff: true,
                torch: true,
              }}
              styles={{
                container: { width: '100%', height: '100%' },
                video: { objectFit: 'cover' }
              }}
            />
          )}
          
          {/* Overlay scanning instruction */}
          {scanStatus === 'idle' && (
            <div className="absolute inset-0 border-[6px] border-indigo-500/50 m-12 rounded-2xl animate-pulse pointer-events-none"></div>
          )}
        </div>

        {/* State Indicators */}
        <div className="mt-6 flex-1">
          {scanStatus === 'idle' && (
            <div className="text-center text-slate-400 space-y-2">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-2xl text-indigo-400 mb-4 animate-bounce-soft">
                <i className="fa-solid fa-qrcode"></i>
              </div>
              <h2 className="text-white font-bold text-xl">Arahkan ke QR Code</h2>
              <p className="text-sm">Pastikan QR Code tiket peserta berada di dalam area kamera untuk absensi.</p>
            </div>
          )}

          {scanStatus === 'loading' && (
            <div className="text-center text-slate-400 py-10">
              <i className="fa-solid fa-circle-notch fa-spin text-4xl text-indigo-500 mb-4"></i>
              <p className="font-semibold text-white">Memverifikasi tiket...</p>
            </div>
          )}

          {scanStatus === 'success' && scannedData && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center animate-fade-in">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto text-2xl text-white mb-4 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                <i className="fa-solid fa-check"></i>
              </div>
              <h2 className="text-white font-bold text-2xl mb-1">{scannedData.nama_anak}</h2>
              <p className="text-emerald-400 font-mono text-sm mb-4">{scannedData.no_peserta || scannedData.id.split('-')[0].toUpperCase()}</p>
              
              <div className="bg-slate-900 rounded-xl p-4 text-left space-y-2 mb-6 border border-slate-800">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-0.5">Cabang Lomba</p>
                  <p className="text-white font-semibold">{scannedData.cabang_lomba}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-0.5">Asal Sekolah</p>
                  <p className="text-white font-semibold">{scannedData.asal_sekolah}</p>
                </div>
              </div>
              
              <button onClick={resetScanner} className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3.5 rounded-xl transition-colors">
                Scan Peserta Berikutnya
              </button>
            </div>
          )}

          {scanStatus === 'duplicate' && scannedData && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-center animate-fade-in">
              <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto text-2xl text-white mb-4 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                <i className="fa-solid fa-exclamation"></i>
              </div>
              <h2 className="text-white font-bold text-xl mb-2">Sudah Melakukan Absensi</h2>
              <p className="text-slate-300 text-sm mb-6">
                Tiket atas nama <strong className="text-white">{scannedData.nama_anak}</strong> sudah terdaftar hadir sebelumnya.
              </p>
              <button onClick={resetScanner} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl transition-colors">
                Kembali ke Scanner
              </button>
            </div>
          )}

          {scanStatus === 'error' && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-center animate-fade-in">
              <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center mx-auto text-2xl text-white mb-4 shadow-[0_0_20px_rgba(243,68,68,0.5)]">
                <i className="fa-solid fa-xmark"></i>
              </div>
              <h2 className="text-white font-bold text-xl mb-2">Scan Gagal</h2>
              <p className="text-rose-200 text-sm mb-6">{errorMessage}</p>
              <button onClick={resetScanner} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl transition-colors">
                Coba Lagi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
