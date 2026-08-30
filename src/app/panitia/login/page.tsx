'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PanitiaLogin() {
    const router = useRouter();
    const [pin, setPin] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        
        // Simulasi proses login PIN
        setTimeout(() => {
            setIsSubmitting(false);
            if (pin === '123456') {
                router.push('/panitia/dashboard');
            } else {
                setError('PIN yang Anda masukkan salah.');
                setPin('');
            }
        }, 800);
    };

    return (
        <div className="bg-sky-50 min-h-screen font-sans flex items-center justify-center relative px-4 overflow-hidden">
            {/* Dekorasi Background */}
            <div className="absolute top-10 left-4 md:left-20 text-6xl opacity-20 transform -rotate-12">🎈</div>
            <div className="absolute bottom-20 right-4 md:right-20 text-6xl opacity-20 transform rotate-12">🚀</div>
            <div className="absolute top-20 right-10 md:right-32 text-6xl opacity-20 transform rotate-6">☁️</div>
            <div className="absolute bottom-32 left-10 md:left-32 text-6xl opacity-20 transform -rotate-6">⭐</div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="w-24 h-24 mx-auto bg-white rounded-full p-2 shadow-bubbly border-4 border-white mb-4 hover:scale-105 transition-transform duration-300 flex items-center justify-center">
                        <img src="/assets/logo.png" alt="Logo SD Plus 3 Al-Muhajirin" className="w-full h-full object-contain" />
                    </div>
                    <span className="inline-block px-4 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold tracking-wider uppercase mb-3">
                        🔒 Area Terbatas
                    </span>
                    <h1 className="text-3xl font-extrabold font-bubbly text-slate-900 tracking-wide">
                        Portal Panitia
                    </h1>
                    <p className="text-slate-600 mt-2 font-medium">
                        Masukkan PIN untuk mengakses dashboard JinGa 2026
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white p-8 rounded-3xl border-4 border-white shadow-bubbly relative z-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {error && (
                            <div className="bg-rose-50 border-2 border-rose-100 rounded-2xl p-4 flex items-start gap-3">
                                <i className="fa-solid fa-circle-exclamation text-rose-500 mt-0.5"></i>
                                <p className="text-sm font-bold text-rose-600">{error}</p>
                            </div>
                        )}

                        <div className="space-y-4 pt-2">
                            <div>
                                <label className="block text-center text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Masukkan 6-Digit PIN Akses</label>
                                <div className="relative max-w-[280px] mx-auto">
                                    <input 
                                        type="password" 
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-4 text-center text-4xl tracking-[0.3em] text-slate-700 focus:outline-none focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20 transition-all font-bold placeholder:text-slate-300" 
                                        placeholder="••••••"
                                        required 
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className={`w-full py-4 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-2 transition-all shadow-lg
                                ${isSubmitting 
                                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                                    : 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98]'
                                }
                            `}
                        >
                            {isSubmitting ? (
                                <>
                                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                                    Memeriksa...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-unlock-keyhole"></i>
                                    Buka Dashboard
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Links */}
                <div className="text-center mt-8 space-y-4">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-sky-600 transition-colors bg-white/50 px-4 py-2 rounded-full backdrop-blur-sm">
                        <i className="fa-solid fa-arrow-left"></i>
                        Kembali ke Halaman Utama
                    </Link>
                    <p className="text-xs text-slate-400 font-medium">
                        &copy; 2026 JinGa Explorers Academy Festival
                    </p>
                </div>
            </div>
        </div>
    );
}
