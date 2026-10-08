'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const categorySlug: Record<string, string> = {
  Adzan: 'adzan',
  'Fashion Show': 'fashion-show',
  MHQ: 'mhq',
  'Karya Kolase': 'karya-kolase',
  Mewarnai: 'mewarnai',
  'Tendangan Penalti': 'tendangan-penalti',
  'Menyanyi Solo': 'menyanyi-solo',
};

const juriOptions = [
  { kategori: 'MHQ', icon: 'fa-book-quran', panel: 'border-emerald-100 bg-emerald-50/70', iconStyle: 'bg-emerald-100 text-emerald-700', active: 'bg-emerald-600 text-white', hover: 'hover:bg-emerald-100 hover:text-emerald-800', code: 'text-emerald-700', juries: ['MHQ-J1', 'MHQ-J2', 'MHQ-J3', 'MHQ-J4'] },
  { kategori: 'Adzan', icon: 'fa-microphone', panel: 'border-sky-100 bg-sky-50/70', iconStyle: 'bg-sky-100 text-sky-700', active: 'bg-sky-600 text-white', hover: 'hover:bg-sky-100 hover:text-sky-800', code: 'text-sky-700', juries: ['ADZ-J1', 'ADZ-J2'] },
  { kategori: 'Menyanyi Solo', icon: 'fa-music', panel: 'border-rose-100 bg-rose-50/70', iconStyle: 'bg-rose-100 text-rose-700', active: 'bg-rose-600 text-white', hover: 'hover:bg-rose-100 hover:text-rose-800', code: 'text-rose-700', juries: ['NYS-J1', 'NYS-J2'] },
  { kategori: 'Fashion Show', icon: 'fa-person-dress', panel: 'border-amber-100 bg-amber-50/70', iconStyle: 'bg-amber-100 text-amber-700', active: 'bg-amber-500 text-white', hover: 'hover:bg-amber-100 hover:text-amber-800', code: 'text-amber-700', juries: ['FSH-J1', 'FSH-J2'] },
];

const getJuriNumber = (kode: string) => kode.split('-J')[1];

