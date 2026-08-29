'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PanitiaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // If they are on the login page, don't show the dashboard layout
  if (pathname === '/panitia/login') {
    return <>{children}</>;
  }

  const menuItems = [
    { name: 'Dashboard', path: '/panitia/dashboard', icon: 'fa-chart-pie', color: 'text-sky-500' },
    { name: 'Data Peserta', path: '/panitia/peserta', icon: 'fa-users', color: 'text-amber-500' },
    { name: 'Keuangan', path: '/panitia/keuangan', icon: 'fa-wallet', color: 'text-emerald-500' },
    { name: 'Pengaturan', path: '/panitia/pengaturan', icon: 'fa-gear', color: 'text-slate-500' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans flex text-slate-800">
      
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white/70 backdrop-blur-xl border-r border-slate-200/60 shadow-sm z-20">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-sky-500 p-0.5 shadow-sm">
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center text-lg font-bold">
                    🎪
                </div>
            </div>
            <div>
                <h2 className="text-xl font-bold font-bubbly text-slate-800">JinGa Panel</h2>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Festival 2026</p>
            </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.path);
            return (
              <Link key={item.name} href={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${isActive ? 'bg-white shadow-sm border border-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? 'bg-slate-50' : ''}`}>
                    <i className={`fa-solid ${item.icon} ${isActive ? item.color : 'text-slate-400'}`}></i>
                </div>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <Link href="/panitia/login" className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm text-rose-500 hover:bg-rose-50 transition-all">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
            </div>
            Keluar Panel
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
        
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-200/40 rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-200/30 rounded-full blur-[80px] -z-10 -translate-x-1/2 translate-y-1/3 pointer-events-none"></div>

        {/* Topbar Mobile */}
        <header className="lg:hidden bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-sky-500 p-0.5 shadow-sm">
                    <div className="w-full h-full bg-white rounded-md flex items-center justify-center text-sm font-bold">
                        🎪
                    </div>
                </div>
                <h2 className="text-lg font-bold font-bubbly text-slate-800">JinGa Panel</h2>
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
                            return (
                                <Link key={item.name} href={item.path} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all ${isActive ? 'bg-slate-50 text-slate-900 border border-slate-100' : 'text-slate-600 active:bg-slate-50'}`}>
                                    <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                                        <i className={`fa-solid ${item.icon} ${isActive ? item.color : 'text-slate-400'}`}></i>
                                    </div>
                                    {item.name}
                                </Link>
                            );
                        })}
                        <div className="h-px bg-slate-100 my-2"></div>
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
                <h1 className="text-2xl font-bold font-bubbly text-slate-800">
                    {menuItems.find(i => pathname.startsWith(i.path))?.name || 'Overview'}
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5"><i className="fa-solid fa-circle-check text-emerald-500 mr-1"></i> Database Terhubung (Supabase)</p>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                    <input type="text" placeholder="Cari nama peserta..." className="pl-9 pr-4 py-2 bg-white/60 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:bg-white w-64 transition-all" />
                </div>
                <div className="w-10 h-10 rounded-full bg-sky-100 border-2 border-white shadow-sm flex items-center justify-center text-sky-600 font-bold overflow-hidden">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" className="w-full h-full object-cover" />
                </div>
            </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 z-0">
            {children}
        </main>
      </div>
    </div>
  );
}
