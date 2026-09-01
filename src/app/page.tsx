'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // State untuk countdown
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Target: 1 September 2026 00:00 WIB (+07:00)
    const targetDate = new Date('2026-09-01T00:00:00+07:00').getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      const { data, error } = await supabase
        .from('pendaftar')
        .select('cabang_lomba');
      
      if (!error && data) {
        const counts: Record<string, number> = {};
        data.forEach((pendaftar) => {
          const lomba = pendaftar.cabang_lomba;
          counts[lomba] = (counts[lomba] || 0) + 1;
        });
        setParticipantCounts(counts);
      }
    };

    fetchCounts();

    const channel = supabase
      .channel('public:pendaftar')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pendaftar'
        },
        (payload) => {
          const newLomba = payload.new.cabang_lomba;
          setParticipantCounts(prev => ({
            ...prev,
            [newLomba]: (prev[newLomba] || 0) + 1
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const lombaList = [
    { id: 1, title: 'Lomba MHQ', category: 'islami', icon: '📖', target: 'TK A & B', desc: 'Uji hafalan surah-surah pendek pilihan dengan tartil, makhraj yang benar, dan adab tilawah.', quota: 60, price: 'Gratis', dbValue: 'MHQ', classes: { border: 'border-emerald-200', tagBg: 'bg-emerald-100', tagText: 'text-emerald-800', priceText: 'text-emerald-600', btnBg: 'bg-emerald-50', btnHover: 'hover:bg-emerald-600', btnText: 'text-emerald-700' } },
    { id: 2, title: 'Lomba Karya Kolase', category: 'seni', icon: '✂️', target: 'TK A & B', desc: 'Berkreasi membuat seni kolase yang indah untuk melatih kreativitas dan motorik halus.', quota: 60, price: 'Gratis', dbValue: 'Karya Kolase', classes: { border: 'border-amber-200', tagBg: 'bg-amber-100', tagText: 'text-amber-800', priceText: 'text-amber-600', btnBg: 'bg-amber-50', btnHover: 'hover:bg-amber-600', btnText: 'text-amber-700' } },
    { id: 3, title: 'Lomba Mewarnai', category: 'seni', icon: '🎨', target: 'TK A & B', desc: 'Mengekspresikan imajinasi dan gradasi warna ceria pada sketsa petualang cilik JinGa.', quota: 130, price: 'Gratis', dbValue: 'Mewarnai', classes: { border: 'border-amber-200', tagBg: 'bg-amber-100', tagText: 'text-amber-800', priceText: 'text-amber-600', btnBg: 'bg-amber-50', btnHover: 'hover:bg-amber-600', btnText: 'text-amber-700' } },
    { id: 4, title: 'Lomba Menyanyi Solo', category: 'seni', icon: '🎵', target: 'TK A & B', desc: 'Menumbuhkan keberanian dan bakat tarik suara anak dengan lagu-lagu anak ceria.', quota: 60, price: 'Gratis', dbValue: 'Menyanyi Solo', classes: { border: 'border-amber-200', tagBg: 'bg-amber-100', tagText: 'text-amber-800', priceText: 'text-amber-600', btnBg: 'bg-amber-50', btnHover: 'hover:bg-amber-600', btnText: 'text-amber-700' } },
    { id: 5, title: 'Lomba Fashion Show', category: 'seni', icon: '👗', target: 'Putra & Putri', desc: 'Peragaan busana muslim/muslimah cilik bertema "Little Explorer" yang syar\'i, anggun, dan percaya diri.', quota: 60, price: 'Gratis', dbValue: 'Fashion Show', classes: { border: 'border-amber-200', tagBg: 'bg-amber-100', tagText: 'text-amber-800', priceText: 'text-amber-600', btnBg: 'bg-amber-50', btnHover: 'hover:bg-amber-600', btnText: 'text-amber-700' } },
    { id: 6, title: 'Lomba Adzan', category: 'islami', icon: '🗣️', target: 'Khusus Ikhwan', desc: 'Melantunkan panggilan adzan Subuh/Dzuhur dengan kemerduan nada, kejelasan makhraj, dan adab muadzin.', quota: 60, price: 'Gratis', dbValue: 'Adzan', classes: { border: 'border-emerald-200', tagBg: 'bg-emerald-100', tagText: 'text-emerald-800', priceText: 'text-emerald-600', btnBg: 'bg-emerald-50', btnHover: 'hover:bg-emerald-600', btnText: 'text-emerald-700' } },
    { id: 7, title: 'Lomba Tendangan Penalti', category: 'ketangkasan', icon: '⚽', target: 'Ketangkasan', desc: 'Tantangan ketepatan menendang bola ke gawang untuk melatih fokus dan motorik anak.', quota: 70, price: 'Gratis', dbValue: 'Tendangan Penalti', classes: { border: 'border-sky-200', tagBg: 'bg-sky-100', tagText: 'text-sky-800', priceText: 'text-sky-600', btnBg: 'bg-sky-50', btnHover: 'hover:bg-sky-600', btnText: 'text-sky-700' } },
  ];

  const filteredLomba = lombaList.filter(lomba => activeFilter === 'Semua' || lomba.category === activeFilter);

  return (
    <div className="bg-[#F8FAFC] font-sans overflow-x-hidden">
      

    
    <div className="bunting-banner w-full fixed top-0 left-0 z-50"></div>

    
    <nav className="fixed top-2 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
                
                
                <a href="#hero" className="flex items-center gap-3 group">
                    <div className="w-14 h-14 group-hover:scale-105 transition-transform flex-shrink-0">
                        <img src="assets/logo.png" alt="Logo SD Plus 3 Al-Muhajirin" className="w-full h-full object-contain drop-shadow-md" />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-2xl font-bold font-bubbly text-sky-600 tracking-wide">JinGa</span>
                            <span className="text-xs uppercase font-extrabold bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full tracking-wider">Festival 2026</span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-500">TK/RA • SD Plus 3 Al-Muhajirin</p>
                    </div>
                </a>

                
                <div className="hidden md:flex items-center space-x-6 text-sm font-semibold text-slate-600">
                    <a href="#lomba" className="hover:text-sky-600 transition-colors">Cabang Lomba</a>
                    <a href="#hadiah" className="hover:text-sky-600 transition-colors">Hadiah & Trofi</a>
                    <a href="#rundown" className="hover:text-sky-600 transition-colors">Peta Rute</a>
                    <a href="#faq" className="hover:text-sky-600 transition-colors">FAQ</a>
                    <Link href="/panitia/login" className="hover:text-amber-500 transition-colors flex items-center gap-1.5 border-l border-slate-200 pl-6">
                        <i className="fa-solid fa-lock text-xs"></i>
                        Login Panitia
                    </Link>
                </div>

                
                <div className="flex items-center gap-3">
                    <Link href="/daftar" className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm shadow-md hover:shadow-lg hover:from-amber-400 hover:to-amber-500 hover:scale-105 active:scale-95 transition-all">
                        <i className="fa-solid fa-compass animate-spin text-amber-200" style={{ animationDuration: '6s' }}></i>
                        <span>Daftar Sekarang</span>
                    </Link>
                    
                    
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-sky-50 focus:outline-none" aria-label="Buka Menu">
                        <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-2xl`}></i>
                    </button>
                </div>
            </div>
        </div>

        
        <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden bg-white shadow-xl pb-6 border-b border-sky-100 animate-in slide-in-from-top-2 duration-200`}>
            <div className="flex flex-col px-2 pt-2 pb-4 space-y-1">
                <a href="#lomba" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between px-4 py-3.5 rounded-2xl text-slate-700 font-semibold active:bg-sky-50 transition-colors">
                    <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner"><i className="fa-solid fa-trophy text-sm"></i></div>
                        <span className="text-[15px]">Cabang Lomba</span>
                    </div>
                    <i className="fa-solid fa-chevron-right text-xs text-slate-300"></i>
                </a>
                
                <a href="#hadiah" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between px-4 py-3.5 rounded-2xl text-slate-700 font-semibold active:bg-sky-50 transition-colors">
                    <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner"><i className="fa-solid fa-gift text-sm"></i></div>
                        <span className="text-[15px]">Hadiah & Trofi</span>
                    </div>
                    <i className="fa-solid fa-chevron-right text-xs text-slate-300"></i>
                </a>

                <a href="#rundown" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between px-4 py-3.5 rounded-2xl text-slate-700 font-semibold active:bg-sky-50 transition-colors">
                    <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shadow-inner"><i className="fa-regular fa-calendar-days text-sm"></i></div>
                        <span className="text-[15px]">Jadwal Acara</span>
                    </div>
                    <i className="fa-solid fa-chevron-right text-xs text-slate-300"></i>
                </a>

                <a href="#lokasi" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between px-4 py-3.5 rounded-2xl text-slate-700 font-semibold active:bg-sky-50 transition-colors">
                    <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner"><i className="fa-solid fa-location-dot text-sm"></i></div>
                        <span className="text-[15px]">Lokasi Sekolah</span>
                    </div>
                    <i className="fa-solid fa-chevron-right text-xs text-slate-300"></i>
                </a>

                <a href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between px-4 py-3.5 rounded-2xl text-slate-700 font-semibold active:bg-sky-50 transition-colors">
                    <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shadow-inner"><i className="fa-regular fa-circle-question text-sm"></i></div>
                        <span className="text-[15px]">Tanya Jawab (FAQ)</span>
                    </div>
                    <i className="fa-solid fa-chevron-right text-xs text-slate-300"></i>
                </a>

                <div className="h-px bg-slate-100 my-2 mx-4"></div>

                <Link href="/panitia/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between px-4 py-3.5 rounded-2xl text-slate-600 font-semibold active:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shadow-inner"><i className="fa-solid fa-lock text-sm"></i></div>
                        <span className="text-[15px]">Login Panitia</span>
                    </div>
                    <i className="fa-solid fa-chevron-right text-xs text-slate-300"></i>
                </Link>
            </div>

            <div className="px-5 pt-2">
                <a href="#daftar" onClick={() => setIsMobileMenuOpen(false)} className="w-full flex items-center justify-center gap-2 py-4 rounded-[1.25rem] bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-extrabold text-base shadow-lg shadow-amber-500/30 active:scale-95 transition-transform">
                    <i className="fa-solid fa-flag-checkered"></i> Daftar Sekarang!
                </a>
            </div>
        </div>
    </nav>

    
    <section id="hero" className="relative pt-28 pb-20 lg:pt-36 lg:pb-32 hero-gradient text-white overflow-hidden">
        
        
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
            <i className="fa-solid fa-cloud text-white text-8xl absolute top-12 left-10 animate-cloud-drift"></i>
            <i className="fa-solid fa-cloud text-white text-9xl absolute top-32 -left-20 animate-cloud-drift" style={{ animationDuration: '60s' }}></i>
            <i className="fa-solid fa-paper-plane text-white text-4xl absolute top-20 right-1/4 animate-float-slow"></i>
        </div>

        {/* Hiasan floating Jelajah Ilmu dihapus sesuai permintaan */}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                <div className="lg:col-span-7 text-center lg:text-left space-y-6">
                    
                    
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-amber-200 text-xs sm:text-sm font-bold shadow-inner">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                        <i className="fa-solid fa-school"></i>
                        <span>Diselenggarakan oleh SD Plus 3 Al-Muhajirin</span>
                    </div>

                    
                    <div className="space-y-2">
                        <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl font-extrabold font-bubbly leading-tight tracking-tight text-white drop-shadow-md">
                            JinGa <span className="text-amber-300">EXPLORERS</span><br />
                            Academy Festival <span className="text-amber-300">2026</span>
                        </h1>
                        <p className="text-lg sm:text-xl font-medium text-sky-100 max-w-2xl mx-auto lg:mx-0">
                            🌟 <strong>Festival Akademik, Kreatif & Islami</strong> Terakbar untuk Siswa-Siswi <strong>TK & RA Se-Kabupaten Purwakarta</strong>. Berani Berpetualang, Raih Prestasi & Bentuk Karakter Sholeh! <br className="hidden sm:block" /><span className="inline-block mt-3 px-4 py-1.5 bg-amber-400 text-slate-900 rounded-full font-bold text-sm shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse border border-amber-300">✨ Pendaftaran 100% Gratis! ✨</span>
                        </p>
                    </div>

                    
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1 text-xs sm:text-sm font-semibold">
                        <span className="bg-emerald-600/80 border border-emerald-400/50 px-3 py-1.5 rounded-full shadow-sm">
                            🧭 Jelajah Ilmu
                        </span>
                        <span className="bg-amber-600/80 border border-amber-400/50 px-3 py-1.5 rounded-full shadow-sm">
                            🤝 Jelajah Amal
                        </span>
                        <span className="bg-red-600/80 border border-red-400/50 px-3 py-1.5 rounded-full shadow-sm">
                            ⭐ Jelajah Akhlak
                        </span>
                    </div>

                    
                    <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-white/20 shadow-xl max-w-xl mx-auto lg:mx-0">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                                <i className="fa-regular fa-clock animate-pulse"></i> Hitung Mundur Hari Petualangan:
                            </span>
                            <span className="text-[11px] bg-emerald-500/80 px-2.5 py-0.5 rounded-full font-bold">Pendaftaran Dibuka</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center" id="countdownTimer">
                            <div className="bg-slate-900/60 rounded-2xl p-2 sm:p-3 border border-white/10">
                                <span className="block text-2xl sm:text-3xl font-extrabold text-amber-400 font-bubbly" id="days">{String(timeLeft.days).padStart(2, '0')}</span>
                                <span className="text-[10px] sm:text-xs text-sky-200 uppercase font-semibold">Hari</span>
                            </div>
                            <div className="bg-slate-900/60 rounded-2xl p-2 sm:p-3 border border-white/10">
                                <span className="block text-2xl sm:text-3xl font-extrabold text-amber-400 font-bubbly" id="hours">{String(timeLeft.hours).padStart(2, '0')}</span>
                                <span className="text-[10px] sm:text-xs text-sky-200 uppercase font-semibold">Jam</span>
                            </div>
                            <div className="bg-slate-900/60 rounded-2xl p-2 sm:p-3 border border-white/10">
                                <span className="block text-2xl sm:text-3xl font-extrabold text-amber-400 font-bubbly" id="minutes">{String(timeLeft.minutes).padStart(2, '0')}</span>
                                <span className="text-[10px] sm:text-xs text-sky-200 uppercase font-semibold">Menit</span>
                            </div>
                            <div className="bg-slate-900/60 rounded-2xl p-2 sm:p-3 border border-white/10">
                                <span className="block text-2xl sm:text-3xl font-extrabold text-amber-400 font-bubbly" id="seconds">{String(timeLeft.seconds).padStart(2, '0')}</span>
                                <span className="text-[10px] sm:text-xs text-sky-200 uppercase font-semibold">Detik</span>
                            </div>
                        </div>
                    </div>

                    
                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                        <Link href="/daftar" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-extrabold text-base shadow-lg shadow-amber-500/30 hover:scale-105 hover:from-amber-300 hover:to-amber-400 transition-all flex items-center justify-center gap-3">
                            <i className="fa-solid fa-map-location-dot text-lg text-slate-900"></i>
                            <span>Daftar Peserta Cilik</span>
                        </Link>
                        <a href="#lomba" className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white font-bold text-base transition-all flex items-center justify-center gap-2">
                            <i className="fa-solid fa-trophy text-amber-300"></i>
                            <span>Lihat 7 Cabang Lomba</span>
                        </a>
                    </div>

                    
                    <div className="pt-4 grid grid-cols-3 gap-2 border-t border-white/15 text-center lg:text-left">
                        <div>
                            <p className="text-xl sm:text-2xl font-bold font-bubbly text-amber-300">500+</p>
                            <p className="text-[11px] sm:text-xs text-sky-100 font-medium">Target Peserta TK/RA</p>
                        </div>
                        <div>
                            <p className="text-xl sm:text-2xl font-bold font-bubbly text-amber-300">7 Lomba</p>
                            <p className="text-[11px] sm:text-xs text-sky-100 font-medium">Islami, Seni & Ketangkasan</p>
                        </div>
                        <div>
                            <p className="text-xl sm:text-2xl font-bold font-bubbly text-amber-300">Jutaan Rp</p>
                            <p className="text-[11px] sm:text-xs text-sky-100 font-medium">Potongan Biaya & Tabungan</p>
                        </div>
                    </div>

                </div>

                
                <div className="lg:col-span-5 relative">
                    <div className="relative mx-auto w-full group">
                        
                        
                        <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 via-emerald-400 to-sky-400 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                        
                        
                        <div className="relative bg-slate-900 p-3 rounded-3xl shadow-2xl border-4 border-amber-300 overflow-hidden">
                            <img src="assets/hero-poster.png" alt="Poster JinGa Explorers Academy Festival 2026" className="w-full h-auto rounded-2xl shadow-inner transform group-hover:scale-105 transition-transform duration-500"  />
                            
                            {/* Overlay dihapus sesuai permintaan */}
                        </div>

                        
                        <div className="absolute -top-5 -left-5 bg-amber-400 text-slate-900 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg border-2 border-white animate-wiggle">
                            🧭
                        </div>

                        
                        <div className="absolute -bottom-4 -right-4 bg-emerald-500 text-white px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-lg border-2 border-white animate-float-delayed">
                            🏫 Potongan Biaya Masuk
                        </div>
                    </div>
                </div>

            </div>
        </div>

        
        <div className="absolute bottom-0 left-0 right-0 leading-none">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-12 sm:h-16 text-slate-50 preserve-3d">
                <path d="M0,32L60,42.7C120,53,240,75,360,74.7C480,75,600,53,720,48C840,43,960,53,1080,64C1200,75,1320,85,1380,90.7L1440,96L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z" fill="#F8FAFC" />
            </svg>
        </div>
    </section>


    
    <section id="lomba" className="py-16 sm:py-24 bg-white relative treasure-map-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
                <span className="inline-block px-4 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold tracking-wider uppercase">
                    🏆 7 Zona Lomba Penjelajah Cilik
                </span>
                <h2 className="text-3xl sm:text-5xl font-extrabold font-bubbly text-slate-900">
                    Pilih Petualangan <span className="text-amber-500">Terbaik Si Kecil!</span>
                </h2>
                <p className="text-slate-600 text-base">
                    Klik filter kategori untuk melihat cabang lomba yang sesuai minat dan bakat ananda:
                </p>

                
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-3 pt-4" id="lombaFilterContainer">
                    <button onClick={() => setActiveFilter('Semua')} className={`w-full max-w-xs sm:w-auto filter-btn px-5 py-2.5 rounded-full text-sm font-bold shadow-sm transition-all border-2 ${activeFilter === 'Semua' ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-700 hover:bg-sky-50 border-slate-200 hover:border-sky-300'}`}>
                        Semua Lomba (7)
                    </button>
                    <button onClick={() => setActiveFilter('islami')} className={`w-full max-w-xs sm:w-auto filter-btn px-5 py-2.5 rounded-full text-sm font-bold shadow-sm transition-all border-2 ${activeFilter === 'islami' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 hover:bg-sky-50 border-slate-200 hover:border-emerald-300'}`}>
                        🕌 Keislaman & Tahfidz
                    </button>
                    <button onClick={() => setActiveFilter('seni')} className={`w-full max-w-xs sm:w-auto filter-btn px-5 py-2.5 rounded-full text-sm font-bold shadow-sm transition-all border-2 ${activeFilter === 'seni' ? 'bg-amber-500 text-slate-900 border-amber-500' : 'bg-white text-slate-700 hover:bg-sky-50 border-slate-200 hover:border-amber-300'}`}>
                        🎨 Seni & Kreativitas
                    </button>
                    <button onClick={() => setActiveFilter('ketangkasan')} className={`w-full max-w-xs sm:w-auto filter-btn px-5 py-2.5 rounded-full text-sm font-bold shadow-sm transition-all border-2 ${activeFilter === 'ketangkasan' ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-700 hover:bg-sky-50 border-slate-200 hover:border-sky-300'}`}>
                        🧩 Sains & Ketangkasan
                    </button>
                </div>
            </div>

            
            <div className="relative w-full">
                {/* Ghost Grid to preserve height exactly so footer NEVER jumps */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 opacity-0 pointer-events-none select-none" aria-hidden="true">
                    {lombaList.map((lomba) => (
                        <div key={lomba.id} className="lomba-card bg-white rounded-3xl p-6 border-2 flex flex-col justify-between invisible">
                            <div>
                                <div className="flex items-start justify-between mb-4">
                                    <span className="text-3xl">{lomba.icon}</span>
                                    <span className="text-[11px] px-2.5 py-1">Sisa Kuota: {Math.max(0, lomba.quota - (participantCounts[lomba.dbValue] || 0))}</span>
                                </div>
                                <h3 className="text-xl font-bold mb-2">{lomba.title}</h3>
                                <p className="text-xs mb-4">{lomba.desc}</p>
                                <div className="space-y-3 text-xs mb-4 p-3.5">
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-end">
                                            <span>Kapasitas Pendaftar</span>
                                            <strong>{participantCounts[lomba.dbValue] || 0} / {lomba.quota}</strong>
                                        </div>
                                        <div className="w-full h-1.5"></div>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span>Biaya Pendaftaran</span> 
                                        <strong>{lomba.price}</strong>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full py-2.5">Pilih Lomba Ini</div>
                        </div>
                    ))}
                </div>

                {/* Actual Animated Grid */}
                <motion.div layout className="absolute inset-0 flex flex-wrap gap-6 z-10 content-start" id="lombaCardsGrid">
                    <AnimatePresence mode="popLayout">
                    {filteredLomba.map((lomba) => (
                        <motion.div 
                            key={lomba.id} 
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className={`w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)] lomba-card ${lomba.category} bg-white rounded-3xl p-6 border-2 ${lomba.classes.border} shadow-md hover:shadow-xl transition-all card-3d-hover flex flex-col justify-between`}
                        >
                            <div>
                                <div className="flex items-start justify-between mb-4">
                                    <span className="text-3xl">{lomba.icon}</span>
                                    <span className={`text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full ${lomba.classes.tagBg} ${lomba.classes.tagText}`}>
                                        Sisa Kuota: {Math.max(0, lomba.quota - (participantCounts[lomba.dbValue] || 0))}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold font-bubbly text-slate-900 mb-2">{lomba.title}</h3>
                                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                                    {lomba.desc}
                                </p>
                                <div className="space-y-3 text-xs mb-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-end">
                                            <span className="font-semibold text-slate-500">Kapasitas Pendaftar</span>
                                            <strong className="text-slate-700 text-sm">{participantCounts[lomba.dbValue] || 0} <span className="text-xs text-slate-400 font-normal">/ {lomba.quota}</span></strong>
                                        </div>
                                        <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                                            <div className={`h-full rounded-full ${lomba.classes.tagBg.replace('100', '400')} transition-all duration-1000 ease-out`} style={{ width: `${Math.min(100, ((participantCounts[lomba.dbValue] || 0) / lomba.quota) * 100)}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/80">
                                        <span className="font-semibold text-slate-500">Biaya Pendaftaran</span> 
                                        <strong className={`${lomba.classes.priceText} font-bold text-sm bg-white px-2 py-0.5 rounded-md border border-slate-100 shadow-sm`}>{lomba.price}</strong>
                                    </div>
                                </div>
                            </div>
                            <Link href="/daftar" className={`w-full py-2.5 rounded-xl ${lomba.classes.btnBg} ${lomba.classes.btnHover} hover:text-white ${lomba.classes.btnText} font-bold text-xs transition-colors flex items-center justify-center gap-1.5`}>
                                <i className="fa-solid fa-plus-circle"></i> Pilih Lomba Ini
                            </Link>
                        </motion.div>
                    ))}
                    </AnimatePresence>
                </motion.div>
            </div>

            
            <div className="mt-12 p-6 rounded-3xl bg-gradient-to-r from-sky-600 to-sky-700 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
                        📄
                    </div>
                    <div>
                        <h4 className="font-bubbly font-bold text-lg">Butuh Petunjuk Teknis Lengkap (Juknis)?</h4>
                        <p className="text-xs sm:text-sm text-sky-100">Unduh PDF berisi kriteria penilaian juri, tata tertib, dan surat rekomendasi sekolah.</p>
                    </div>
                </div>
                <a href="/juknis-jeaf.pdf" download="Juknis_JEAF_2026.pdf" className="px-6 py-3 rounded-xl bg-amber-400 text-slate-900 font-extrabold text-xs sm:text-sm shadow hover:bg-amber-300 transition-colors whitespace-nowrap">
                    <i className="fa-solid fa-file-pdf mr-1"></i> Download Juknis (PDF)
                </a>
            </div>

        </div>
    </section>

    
    <section id="hadiah" className="py-16 sm:py-24 bg-gradient-to-b from-slate-900 to-sky-950 text-white relative overflow-hidden">
        
        
        <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-10 left-1/4 text-amber-300 text-xl animate-pulse">✨</div>
            <div className="absolute bottom-20 right-1/3 text-amber-300 text-2xl animate-pulse">⭐</div>
            <div className="absolute top-1/2 right-10 text-amber-300 text-xl animate-pulse">✨</div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                <span className="inline-block px-4 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-extrabold tracking-wider uppercase">
                    🎁 Apresiasi Sang Penjelajah
                </span>
                <h2 className="text-3xl sm:text-5xl font-extrabold font-bubbly text-white">
                    Peti Harta Karun & <span className="text-amber-400">Hadiah Spektakuler</span>
                </h2>
                <p className="text-slate-300 text-base">
                    Setiap keberanian ananda patut dirayakan! Berikut penghargaan dan fasilitas istimewa yang disiapkan:
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Card 1: Uang Pembinaan */}
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/15 text-center card-3d-hover">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-400/20 text-emerald-400 flex items-center justify-center text-3xl mb-4 border border-emerald-400/30 shadow-green-glow">
                        💵
                    </div>
                    <h3 className="text-lg font-bold font-bubbly text-emerald-300 mb-2">Tabungan Pendidikan</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        Uang pembinaan senilai total jutaan rupiah bagi para juara sebagai wujud apresiasi semangat belajar ananda.
                    </p>
                </div>

                {/* Card 2: Piala */}
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/15 text-center card-3d-hover">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center text-3xl mb-4 border border-amber-400/30 shadow-gold-glow">
                        🏆
                    </div>
                    <h3 className="text-lg font-bold font-bubbly text-amber-300 mb-2">Piala Kejuaraan</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        Piala eksklusif bagi para pemenang 1, 2, 3 sebagai bentuk apresiasi tertinggi atas keberanian dan prestasi ananda.
                    </p>
                </div>

                {/* Card 3: Sertifikat */}
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/15 text-center card-3d-hover">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-400/20 text-sky-400 flex items-center justify-center text-3xl mb-4 border border-sky-400/30">
                        📜
                    </div>
                    <h3 className="text-lg font-bold font-bubbly text-sky-300 mb-2">Sertifikat Penghargaan</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        Sertifikat penghargaan resmi keikutsertaan festival untuk seluruh pendaftar, peserta didik, dan guru pendamping.
                    </p>
                </div>

                {/* Card 4: Voucher Makanan */}
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/15 text-center card-3d-hover">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-red-400/20 text-red-400 flex items-center justify-center text-3xl mb-4 border border-red-400/30">
                        🎫
                    </div>
                    <h3 className="text-lg font-bold font-bubbly text-red-300 mb-2">Voucher Makanan Gratis</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        Nikmati keseruan acara dengan voucher makan gratis yang bisa ditukarkan di berbagai stand kuliner festival JinGa!
                    </p>
                </div>

            </div>

            
            <div className="mt-12 bg-gradient-to-r from-emerald-500/20 via-emerald-400/30 to-emerald-500/20 p-6 sm:p-8 rounded-3xl border-2 border-emerald-400/40 text-center max-w-2xl mx-auto shadow-green-glow">
                <span className="text-4xl block mb-2">🏫</span>
                <h3 className="text-2xl font-bold font-bubbly text-emerald-300 mb-2">Hadiah Utama: Potongan Biaya Bangunan SD!</h3>
                <p className="text-xs sm:text-sm text-slate-200">
                    Bagi para juara, dapatkan <strong>Potongan Khusus Dana Sumbangan Pendidikan (DSP)</strong> senilai jutaan rupiah untuk melanjutkan pendidikan terbaik di <strong>SD Plus 3 Al-Muhajirin</strong>!
                </p>
            </div>

        </div>
    </section>

    
    <section id="rundown" className="py-16 sm:py-24 bg-sky-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                <span className="inline-block px-4 py-1 rounded-full bg-sky-200 text-sky-800 text-xs font-extrabold tracking-wider uppercase">
                    🧭 Peta Rute Hari-H
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold font-bubbly text-slate-900">
                    Rundown Ekspedisi <span className="text-sky-600">Festival 2026</span>
                </h2>
                <p className="text-slate-600 text-base">
                    Susunan jadwal kegiatan dirancang efisien, ramah stamina anak, dan tidak membuat jenuh:
                </p>
            </div>

            
            <div className="max-w-4xl mx-auto relative">
                
                
                <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 top-4 bottom-4 w-1 bg-sky-200 rounded-full"></div>

                <div className="space-y-8">
                    
                    
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="w-full md:w-5/12 text-center md:text-right">
                            <span className="inline-block px-3 py-1 bg-amber-400 text-slate-900 font-extrabold text-xs rounded-full mb-1">07.00 - 08.00 WIB</span>
                            <h4 className="text-lg font-bold font-bubbly text-slate-900">Registrasi & Pembagian Atribut</h4>
                            <p className="text-xs text-slate-600">Check-in peserta di gerbang utama, foto di Photobooth 3D Explorer, dan pengambilan nomor dada.</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-md z-10 ring-4 ring-white">
                            1
                        </div>
                        <div className="w-full md:w-5/12 text-center md:text-left text-xs text-slate-500 bg-white p-3 rounded-2xl shadow-sm border border-sky-100">
                            📍 Plaza Utama SD Plus 3 Al-Muhajirin
                        </div>
                    </div>

                    
                    <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-6">
                        <div className="w-full md:w-5/12 text-center md:text-left">
                            <span className="inline-block px-3 py-1 bg-emerald-500 text-white font-extrabold text-xs rounded-full mb-1">08.00 - 08.30 WIB</span>
                            <h4 className="text-lg font-bold font-bubbly text-slate-900">Opening Ceremony</h4>
                            <p className="text-xs text-slate-600">Pembacaan ayat suci Al-Qur&apos;an, sambutan, dan prosesi pelepasan balon cita-cita.</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md z-10 ring-4 ring-white">
                            2
                        </div>
                        <div className="w-full md:w-5/12 text-center md:text-right text-xs text-slate-500 bg-white p-3 rounded-2xl shadow-sm border border-sky-100">
                            🎈 Panggung Utama Lapangan Hijau
                        </div>
                    </div>

                    
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="w-full md:w-5/12 text-center md:text-right">
                            <span className="inline-block px-3 py-1 bg-sky-500 text-white font-extrabold text-xs rounded-full mb-1">08.30 - 10.30 WIB</span>
                            <h4 className="text-lg font-bold font-bubbly text-slate-900">Ekspedisi Lomba Serentak</h4>
                            <p className="text-xs text-slate-600">Pelaksanaan 8 cabang lomba di zona kelas ber-AC dan arena outdoor yang nyaman.</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-md z-10 ring-4 ring-white">
                            3
                        </div>
                        <div className="w-full md:w-5/12 text-center md:text-left text-xs text-slate-500 bg-white p-3 rounded-2xl shadow-sm border border-sky-100">
                            🏫 Ruang Kelas SD Plus 3 Al-Muhajirin
                        </div>
                    </div>

                    
                    <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-6">
                        <div className="w-full md:w-5/12 text-center md:text-left">
                            <span className="inline-block px-3 py-1 bg-red-500 text-white font-extrabold text-xs rounded-full mb-1">10.30 - 11.30 WIB</span>
                            <h4 className="text-lg font-bold font-bubbly text-slate-900">Hiburan Edukasi Islami & Snack Time</h4>
                            <p className="text-xs text-slate-600">Istirahat sejenak menikmati jajanan dari voucher sambil menonton berbagai penampilan dan hiburan edukatif yang seru di panggung utama.</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-sm shadow-md z-10 ring-4 ring-white">
                            4
                        </div>
                        <div className="w-full md:w-5/12 text-center md:text-right text-xs text-slate-500 bg-white p-3 rounded-2xl shadow-sm border border-sky-100">
                            🎪 Area Panggung & Lapangan Hijau
                        </div>
                    </div>

                    
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="w-full md:w-5/12 text-center md:text-right">
                            <span className="inline-block px-3 py-1 bg-amber-500 text-slate-900 font-extrabold text-xs rounded-full mb-1">11.30 - 12.00 WIB</span>
                            <h4 className="text-lg font-bold font-bubbly text-slate-900">Awarding & Penyerahan Trofi</h4>
                            <p className="text-xs text-slate-600">Pengumuman juara lomba, penyerahan piala bergilir juara umum, dan foto bersama seluruh kontingen.</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center font-bold text-sm shadow-md z-10 ring-4 ring-white">
                            5
                        </div>
                        <div className="w-full md:w-5/12 text-center md:text-left text-xs text-slate-500 bg-white p-3 rounded-2xl shadow-sm border border-sky-100">
                            🏆 Panggung Utama Kehormatan
                        </div>
                    </div>

                </div>
            </div>

        </div>
    </section>


    
    <section id="lokasi" className="py-16 sm:py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                
                <div className="lg:col-span-6 space-y-6">
                    <span className="inline-block px-4 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold tracking-wider uppercase">
                        🏫 Lokasi Tuan Rumah
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold font-bubbly text-slate-900">
                        SD Plus 3 <span className="text-emerald-600">Al-Muhajirin</span>
                    </h2>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        Kampus sekolah yang asri, berwawasan islami modern, dilengkapi gedung ber-AC, lapangan terbuka ramah anak, musholla nyaman, dan area parkir luas.
                    </p>

                    <div className="space-y-4 pt-2">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center text-lg shrink-0">
                                <i className="fa-solid fa-location-dot"></i>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Alamat Sekolah</h4>
                                <p className="text-xs text-slate-600">Jl. Ipik Gandamanah No. 33, Ciseureuh, Purwakarta, Jawa Barat</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                                <i className="fa-brands fa-whatsapp"></i>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Call Center Panitia</h4>
                                <p className="text-xs text-slate-600">
                                    <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-all">
                                        +62 812-3456-7890
                                    </a> (Admin Konfirmasi Pendaftaran)
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-lg shrink-0">
                                <i className="fa-regular fa-calendar-check"></i>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Waktu Pelaksanaan</h4>
                                <p className="text-xs text-slate-600">Sabtu, 10 Oktober 2026 • Pukul 07.00 WIB s.d Selesai</p>
                            </div>
                        </div>
                    </div>
                </div>

                
                <div className="lg:col-span-6">
                    <div className="bg-white p-4 rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden relative">
                        <div className="aspect-video w-full rounded-2xl bg-sky-100 relative overflow-hidden flex flex-col items-center justify-center p-6 text-center border border-sky-200">
                            <i className="fa-solid fa-map-marked-alt text-5xl text-sky-500 mb-3 animate-bounce"></i>
                            <h4 className="font-bubbly font-bold text-slate-800 text-lg">Peta Lokasi Kampus</h4>
                            <p className="text-xs text-slate-500 max-w-sm mb-4">Akses mudah dijangkau dari pusat kota dengan fasilitas drop-off area bus rombongan.</p>
                            <a href="https://maps.app.goo.gl/tHPfgB7Wq1CMPcMd6" target="_blank" className="px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs shadow hover:bg-sky-500 transition-colors flex items-center gap-2">
                                <i className="fa-solid fa-arrow-up-right-from-square"></i> Buka Petunjuk Arah Google Maps
                            </a>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    </section>

    
    <section id="faq" className="py-16 sm:py-24 bg-white relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
                <span className="inline-block px-4 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-extrabold tracking-wider uppercase">
                    ❓ Pertanyaan Populer
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold font-bubbly text-slate-900">
                    Frequently Asked <span className="text-sky-600">Questions</span>
                </h2>
                <p className="text-slate-600 text-sm">
                    Pertanyaan yang sering diajukan oleh Ayah/Bunda dan Guru Pendamping:
                </p>
            </div>

            <div className="space-y-4">
                
                
                <div className="border border-slate-200 rounded-2xl p-5 hover:border-sky-300 transition-colors bg-slate-50/50">
                    <button onClick={() => setActiveFaq(activeFaq === 1 ? null : 1)} className="w-full flex items-center justify-between text-left font-bold text-sm sm:text-base text-slate-800 focus:outline-none">
                        <span>Apakah 1 anak boleh mengikuti lebih dari 1 cabang lomba?</span>
                        <i className={`fa-solid fa-chevron-down text-sky-600 transition-transform ${activeFaq === 1 ? 'rotate-180' : ''}`}></i>
                    </button>
                    <AnimatePresence>
                        {activeFaq === 1 && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="overflow-hidden"
                            >
                                <div className="pt-3 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-3">
                                    Mohon maaf, tidak boleh. Untuk menjaga keadilan dan fokus ananda, 1 anak hanya diperkenankan memilih dan mengikuti 1 cabang lomba saja.
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                
                <div className="border border-slate-200 rounded-2xl p-5 hover:border-sky-300 transition-colors bg-slate-50/50">
                    <button onClick={() => setActiveFaq(activeFaq === 2 ? null : 2)} className="w-full flex items-center justify-between text-left font-bold text-sm sm:text-base text-slate-800 focus:outline-none">
                        <span>Bagaimana sistem penilaian juri?</span>
                        <i className={`fa-solid fa-chevron-down text-sky-600 transition-transform ${activeFaq === 2 ? 'rotate-180' : ''}`}></i>
                    </button>
                    <AnimatePresence>
                        {activeFaq === 2 && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="overflow-hidden"
                            >
                                <div className="pt-3 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-3">
                                    Dewan juri terdiri dari praktisi pendidikan anak usia dini independen dan ustadz/ustadzah profesional. Keputusan dewan juri bersifat mutlak dan berpedoman penuh pada Juknis Resmi.
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                
                <div className="border border-slate-200 rounded-2xl p-5 hover:border-sky-300 transition-colors bg-slate-50/50">
                    <button onClick={() => setActiveFaq(activeFaq === 3 ? null : 3)} className="w-full flex items-center justify-between text-left font-bold text-sm sm:text-base text-slate-800 focus:outline-none">
                        <span>Apa saja fasilitas dan hadiah yang didapatkan peserta?</span>
                        <i className={`fa-solid fa-chevron-down text-sky-600 transition-transform ${activeFaq === 3 ? 'rotate-180' : ''}`}></i>
                    </button>
                    <AnimatePresence>
                        {activeFaq === 3 && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="overflow-hidden"
                            >
                                <div className="pt-3 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-3">
                                    Seluruh peserta akan mendapatkan Sertifikat Kepesertaan Resmi dan voucher makanan gratis. Bagi para juara, tersedia piala eksklusif, tabungan pendidikan, serta Hadiah Utama berupa Potongan Biaya Bangunan (DSP) di SD Plus 3 Al-Muhajirin!
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                
                <div className="border border-slate-200 rounded-2xl p-5 hover:border-sky-300 transition-colors bg-slate-50/50">
                    <button onClick={() => setActiveFaq(activeFaq === 4 ? null : 4)} className="w-full flex items-center justify-between text-left font-bold text-sm sm:text-base text-slate-800 focus:outline-none">
                        <span>Bagaimana cara mendaftar dan melakukan pembayaran?</span>
                        <i className={`fa-solid fa-chevron-down text-sky-600 transition-transform ${activeFaq === 4 ? 'rotate-180' : ''}`}></i>
                    </button>
                    <AnimatePresence>
                        {activeFaq === 4 && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="overflow-hidden"
                            >
                                <div className="pt-3 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-3">
                                    Pendaftaran dapat dilakukan secara praktis melalui tombol "Daftar Sekarang" di website ini. Pembayaran dapat ditransfer atau dibayar tunai langsung di Sekretariat SD Plus 3 Al-Muhajirin. Silakan hubungi Admin Konfirmasi Pendaftaran jika ada kendala.
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>

        </div>
    </section>

    
    <footer className="bg-slate-900 text-slate-400 text-xs pt-16 pb-12 border-t-4 border-amber-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
                
                <div className="space-y-4 md:col-span-2">
                    <div className="flex items-center gap-3">
                        <img src="assets/logo.png" alt="Logo SD Plus 3 Al-Muhajirin" className="w-14 h-14 object-contain drop-shadow-md" />
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="text-2xl font-bold font-bubbly text-sky-400">JinGa</span>
                            <span className="text-xs uppercase font-extrabold bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full self-start sm:self-auto">Festival 2026</span>
                        </div>
                    </div>
                    <p className="text-slate-400 max-w-md leading-relaxed">
                        Ekspedisi Akbar TK/RA se-Kabupaten Purwakarta dalam rangka membentuk generasi pembelajar cilik yang unggul dalam ilmu pengetahuan, tangguh dalam amal, dan mulia dalam akhlak islami.
                    </p>
                    <p className="text-slate-500 font-semibold">Tuan Rumah: SD Plus 3 Al-Muhajirin</p>
                </div>

                <div className="space-y-2">
                    <h5 className="font-bold text-white uppercase text-xs tracking-wider">Tautan Cepat</h5>
                    <ul className="space-y-2">
                        <li><a href="#tentang" className="hover:text-amber-400 transition-colors">Tentang Acara</a></li>
                        <li><a href="#lomba" className="hover:text-amber-400 transition-colors">8 Cabang Lomba</a></li>
                        <li><a href="#hadiah" className="hover:text-amber-400 transition-colors">Hadiah & Trofi</a></li>
                        <li><a href="#daftar" className="hover:text-amber-400 transition-colors">Formulir Pendaftaran</a></li>
                    </ul>
                </div>

                <div className="space-y-2">
                    <h5 className="font-bold text-white uppercase text-xs tracking-wider">Media Sosial</h5>
                    <div className="flex gap-3 pt-1 text-lg">
                        <a href="https://www.instagram.com/sdplus3almuhajirin/" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-sky-600 text-white flex items-center justify-center transition-colors"><i className="fa-brands fa-instagram"></i></a>
                        <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-emerald-600 text-white flex items-center justify-center transition-colors"><i className="fa-brands fa-whatsapp"></i></a>
                        <a href="https://www.youtube.com/channel/UCwcqB1JYus2Pk79TFSY273Q/about" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-red-600 text-white flex items-center justify-center transition-colors"><i className="fa-brands fa-youtube"></i></a>
                    </div>
                </div>

            </div>

            <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <p>&copy; 2026 JinGa Explorers Academy Festival • SD Plus 3 Al-Muhajirin.</p>
                <p className="text-slate-500">
                    <i className="fa-solid fa-code text-slate-400 mr-1"></i> Developed by <strong>Dani Ramdani, S.Kom</strong> (<a href="https://wa.me/6283820374734" target="_blank" rel="noreferrer" className="hover:text-sky-400 transition-colors">083820374734</a>)
                </p>
            </div>
        </div>
    </footer>



    
    <div id="posterModal" className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md hidden items-center justify-center p-4">
        <div className="relative max-w-3xl w-full bg-slate-900 rounded-3xl p-4 border-2 border-amber-400 shadow-2xl">
            <button  className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-amber-400 text-slate-900 font-extrabold flex items-center justify-center shadow-lg hover:bg-amber-300">
                ✕
            </button>
            <img src="assets/hero-poster.png" alt="Poster Festival Lengkap" className="w-full h-auto max-h-[80vh] object-contain rounded-2xl" />
            <div className="text-center pt-3">
                <p className="text-amber-300 text-xs font-bold">Poster Resmi JinGa Explorers Academy Festival 2026</p>
            </div>
        </div>
    </div>

    
    <div id="juknisModal" className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm hidden items-center justify-center p-4">
        <div className="bg-white max-w-lg w-full rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-sky-200 relative">
            <button  className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-xl font-bold">
                ✕
            </button>
            <div className="text-center space-y-3 mb-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-3xl">
                    📄
                </div>
                <h3 className="text-2xl font-bold font-bubbly text-slate-900">Petunjuk Teknis (Juknis)</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                    Dokumen resmi berisi ketentuan umum, kriteria penilaian juri di setiap mata lomba, dan tata tertib lomba.
                </p>
            </div>
            <div className="space-y-3">
                <a href="#"  className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm text-center block shadow transition-colors">
                    📥 Download Juknis Lomba Lengkap (.PDF)
                </a>
                <button  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors">
                    Tutup
                </button>
            </div>
        </div>
    </div>

    
    

    </div>
  );
}
