'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PanitiaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isJuryMenuOpen, setIsJuryMenuOpen] = useState(() => pathname.startsWith('/panitia/penilaian'));
  const [accessMode, setAccessMode] = useState<string | null>(null);
  const [isAccessModeReady, setIsAccessModeReady] = useState(false);

  useEffect(() => {
    setAccessMode(window.localStorage.getItem('jinga-access-mode'));
    setIsAccessModeReady(true);
  }, [pathname]);

  // If they are on the login page, don't show the dashboard layout
  if (pathname === '/panitia/login' || pathname === '/panitia/juri-login') {
    return <>{children}</>;
  }

  // Hindari pergantian layout admin/juri sesaat ketika localStorage belum dibaca.
  if (pathname.startsWith('/panitia/penilaian') && !isAccessModeReady) {
    return (
      <div className="flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 text-slate-500">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold shadow-sm">
          <i className="fa-solid fa-circle-notch fa-spin text-purple-500" aria-hidden="true"></i>
          Menyiapkan halaman penilaian...
        </div>
      </div>
    );
  }

  // Area penilaian memakai portal khusus juri, terpisah dari dashboard admin.
  if (pathname.startsWith('/panitia/penilaian') && accessMode !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-100 font-inter text-slate-800">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-11 w-11 shrink-0 rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
                <img src="/assets/logo.png" alt="Logo JinGa" className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-base font-black text-slate-900 sm:text-lg">Portal Penilaian Juri</h1>
                  <span className="hidden rounded-full bg-purple-100 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-purple-700 sm:inline">Khusus Juri</span>
                </div>
                <p className="truncate text-[11px] font-semibold text-slate-500">JinGa Festival 2026 · SD Plus 3 Al-Muhajirin</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="hidden sm:inline">Sistem Terhubung</span>
              <span className="sm:hidden">Online</span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] p-3 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', path: '/panitia/dashboard', icon: 'fa-chart-pie', color: 'text-sky-500' },
    { name: 'Data Peserta', path: '/panitia/peserta', icon: 'fa-users', color: 'text-amber-500' },
    {
      name: 'Penilaian Juri',
      path: '/panitia/penilaian',
      icon: 'fa-star',
      color: 'text-purple-500',
      children: [
        { name: 'MHQ', path: '/panitia/penilaian/mhq', icon: 'fa-book-quran' },
        { name: 'Adzan', path: '/panitia/penilaian/adzan', icon: 'fa-microphone' },
        { name: 'Menyanyi Solo', path: '/panitia/penilaian/menyanyi-solo', icon: 'fa-music' },
        { name: 'Fashion Show', path: '/panitia/penilaian/fashion-show', icon: 'fa-person-dress' },
      ],
    },
    { name: 'Pengaturan', path: '/panitia/pengaturan', icon: 'fa-gear', color: 'text-slate-500' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-inter flex text-slate-800">
      
      {/* Sidebar Desktop */}
      <aside className="z-20 hidden w-72 shrink-0 self-start border-r border-slate-200/60 bg-white/90 shadow-sm backdrop-blur-xl lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl shadow-sm flex-shrink-0">
                <img src="/assets/logo.png" alt="Logo JinGa Panel" className="w-full h-full object-contain" />
            </div>
            <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-800">JinGa Panel</h2>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Festival 2026</p>
            </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.path);
            const isSubmenuOpen = Boolean(item.children && isJuryMenuOpen);
            const menuClassName = `flex w-full items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-left transition-all ${isActive ? 'bg-white shadow-sm border border-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`;
            const menuContent = (
              <>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? 'bg-slate-50' : ''}`}>
                  <i className={`fa-solid ${item.icon} ${isActive ? item.color : 'text-slate-400'}`}></i>
                </div>
                <span className="flex-1">{item.name}</span>
                {item.children && <i className={`fa-solid fa-chevron-down text-[10px] transition-transform ${isSubmenuOpen ? 'rotate-180 text-purple-400' : 'text-slate-300'}`}></i>}
              </>
            );
            return (
              <div key={item.name}>
                {item.children ? (
                  <button
                    type="button"
                    onClick={() => setIsJuryMenuOpen((open) => !open)}
                    aria-expanded={isSubmenuOpen}
                    aria-controls="desktop-jury-submenu"
                    className={menuClassName}
                  >
                    {menuContent}
                  </button>
                ) : (
                  <Link href={item.path} className={menuClassName}>
                    {menuContent}
                  </Link>
                )}

                {item.children && isSubmenuOpen && (
                  <div id="desktop-jury-submenu" className="mt-2 ml-8 pl-3 border-l-2 border-purple-100 space-y-1">
                    {item.children.map((child) => {
                      const isChildActive = pathname === child.path;
                      return (
                        <div key={child.path}>
                          <Link href={child.path} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${isChildActive ? 'bg-purple-50 text-purple-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                            <i className={`fa-solid ${child.icon} w-4 text-center ${isChildActive ? 'text-purple-500' : 'text-slate-400'}`}></i>
                            {child.name}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <Link href="/panitia/juri-login" className="mb-1 w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-purple-600 hover:bg-purple-50 transition-all">
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                <i className="fa-solid fa-user-pen"></i>
            </div>
            Login Juri
          </Link>
          <Link href="/panitia/login" className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-rose-500 hover:bg-rose-50 transition-all">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
            </div>
            Keluar Panel
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="relative flex min-h-screen min-w-0 flex-1 flex-col bg-[#F8FAFC]">
        
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-200/40 rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>

        {/* Topbar Mobile */}
        <header className="lg:hidden bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg shadow-sm flex-shrink-0">
                    <img src="/assets/logo.png" alt="Logo JinGa Panel" className="w-full h-full object-contain" />
                </div>
                <h2 className="text-lg font-bold tracking-tight text-slate-800">JinGa Panel</h2>
            </div>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 focus:outline-none">
                <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
            </button>
        </header>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
            {isMobileMenuOpen && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="lg:hidden bg-white border-b border-slate-200 overflow-hidden sticky top-[65px] z-20 shadow-xl"
                >
                    <nav className="p-4 space-y-2">
                        {menuItems.map((item) => {
                            const isActive = pathname.startsWith(item.path);
                            const isSubmenuOpen = Boolean(item.children && isJuryMenuOpen);
                            const menuClassName = `flex w-full items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm text-left transition-all ${isActive ? 'bg-slate-50 text-slate-900 border border-slate-100' : 'text-slate-600 active:bg-slate-50'}`;
                            const menuContent = (
                                <>
                                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                                        <i className={`fa-solid ${item.icon} ${isActive ? item.color : 'text-slate-400'}`}></i>
                                    </div>
                                    <span className="flex-1">{item.name}</span>
                                    {item.children && <i className={`fa-solid fa-chevron-down text-[10px] transition-transform ${isSubmenuOpen ? 'rotate-180 text-purple-400' : 'text-slate-300'}`}></i>}
                                </>
                            );
                            return (
                                <div key={item.name}>
                                    {item.children ? (
                                        <button
                                            type="button"
                                            onClick={() => setIsJuryMenuOpen((open) => !open)}
                                            aria-expanded={isSubmenuOpen}
                                            aria-controls="mobile-jury-submenu"
                                            className={menuClassName}
                                        >
                                            {menuContent}
                                        </button>
                                    ) : (
                                        <Link href={item.path} onClick={() => setIsMobileMenuOpen(false)} className={menuClassName}>
                                            {menuContent}
                                        </Link>
                                    )}

                                    {item.children && isSubmenuOpen && (
                                        <div id="mobile-jury-submenu" className="mt-2 ml-8 pl-3 border-l-2 border-purple-100 space-y-1">
                                            {item.children.map((child) => {
                                                const isChildActive = pathname === child.path;
                                                return (
                                                    <div key={child.path}>
                                                        <Link href={child.path} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold ${isChildActive ? 'bg-purple-50 text-purple-700' : 'text-slate-500 active:bg-slate-50'}`}>
                                                            <i className={`fa-solid ${child.icon} w-4 text-center ${isChildActive ? 'text-purple-500' : 'text-slate-400'}`}></i>
                                                            {child.name}
                                                        </Link>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <div className="h-px bg-slate-100 my-2"></div>
                        <Link href="/panitia/juri-login" onClick={() => setIsMobileMenuOpen(false)} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm text-purple-600 active:bg-purple-50 transition-all">
                            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
                                <i className="fa-solid fa-user-pen"></i>
                            </div>
                            Login Juri
                        </Link>
                        <Link href="/panitia/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm text-rose-500 active:bg-rose-50 transition-all">
                            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
                                <i className="fa-solid fa-arrow-right-from-bracket"></i>
                            </div>
                            Keluar
                        </Link>
                    </nav>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Topbar Desktop */}
        <header className="hidden lg:flex bg-white/40 backdrop-blur-md border-b border-slate-200/50 px-8 py-4 items-center justify-between z-10 sticky top-0">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                    {menuItems.find(i => pathname.startsWith(i.path))?.name || 'Overview'}
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5"><i className="fa-solid fa-circle-check text-emerald-500 mr-1"></i> Database Terhubung (Supabase)</p>
            </div>
            
            <div className="flex items-center gap-4">
                <Link href="/panitia/scan" className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-md shadow-indigo-500/20 transition-all hover:-translate-y-0.5 group">
                    <i className="fa-solid fa-qrcode group-hover:scale-110 transition-transform"></i>
                    <span>Scan Tiket Cepat</span>
                </Link>
                <div className="w-10 h-10 rounded-full bg-sky-100 border-2 border-white shadow-sm flex items-center justify-center text-sky-600 font-bold overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" className="w-full h-full object-cover" />
                </div>
            </div>
        </header>

        {/* Page Content */}
        <main className="flex flex-1 flex-col p-4 lg:p-8">
            {/* Mobile Scan Button */}
            {pathname !== '/panitia/scan' && (
                <div className="lg:hidden mb-4">
                    <Link href="/panitia/scan" className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white px-5 py-3.5 rounded-2xl font-bold text-sm shadow-[0_8px_16px_rgba(99,102,241,0.2)] transition-all active:scale-[0.98]">
                        <i className="fa-solid fa-qrcode text-lg"></i>
                        <span>Scan Tiket Cepat</span>
                    </Link>
                </div>
            )}
            
            {children}
        </main>
      </div>
    </div>
  );
}
