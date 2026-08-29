
export default function Home() {
  return (
    <div className="bg-[#F8FAFC] font-sans overflow-x-hidden">
      

    
    <div className="bunting-banner w-full fixed top-0 left-0 z-50"></div>

    
    <nav className="fixed top-2 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
                
                
                <a href="#hero" className="flex items-center gap-3 group">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-sky-500 p-0.5 shadow-md group-hover:rotate-6 transition-transform">
                        <img src="assets/hero-poster.png" alt="JinGa Explorers" className="w-full h-full object-cover rounded-[14px]" />
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
                    <a href="#tentang" className="hover:text-sky-600 transition-colors">Tentang Acara</a>
                    <a href="#lomba" className="hover:text-sky-600 transition-colors">Cabang Lomba</a>
                    <a href="#hadiah" className="hover:text-sky-600 transition-colors">Hadiah & Trofi</a>
                    <a href="#rundown" className="hover:text-sky-600 transition-colors">Peta Rute</a>
                    <a href="#faq" className="hover:text-sky-600 transition-colors">FAQ</a>
                </div>

                
                <div className="flex items-center gap-3">
                    <a href="#daftar" className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm shadow-md hover:shadow-lg hover:from-amber-400 hover:to-amber-500 hover:scale-105 active:scale-95 transition-all">
                        <i className="fa-solid fa-compass animate-spin text-amber-200" style={{ animationDuration: '6s' }}></i>
                        <span>Daftar Sekarang</span>
                    </a>
                    
                    
                    <button id="mobileMenuBtn" className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-sky-50 focus:outline-none" aria-label="Buka Menu">
                        <i className="fa-solid fa-bars text-2xl" id="menuIcon"></i>
                    </button>
                </div>
            </div>
        </div>

        
        <div id="mobileMenu" className="hidden md:hidden bg-white border-b border-sky-100 px-4 pt-2 pb-6 space-y-3 shadow-xl">
            <a href="#tentang" className="block py-2 text-slate-700 font-semibold hover:text-sky-600 mobile-link">Tentang Acara</a>
            <a href="#lomba" className="block py-2 text-slate-700 font-semibold hover:text-sky-600 mobile-link">Cabang Lomba (8 Kategori)</a>
            <a href="#hadiah" className="block py-2 text-slate-700 font-semibold hover:text-sky-600 mobile-link">Peti Hadiah & Trofi</a>
            <a href="#rundown" className="block py-2 text-slate-700 font-semibold hover:text-sky-600 mobile-link">Peta Jadwal Acara</a>
            <a href="#lokasi" className="block py-2 text-slate-700 font-semibold hover:text-sky-600 mobile-link">Lokasi Sekolah</a>
            <a href="#faq" className="block py-2 text-slate-700 font-semibold hover:text-sky-600 mobile-link">Tanya Jawab (FAQ)</a>
            <div className="pt-2">
                <a href="#daftar" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 text-white font-bold text-center shadow mobile-link">
                    <i className="fa-solid fa-flag-checkered"></i> Daftar Petualangan Sekarang
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

        
        <div className="hidden lg:block absolute top-28 right-12 animate-float-slow pointer-events-none">
            <div className="bg-amber-400 text-slate-900 px-3 py-1 rounded-full text-xs font-extrabold shadow-lg mb-1 animate-bounce text-center">
                🎈 Jelajah Ilmu!
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                
                
                <div className="lg:col-span-7 text-center lg:text-left space-y-6">
                    
                    
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-amber-200 text-xs sm:text-sm font-bold shadow-inner">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                        <i className="fa-solid fa-school"></i>
                        <span>Diselenggarakan oleh SD Plus 3 Al-Muhajirin</span>
                    </div>

                    
                    <div className="space-y-2">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-bubbly leading-tight tracking-tight text-white drop-shadow-md">
                            JinGa <span className="text-amber-300">EXPLORERS</span><br />
                            Academy Festival <span className="text-amber-300">2026</span>
                        </h1>
                        <p className="text-lg sm:text-xl font-medium text-sky-100 max-w-2xl mx-auto lg:mx-0">
                            🌟 <strong>Festival Akademik, Kreatif & Islami</strong> Terakbar untuk Siswa-Siswi <strong>TK & RA Se-Derajat</strong>. Berani Berpetualang, Raih Prestasi & Bentuk Karakter Sholeh!
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
                                <span className="block text-2xl sm:text-3xl font-extrabold text-amber-400 font-bubbly" id="days">00</span>
                                <span className="text-[10px] sm:text-xs text-sky-200 uppercase font-semibold">Hari</span>
                            </div>
                            <div className="bg-slate-900/60 rounded-2xl p-2 sm:p-3 border border-white/10">
                                <span className="block text-2xl sm:text-3xl font-extrabold text-amber-400 font-bubbly" id="hours">00</span>
                                <span className="text-[10px] sm:text-xs text-sky-200 uppercase font-semibold">Jam</span>
                            </div>
                            <div className="bg-slate-900/60 rounded-2xl p-2 sm:p-3 border border-white/10">
                                <span className="block text-2xl sm:text-3xl font-extrabold text-amber-400 font-bubbly" id="minutes">00</span>
                                <span className="text-[10px] sm:text-xs text-sky-200 uppercase font-semibold">Menit</span>
                            </div>
                            <div className="bg-slate-900/60 rounded-2xl p-2 sm:p-3 border border-white/10">
                                <span className="block text-2xl sm:text-3xl font-extrabold text-amber-400 font-bubbly" id="seconds">00</span>
                                <span className="text-[10px] sm:text-xs text-sky-200 uppercase font-semibold">Detik</span>
                            </div>
                        </div>
                    </div>

                    
                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                        <a href="#daftar" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-extrabold text-base shadow-lg shadow-amber-500/30 hover:scale-105 hover:from-amber-300 hover:to-amber-400 transition-all flex items-center justify-center gap-3">
                            <i className="fa-solid fa-map-location-dot text-lg text-slate-900"></i>
                            <span>Daftar Peserta Cilik</span>
                        </a>
                        <a href="#lomba" className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white font-bold text-base transition-all flex items-center justify-center gap-2">
                            <i className="fa-solid fa-trophy text-amber-300"></i>
                            <span>Lihat 8 Cabang Lomba</span>
                        </a>
                    </div>

                    
                    <div className="pt-4 grid grid-cols-3 gap-2 border-t border-white/15 text-center lg:text-left">
                        <div>
                            <p className="text-xl sm:text-2xl font-bold font-bubbly text-amber-300">500+</p>
                            <p className="text-[11px] sm:text-xs text-sky-100 font-medium">Target Peserta TK/RA</p>
                        </div>
                        <div>
                            <p className="text-xl sm:text-2xl font-bold font-bubbly text-amber-300">8 Lomba</p>
                            <p className="text-[11px] sm:text-xs text-sky-100 font-medium">Islami, Seni & Ketangkasan</p>
                        </div>
                        <div>
                            <p className="text-xl sm:text-2xl font-bold font-bubbly text-amber-300">Jutaan Rp</p>
                            <p className="text-[11px] sm:text-xs text-sky-100 font-medium">Tabungan & Piala Bergilir</p>
                        </div>
                    </div>

                </div>

                
                <div className="lg:col-span-5 relative">
                    <div className="relative mx-auto max-w-md group">
                        
                        
                        <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 via-emerald-400 to-sky-400 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                        
                        
                        <div className="relative bg-slate-900 p-3 rounded-3xl shadow-2xl border-4 border-amber-300 overflow-hidden">
                            <img src="assets/hero-poster.png" alt="Poster JinGa Explorers Academy Festival 2026" className="w-full h-auto rounded-2xl shadow-inner transform group-hover:scale-105 transition-transform duration-500 cursor-pointer"  />
                            
                            
                            <div className="absolute bottom-6 left-6 right-6 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-amber-400/40 text-center shadow-lg">
                                <p className="text-xs font-bold text-amber-300">🔍 Klik poster untuk perbesar</p>
                                <p className="text-[11px] text-slate-300">Tempat: SD Plus 3 Al-Muhajirin</p>
                            </div>
                        </div>

                        
                        <div className="absolute -top-5 -left-5 bg-amber-400 text-slate-900 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg border-2 border-white animate-wiggle">
                            🧭
                        </div>

                        
                        <div className="absolute -bottom-4 -right-4 bg-emerald-500 text-white px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-lg border-2 border-white animate-float-delayed">
                            🏆 Piala Juara Umum
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

    
    <section id="tentang" className="py-16 sm:py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
                <span className="inline-block px-4 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-extrabold tracking-wider uppercase">
                    🗺️ Menjelajah Bersama JinGa
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold font-bubbly text-slate-900">
                    Bukan Sekadar Lomba Biasa, Ini Adalah <span className="text-sky-600">Ekspedisi Karakter Cilik!</span>
                </h2>
                <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                    <strong>JinGa Explorers Academy Festival 2026</strong> dirancang khusus dengan pendekatan psikologi anak usia dini (TK A & TK B) yang menyenangkan, edukatif, dan bernafaskan nilai-nilai Islam yang ramah serta menginspirasi.
                </p>
            </div>

            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                
                <div className="bg-white p-8 rounded-3xl border-2 border-sky-100 shadow-bubbly card-3d-hover relative overflow-hidden group">
                    <div className="w-16 h-16 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-graduation-cap"></i>
                    </div>
                    <span className="text-xs font-extrabold uppercase px-2.5 py-1 bg-sky-50 text-sky-600 rounded-lg">Pilar 01</span>
                    <h3 className="text-2xl font-bold font-bubbly text-slate-900 mt-2 mb-3">Jelajah Ilmu</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        Mengasah daya pikir kritis, wawasan sains cilik, kecintaan membaca Al-Qur&apos;an, dan kemampuan berani berbicara di hadapan umum sejak usia dini.
                    </p>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-sky-600 gap-1.5">
                        <i className="fa-solid fa-circle-check"></i> Tahfidz, Pildacil & Sains
                    </div>
                </div>

                
                <div className="bg-white p-8 rounded-3xl border-2 border-amber-100 shadow-bubbly card-3d-hover relative overflow-hidden group">
                    <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-hands-holding-heart"></i>
                    </div>
                    <span className="text-xs font-extrabold uppercase px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg">Pilar 02</span>
                    <h3 className="text-2xl font-bold font-bubbly text-slate-900 mt-2 mb-3">Jelajah Amal</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        Mendorong kreativitas karya seni, kemandirian anak, sportivitas, serta kemampuan motorik halus dan kasar lewat arena ketangkasan seru.
                    </p>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-amber-600 gap-1.5">
                        <i className="fa-solid fa-circle-check"></i> Mewarnai, Kreasi & Halang Rintang
                    </div>
                </div>

                
                <div className="bg-white p-8 rounded-3xl border-2 border-emerald-100 shadow-bubbly card-3d-hover relative overflow-hidden group">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-star-and-crescent"></i>
                    </div>
                    <span className="text-xs font-extrabold uppercase px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg">Pilar 03</span>
                    <h3 className="text-2xl font-bold font-bubbly text-slate-900 mt-2 mb-3">Jelajah Akhlak</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        Menanamkan adab islami, rasa percaya diri, busana sopan syar&apos;i yang anggun, serta cinta kepada Allah SWT dan Rasulullah SAW.
                    </p>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-emerald-600 gap-1.5">
                        <i className="fa-solid fa-circle-check"></i> Adzan, Doa & Fashion Show Muslim
                    </div>
                </div>

            </div>

        </div>
    </section>

    
    <section id="lomba" className="py-16 sm:py-24 bg-white relative treasure-map-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
                <span className="inline-block px-4 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold tracking-wider uppercase">
                    🏆 8 Zona Lomba Penjelajah Cilik
                </span>
                <h2 className="text-3xl sm:text-5xl font-extrabold font-bubbly text-slate-900">
                    Pilih Petualangan <span className="text-amber-500">Terbaik Si Kecil!</span>
                </h2>
                <p className="text-slate-600 text-base">
                    Klik filter kategori untuk melihat cabang lomba yang sesuai minat dan bakat ananda:
                </p>

                
                <div className="flex flex-wrap items-center justify-center gap-2 pt-4" id="lombaFilterContainer">
                    <button  className="filter-btn active px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-sky-600 text-white shadow-md transition-all">
                        Semua Lomba (8)
                    </button>
                    <button  className="filter-btn px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-white text-slate-700 hover:bg-sky-50 border border-slate-200 transition-all">
                        🕌 Keislaman & Tahfidz
                    </button>
                    <button  className="filter-btn px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-white text-slate-700 hover:bg-sky-50 border border-slate-200 transition-all">
                        🎨 Seni & Kreativitas
                    </button>
                    <button  className="filter-btn px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-white text-slate-700 hover:bg-sky-50 border border-slate-200 transition-all">
                        🧩 Sains & Ketangkasan
                    </button>
                </div>
            </div>

            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="lombaCardsGrid">
                
                
                <div className="lomba-card islami bg-white rounded-3xl p-6 border-2 border-emerald-200 shadow-md hover:shadow-xl transition-all card-3d-hover flex flex-col justify-between">
                    <div>
                        <div className="flex items-start justify-between mb-4">
                            <span className="text-3xl">📖</span>
                            <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                                TK A & B
                            </span>
                        </div>
                        <h3 className="text-xl font-bold font-bubbly text-slate-900 mb-2">Tahfidz Cilik (Juz 30)</h3>
                        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                            Uji hafalan surah-surah pendek pilihan dengan tartil, makhraj yang benar, dan adab tilawah.
                        </p>
                        <div className="space-y-1.5 text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-2xl">
                            <div className="flex justify-between"><span>Kuota:</span> <strong className="text-slate-800">40 Peserta</strong></div>
                            <div className="flex justify-between"><span>Biaya:</span> <strong className="text-emerald-600 font-bold">Rp 35.000</strong></div>
                        </div>
                    </div>
                    <button  className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5">
                        <i className="fa-solid fa-plus-circle"></i> Pilih Lomba Ini
                    </button>
                </div>

                
                <div className="lomba-card islami bg-white rounded-3xl p-6 border-2 border-emerald-200 shadow-md hover:shadow-xl transition-all card-3d-hover flex flex-col justify-between">
                    <div>
                        <div className="flex items-start justify-between mb-4">
                            <span className="text-3xl">🤲</span>
                            <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                                TK A & B
                            </span>
                        </div>
                        <h3 className="text-xl font-bold font-bubbly text-slate-900 mb-2">Hafalan Doa & Hadits</h3>
                        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                            Melafalkan doa sehari-hari beserta hadits akhlak dengan kelancaran dan pemahaman arti sederhana.
                        </p>
                        <div className="space-y-1.5 text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-2xl">
                            <div className="flex justify-between"><span>Kuota:</span> <strong className="text-slate-800">35 Peserta</strong></div>
                            <div className="flex justify-between"><span>Biaya:</span> <strong className="text-emerald-600 font-bold">Rp 35.000</strong></div>
                        </div>
                    </div>
                    <button  className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5">
                        <i className="fa-solid fa-plus-circle"></i> Pilih Lomba Ini
                    </button>
                </div>

                
                <div className="lomba-card seni bg-white rounded-3xl p-6 border-2 border-amber-200 shadow-md hover:shadow-xl transition-all card-3d-hover flex flex-col justify-between">
                    <div>
                        <div className="flex items-start justify-between mb-4">
                            <span className="text-3xl">🎨</span>
                            <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                                TK A & B
                            </span>
                        </div>
                        <h3 className="text-xl font-bold font-bubbly text-slate-900 mb-2">Lomba Mewarnai Cilik</h3>
                        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                            Mengekspresikan imajinasi dan gradasi warna ceria pada sketsa petualang cilik JinGa.
                        </p>
                        <div className="space-y-1.5 text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-2xl">
                            <div className="flex justify-between"><span>Kuota:</span> <strong className="text-slate-800">75 Peserta</strong></div>
                            <div className="flex justify-between"><span>Biaya:</span> <strong className="text-amber-600 font-bold">Rp 30.000</strong></div>
                        </div>
                    </div>
                    <button  className="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5">
                        <i className="fa-solid fa-plus-circle"></i> Pilih Lomba Ini
                    </button>
                </div>

                
                <div className="lomba-card islami bg-white rounded-3xl p-6 border-2 border-emerald-200 shadow-md hover:shadow-xl transition-all card-3d-hover flex flex-col justify-between">
                    <div>
                        <div className="flex items-start justify-between mb-4">
                            <span className="text-3xl">🎤</span>
                            <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                                Khusus TK B
                            </span>
                        </div>
                        <h3 className="text-xl font-bold font-bubbly text-slate-900 mb-2">Pildacil (Dai Cilik)</h3>
                        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                            Menumbuhkan keberanian berbicara di depan panggung dengan pesan moral islami yang menggemaskan.
                        </p>
                        <div className="space-y-1.5 text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-2xl">
                            <div className="flex justify-between"><span>Kuota:</span> <strong className="text-slate-800">25 Peserta</strong></div>
                            <div className="flex justify-between"><span>Biaya:</span> <strong className="text-emerald-600 font-bold">Rp 35.000</strong></div>
                        </div>
                    </div>
                    <button  className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5">
                        <i className="fa-solid fa-plus-circle"></i> Pilih Lomba Ini
                    </button>
                </div>

                
                <div className="lomba-card seni bg-white rounded-3xl p-6 border-2 border-amber-200 shadow-md hover:shadow-xl transition-all card-3d-hover flex flex-col justify-between">
                    <div>
                        <div className="flex items-start justify-between mb-4">
                            <span className="text-3xl">👗</span>
                            <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                                Putra & Putri
                            </span>
                        </div>
                        <h3 className="text-xl font-bold font-bubbly text-slate-900 mb-2">Fashion Busana Muslim</h3>
                        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                            Peragaan busana muslim/muslimah cilik bertema &quot;Little Explorer&quot; yang syar&apos;i, anggun, dan percaya diri.
                        </p>
                        <div className="space-y-1.5 text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-2xl">
                            <div className="flex justify-between"><span>Kuota:</span> <strong className="text-slate-800">30 Peserta</strong></div>
                            <div className="flex justify-between"><span>Biaya:</span> <strong className="text-amber-600 font-bold">Rp 40.000</strong></div>
                        </div>
                    </div>
                    <button  className="w-full py-2.5 rounded-xl bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5">
                        <i className="fa-solid fa-plus-circle"></i> Pilih Lomba Ini
                    </button>
                </div>

                
                <div className="lomba-card islami bg-white rounded-3xl p-6 border-2 border-emerald-200 shadow-md hover:shadow-xl transition-all card-3d-hover flex flex-col justify-between">
                    <div>
                        <div className="flex items-start justify-between mb-4">
                            <span className="text-3xl">🗣️</span>
                            <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                                Khusus Ikhwan
                            </span>
                        </div>
                        <h3 className="text-xl font-bold font-bubbly text-slate-900 mb-2">Lomba Adzan Cilik</h3>
                        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                            Melantunkan panggilan adzan Subuh/Dzuhur dengan kemerduan nada, kejelasan makhraj, dan adab muadzin.
                        </p>
                        <div className="space-y-1.5 text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-2xl">
                            <div className="flex justify-between"><span>Kuota:</span> <strong className="text-slate-800">30 Peserta</strong></div>
                            <div className="flex justify-between"><span>Biaya:</span> <strong className="text-emerald-600 font-bold">Rp 30.000</strong></div>
                        </div>
                    </div>
                    <button  className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5">
                        <i className="fa-solid fa-plus-circle"></i> Pilih Lomba Ini
                    </button>
                </div>

                
                <div className="lomba-card ketangkasan bg-white rounded-3xl p-6 border-2 border-sky-200 shadow-md hover:shadow-xl transition-all card-3d-hover flex flex-col justify-between">
                    <div>
                        <div className="flex items-start justify-between mb-4">
                            <span className="text-3xl">🧩</span>
                            <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-sky-100 text-sky-800">
                                Sains & Logika
                            </span>
                        </div>
                        <h3 className="text-xl font-bold font-bubbly text-slate-900 mb-2">Puzzle & Sains Cilik</h3>
                        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                            Tantangan kecepatan menyusun balok logika, geometri, dan eksperimen warna sains pemula yang seru.
                        </p>
                        <div className="space-y-1.5 text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-2xl">
                            <div className="flex justify-between"><span>Kuota:</span> <strong className="text-slate-800">30 Peserta</strong></div>
                            <div className="flex justify-between"><span>Biaya:</span> <strong className="text-sky-600 font-bold">Rp 35.000</strong></div>
                        </div>
                    </div>
                    <button  className="w-full py-2.5 rounded-xl bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5">
                        <i className="fa-solid fa-plus-circle"></i> Pilih Lomba Ini
                    </button>
                </div>

                
                <div className="lomba-card ketangkasan bg-white rounded-3xl p-6 border-2 border-sky-200 shadow-md hover:shadow-xl transition-all card-3d-hover flex flex-col justify-between">
                    <div>
                        <div className="flex items-start justify-between mb-4">
                            <span className="text-3xl">🏃</span>
                            <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-sky-100 text-sky-800">
                                Motorik Kasar
                            </span>
                        </div>
                        <h3 className="text-xl font-bold font-bubbly text-slate-900 mb-2">Halang Rintang Cilik</h3>
                        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                            Arena jelajah aman: merangkak terowongan, titian keseimbangan, dan mengumpulkan bintang harta karun.
                        </p>
                        <div className="space-y-1.5 text-xs text-slate-500 mb-4 bg-slate-50 p-3 rounded-2xl">
                            <div className="flex justify-between"><span>Kuota:</span> <strong className="text-slate-800">40 Peserta</strong></div>
                            <div className="flex justify-between"><span>Biaya:</span> <strong className="text-sky-600 font-bold">Rp 35.000</strong></div>
                        </div>
                    </div>
                    <button  className="w-full py-2.5 rounded-xl bg-sky-50 hover:bg-sky-600 hover:text-white text-sky-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5">
                        <i className="fa-solid fa-plus-circle"></i> Pilih Lomba Ini
                    </button>
                </div>

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
                <a href="#juknisModal"  className="px-6 py-3 rounded-xl bg-amber-400 text-slate-900 font-extrabold text-xs sm:text-sm shadow hover:bg-amber-300 transition-colors whitespace-nowrap">
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
                
                
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/15 text-center card-3d-hover">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center text-3xl mb-4 border border-amber-400/30 shadow-gold-glow">
                        🏆
                    </div>
                    <h3 className="text-lg font-bold font-bubbly text-amber-300 mb-2">Trofi Juara 1, 2, 3</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        Piala eksklusif berkarakter JinGa Explorer + Juara Harapan 1, 2, 3 di setiap cabang lomba.
                    </p>
                </div>

                
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/15 text-center card-3d-hover">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-400/20 text-emerald-400 flex items-center justify-center text-3xl mb-4 border border-emerald-400/30 shadow-green-glow">
                        💵
                    </div>
                    <h3 className="text-lg font-bold font-bubbly text-emerald-300 mb-2">Tabungan Pendidikan</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        Uang pembinaan jutaan rupiah bagi para juara sebagai wujud apresiasi semangat belajar ananda.
                    </p>
                </div>

                
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/15 text-center card-3d-hover">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-400/20 text-sky-400 flex items-center justify-center text-3xl mb-4 border border-sky-400/30">
                        📜
                    </div>
                    <h3 className="text-lg font-bold font-bubbly text-sky-300 mb-2">Sertifikat Ber-Barcode</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        Sertifikat penghargaan resmi ber-barcode verifikasi untuk seluruh peserta dan guru pendamping.
                    </p>
                </div>

                
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/15 text-center card-3d-hover">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-red-400/20 text-red-400 flex items-center justify-center text-3xl mb-4 border border-red-400/30">
                        🎒
                    </div>
                    <h3 className="text-lg font-bold font-bubbly text-red-300 mb-2">Explorer Goodie Bag</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                        Topi petualang JinGa, snack sehat bergizi, stiker edisi terbatas, dan voucher edukasi SD Plus 3.
                    </p>
                </div>

            </div>

            
            <div className="mt-12 bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 p-6 sm:p-8 rounded-3xl border-2 border-amber-400/40 text-center max-w-2xl mx-auto shadow-gold-glow">
                <span className="text-4xl block mb-2">👑</span>
                <h3 className="text-2xl font-bold font-bubbly text-amber-300 mb-2">Piala Bergilir Juara Umum Sekolah TK/RA</h3>
                <p className="text-xs sm:text-sm text-slate-200">
                    Sekolah TK/RA dengan perolehan medali juara terbanyak akan membawa pulang <strong>Trofi Bergilir Bergengsi &quot;The Supreme JinGa Explorer School 2026&quot;</strong>!
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
                            <h4 className="text-lg font-bold font-bubbly text-slate-900">Opening Ceremony & Senam Ceria</h4>
                            <p className="text-xs text-slate-600">Pelepasan balon cita-cita, pembacaan ayat suci Al-Qur&apos;an, dan pemanasan senam anak JinGa.</p>
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
                            <span className="inline-block px-3 py-1 bg-sky-500 text-white font-extrabold text-xs rounded-full mb-1">08.30 - 11.30 WIB</span>
                            <h4 className="text-lg font-bold font-bubbly text-slate-900">Ekspedisi Lomba Serentak</h4>
                            <p className="text-xs text-slate-600">Pelaksanaan 8 cabang lomba di zona kelas ber-AC dan arena outdoor yang nyaman.</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-md z-10 ring-4 ring-white">
                            3
                        </div>
                        <div className="w-full md:w-5/12 text-center md:text-left text-xs text-slate-500 bg-white p-3 rounded-2xl shadow-sm border border-sky-100">
                            🏫 Zona 1 s/d Zona 8
                        </div>
                    </div>

                    
                    <div className="flex flex-col md:flex-row-reverse items-center justify-between gap-6">
                        <div className="w-full md:w-5/12 text-center md:text-left">
                            <span className="inline-block px-3 py-1 bg-red-500 text-white font-extrabold text-xs rounded-full mb-1">11.30 - 13.00 WIB</span>
                            <h4 className="text-lg font-bold font-bubbly text-slate-900">Ishoma & Dongeng Edukasi Islami</h4>
                            <p className="text-xs text-slate-600">Shalat Dzuhur berjamaah, makan siang bersama, dan pertunjukan mendongeng bersama Kakak Pendongeng Nasional.</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-sm shadow-md z-10 ring-4 ring-white">
                            4
                        </div>
                        <div className="w-full md:w-5/12 text-center md:text-right text-xs text-slate-500 bg-white p-3 rounded-2xl shadow-sm border border-sky-100">
                            🕌 Masjid Sekolah & Aula
                        </div>
                    </div>

                    
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="w-full md:w-5/12 text-center md:text-right">
                            <span className="inline-block px-3 py-1 bg-amber-500 text-slate-900 font-extrabold text-xs rounded-full mb-1">13.00 - Selesai</span>
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

    
    <section id="daftar" className="py-16 sm:py-24 bg-white relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="bg-gradient-to-br from-sky-50 via-white to-amber-50 rounded-3xl border-2 border-sky-200 shadow-2xl p-6 sm:p-10 relative overflow-hidden">
                
                
                <div className="text-center max-w-2xl mx-auto space-y-3 mb-8">
                    <span className="inline-block px-4 py-1 rounded-full bg-amber-400 text-slate-900 text-xs font-extrabold tracking-wider uppercase shadow-sm">
                        📝 Tiket Ekspedisi Online
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold font-bubbly text-slate-900">
                        Formulir Registrasi <span className="text-sky-600">Calon Penjelajah</span>
                    </h2>
                    <p className="text-slate-600 text-xs sm:text-sm">
                        Daftar mandiri (Orang Tua) atau kolektif (Sekolah). Data akan terhitung otomatis dan langsung terhubung ke WhatsApp Panitia Resmi.
                    </p>
                </div>

                <form id="registrationForm"  className="space-y-6">
                    
                    
                    <div className="flex items-center justify-center gap-4 bg-white p-2 rounded-2xl border border-sky-100 max-w-md mx-auto shadow-inner">
                        <label className="flex-1 text-center cursor-pointer">
                            <input type="radio" name="registrationType" value="mandiri" checked  className="peer sr-only" />
                            <div className="py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-600 peer-checked:bg-sky-600 peer-checked:text-white transition-all">
                                👨‍👩‍👦 Mandiri (Orang Tua)
                            </div>
                        </label>
                        <label className="flex-1 text-center cursor-pointer">
                            <input type="radio" name="registrationType" value="kolektif"  className="peer sr-only" />
                            <div className="py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-600 peer-checked:bg-emerald-600 peer-checked:text-white transition-all">
                                🏫 Kolektif (Sekolah TK/RA)
                            </div>
                        </label>
                    </div>

                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5" id="labelNamaPendaftar">
                                Nama Orang Tua / Wali *
                            </label>
                            <input type="text" id="parentName" required placeholder="Contoh: Bunda Aisyah" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm" />
                        </div>

                        
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                                No. WhatsApp Aktif *
                            </label>
                            <input type="tel" id="whatsappNumber" required placeholder="Contoh: 081234567890" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm" />
                        </div>

                        
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                                Asal Sekolah TK / RA *
                            </label>
                            <input type="text" id="schoolOrigin" required placeholder="Contoh: RA Al-Falah / TK Pertiwi" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm" />
                        </div>

                        
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5" id="labelNamaPeserta">
                                Nama Lengkap Ananda (Peserta) *
                            </label>
                            <input type="text" id="childName" required placeholder="Contoh: Muhammad Rayyan" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-sm" />
                        </div>

                    </div>

                    
                    <div className="space-y-3 pt-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase">
                            Pilih Cabang Lomba yang Diikuti (Bisa Lebih Dari 1):
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="lombaChecklist">
                            
                            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 cursor-pointer transition-colors">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" name="lombaSelected" value="Tahfidz Cilik (Juz 30)" data-price="35000"  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500" />
                                    <span className="text-xs sm:text-sm font-semibold text-slate-800">📖 Tahfidz Cilik (Juz 30)</span>
                                </div>
                                <span className="text-xs font-bold text-emerald-600">Rp 35.000</span>
                            </label>

                            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 cursor-pointer transition-colors">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" name="lombaSelected" value="Hafalan Doa & Hadits" data-price="35000"  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500" />
                                    <span className="text-xs sm:text-sm font-semibold text-slate-800">🤲 Hafalan Doa & Hadits</span>
                                </div>
                                <span className="text-xs font-bold text-emerald-600">Rp 35.000</span>
                            </label>

                            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 cursor-pointer transition-colors">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" name="lombaSelected" value="Lomba Mewarnai Cilik" data-price="30000"  className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500" />
                                    <span className="text-xs sm:text-sm font-semibold text-slate-800">🎨 Lomba Mewarnai Cilik</span>
                                </div>
                                <span className="text-xs font-bold text-amber-600">Rp 30.000</span>
                            </label>

                            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 cursor-pointer transition-colors">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" name="lombaSelected" value="Pildacil (Dai Cilik)" data-price="35000"  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500" />
                                    <span className="text-xs sm:text-sm font-semibold text-slate-800">🎤 Pildacil (Dai Cilik)</span>
                                </div>
                                <span className="text-xs font-bold text-emerald-600">Rp 35.000</span>
                            </label>

                            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 cursor-pointer transition-colors">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" name="lombaSelected" value="Fashion Busana Muslim" data-price="40000"  className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500" />
                                    <span className="text-xs sm:text-sm font-semibold text-slate-800">👗 Fashion Busana Muslim</span>
                                </div>
                                <span className="text-xs font-bold text-amber-600">Rp 40.000</span>
                            </label>

                            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 cursor-pointer transition-colors">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" name="lombaSelected" value="Lomba Adzan Cilik" data-price="30000"  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500" />
                                    <span className="text-xs sm:text-sm font-semibold text-slate-800">🗣️ Lomba Adzan Cilik</span>
                                </div>
                                <span className="text-xs font-bold text-emerald-600">Rp 30.000</span>
                            </label>

                            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-sky-400 cursor-pointer transition-colors">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" name="lombaSelected" value="Puzzle & Sains Cilik" data-price="35000"  className="w-5 h-5 text-sky-600 rounded focus:ring-sky-500" />
                                    <span className="text-xs sm:text-sm font-semibold text-slate-800">🧩 Puzzle & Sains Cilik</span>
                                </div>
                                <span className="text-xs font-bold text-sky-600">Rp 35.000</span>
                            </label>

                            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-sky-400 cursor-pointer transition-colors">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" name="lombaSelected" value="Halang Rintang Cilik" data-price="35000"  className="w-5 h-5 text-sky-600 rounded focus:ring-sky-500" />
                                    <span className="text-xs sm:text-sm font-semibold text-slate-800">🏃 Halang Rintang Cilik</span>
                                </div>
                                <span className="text-xs font-bold text-sky-600">Rp 35.000</span>
                            </label>

                        </div>
                    </div>

                    
                    <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <span className="text-xs text-slate-400 block">Total Biaya Pendaftaran:</span>
                            <div className="text-2xl sm:text-3xl font-extrabold font-bubbly text-amber-400" id="totalDisplay">
                                Rp 0
                            </div>
                            <span className="text-[11px] text-sky-200" id="selectedCountText">0 lomba terpilih</span>
                        </div>
                        <button type="submit" className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-extrabold text-sm shadow-lg hover:from-emerald-400 hover:to-emerald-500 transition-all flex items-center justify-center gap-2">
                            <i className="fa-brands fa-whatsapp text-lg"></i>
                            <span>Kirim Pendaftaran via WhatsApp</span>
                        </button>
                    </div>

                </form>

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
                                <p className="text-xs text-slate-600">Kompleks SD Plus 3 Al-Muhajirin (Jl. Pendidikan Islami No. 3)</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                                <i className="fa-brands fa-whatsapp"></i>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Call Center Panitia</h4>
                                <p className="text-xs text-slate-600">+62 812-3456-7890 (Admin Pendaftaran) / +62 898-7654-3210 (Juknis)</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-lg shrink-0">
                                <i className="fa-regular fa-calendar-check"></i>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">Waktu Pelaksanaan</h4>
                                <p className="text-xs text-slate-600">Sabtu, 24 Oktober 2026 • Pukul 07.00 WIB s.d Selesai</p>
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
                            <a href="https://maps.google.com" target="_blank" className="px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-xs shadow hover:bg-sky-500 transition-colors flex items-center gap-2">
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
                    <button  className="w-full flex items-center justify-between text-left font-bold text-sm sm:text-base text-slate-800 focus:outline-none">
                        <span>Apakah 1 anak boleh mengikuti lebih dari 1 cabang lomba?</span>
                        <i className="fa-solid fa-chevron-down text-sky-600 transition-transform" id="faqIcon-1"></i>
                    </button>
                    <div id="faqContent-1" className="hidden pt-3 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-3">
                        Boleh, asalkan jadwal perlombaan tidak bentrok secara bersamaan. Silakan konfirmasi ke admin panitia saat memilih lomba untuk pengaturan sesi tampil ananda.
                    </div>
                </div>

                
                <div className="border border-slate-200 rounded-2xl p-5 hover:border-sky-300 transition-colors bg-slate-50/50">
                    <button  className="w-full flex items-center justify-between text-left font-bold text-sm sm:text-base text-slate-800 focus:outline-none">
                        <span>Bagaimana sistem penilaian juri?</span>
                        <i className="fa-solid fa-chevron-down text-sky-600 transition-transform" id="faqIcon-2"></i>
                    </button>
                    <div id="faqContent-2" className="hidden pt-3 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-3">
                        Dewan juri terdiri dari praktisi pendidikan anak usia dini independen dan ustadz/ustadzah profesional. Keputusan dewan juri bersifat mutlak dan berpedoman penuh pada Juknis Resmi.
                    </div>
                </div>

                
                <div className="border border-slate-200 rounded-2xl p-5 hover:border-sky-300 transition-colors bg-slate-50/50">
                    <button  className="w-full flex items-center justify-between text-left font-bold text-sm sm:text-base text-slate-800 focus:outline-none">
                        <span>Apakah seluruh peserta mendapatkan medali/sertifikat?</span>
                        <i className="fa-solid fa-chevron-down text-sky-600 transition-transform" id="faqIcon-3"></i>
                    </button>
                    <div id="faqContent-3" className="hidden pt-3 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-3">
                        Ya! Seluruh anak yang terdaftar akan menerima Sertifikat Kepesertaan Resmi Ber-Barcode dan Goodie Bag Petualang JinGa sebagai bentuk apresiasi partisipasi positif.
                    </div>
                </div>

                
                <div className="border border-slate-200 rounded-2xl p-5 hover:border-sky-300 transition-colors bg-slate-50/50">
                    <button  className="w-full flex items-center justify-between text-left font-bold text-sm sm:text-base text-slate-800 focus:outline-none">
                        <span>Bagaimana metode pembayaran registrasi?</span>
                        <i className="fa-solid fa-chevron-down text-sky-600 transition-transform" id="faqIcon-4"></i>
                    </button>
                    <div id="faqContent-4" className="hidden pt-3 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-3">
                        Pembayaran dapat dilakukan via Transfer Bank (BSI / BCA / Mandiri) atau pembayaran tunai langsung di Sekretariat Panitia SD Plus 3 Al-Muhajirin. Bukti transfer cukup dikirimkan via WhatsApp.
                    </div>
                </div>

            </div>

        </div>
    </section>

    
    <footer className="bg-slate-900 text-slate-400 text-xs pt-16 pb-12 border-t-4 border-amber-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
                
                <div className="space-y-4 md:col-span-2">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold font-bubbly text-sky-400">JinGa</span>
                        <span className="text-xs uppercase font-extrabold bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full">Festival 2026</span>
                    </div>
                    <p className="text-slate-400 max-w-md leading-relaxed">
                        Ekspedisi Akbar TK/RA se-derajat dalam rangka membentuk generasi pembelajar cilik yang unggul dalam ilmu pengetahuan, tangguh dalam amal, dan mulia dalam akhlak islami.
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
                        <a href="#" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-sky-600 text-white flex items-center justify-center transition-colors"><i className="fa-brands fa-instagram"></i></a>
                        <a href="#" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-emerald-600 text-white flex items-center justify-center transition-colors"><i className="fa-brands fa-whatsapp"></i></a>
                        <a href="#" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-red-600 text-white flex items-center justify-center transition-colors"><i className="fa-brands fa-youtube"></i></a>
                    </div>
                </div>

            </div>

            <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <p>&copy; 2026 JinGa Explorers Academy Festival • SD Plus 3 Al-Muhajirin. All rights reserved.</p>
                <p className="text-slate-500">Dirancang khusus untuk Petualang Cilik Indonesia 🇲🇨</p>
            </div>
        </div>
    </footer>

    
    <a href="https://wa.me/6281234567890?text=Halo%20Panitia%20JinGa%20Festival%202026,%20saya%20ingin%20bertanya%20seputar%20pendaftaran%20lomba%20TK/RA" target="_blank" className="fixed bottom-6 right-6 z-50 bg-emerald-500 hover:bg-emerald-400 text-white p-4 rounded-full shadow-2xl flex items-center gap-3 font-bold text-sm hover:scale-110 active:scale-95 transition-all group" aria-label="Chat WhatsApp Panitia">
        <i className="fa-brands fa-whatsapp text-2xl"></i>
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-500 ease-in-out text-xs">
            Tanya Panitia
        </span>
    </a>

    
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