export default function JuriLoginPage() {
  const router = useRouter();
  const [kode, setKode] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isJuriMenuOpen, setIsJuriMenuOpen] = useState(false);
  const [menuCategory, setMenuCategory] = useState('MHQ');
  const selectedGroup = juriOptions.find((group) => group.juries.includes(kode));
  const activeMenuGroup = juriOptions.find((group) => group.kategori === menuCategory) || juriOptions[0];

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const normalizedCode = kode.trim().toUpperCase();
    const email = `${normalizedCode.toLowerCase()}@juri.jinga.local`;
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password: pin });

    if (loginError) {
      setError('Kode juri atau PIN tidak sesuai. Silakan periksa kartu login Anda.');
      setLoading(false);
      return;
    }

    const { data: juri, error: juriError } = await supabase
      .from('juri')
      .select('id, aktif')
      .eq('kode', normalizedCode)
      .single();

    if (juriError || !juri?.aktif) {
      await supabase.auth.signOut();
      setError('Akun juri belum aktif atau belum terhubung. Hubungi panitia.');
      setLoading(false);
      return;
    }

    const { data: assignment } = await supabase
      .from('juri_kategori')
      .select('cabang_lomba')
      .eq('juri_id', juri.id)
      .limit(1)
      .single();

    const slug = assignment ? categorySlug[assignment.cabang_lomba] : undefined;
    if (!slug) {
      await supabase.auth.signOut();
      setError('Cabang lomba untuk akun ini belum ditentukan. Hubungi panitia.');
      setLoading(false);
      return;
    }

    window.localStorage.setItem('jinga-access-mode', 'juri');
    router.replace(`/panitia/penilaian/${slug}`);
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
        <div className="rounded-t-[calc(1.5rem-1px)] bg-gradient-to-br from-purple-600 to-indigo-600 px-7 py-7 text-white">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <i className="fa-solid fa-user-pen text-xl" aria-hidden="true" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-200">Festival JinGa 2026</p>
          <h1 className="mt-1 text-2xl font-black">Masuk sebagai Juri</h1>
          <p className="mt-2 text-sm text-purple-100">Pilih identitas juri, lalu masukkan PIN yang diberikan panitia.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 rounded-b-[calc(1.5rem-1px)] bg-white p-7">
          {error && (
            <div role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm font-semibold text-rose-700">
              <i className="fa-solid fa-circle-exclamation mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label id="label-kode-juri" className="mb-2 block text-sm font-bold text-slate-700">Pilih Identitas Juri</label>
            <div className="relative z-20">
              <button type="button" autoFocus aria-labelledby="label-kode-juri" aria-haspopup="listbox" aria-expanded={isJuriMenuOpen}
                onClick={() => {
                  if (!isJuriMenuOpen && selectedGroup) setMenuCategory(selectedGroup.kategori);
                  setIsJuriMenuOpen((open) => !open);
                }}
                className={`flex min-h-14 w-full items-center gap-3 rounded-xl border bg-white px-3 text-left outline-none transition ${isJuriMenuOpen ? 'border-purple-500 ring-4 ring-purple-100' : 'border-slate-300 hover:border-purple-300'}`}>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${selectedGroup?.iconStyle || 'bg-purple-50 text-purple-600'}`}>
                  <i className={`fa-solid ${selectedGroup?.icon || 'fa-user-pen'}`} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  {kode && selectedGroup ? (
                    <><span className="block truncate text-sm font-extrabold text-slate-800">Juri {getJuriNumber(kode)} {selectedGroup.kategori}</span><span className="block font-mono text-[10px] font-bold text-slate-400">{kode}</span></>
                  ) : <span className="text-sm font-semibold text-slate-400">Pilih juri dan cabang lomba</span>}
                </span>
                <i className={`fa-solid fa-chevron-down text-xs text-slate-400 transition-transform ${isJuriMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>

              {isJuriMenuOpen && (
                <>
                  <button type="button" aria-label="Tutup pilihan juri" onClick={() => setIsJuriMenuOpen(false)} className="fixed inset-0 z-10 cursor-default" />
                  <div role="listbox" aria-labelledby="label-kode-juri" className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/20">
                    <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">1. Pilih cabang lomba</p>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                      {juriOptions.map((group) => {
                        const isActive = menuCategory === group.kategori;
                        return (
                          <button key={group.kategori} type="button" onClick={() => setMenuCategory(group.kategori)}
                            className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border px-1.5 py-2 text-center transition ${isActive ? `${group.panel} ring-2 ring-current ${group.code}` : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
                            <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${group.iconStyle}`}><i className={`fa-solid ${group.icon} text-xs`} aria-hidden="true" /></span>
                            <span className="text-[10px] font-extrabold leading-tight">{group.kategori}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className={`mt-3 rounded-xl border p-2.5 ${activeMenuGroup.panel}`}>
                      <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">2. Pilih nomor juri</p>
                      <div className={`grid gap-2 ${activeMenuGroup.juries.length > 2 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
                        {activeMenuGroup.juries.map((juriKode) => (
                          <button key={juriKode} type="button" role="option" aria-selected={kode === juriKode}
                            onClick={() => { setKode(juriKode); setError(''); setIsJuriMenuOpen(false); }}
                            className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 text-xs font-bold transition ${kode === juriKode ? `${activeMenuGroup.active} shadow-sm` : `bg-white text-slate-600 ${activeMenuGroup.hover}`}`}>
                            <i className="fa-solid fa-user text-[9px] opacity-70" aria-hidden="true" /> Juri {getJuriNumber(juriKode)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="pin-juri" className="mb-2 block text-sm font-bold text-slate-700">PIN 6 Digit</label>
            <input id="pin-juri" type="password" inputMode="numeric" autoComplete="current-password" value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••"
              minLength={6} maxLength={6}
              className="h-12 w-full rounded-xl border border-slate-300 px-4 text-center text-xl font-black tracking-[0.45em] text-slate-800 outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100" required />
          </div>

          <button type="submit" disabled={loading || kode.trim() === '' || pin.length !== 6}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-bold text-white shadow-lg shadow-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? <><i className="fa-solid fa-spinner fa-spin" /> Memeriksa...</> : <><i className="fa-solid fa-arrow-right-to-bracket" /> Masuk Penilaian</>}
          </button>

          <p className="text-center text-xs text-slate-400">Ada kendala? Jangan mencoba akun lain—hubungi panitia.</p>
        </form>
      </div>
    </main>
  );
}
