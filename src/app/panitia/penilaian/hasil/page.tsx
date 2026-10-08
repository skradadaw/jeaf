'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import CustomSelect from '@/components/CustomSelect';

const categories = ['MHQ', 'Adzan', 'Menyanyi Solo', 'Fashion Show'] as const;
const categoryIcons: Record<(typeof categories)[number], string> = {
  MHQ: 'fa-solid fa-book-quran',
  Adzan: 'fa-solid fa-microphone',
  'Menyanyi Solo': 'fa-solid fa-music',
  'Fashion Show': 'fa-solid fa-person-dress',
};

type Juri = {
  id: string;
  kode: string;
  nama: string;
};

type NilaiJuri = {
  juri_id: string;
  nilai_total: number;
};

type Participant = {
  id: string;
  no_peserta: string | null;
  nama_anak: string;
  asal_sekolah: string;
  jumlah_juri: number;
  jumlah_selesai: number;
  nilai_akhir: number | null;
  nilai_juri: NilaiJuri[];
};

type DashboardPayload = {
  juries: Juri[];
  participants: Participant[];
};

export default function HasilPenilaianPage() {
  const router = useRouter();
  const [category, setCategory] = useState<(typeof categories)[number]>('MHQ');
  const [juries, setJuries] = useState<Juri[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function loadResults() {
      setLoading(true);
      setError('');

      const { data: userData } = await supabase.auth.getUser();
      if (controller.signal.aborted) return;

      if (!userData.user || userData.user.app_metadata?.role !== 'admin') {
        router.replace('/panitia/login');
        return;
      }

      const { data, error: dashboardError } = await supabase
        .rpc('get_dashboard_penilaian', { p_kategori: category })
        .abortSignal(controller.signal);

      if (controller.signal.aborted) return;
      if (dashboardError || !data) {
        setError(dashboardError?.message || 'Data penilaian gagal dimuat.');
        setJuries([]);
        setParticipants([]);
      } else {
        const dashboard = data as unknown as DashboardPayload;
        setJuries(dashboard.juries || []);
        setParticipants(dashboard.participants || []);
      }
      setLoading(false);
    }

    void loadResults();
    return () => controller.abort();
  }, [category, router]);

  const filteredParticipants = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matching = normalizedQuery
      ? participants.filter((participant) =>
          participant.nama_anak.toLowerCase().includes(normalizedQuery)
          || (participant.no_peserta || '').toLowerCase().includes(normalizedQuery)
          || participant.asal_sekolah.toLowerCase().includes(normalizedQuery))
      : participants;

    const getFinalTotal = (participant: Participant) => {
      const complete = participant.jumlah_juri > 0 && participant.jumlah_selesai === participant.jumlah_juri;
      return complete ? participant.nilai_juri.reduce((total, score) => total + Number(score.nilai_total), 0) : null;
    };

    return [...matching].sort((a, b) => {
      const totalA = getFinalTotal(a);
      const totalB = getFinalTotal(b);
      if (totalA === null && totalB !== null) return 1;
      if (totalA !== null && totalB === null) return -1;
      return (totalB || 0) - (totalA || 0);
    });
  }, [participants, query]);

  const completedCount = participants.filter((participant) => participant.jumlah_juri > 0 && participant.jumlah_selesai === participant.jumlah_juri).length;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 p-5 text-white shadow-lg shadow-purple-500/15 sm:p-6">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-purple-200">Khusus Administrator</p>
        <h2 className="mt-1 text-xl font-black sm:text-2xl">Rekap Nilai Akhir Juri</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-purple-100">
          Bandingkan nilai setiap juri dan lihat jumlah nilai akhir setelah seluruh juri menyelesaikan penilaian.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(220px,0.45fr)_1fr_auto] md:items-end">
          <div className="block">
            <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-500">Cabang Lomba</span>
            <CustomSelect
              value={category}
              onChange={(value) => setCategory(value as (typeof categories)[number])}
              options={categories.map((item) => ({
                value: item,
                label: item,
                icon: categoryIcons[item],
                color: 'bg-purple-100 text-purple-600',
              }))}
              ariaLabel="Pilih cabang lomba"
              accent="purple"
            />
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-500">Cari Peserta</span>
            <span className="relative block">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true"></i>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nama, nomor peserta, atau sekolah"
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
              />
            </span>
          </label>

          <div className="flex min-h-11 items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 text-sm font-bold text-emerald-700">
            <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
            {completedCount}/{participants.length} lengkap
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm font-bold text-slate-500">
            <i className="fa-solid fa-circle-notch fa-spin text-xl text-purple-500" aria-hidden="true"></i>
            Memuat rekap nilai...
          </div>
        ) : error ? (
          <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            <i className="fa-solid fa-circle-exclamation mr-2" aria-hidden="true"></i>{error}
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm font-semibold text-slate-500">Tidak ada peserta yang sesuai.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left">
              <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="sticky left-0 z-10 min-w-60 border-r border-slate-200 bg-slate-50 px-5 py-3">Peserta</th>
                  {juries.map((jury) => (
                    <th key={jury.id} className="min-w-28 px-4 py-3 text-center">
                      <span className="block text-slate-700">{jury.nama}</span>
                      <span className="mt-0.5 block font-mono text-[9px] text-slate-400">{jury.kode}</span>
                    </th>
                  ))}
                  <th className="min-w-32 bg-purple-50 px-4 py-3 text-center text-purple-700">Jumlah Nilai Akhir</th>
                  <th className="min-w-36 px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParticipants.map((participant) => {
                  const complete = participant.jumlah_juri > 0 && participant.jumlah_selesai === participant.jumlah_juri;
                  const scoreMap = new Map(participant.nilai_juri.map((score) => [score.juri_id, score.nilai_total]));
                  const finalTotal = complete
                    ? participant.nilai_juri.reduce((total, score) => total + Number(score.nilai_total), 0)
                    : null;

                  return (
                    <tr key={participant.id} className="group hover:bg-slate-50/70">
                      <td className="sticky left-0 z-10 border-r border-slate-100 bg-white px-5 py-3 group-hover:bg-slate-50">
                        <p className="text-sm font-bold text-slate-800">{participant.nama_anak}</p>
                        <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                          <span className="font-mono">{participant.no_peserta || participant.id.split('-')[0].toUpperCase()}</span>
                          <span className="mx-1.5">•</span>{participant.asal_sekolah}
                        </p>
                      </td>
                      {juries.map((jury) => {
                        const score = scoreMap.get(jury.id);
                        return (
                          <td key={jury.id} className="px-4 py-3 text-center">
                            {score === undefined
                              ? <span className="text-sm font-bold text-slate-300">—</span>
                              : <span className="inline-flex min-w-10 justify-center rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm font-black text-slate-700">{score}</span>}
                          </td>
                        );
                      })}
                      <td className="bg-purple-50/50 px-4 py-3 text-center">
                        {finalTotal === null
                          ? <span className="text-sm font-bold text-slate-300">—</span>
                          : <span className="inline-flex min-w-11 justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 px-3 py-2 text-base font-black text-white shadow-sm">{finalTotal}</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${complete ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${complete ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                          {complete ? 'Lengkap' : `${participant.jumlah_selesai}/${participant.jumlah_juri} juri`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
