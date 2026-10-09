'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  ruangan_mhq?: number | null;
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
  ruangan_mhq?: number | null;
};

type DashboardPayload = {
  juries: Juri[];
  participants: Participant[];
};

type ParticipantStatusPayload = Participant & {
  cabang_lomba: string;
};

export default function HasilPenilaianPage() {
  const router = useRouter();
  const [category, setCategory] = useState<(typeof categories)[number]>('MHQ');
  const [juries, setJuries] = useState<Juri[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [query, setQuery] = useState('');
  const [roomFilter, setRoomFilter] = useState<'all' | '1' | '2'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const activeCategoryRef = useRef(category);

  useEffect(() => {
    activeCategoryRef.current = category;
  }, [category]);

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
  }, [category, refreshKey, router]);

  const refreshParticipantResult = useCallback(async (participantId: string, expectedCategory: string) => {
    const { data, error: statusError } = await supabase.rpc('get_status_penilaian_peserta', {
      p_pendaftar_id: participantId,
    });

    if (statusError || !data || activeCategoryRef.current !== expectedCategory) return;

    const refreshedParticipant = data as unknown as ParticipantStatusPayload;
    if (refreshedParticipant.cabang_lomba !== expectedCategory) return;

    setParticipants((currentParticipants) => currentParticipants.map((participant) =>
      participant.id === participantId
        ? {
            ...participant,
            jumlah_juri: refreshedParticipant.jumlah_juri,
            jumlah_selesai: refreshedParticipant.jumlah_selesai,
            nilai_akhir: refreshedParticipant.nilai_akhir,
            nilai_juri: refreshedParticipant.nilai_juri || [],
            ruangan_mhq: refreshedParticipant.ruangan_mhq ?? participant.ruangan_mhq,
          }
        : participant));
  }, []);

  useEffect(() => {
    const pendingParticipantIds = new Set<string>();
    let realtimeDebounce: ReturnType<typeof setTimeout> | null = null;

    const flushParticipantUpdates = () => {
      const participantIds = Array.from(pendingParticipantIds);
      pendingParticipantIds.clear();
      void Promise.all(participantIds.map((participantId) => refreshParticipantResult(participantId, category)));
    };

    void supabase.realtime.setAuth();
    const channel = supabase
      .channel(`penilaian:${category}`, { config: { private: true } })
      .on('broadcast', { event: 'score_changed' }, ({ payload }) => {
        const participantId = typeof payload?.pendaftar_id === 'string' ? payload.pendaftar_id : '';
        if (!participantId) return;

        pendingParticipantIds.add(participantId);
        if (realtimeDebounce) clearTimeout(realtimeDebounce);
        realtimeDebounce = setTimeout(flushParticipantUpdates, 200);
      })
      .subscribe();

    const refreshAfterFocus = () => setRefreshKey((currentKey) => currentKey + 1);
    window.addEventListener('focus', refreshAfterFocus);

    return () => {
      window.removeEventListener('focus', refreshAfterFocus);
      if (realtimeDebounce) clearTimeout(realtimeDebounce);
      pendingParticipantIds.clear();
      void supabase.removeChannel(channel);
    };
  }, [category, refreshParticipantResult]);

  const roomParticipants = useMemo(() => category === 'MHQ' && roomFilter !== 'all'
    ? participants.filter((participant) => participant.ruangan_mhq === Number(roomFilter))
    : participants, [category, participants, roomFilter]);

  const visibleJuries = useMemo(() => category === 'MHQ' && roomFilter !== 'all'
    ? juries.filter((jury) => jury.ruangan_mhq === Number(roomFilter))
    : juries, [category, juries, roomFilter]);
  const compactMhqColumns = category === 'MHQ' && roomFilter === 'all';

  const filteredParticipants = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matching = normalizedQuery
      ? roomParticipants.filter((participant) =>
          participant.nama_anak.toLowerCase().includes(normalizedQuery)
          || (participant.no_peserta || '').toLowerCase().includes(normalizedQuery)
          || participant.asal_sekolah.toLowerCase().includes(normalizedQuery))
      : roomParticipants;

    const getFinalTotal = (participant: Participant) => {
      const complete = participant.jumlah_juri > 0 && participant.jumlah_selesai === participant.jumlah_juri;
      return complete ? participant.nilai_akhir : null;
    };

    return [...matching].sort((a, b) => {
      const totalA = getFinalTotal(a);
      const totalB = getFinalTotal(b);
      if (totalA === null && totalB !== null) return 1;
      if (totalA !== null && totalB === null) return -1;
      return (totalB || 0) - (totalA || 0);
    });
  }, [query, roomParticipants]);

  const completedCount = roomParticipants.filter((participant) => participant.jumlah_juri > 0 && participant.jumlah_selesai === participant.jumlah_juri).length;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 p-5 text-white shadow-lg shadow-purple-500/15 sm:p-6">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-purple-200">Khusus Administrator</p>
        <h2 className="mt-1 text-xl font-black sm:text-2xl">Rekap Nilai Akhir Juri</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-purple-100">
          {category === 'MHQ'
            ? 'Bandingkan nilai setiap juri dan lihat jumlah nilai akhir dari kedua juri di ruangan peserta.'
            : 'Bandingkan nilai setiap juri dan lihat jumlah nilai akhir setelah seluruh juri menyelesaikan penilaian.'}
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(180px,0.4fr)_minmax(160px,0.3fr)_1fr_auto] md:items-end">
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

          <div className={category === 'MHQ' ? 'block' : 'hidden'}>
            <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-500">Ruangan</span>
            <CustomSelect
              value={roomFilter}
              onChange={(value) => setRoomFilter(value as 'all' | '1' | '2')}
              options={[
                { value: 'all', label: 'Semua Ruangan', icon: 'fa-solid fa-door-open', color: 'bg-purple-100 text-purple-600' },
                { value: '1', label: 'Ruang 1', icon: 'fa-solid fa-1', color: 'bg-sky-100 text-sky-600' },
                { value: '2', label: 'Ruang 2', icon: 'fa-solid fa-2', color: 'bg-emerald-100 text-emerald-600' },
              ]}
              ariaLabel="Filter ruangan MHQ"
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
            {completedCount}/{roomParticipants.length} lengkap
          </div>
        </div>
      </section>

      {compactMhqColumns && (
        <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-semibold leading-relaxed text-sky-800">
          <i className="fa-solid fa-circle-info mt-0.5 text-sky-600" aria-hidden="true"></i>
          <p>Kolom Juri 1 dan Juri 2 otomatis mengikuti ruangan setiap peserta. Nama juri yang bertugas ditampilkan di dalam kolom nilai.</p>
        </div>
      )}

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
                  {category === 'MHQ' && (
                    <th className="min-w-28 border-r border-slate-200 px-4 py-3 text-center">Ruangan</th>
                  )}
                  {compactMhqColumns
                    ? [1, 2].map((position) => (
                        <th key={position} className="min-w-36 px-4 py-3 text-center">
                          <span className="block text-slate-700">Juri {position} di Ruangan</span>
                          <span className="mt-0.5 block text-[9px] text-slate-400">Mengikuti ruang peserta</span>
                        </th>
                      ))
                    : visibleJuries.map((jury) => (
                        <th key={jury.id} className="min-w-28 px-4 py-3 text-center">
                          <span className="block text-slate-700">{jury.nama}</span>
                          <span className="mt-0.5 block font-mono text-[9px] text-slate-400">{jury.kode}{jury.ruangan_mhq ? ` · R${jury.ruangan_mhq}` : ''}</span>
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
                  const finalTotal = complete ? participant.nilai_akhir : null;
                  const participantRoomJuries = compactMhqColumns
                    ? juries
                        .filter((jury) => jury.ruangan_mhq === participant.ruangan_mhq)
                        .sort((first, second) => first.kode.localeCompare(second.kode))
                    : visibleJuries;
                  const rowJuries = compactMhqColumns
                    ? [participantRoomJuries[0], participantRoomJuries[1]]
                    : participantRoomJuries;

                  return (
                    <tr key={participant.id} className={`group hover:bg-slate-50/70 ${category === 'MHQ' && participant.ruangan_mhq === 1 ? 'border-l-4 border-l-sky-400' : category === 'MHQ' && participant.ruangan_mhq === 2 ? 'border-l-4 border-l-emerald-400' : ''}`}>
                      <td className="sticky left-0 z-10 border-r border-slate-100 bg-white px-5 py-3 group-hover:bg-slate-50">
                        <p className="text-sm font-bold text-slate-800">{participant.nama_anak}</p>
                        <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                          <span className="font-mono">{participant.no_peserta || participant.id.split('-')[0].toUpperCase()}</span>
                          <span className="mx-1.5">•</span>{participant.asal_sekolah}
                        </p>
                      </td>
                      {category === 'MHQ' && (
                        <td className={`border-r px-4 py-3 text-center ${participant.ruangan_mhq === 1 ? 'border-sky-100 bg-sky-50/60' : participant.ruangan_mhq === 2 ? 'border-emerald-100 bg-emerald-50/60' : 'border-amber-100 bg-amber-50/60'}`}>
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-extrabold ${participant.ruangan_mhq === 1 ? 'border-sky-200 bg-sky-100 text-sky-700' : participant.ruangan_mhq === 2 ? 'border-emerald-200 bg-emerald-100 text-emerald-700' : 'border-amber-200 bg-amber-100 text-amber-700'}`}>
                            <i className="fa-solid fa-door-open" aria-hidden="true"></i>
                            {participant.ruangan_mhq ? `Ruang ${participant.ruangan_mhq}` : 'Belum dibagi'}
                          </span>
                        </td>
                      )}
                      {rowJuries.map((jury, index) => {
                        const score = jury ? scoreMap.get(jury.id) : undefined;
                        return (
                          <td key={jury?.id || `jury-${index}`} className="px-4 py-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              {score === undefined
                                ? <span className="text-sm font-bold text-slate-300">—</span>
                                : <span className="inline-flex min-w-10 justify-center rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm font-black text-slate-700">{score}</span>}
                              {compactMhqColumns && (
                                <span className="max-w-32 truncate text-[9px] font-bold text-slate-400" title={jury?.nama}>
                                  {jury?.nama || 'Belum ditetapkan'}
                                </span>
                              )}
                            </div>
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
