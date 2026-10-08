'use client';

import { useState, useMemo, use, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { exportPenilaianToExcel } from '@/lib/exportPenilaian';

const categoryMap: Record<string, string> = {
    'adzan': 'Adzan',
    'fashion-show': 'Fashion Show',
    'mhq': 'MHQ',
    'karya-kolase': 'Karya Kolase',
    'mewarnai': 'Mewarnai',
    'tendangan-penalti': 'Tendangan Penalti',
    'menyanyi-solo': 'Menyanyi Solo',
};

type CriteriaItem = {
    id: string;
    label: string;
    weight: number;
    icon: string;
    indicator: string;
};

type Juri = {
    id: string;
    kode: string;
    nama: string;
    user_id?: string;
};

type NilaiJuri = {
    id?: string;
    pendaftar_id?: string;
    juri_id: string;
    detail_nilai: Record<string, number>;
    nilai_total: number;
    catatan: string;
    version: number;
};

type RingkasanNilai = {
    pendaftar_id: string;
    jumlah_juri: number;
    jumlah_selesai: number;
    nilai_akhir: number | null;
    juri_belum: string[];
};

type DashboardCriteria = {
    kode: string;
    label: string;
    bobot: number;
    nilai_maksimum: number;
    urutan: number;
};

type DashboardParticipant = {
    id: string;
    created_at: string;
    no_peserta: string | null;
    nama_anak: string;
    asal_sekolah: string;
    cabang_lomba: string;
    jumlah_juri: number;
    jumlah_selesai: number;
    nilai_akhir: number | null;
    juri_belum: string[];
    nilai_juri: NilaiJuri[];
};

type DashboardPayload = {
    criteria: DashboardCriteria[];
    juries: Juri[];
    participants: DashboardParticipant[];
};

const criteriaConfig: Record<string, CriteriaItem[]> = {
    'Adzan': [
        { id: 'makhraj', label: 'Ketepatan bacaan & makhraj', weight: 35, icon: 'fa-book-quran', indicator: 'Pelafalan huruf, kejelasan makhraj, dan ketepatan bacaan.' },
        { id: 'lafaz', label: 'Kelancaran & ketepatan lafaz', weight: 25, icon: 'fa-comment-dots', indicator: 'Urutan lafaz, kontinuitas, dan minimnya koreksi/terhenti.' },
        { id: 'irama', label: 'Suara & irama', weight: 20, icon: 'fa-music', indicator: 'Kejelasan suara, kestabilan, dan irama yang wajar.' },
        { id: 'adab', label: 'Adab & sikap', weight: 10, icon: 'fa-user-tie', indicator: 'Sikap saat tampil, ketenangan, dan kesopanan.' },
        { id: 'keberanian', label: 'Keberanian & percaya diri', weight: 10, icon: 'fa-shield-halved', indicator: 'Kesiapan tampil dan keberanian menyelesaikan penampilan.' }
    ],
    'Mewarnai': [
        { id: 'kesesuaian', label: 'Kesesuaian & ketepatan mewarnai', weight: 30, icon: 'fa-palette', indicator: 'Pengisian bidang, ketelitian terhadap objek, dan kontrol warna.' },
        { id: 'kerapian', label: 'Kerapian', weight: 25, icon: 'fa-broom', indicator: 'Kebersihan garis tepi, minim coretan yang tidak disengaja.' },
        { id: 'komposisi', label: 'Komposisi & pemilihan warna', weight: 25, icon: 'fa-fill-drip', indicator: 'Keserasian, keberanian kombinasi, dan keseimbangan warna.' },
        { id: 'kreativitas', label: 'Kreativitas', weight: 10, icon: 'fa-lightbulb', indicator: 'Eksplorasi warna/aksen yang tetap sesuai gambar.' },
        { id: 'kebersihan', label: 'Kebersihan hasil karya', weight: 10, icon: 'fa-sparkles', indicator: 'Kondisi karya tidak kusut, kotor, atau rusak karena pengerjaan.' }
    ],
    'Menyanyi Solo': [
        { id: 'nada', label: 'Ketepatan nada & melodi', weight: 30, icon: 'fa-music', indicator: 'Ketepatan pitch/melodi sesuai lagu dan kemampuan usia anak.' },
        { id: 'vokal', label: 'Vokal & kejelasan suara', weight: 25, icon: 'fa-microphone', indicator: 'Artikulasi, volume, kestabilan, dan kualitas suara natural.' },
        { id: 'ekspresi', label: 'Penghayatan & ekspresi', weight: 20, icon: 'fa-masks-theater', indicator: 'Ekspresi wajah, keterlibatan emosi, dan komunikasi lagu.' },
        { id: 'penampilan', label: 'Percaya diri & penampilan', weight: 15, icon: 'fa-star', indicator: 'Keberanian, postur, dan ketenangan di panggung.' },
        { id: 'kesesuaian_lagu', label: 'Kesesuaian lagu', weight: 10, icon: 'fa-compact-disc', indicator: 'Lagu sesuai kategori, usia, dan karakter anak.' }
    ],
    'Karya Kolase': [
        { id: 'tema', label: 'Kesesuaian tema', weight: 25, icon: 'fa-paw', indicator: 'Keterbacaan objek hewan dan keterkaitan dengan tema Animal Explorer.' },
        { id: 'kreativitas', label: 'Kreativitas', weight: 25, icon: 'fa-lightbulb', indicator: 'Keunikan ide, eksplorasi tekstur, dan cara memanfaatkan bahan.' },
        { id: 'komposisi', label: 'Komposisi & pemilihan bahan', weight: 20, icon: 'fa-layer-group', indicator: 'Keseimbangan visual dan kecocokan bahan.' },
        { id: 'kerapian', label: 'Kerapian & ketepatan menempel', weight: 20, icon: 'fa-hand-dots', indicator: 'Kekuatan tempel, kerapian susunan, minim residu lem.' },
        { id: 'kebersihan', label: 'Kebersihan & hasil akhir', weight: 10, icon: 'fa-sparkles', indicator: 'Kondisi akhir bersih, utuh, dan layak ditampilkan.' }
    ],
    'MHQ': [
        { id: 'kelancaran', label: 'Kelancaran hafalan', weight: 35, icon: 'fa-brain', indicator: 'Kemampuan melanjutkan ayat/surah dengan lancar dan minim pancingan.' },
        { id: 'ketepatan', label: 'Ketepatan bacaan', weight: 30, icon: 'fa-book-open', indicator: 'Ketepatan lafaz, urutan ayat, dan minim kesalahan penggantian/penambahan.' },
        { id: 'tajwid', label: 'Makhraj & tajwid', weight: 25, icon: 'fa-book-quran', indicator: 'Pelafalan huruf serta penerapan kaidah tajwid sesuai tingkat usia.' },
        { id: 'adab', label: 'Adab & sikap', weight: 10, icon: 'fa-user-tie', indicator: 'Sikap, ketenangan, kesopanan, dan penghormatan terhadap bacaan.' }
    ],
    'Fashion Show': [
        { id: 'tema', label: 'Kesesuaian dengan tema', weight: 25, icon: 'fa-shirt', indicator: 'Keterbacaan konsep Little Explorer dan konsistensi busana/properti.' },
        { id: 'kreativitas', label: 'Kreativitas busana', weight: 25, icon: 'fa-lightbulb', indicator: 'Ide, detail, dan pemanfaatan unsur busana secara kreatif.' },
        { id: 'ekspresi', label: 'Penampilan & ekspresi', weight: 20, icon: 'fa-masks-theater', indicator: 'Ekspresi wajah, pose, dan komunikasi panggung.' },
        { id: 'percaya_diri', label: 'Kepercayaan diri', weight: 20, icon: 'fa-star', indicator: 'Keberanian berjalan, ketenangan, dan kemandirian.' },
        { id: 'kerapian', label: 'Kerapian', weight: 10, icon: 'fa-broom', indicator: 'Kerapian keseluruhan busana dan properti.' }
    ],
    'Tendangan Penalti': [
        { id: 'skor_utama', label: 'Skor utama', weight: 100, icon: 'fa-futbol', indicator: 'Jumlah bola masuk dari 3 tendangan. Maksimal 3 poin.' }
    ],
    'default': [
        { id: 'kreativitas', label: 'Kreativitas & Inovasi', weight: 34, icon: 'fa-lightbulb', indicator: 'Ide kreatif dan keaslian karya/penampilan.' },
        { id: 'teknik', label: 'Teknik & Eksekusi', weight: 33, icon: 'fa-wand-magic-sparkles', indicator: 'Penguasaan teknik dan kerapian.' },
        { id: 'penampilan', label: 'Penampilan & Ekspresi', weight: 33, icon: 'fa-masks-theater', indicator: 'Gaya, ekspresi, dan penguasaan panggung.' }
    ]
};

const snapToNearestGuide = (value: number, guides: number[], threshold: number) => {
    const nearest = guides.reduce((closest, guide) =>
        Math.abs(guide - value) < Math.abs(closest - value) ? guide : closest
    );
    return Math.abs(nearest - value) <= threshold ? nearest : value;
};

const criteriaAccentStyles = [
    { border: 'border-l-violet-500 sm:border-l-slate-200', soft: 'bg-violet-50', text: 'text-violet-700', color: '#7c3aed' },
    { border: 'border-l-blue-500 sm:border-l-slate-200', soft: 'bg-blue-50', text: 'text-blue-700', color: '#2563eb' },
    { border: 'border-l-emerald-500 sm:border-l-slate-200', soft: 'bg-emerald-50', text: 'text-emerald-700', color: '#059669' },
    { border: 'border-l-amber-500 sm:border-l-slate-200', soft: 'bg-amber-50', text: 'text-amber-700', color: '#d97706' },
    { border: 'border-l-rose-500 sm:border-l-slate-200', soft: 'bg-rose-50', text: 'text-rose-700', color: '#e11d48' },
];

export default function CategoryPenilaianPage({ params }: { params: Promise<{ kategori: string }> }) {
    const unwrappedParams = use(params);
    const router = useRouter();
    const currentCategoryName = categoryMap[unwrappedParams.kategori] || 'Tidak Diketahui';
    
    const [pesertaList, setPesertaList] = useState<any[]>([]);
    const [juriList, setJuriList] = useState<Juri[]>([]);
    const [selectedJuriId, setSelectedJuriId] = useState('');
    const [databaseError, setDatabaseError] = useState('');
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [activeCriteria, setActiveCriteria] = useState<CriteriaItem[]>([]);
    const hasLoadedOnce = useRef(false);
    const realtimeDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingRealtimeParticipantIds = useRef<Set<string>>(new Set());
    const recentlySavedParticipant = useRef<{ id: string; at: number } | null>(null);
    
    useEffect(() => {
        const controller = new AbortController();
        const fetchPeserta = async () => {
            if (!hasLoadedOnce.current) setLoading(true);
            setDatabaseError('');

            // Ambil sesi lokal lebih dulu agar perpindahan dari login admin tidak
            // salah dianggap sebagai sesi kosong saat token masih dipulihkan.
            const { data: sessionData } = await supabase.auth.getSession();
            let authenticatedUser = sessionData.session?.user ?? null;

            if (!authenticatedUser) {
                const { data: userData } = await supabase.auth.getUser();
                authenticatedUser = userData.user;
            }

            if (!authenticatedUser) {
                const savedMode = window.localStorage.getItem('jinga-access-mode');
                router.replace(savedMode === 'admin' ? '/panitia/login' : '/panitia/juri-login');
                return;
            }
            const adminSession = authenticatedUser.app_metadata?.role === 'admin';
            setIsAdmin(adminSession);

            // Jalur utama setelah supabase_penilaian_performance.sql dipasang:
            // seluruh data awal dashboard dimuat melalui satu request.
            const { data: dashboardData, error: dashboardError } = await supabase
                .rpc('get_dashboard_penilaian', { p_kategori: currentCategoryName })
                .abortSignal(controller.signal);

            if (controller.signal.aborted) return;
            if (!dashboardError && dashboardData) {
                const dashboard = dashboardData as unknown as DashboardPayload;
                const presentationCriteria = criteriaConfig[currentCategoryName] || criteriaConfig.default;
                const resolvedCriteria: CriteriaItem[] = (dashboard.criteria || []).map(row => {
                    const presentation = presentationCriteria.find(item => item.id === row.kode);
                    return {
                        id: row.kode,
                        label: row.label,
                        weight: Number(row.bobot),
                        icon: presentation?.icon || 'fa-star',
                        indicator: presentation?.indicator || 'Berikan nilai sesuai penampilan peserta.',
                    };
                });
                const activeJudges = (dashboard.juries || []) as Juri[];
                const authenticatedJuri = adminSession
                    ? activeJudges[0]
                    : activeJudges.find(juri => juri.user_id === authenticatedUser.id);

                if (!authenticatedJuri || resolvedCriteria.length === 0) {
                    setDatabaseError('Akun, penugasan juri, atau kriteria penilaian belum lengkap.');
                    setLoading(false);
                    return;
                }

                setActiveCriteria(resolvedCriteria);
                setJuriList(activeJudges);
                setSelectedJuriId(previous => adminSession && activeJudges.some(juri => juri.id === previous) ? previous : authenticatedJuri.id);
                setPesertaList((dashboard.participants || []).map((participant, index) => {
                    const initialKriteria = Object.fromEntries(resolvedCriteria.map(criteria => [criteria.id, 0]));
                    const lengkap = participant.jumlah_juri > 0 && participant.jumlah_selesai === participant.jumlah_juri;
                    return {
                        id: participant.id,
                        nomor_urut: index + 1,
                        no_peserta: participant.no_peserta || participant.id.split('-')[0].toUpperCase(),
                        nama_lengkap: participant.nama_anak,
                        asal: participant.asal_sekolah,
                        kategori: participant.cabang_lomba,
                        status_nilai: lengkap
                            ? 'Penilaian Lengkap'
                            : participant.jumlah_selesai > 0
                                ? `Menunggu ${participant.juri_belum?.join(', ') || 'juri lain'}`
                                : 'Belum Dinilai',
                        total_nilai: lengkap ? participant.nilai_akhir : null,
                        nilai_juri: participant.nilai_juri || [],
                        initial_kriteria: initialKriteria,
                    };
                }));
                hasLoadedOnce.current = true;
                setLoading(false);
                return;
            }

            // Fallback kompatibilitas untuk database yang belum menjalankan migrasi performa.
            const { data: criteriaRows, error: criteriaError } = await supabase
                .from('kriteria_penilaian')
                .select('kode, label, bobot, nilai_maksimum, urutan')
                .eq('cabang_lomba', currentCategoryName)
                .eq('aktif', true)
                .order('urutan')
                .abortSignal(controller.signal);
            if (controller.signal.aborted) return;
            if (criteriaError || !criteriaRows?.length) {
                setDatabaseError('Konfigurasi kriteria penilaian tidak dapat dimuat.');
                setLoading(false);
                return;
            }
            const presentationCriteria = criteriaConfig[currentCategoryName] || criteriaConfig.default;
            const resolvedCriteria: CriteriaItem[] = criteriaRows.map(row => {
                const presentation = presentationCriteria.find(item => item.id === row.kode);
                return {
                    id: row.kode,
                    label: row.label,
                    weight: Number(row.bobot),
                    icon: presentation?.icon || 'fa-star',
                    indicator: presentation?.indicator || 'Berikan nilai sesuai penampilan peserta.',
                };
            });
            setActiveCriteria(resolvedCriteria);

            const { data: assignments, error: assignmentError } = await supabase
                .from('juri_kategori')
                .select('juri_id')
                .eq('cabang_lomba', currentCategoryName)
                .abortSignal(controller.signal);
            if (controller.signal.aborted) return;

            if (assignmentError) {
                setDatabaseError('Tabel multi-juri belum tersedia. Jalankan pembaruan supabase_schema.sql di Supabase SQL Editor.');
                setPesertaList([]);
                setJuriList([]);
                setLoading(false);
                return;
            }

            const juriIds = assignments?.map(item => item.juri_id) || [];
            const { data: judges, error: judgesError } = juriIds.length > 0
                ? await supabase.from('juri').select('id, kode, nama, user_id').in('id', juriIds).eq('aktif', true).order('kode').abortSignal(controller.signal)
                : { data: [], error: null };
            if (controller.signal.aborted) return;

            if (judgesError) {
                setDatabaseError('Data juri gagal dimuat: ' + judgesError.message);
            }

            const activeJudges = (judges || []) as Juri[];
            setJuriList(activeJudges);
            const authenticatedJuri = adminSession
                ? activeJudges[0]
                : activeJudges.find(juri => juri.user_id === authenticatedUser.id);
            if (!authenticatedJuri) {
                setDatabaseError('Akun ini tidak aktif atau tidak ditugaskan pada cabang lomba ini.');
                setLoading(false);
                return;
            }
            setSelectedJuriId(previous => adminSession && activeJudges.some(juri => juri.id === previous) ? previous : authenticatedJuri.id);

            const { data, error } = await supabase
                .from('pendaftar')
                .select('id, created_at, no_peserta, nama_anak, asal_sekolah, cabang_lomba, nilai_total')
                .eq('cabang_lomba', currentCategoryName)
                .order('created_at', { ascending: true })
                .abortSignal(controller.signal);
            if (controller.signal.aborted) return;
                
            if (!error && data) {
                const participantIds = data.map(p => p.id);
                const [{ data: scoreRows, error: scoreError }, { data: summaries, error: summaryError }] = participantIds.length > 0
                    ? await Promise.all([supabase
                        .from('penilaian_juri')
                        .select('id, pendaftar_id, juri_id, detail_nilai, nilai_total, catatan, version')
                        .in('pendaftar_id', participantIds)
                        .abortSignal(controller.signal), supabase.rpc('get_ringkasan_penilaian', { p_kategori: currentCategoryName }).abortSignal(controller.signal)])
                    : [{ data: [], error: null }, { data: [], error: null }];

                if (controller.signal.aborted) return;

                if (scoreError || summaryError) {
                    setDatabaseError('Nilai juri gagal dimuat: ' + (scoreError?.message || summaryError?.message));
                }
                const summaryMap = new Map(((summaries || []) as RingkasanNilai[]).map(item => [item.pendaftar_id, item]));

                // Map the DB data to include local scoring state
                const mapped = data.map((p, index) => {
                    const currentCriteria = resolvedCriteria;
                    const initialKriteria: Record<string, number> = {};
                    currentCriteria.forEach(c => initialKriteria[c.id] = 0);
                    const nilaiJuri = ((scoreRows || []) as Array<NilaiJuri & { pendaftar_id: string }>)
                        .filter(score => score.pendaftar_id === p.id && activeJudges.some(juri => juri.id === score.juri_id));
                    const summary = summaryMap.get(p.id);
                    const lengkap = Boolean(summary && summary.jumlah_juri > 0 && summary.jumlah_selesai === summary.jumlah_juri);
                    
                    return {
                        id: p.id,
                        // Nomor urut juri selalu dimulai dari 1 untuk setiap kategori.
                        nomor_urut: index + 1,
                        no_peserta: p.no_peserta || p.id.split('-')[0].toUpperCase(),
                        nama_lengkap: p.nama_anak,
                        asal: p.asal_sekolah,
                        kategori: p.cabang_lomba,
                        status_nilai: lengkap
                            ? 'Penilaian Lengkap'
                            : (summary?.jumlah_selesai || 0) > 0
                                ? `Menunggu ${summary?.juri_belum?.join(', ') || 'juri lain'}`
                                : 'Belum Dinilai',
                        total_nilai: lengkap ? summary?.nilai_akhir ?? null : null,
                        nilai_juri: nilaiJuri,
                        initial_kriteria: initialKriteria,
                    };
                });
                setPesertaList(mapped);
                hasLoadedOnce.current = true;
            } else if (error) {
                setDatabaseError('Data peserta gagal dimuat: ' + error.message);
            }
            setLoading(false);
        };
        
        if (currentCategoryName !== 'Tidak Diketahui') {
            fetchPeserta();
        } else {
            setLoading(false);
        }
        return () => controller.abort();
    }, [currentCategoryName, router, refreshKey]);

    const refreshParticipantStatus = useCallback(async (participantId: string) => {
        const { data, error } = await supabase.rpc('get_status_penilaian_peserta', {
            p_pendaftar_id: participantId,
        });
        if (error || !data) return false;

        const participant = data as unknown as DashboardParticipant;
        const complete = participant.jumlah_juri > 0 && participant.jumlah_selesai === participant.jumlah_juri;
        setPesertaList(previous => previous.map(current => current.id === participantId
            ? {
                ...current,
                status_nilai: complete
                    ? 'Penilaian Lengkap'
                    : participant.jumlah_selesai > 0
                        ? `Menunggu ${participant.juri_belum?.join(', ') || 'juri lain'}`
                        : 'Belum Dinilai',
                total_nilai: complete ? participant.nilai_akhir : null,
                nilai_juri: participant.nilai_juri || current.nilai_juri,
            }
            : current));
        return true;
    }, []);

    useEffect(() => {
        const pendingParticipantIds = pendingRealtimeParticipantIds.current;
        void supabase.realtime.setAuth();
        const channel = supabase
            .channel(`penilaian:${currentCategoryName}`, { config: { private: true } })
            .on('broadcast', { event: 'score_changed' }, ({ payload }) => {
                const participantId = typeof payload?.pendaftar_id === 'string' ? payload.pendaftar_id : '';
                if (!participantId) return;
                const recentSave = recentlySavedParticipant.current;
                if (recentSave && recentSave.id === participantId && Date.now() - recentSave.at < 2000) return;
                pendingParticipantIds.add(participantId);
                if (realtimeDebounce.current) clearTimeout(realtimeDebounce.current);
                realtimeDebounce.current = setTimeout(() => {
                    const participantIds = Array.from(pendingParticipantIds);
                    pendingParticipantIds.clear();
                    void Promise.all(participantIds.map(refreshParticipantStatus));
                }, 200);
            })
            .subscribe();
        const handleFocus = () => setRefreshKey(value => value + 1);
        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
            if (realtimeDebounce.current) clearTimeout(realtimeDebounce.current);
            pendingParticipantIds.clear();
            void supabase.removeChannel(channel);
        };
    }, [currentCategoryName, refreshParticipantStatus]);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('Belum Dinilai');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activePeserta, setActivePeserta] = useState<any>(null);
    const [tempNilai, setTempNilai] = useState<Record<string, number>>({});
    const [tempCatatan, setTempCatatan] = useState('');
    const [touchedCriteria, setTouchedCriteria] = useState<Set<string>>(new Set());
    const [missingCriteriaIds, setMissingCriteriaIds] = useState<string[]>([]);
    const [originalForm, setOriginalForm] = useState('');
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [isMobileNotesOpen, setIsMobileNotesOpen] = useState(false);
    const sliderFrameRef = useRef<number | null>(null);
    const pendingSliderValueRef = useRef<{ criterionId: string; value: number } | null>(null);
    const modalHistoryPushedRef = useRef(false);
    const isClosingViaProgrammaticBackRef = useRef(false);

    const currentFormSnapshot = JSON.stringify({ nilai: tempNilai, catatan: tempCatatan });
    const hasUnsavedChanges = isModalOpen && currentFormSnapshot !== originalForm;
    const filledCriteriaCount = activeCriteria.filter(criterion => touchedCriteria.has(criterion.id)).length;

    const isModalOpenRef = useRef(isModalOpen);
    const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
    const showSaveConfirmRef = useRef(showSaveConfirm);
    const showDiscardConfirmRef = useRef(showDiscardConfirm);

    useEffect(() => {
        isModalOpenRef.current = isModalOpen;
        hasUnsavedChangesRef.current = hasUnsavedChanges;
        showSaveConfirmRef.current = showSaveConfirm;
        showDiscardConfirmRef.current = showDiscardConfirm;
    }, [isModalOpen, hasUnsavedChanges, showSaveConfirm, showDiscardConfirm]);

    useEffect(() => {
        const warnBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!hasUnsavedChanges) return;
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', warnBeforeUnload);
        return () => window.removeEventListener('beforeunload', warnBeforeUnload);
    }, [hasUnsavedChanges]);

    useEffect(() => {
        if (!isModalOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isModalOpen]);

    // --- Export Excel ---
    const handleExportExcel = (kategoriSlug: string) => {
        try {
            if (!isAdmin) {
                alert('Export hanya tersedia untuk administrator.');
                return;
            }
            if (pesertaList.length === 0) {
                alert('Tidak ada data peserta untuk kategori ini.');
                return;
            }

            exportPenilaianToExcel({
                kategori: kategoriSlug,
                peserta: pesertaList,
                juri: juriList,
                kriteria: activeCriteria,
            });
        } catch (err: unknown) {
            alert('Gagal mengekspor data: ' + (err instanceof Error ? err.message : 'Terjadi kesalahan'));
        }
    };

    // --- Filtering ---
    const filteredPeserta = useMemo(() => {
        return pesertaList.filter(p => {
            const normalizedQuery = searchQuery.toLowerCase();
            const hasMyScore = (p.nilai_juri as NilaiJuri[]).some(score => score.juri_id === selectedJuriId);
            const isWaitingForOthers = hasMyScore && p.status_nilai !== 'Penilaian Lengkap';
            const matchSearch = p.nama_lengkap.toLowerCase().includes(normalizedQuery)
                || p.no_peserta.toLowerCase().includes(normalizedQuery)
                || String(p.nomor_urut).includes(normalizedQuery);
            const matchStatus = (filterStatus === 'Belum Dinilai' && !hasMyScore)
                || (filterStatus === 'Sudah Dinilai' && hasMyScore)
                || (filterStatus === 'Menunggu Juri Lain' && isWaitingForOthers);
            return matchSearch && matchStatus;
        });
    }, [pesertaList, searchQuery, filterStatus, selectedJuriId]);

    // --- Stats ---
    const stats = useMemo(() => ({ total: pesertaList.length }), [pesertaList]);
    const filterTabs = useMemo(() => {
        const scoredByMe = pesertaList.filter(p =>
            (p.nilai_juri as NilaiJuri[]).some(score => score.juri_id === selectedJuriId)
        );
        return [
            { label: 'Belum Dinilai', count: pesertaList.length - scoredByMe.length },
            { label: 'Sudah Dinilai', count: scoredByMe.length },
            { label: 'Menunggu Juri Lain', count: scoredByMe.filter(p => p.status_nilai !== 'Penilaian Lengkap').length },
        ];
    }, [pesertaList, selectedJuriId]);

    // --- Handlers ---
    const openScoringModal = (peserta: any) => {
        if (!selectedJuriId) {
            alert('Pilih juri aktif terlebih dahulu.');
            return;
        }
        const existingScore = (peserta.nilai_juri as NilaiJuri[]).find(score => score.juri_id === selectedJuriId);
        const startingValues = { ...(existingScore?.detail_nilai || peserta.initial_kriteria) };
        setActivePeserta(peserta);
        setTempNilai(startingValues);
        setTempCatatan(existingScore?.catatan || '');
        setTouchedCriteria(new Set(existingScore ? Object.keys(existingScore.detail_nilai) : []));
        setMissingCriteriaIds([]);
        setIsMobileNotesOpen(Boolean(existingScore?.catatan));
        setOriginalForm(JSON.stringify({ nilai: startingValues, catatan: existingScore?.catatan || '' }));
        setIsModalOpen(true);

        if (typeof window !== 'undefined' && !modalHistoryPushedRef.current) {
            window.history.pushState({ modal: 'scoring' }, '', window.location.href);
            modalHistoryPushedRef.current = true;
        }
    };

    const markCriterionFilled = (criterionId: string) => {
        setTouchedCriteria(previous => {
            if (previous.has(criterionId)) return previous;
            return new Set(previous).add(criterionId);
        });
        setMissingCriteriaIds(previous => previous.includes(criterionId)
            ? previous.filter(id => id !== criterionId)
            : previous);
    };

    const commitSliderValue = (criterionId: string, value: number) => {
        setTempNilai(previous => previous[criterionId] === value
            ? previous
            : { ...previous, [criterionId]: value });
        markCriterionFilled(criterionId);
    };

    const queueSliderValue = (criterionId: string, value: number) => {
        pendingSliderValueRef.current = { criterionId, value };
        if (sliderFrameRef.current !== null) return;

        sliderFrameRef.current = window.requestAnimationFrame(() => {
            sliderFrameRef.current = null;
            const pending = pendingSliderValueRef.current;
            pendingSliderValueRef.current = null;
            if (pending) commitSliderValue(pending.criterionId, pending.value);
        });
    };

    const finishSliderInteraction = (criterionId: string, rawValue: number, guideScores: number[], maxScore: number) => {
        if (sliderFrameRef.current !== null) {
            window.cancelAnimationFrame(sliderFrameRef.current);
            sliderFrameRef.current = null;
        }
        pendingSliderValueRef.current = null;
        commitSliderValue(criterionId, snapToNearestGuide(rawValue, guideScores, maxScore === 3 ? 0.4 : 4));
    };

    const showMissingCriteriaNotice = (missingIds: string[]) => {
        setMissingCriteriaIds(missingIds);
        setShowSaveConfirm(false);

        window.requestAnimationFrame(() => {
            document.getElementById(`criterion-${missingIds[0]}`)?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        });
    };

    const requestSaveConfirmation = () => {
        const missingIds = activeCriteria
            .filter(criterion => !touchedCriteria.has(criterion.id))
            .map(criterion => criterion.id);

        if (missingIds.length > 0) {
            showMissingCriteriaNotice(missingIds);
            return;
        }

        setMissingCriteriaIds([]);
        setShowSaveConfirm(true);
    };

    const dismissModal = useCallback(() => {
        setIsModalOpen(false);
        setShowDiscardConfirm(false);
        setShowSaveConfirm(false);
        if (modalHistoryPushedRef.current) {
            modalHistoryPushedRef.current = false;
            isClosingViaProgrammaticBackRef.current = true;
            window.history.back();
        }
    }, []);

    const requestCloseModal = useCallback(() => {
        if (hasUnsavedChangesRef.current) {
            setShowDiscardConfirm(true);
            return;
        }
        dismissModal();
    }, [dismissModal]);

    useEffect(() => {
        const handlePopState = () => {
            if (isClosingViaProgrammaticBackRef.current) {
                isClosingViaProgrammaticBackRef.current = false;
                return;
            }

            if (!isModalOpenRef.current) {
                return;
            }

            // Browser sudah memundurkan history (pop) saat tombol back ditekan
            modalHistoryPushedRef.current = false;

            // 1. Jika konfirmasi simpan sedang terbuka, batalkan konfirmasi dan tetap di form
            if (showSaveConfirmRef.current) {
                setShowSaveConfirm(false);
                window.history.pushState({ modal: 'scoring' }, '', window.location.href);
                modalHistoryPushedRef.current = true;
                return;
            }

            // 2. Jika konfirmasi buang perubahan sudah terbuka, back sekali lagi berarti setuju buang & tutup modal
            if (showDiscardConfirmRef.current) {
                setShowDiscardConfirm(false);
                setIsModalOpen(false);
                return;
            }

            // 3. Jika ada perubahan belum disimpan, buka dialog konfirmasi buang perubahan
            if (hasUnsavedChangesRef.current) {
                window.history.pushState({ modal: 'scoring' }, '', window.location.href);
                modalHistoryPushedRef.current = true;
                setShowDiscardConfirm(true);
                return;
            }

            // 4. Jika tidak ada perubahan yang dibuat, langsung tutup modal kembali ke daftar peserta
            setIsModalOpen(false);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isModalOpenRef.current) {
                event.preventDefault();
                if (showSaveConfirmRef.current) {
                    setShowSaveConfirm(false);
                } else if (showDiscardConfirmRef.current) {
                    setShowDiscardConfirm(false);
                } else {
                    requestCloseModal();
                }
            }
        };

        window.addEventListener('popstate', handlePopState);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [requestCloseModal]);

    const handleLogoutJuri = async () => {
        await supabase.auth.signOut();
        window.localStorage.removeItem('jinga-access-mode');
        router.replace(isAdmin ? '/panitia/login' : '/panitia/juri-login');
    };

    const handleSaveScore = async () => {
        const criteriaForScore = activeCriteria;
        const missingCriteria = criteriaForScore.filter(criteria => !touchedCriteria.has(criteria.id));
        if (missingCriteria.length > 0) {
            showMissingCriteriaNotice(missingCriteria.map(criterion => criterion.id));
            return;
        }
        let finalScore = 0;
        
        criteriaForScore.forEach(c => {
            const score = tempNilai[c.id] || 0;
            finalScore += score * (c.weight / 100);
        });
        
        const roundedScore = Math.round(finalScore);
        
        if (!selectedJuriId) return;

        const invalidCriterion = criteriaForScore.find(criteria => {
            const value = tempNilai[criteria.id];
            const maximum = activePeserta.kategori === 'Tendangan Penalti' ? 3 : 100;
            return touchedCriteria.has(criteria.id) && (!Number.isFinite(value) || value < 0 || value > maximum);
        });
        if (invalidCriterion) {
            alert(`Nilai ${invalidCriterion.label} tidak valid.`);
            return;
        }

        const detailToSave = Object.fromEntries(
            Object.entries(tempNilai).filter(([key]) => touchedCriteria.has(key))
        );
        const existingScore = (activePeserta.nilai_juri as NilaiJuri[]).find(score => score.juri_id === selectedJuriId);
        const savedScore: NilaiJuri = {
            juri_id: selectedJuriId,
            detail_nilai: detailToSave,
            nilai_total: roundedScore,
            catatan: tempCatatan,
            version: existingScore ? existingScore.version + 1 : 1,
        };

        setIsSaving(true);
        const scorePayload = {
            pendaftar_id: activePeserta.id,
            ...savedScore,
        };
        const { data: savedRow, error } = existingScore
            ? await supabase.from('penilaian_juri').update(scorePayload)
                .eq('id', existingScore.id).eq('version', existingScore.version).select('id').single()
            : await supabase.from('penilaian_juri').insert(scorePayload).select('id').single();
            
        if (error) {
            alert('Gagal menyimpan nilai ke database: ' + error.message);
            setIsSaving(false);
            return;
        }
        
        setIsSaving(false);
        setOriginalForm(JSON.stringify({ nilai: tempNilai, catatan: tempCatatan }));
        recentlySavedParticipant.current = { id: activePeserta.id, at: Date.now() };
        setPesertaList(previous => previous.map(peserta => {
            if (peserta.id !== activePeserta.id) return peserta;
            const scores = (peserta.nilai_juri as NilaiJuri[]).filter(score => score.juri_id !== selectedJuriId);
            return {
                ...peserta,
                nilai_juri: [...scores, { ...savedScore, id: savedRow?.id ?? existingScore?.id }],
                status_nilai: peserta.status_nilai === 'Penilaian Lengkap'
                    ? peserta.status_nilai
                    : 'Menunggu juri lain',
            };
        }));
        dismissModal();
        void refreshParticipantStatus(activePeserta.id).then(updated => {
            // Database lama tetap berfungsi sampai migrasi performa dijalankan.
            if (!updated) setRefreshKey(value => value + 1);
        });
    };

    const selectedJuri = juriList.find(juri => juri.id === selectedJuriId);
    const selectedJuriNumber = selectedJuri?.kode.match(/J(\d+)$/)?.[1];
    const juryScoreLabel = selectedJuriNumber ? `Nilai Juri ${selectedJuriNumber}` : 'Nilai Juri';

    return (
        <div className="space-y-4 md:space-y-6">
            {databaseError && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800 flex items-start gap-3">
                    <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
                    <span>{databaseError}</span>
                </div>
            )}

            <div className="flex flex-col justify-between gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white shadow-lg shadow-purple-500/15 md:flex-row md:items-center md:gap-4 md:p-5">
                <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-purple-200 md:text-xs">{isAdmin ? 'Mode Administrator' : 'Juri Aktif'}</p>
                    <h2 className="text-lg font-extrabold md:text-xl">
                        <span className="sm:hidden">Penilaian {currentCategoryName}</span>
                        <span className="hidden sm:inline">{juriList.find(juri => juri.id === selectedJuriId)?.nama || 'Memuat identitas juri...'}</span>
                    </h2>
                    <p className="mt-1 hidden text-sm text-purple-100 sm:block">{isAdmin ? 'Pilih juri jika perlu memasukkan atau memperbaiki nilai atas nama juri tersebut.' : 'Identitas dan cabang lomba dipilih otomatis dari akun yang masuk.'}</p>
                </div>
                <div className="flex w-full items-center gap-3 rounded-xl border border-white/40 bg-white px-3 py-2.5 text-slate-800 shadow-lg shadow-indigo-950/10 md:w-auto md:min-w-80 md:rounded-2xl md:px-4 md:py-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                        <i className="fa-solid fa-id-card" aria-hidden="true"></i>
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{isAdmin ? 'Menilai sebagai' : 'Identitas Juri'}</span>
                        {isAdmin ? (
                            <select value={selectedJuriId} onChange={(event) => setSelectedJuriId(event.target.value)} aria-label="Pilih juri untuk penilaian" className="mt-0.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm font-extrabold outline-none focus:border-purple-400">
                                {juriList.map(juri => <option key={juri.id} value={juri.id}>{juri.nama} ({juri.kode})</option>)}
                            </select>
                        ) : (
                            <><span className="block truncate text-sm font-extrabold">{juriList.find(juri => juri.id === selectedJuriId)?.nama || 'Memuat akun...'}</span><span className="block font-mono text-[10px] text-slate-400">{juriList.find(juri => juri.id === selectedJuriId)?.kode}</span></>
                        )}
                    </span>
                    <button type="button" onClick={handleLogoutJuri} aria-label="Keluar akun juri"
                        className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors active:bg-rose-50 active:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 md:h-10 md:w-10 md:hover:bg-rose-50 md:hover:text-rose-600">
                        <i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i>
                    </button>
                </div>
            </div>

            {/* Ringkasan peserta */}
            <div className="flex items-center gap-3 rounded-2xl border border-purple-100 bg-white p-3 shadow-sm md:max-w-sm md:p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 md:h-12 md:w-12 md:text-lg">
                    <i className="fa-solid fa-users" aria-hidden="true"></i>
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Jumlah Peserta</p>
                    <p className="truncate text-sm font-bold text-slate-600">{currentCategoryName}</p>
                </div>
                <p className="text-3xl font-black leading-none text-slate-900">{stats.total}</p>
            </div>

            {/* Filters Area */}
            <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200/60 bg-white p-3 shadow-sm md:flex-row md:gap-4 md:p-4">
                <div className="grid w-full grid-cols-3 rounded-xl bg-slate-100 p-1 md:flex md:w-auto" role="tablist" aria-label="Filter status penilaian">
                    {filterTabs.map(tab => (
                        <button
                            key={tab.label}
                            type="button"
                            role="tab"
                            aria-selected={filterStatus === tab.label}
                            onClick={() => setFilterStatus(tab.label)}
                            className={`min-h-11 rounded-lg px-1.5 py-2 text-[10px] font-bold leading-tight transition-colors md:min-h-0 md:flex-none md:px-4 md:text-xs ${filterStatus === tab.label ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 active:text-slate-700 md:hover:text-slate-700'}`}
                        >
                            <span className="block">{tab.label}</span>
                            <span className={`mt-0.5 block text-[9px] ${filterStatus === tab.label ? 'text-purple-500' : 'text-slate-400'}`}>{tab.count} peserta</span>
                        </button>
                    ))}
                </div>
                <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
                    <div className="relative w-full md:w-80">
                        <i className="fa-solid fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input
                            type="text"
                            placeholder={`Cari peserta di ${currentCategoryName}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-11 text-sm transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 md:h-auto md:pr-4"
                        />
                        {searchQuery && (
                            <button type="button" onClick={() => setSearchQuery('')} aria-label="Hapus pencarian" className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 active:bg-slate-200 md:hidden">
                                <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                            </button>
                        )}
                    </div>
                    {isAdmin && (
                        <button onClick={() => handleExportExcel(unwrappedParams.kategori)} className="flex min-h-11 shrink-0 touch-manipulation items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition-all active:from-emerald-600 active:to-teal-600 md:px-5 md:text-sm md:hover:from-emerald-600 md:hover:to-teal-600">
                            <i className="fa-solid fa-file-excel"></i> Export Excel
                        </button>
                    )}
                </div>
            </div>

            {/* Daftar peserta mobile */}
            <div className="space-y-3 md:hidden">
                {loading ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center shadow-sm">
                        <i className="fa-solid fa-circle-notch fa-spin text-3xl text-purple-500" aria-hidden="true"></i>
                        <p className="mt-3 text-sm font-semibold text-slate-500">Memuat data peserta...</p>
                    </div>
                ) : filteredPeserta.length > 0 ? (
                    <AnimatePresence>
                        {filteredPeserta.map((peserta, index) => {
                            const myScore = (peserta.nilai_juri as NilaiJuri[]).find(score => score.juri_id === selectedJuriId);
                            const hasMyScore = Boolean(myScore);
                            const isComplete = peserta.status_nilai === 'Penilaian Lengkap';
                            const isWaiting = hasMyScore && !isComplete;
                            const displayedScore = isComplete ? peserta.total_nilai : myScore?.nilai_total;
                            const displayedStatus = !hasMyScore
                                ? 'Belum Anda nilai'
                                : isComplete ? 'Penilaian Lengkap' : 'Menunggu juri lain';
                            return (
                                <motion.article
                                    key={peserta.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ delay: Math.min(index * 0.02, 0.2) }}
                                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            <span className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl border border-purple-200 bg-purple-100 px-2 text-sm font-black text-purple-700">{peserta.nomor_urut}</span>
                                            <div className="min-w-0">
                                                <p className="truncate font-mono text-[11px] font-bold text-slate-500">{peserta.no_peserta}</p>
                                                <h3 className="truncate text-sm font-extrabold text-slate-900">{peserta.nama_lengkap}</h3>
                                            </div>
                                        </div>
                                        {displayedScore !== null && displayedScore !== undefined && (
                                            <div className="shrink-0 text-right">
                                                <p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">{isComplete ? 'Nilai akhir' : juryScoreLabel}</p>
                                                <p className="text-xl font-black leading-tight text-purple-700">{displayedScore}</p>
                                            </div>
                                        )}
                                    </div>
                                    <p className="mt-2 truncate text-xs text-slate-500"><i className="fa-solid fa-school mr-1.5 text-slate-400" aria-hidden="true"></i>{peserta.asal}</p>
                                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                                        <span className={`inline-flex min-w-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${isComplete ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : isWaiting ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-rose-200 bg-rose-50 text-rose-600'}`}>
                                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isComplete ? 'bg-emerald-500' : isWaiting ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                                            <span className="truncate">{displayedStatus}</span>
                                        </span>
                                        <button type="button" onClick={() => openScoringModal(peserta)} className="inline-flex min-h-11 shrink-0 touch-manipulation items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 text-xs font-extrabold text-white shadow-md shadow-purple-500/20 active:bg-purple-700">
                                            <i className={`fa-solid ${hasMyScore ? 'fa-pen-to-square' : 'fa-star'}`} aria-hidden="true"></i>
                                            {hasMyScore ? 'Edit Nilai' : 'Beri Nilai'}
                                        </button>
                                    </div>
                                </motion.article>
                            );
                        })}
                    </AnimatePresence>
                ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center shadow-sm">
                        <i className="fa-solid fa-folder-open text-4xl text-slate-300" aria-hidden="true"></i>
                        <p className="mt-3 text-sm font-semibold text-slate-500">Tidak ada peserta yang sesuai.</p>
                        <p className="mt-1 text-xs text-slate-400">Coba pencarian lain atau pilih tab berbeda.</p>
                    </div>
                )}
                {!loading && filteredPeserta.length > 0 && <p className="pb-1 text-center text-xs font-semibold text-slate-400">Menampilkan {filteredPeserta.length} peserta</p>}
            </div>

            {/* Data Table desktop */}
            <div className="hidden h-auto max-h-none overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm md:block">
                <div className={`h-auto max-h-none overflow-y-hidden ${loading ? 'overflow-x-hidden' : 'overflow-x-auto'}`}>
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200/60 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-bold">No. Urut &amp; Kode Peserta</th>
                                <th className="px-6 py-4 font-bold">Informasi Peserta</th>
                                <th className="px-6 py-4 font-bold text-center">Status</th>
                                <th className="px-6 py-4 font-bold text-center">Nilai</th>
                                <th className="px-6 py-4 font-bold text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <i className="fa-solid fa-circle-notch fa-spin text-4xl mb-3 text-purple-500"></i>
                                            <p className="font-medium text-slate-500">Memuat data peserta...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                <AnimatePresence>
                                    {filteredPeserta.length > 0 ? (
                                        filteredPeserta.map((peserta, index) => (
                                            <motion.tr 
                                                key={peserta.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="hover:bg-slate-50/50 transition-colors group"
                                            >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-purple-100 px-2 text-sm font-extrabold text-purple-700 border border-purple-200">
                                                        {peserta.nomor_urut}
                                                    </span>
                                                    <span className="font-mono text-xs font-bold text-slate-600">
                                                        {peserta.no_peserta}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800">{peserta.nama_lengkap}</span>
                                                    <span className="text-xs text-slate-500">{peserta.asal}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {!(peserta.nilai_juri as NilaiJuri[]).some(score => score.juri_id === selectedJuriId) ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/50 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                                                        Belum Anda nilai
                                                    </span>
                                                ) : peserta.status_nilai === 'Penilaian Lengkap' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/50">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                        Penilaian Lengkap
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/50">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                        Menunggu juri lain
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {(() => {
                                                    const myScore = (peserta.nilai_juri as NilaiJuri[]).find(score => score.juri_id === selectedJuriId);
                                                    const isComplete = peserta.status_nilai === 'Penilaian Lengkap';
                                                    const displayedScore = isComplete ? peserta.total_nilai : myScore?.nilai_total;
                                                    if (displayedScore === null || displayedScore === undefined) {
                                                        return <span className="font-medium text-slate-400">-</span>;
                                                    }
                                                    return (
                                                        <div className="inline-flex flex-col items-center gap-1">
                                                            <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 px-2 font-bold text-white shadow-sm">
                                                                {displayedScore}
                                                            </span>
                                                            <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{isComplete ? 'Nilai akhir' : juryScoreLabel}</span>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button 
                                                    onClick={() => openScoringModal(peserta)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-purple-600 rounded-xl font-bold text-sm hover:bg-purple-50 hover:border-purple-200 transition-all shadow-sm group-hover:shadow"
                                                >
                                                    <i className={`fa-solid ${(peserta.nilai_juri as NilaiJuri[]).some(score => score.juri_id === selectedJuriId) ? 'fa-pen-to-square' : 'fa-star'}`}></i>
                                                    {(peserta.nilai_juri as NilaiJuri[]).some(score => score.juri_id === selectedJuriId) ? 'Edit Nilai Saya' : 'Beri Nilai'}
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <i className="fa-solid fa-folder-open text-4xl mb-3 text-slate-300"></i>
                                                <p className="font-medium text-slate-500">Tidak ada data peserta di kategori ini.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {filteredPeserta.length > 0 && (
                    <div className="border-t border-slate-200/60 p-4 flex items-center justify-between bg-slate-50/50">
                        <p className="text-xs font-semibold text-slate-500">Menampilkan total {filteredPeserta.length} peserta</p>
                    </div>
                )}
            </div>

            {/* Scoring Modal */}
            <AnimatePresence>
                {isModalOpen && activePeserta && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-2 md:p-3">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={requestCloseModal}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        ></motion.div>
                        
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            role="dialog"
                            aria-modal="true"
                            aria-label={`Form penilaian ${activePeserta.nama_lengkap}`}
                            className="scoring-dialog relative z-10 flex h-[100dvh] max-h-none w-full flex-col overflow-hidden bg-slate-50 shadow-2xl sm:h-auto sm:max-h-[calc(100vh-1rem)] sm:max-w-5xl sm:rounded-3xl md:max-h-[calc(100vh-1.5rem)]"
                        >
                            {/* Modal Header */}
                            <div className="shrink-0 border-b border-slate-200 bg-white px-4 pb-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] sm:px-5 sm:py-3 md:px-6">
                                <div className="flex items-center gap-3 sm:hidden">
                                    <button
                                        type="button"
                                        aria-label="Kembali ke daftar peserta"
                                        onClick={requestCloseModal}
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[15px] text-slate-600 transition-colors active:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                                    >
                                        <i className="fa-solid fa-arrow-left" aria-hidden="true"></i>
                                    </button>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-[11px] font-semibold text-purple-600">Form Penilaian</p>
                                            <span className="rounded-full bg-purple-50 px-2 py-1 text-[11px] font-semibold text-purple-700">
                                                {filledCriteriaCount}/{activeCriteria.length} kriteria
                                            </span>
                                        </div>
                                        <h2 className="truncate text-[17px] font-bold leading-6 tracking-tight text-slate-900">{activePeserta.nama_lengkap}</h2>
                                        <p className="truncate text-xs font-normal text-slate-500">No. {activePeserta.nomor_urut} &middot; {activePeserta.no_peserta} &middot; {activePeserta.kategori}</p>
                                    </div>
                                </div>
                                <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-slate-100 sm:hidden" aria-label={`${filledCriteriaCount} dari ${activeCriteria.length} kriteria telah diisi`}>
                                    <div className="h-full rounded-full bg-purple-600 transition-[width] duration-200" style={{ width: `${activeCriteria.length ? (filledCriteriaCount / activeCriteria.length) * 100 : 0}%` }}></div>
                                </div>

                                <div className="hidden justify-between items-start gap-4 sm:flex">
                                    <div className="min-w-0">
                                        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-purple-600">Form Penilaian</p>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900">{activePeserta.nama_lengkap}</h2>
                                            <span className="rounded-lg bg-purple-50 px-2 py-1 text-xs font-bold text-purple-700">No. {activePeserta.nomor_urut}</span>
                                            <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-600">{activePeserta.no_peserta}</span>
                                        </div>
                                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-500">
                                            <span><i className="fa-solid fa-user-pen mr-1.5" aria-hidden="true"></i>{juriList.find(juri => juri.id === selectedJuriId)?.nama}</span>
                                            <span><i className="fa-solid fa-trophy mr-1.5" aria-hidden="true"></i>{activePeserta.kategori}</span>
                                            <span><i className="fa-solid fa-school mr-1.5" aria-hidden="true"></i>{activePeserta.asal}</span>
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        aria-label="Tutup form penilaian"
                                        onClick={requestCloseModal}
                                        className="w-11 h-11 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl flex items-center justify-center transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                                    >
                                        <i className="fa-solid fa-xmark text-lg" aria-hidden="true"></i>
                                    </button>
                                </div>
                            </div>

                            {/* Konten ringkas tanpa scrollbar untuk layar laptop */}
                            <div className="scoring-modal-body flex-1 overflow-hidden px-4 py-3 sm:p-3 md:p-4">
                                <div className="mx-auto max-w-4xl space-y-2.5">
                                    {missingCriteriaIds.length > 0 ? (
                                        <div role="alert" aria-live="assertive" className="flex items-start gap-2.5 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2.5 text-[13px] leading-[18px] text-rose-800 sm:py-2 sm:text-xs">
                                            <i className="fa-solid fa-triangle-exclamation mt-0.5 text-rose-500" aria-hidden="true"></i>
                                            <div>
                                                <p className="font-extrabold">Penilaian belum lengkap</p>
                                                <p>Isi nilai: {activeCriteria.filter(criterion => missingCriteriaIds.includes(criterion.id)).map(criterion => criterion.label).join(', ')}.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-2.5 rounded-xl border border-purple-100 bg-purple-50/70 px-3 py-2.5 text-[13px] leading-[18px] text-slate-600 sm:items-center sm:py-2 sm:text-xs">
                                            <i className="fa-solid fa-circle-info text-purple-500" aria-hidden="true"></i>
                                            <p>Geser slider atau ketik nilai. Total dihitung otomatis.</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                        {activeCriteria.map((c, index) => {
                                            const maxScore = activePeserta.kategori === 'Tendangan Penalti' ? 3 : 100;
                                            const currentScore = tempNilai[c.id] || 0;
                                            const guideScores = maxScore === 3 ? [0, 1, 2, 3] : [0, 25, 50, 75, 100];
                                            const criteriaCount = activeCriteria.length;
                                            const isMhqLastCriterion = activePeserta.kategori === 'MHQ' && index === criteriaCount - 1;
                                            const placeBesideTotal = criteriaCount % 2 === 0 && index === criteriaCount - 1;
                                            const isMissing = missingCriteriaIds.includes(c.id);
                                            const accent = criteriaAccentStyles[index % criteriaAccentStyles.length];
                                            return (
                                                <div
                                                    key={c.id}
                                                    id={`criterion-${c.id}`}
                                                    className={`rounded-[14px] border border-l-4 bg-white p-2.5 shadow-sm transition-colors sm:rounded-xl sm:border-l sm:p-3 ${isMissing ? 'border-rose-400 border-l-rose-500 ring-2 ring-rose-100 sm:border-l-rose-400' : `border-slate-200 ${accent.border}`} ${isMhqLastCriterion ? 'sm:col-start-1 sm:row-start-3' : placeBesideTotal ? 'sm:col-start-1' : ''}`}
                                                >
                                                    <div className="flex items-center gap-2 sm:gap-2.5">
                                                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold sm:h-8 sm:w-8 sm:bg-purple-50 sm:text-[13px] sm:text-purple-600 ${accent.soft} ${accent.text}`}>
                                                            {index + 1}
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 sm:flex-nowrap sm:justify-between sm:gap-2">
                                                                <label htmlFor={`nilai-${c.id}`} className="text-[13px] font-extrabold uppercase leading-[18px] tracking-[0.025em] text-slate-900 sm:text-xs sm:leading-tight">{c.label}</label>
                                                                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase sm:rounded-md sm:font-extrabold ${accent.soft} ${accent.text}`}>Bobot {c.weight}%</span>
                                                                {isMissing && <span className="shrink-0 rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-rose-600 sm:hidden">Belum diisi</span>}
                                                            </div>
                                                            <p className="mt-0.5 hidden truncate text-[10px] text-slate-500 sm:block" title={c.indicator}>{c.indicator}</p>
                                                        </div>
                                                        <div className="flex shrink-0 items-center gap-1">
                                                            <input
                                                                id={`nilai-${c.id}`}
                                                                type="number"
                                                                inputMode="numeric"
                                                                min={0}
                                                                max={maxScore}
                                                                value={currentScore}
                                                                onChange={(event) => {
                                                                    const value = Math.min(maxScore, Math.max(0, Number(event.target.value) || 0));
                                                                    setTempNilai(previous => ({ ...previous, [c.id]: value }));
                                                                    markCriterionFilled(c.id);
                                                                }}
                                                                className="h-11 w-16 rounded-xl border-2 border-slate-200 bg-slate-50 text-center text-xl font-bold text-slate-900 outline-none focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100 sm:h-10 sm:rounded-lg sm:font-black sm:text-slate-800"
                                                            />
                                                            <span className="text-[10px] font-bold text-slate-400">/{maxScore}</span>
                                                        </div>
                                                    </div>
                                                    <p className="mt-2 text-xs leading-[18px] text-slate-600 sm:hidden">{c.indicator}</p>
                                                    <div className="mt-1 flex min-h-9 items-center sm:mt-2.5 sm:min-h-0">
                                                        <input
                                                            aria-label={`Nilai ${c.label}`}
                                                            type="range"
                                                            min={0}
                                                            max={maxScore}
                                                            step={1}
                                                            value={currentScore}
                                                            onInput={(event) => {
                                                                const value = Number(event.currentTarget.value);
                                                                queueSliderValue(c.id, value);
                                                            }}
                                                            onPointerUp={(event) => {
                                                                finishSliderInteraction(c.id, Number(event.currentTarget.value), guideScores, maxScore);
                                                            }}
                                                            onKeyUp={(event) => {
                                                                finishSliderInteraction(c.id, Number(event.currentTarget.value), guideScores, maxScore);
                                                            }}
                                                            className="scoring-range"
                                                            style={{ '--slider-color': accent.color, '--slider-progress': `${(currentScore / maxScore) * 100}%` } as React.CSSProperties}
                                                        />
                                                    </div>
                                                    <div className="flex items-start justify-between gap-1 px-0.5 sm:mt-1 sm:gap-0">
                                                        {guideScores.map(score => {
                                                            const isActiveGuide = currentScore === score;
                                                            return (
                                                                <button
                                                                    key={score}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setTempNilai(previous => ({ ...previous, [c.id]: score }));
                                                                        markCriterionFilled(c.id);
                                                                    }}
                                                                    aria-label={`Atur ${c.label} menjadi ${score}`}
                                                                    className={`min-h-10 flex-1 touch-manipulation rounded-lg px-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 sm:min-h-0 sm:min-w-7 sm:flex-none sm:rounded-md sm:py-0.5 sm:text-[9px] sm:font-bold ${isActiveGuide ? `${accent.soft} ${accent.text} sm:bg-purple-100 sm:text-purple-700` : 'bg-slate-50 text-slate-500 sm:bg-transparent sm:text-slate-400'}`}
                                                                >
                                                                    {score}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        <div className={`hidden items-center justify-between rounded-xl border border-purple-200 bg-purple-50/70 p-4 shadow-sm sm:flex ${activePeserta.kategori === 'MHQ' ? 'sm:col-start-2 sm:row-start-2 sm:row-span-2' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-purple-600 shadow-sm">
                                                    <i className="fa-solid fa-calculator" aria-hidden="true"></i>
                                                </span>
                                                <div>
                                                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-purple-500">Hasil Otomatis</p>
                                                    <p className="text-sm font-extrabold text-slate-800">Total Nilai</p>
                                                </div>
                                            </div>
                                            <div className="flex items-end gap-1">
                                                <span className="text-4xl font-black leading-none text-purple-700">
                                                    {Math.round(activeCriteria.reduce((acc, c) => acc + ((tempNilai[c.id] || 0) * c.weight / 100), 0))}
                                                </span>
                                                <span className="pb-0.5 text-[10px] font-bold text-purple-400">/{activePeserta.kategori === 'Tendangan Penalti' ? 3 : 100}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-[14px] border border-slate-200 bg-white p-2.5 shadow-sm sm:rounded-xl sm:p-3">
                                        <button type="button" onClick={() => setIsMobileNotesOpen(open => !open)} aria-expanded={isMobileNotesOpen} aria-controls="catatan-juri" className="flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-1 text-left sm:hidden">
                                            <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                                <i className="fa-solid fa-pen-nib text-purple-500" aria-hidden="true"></i>
                                                Catatan Juri <span className="font-medium text-slate-400">(opsional)</span>
                                            </span>
                                            <i className={`fa-solid fa-chevron-down text-xs text-slate-400 transition-transform ${isMobileNotesOpen ? 'rotate-180' : ''}`} aria-hidden="true"></i>
                                        </button>
                                        <label htmlFor="catatan-juri" className="hidden items-center gap-2 text-sm font-extrabold text-slate-800 sm:flex">
                                            <i className="fa-solid fa-pen-nib text-purple-500" aria-hidden="true"></i>
                                            Catatan Juri <span className="font-medium text-slate-400">(opsional)</span>
                                        </label>
                                        <textarea
                                            id="catatan-juri"
                                            value={tempCatatan}
                                            onChange={(event) => setTempCatatan(event.target.value)}
                                            placeholder="Tulis catatan singkat untuk peserta..."
                                            rows={2}
                                            className={`${isMobileNotesOpen ? 'block' : 'hidden'} mt-2 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-relaxed text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100 sm:block sm:py-2 sm:text-xs`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Aksi selalu terlihat */}
                            <div className="relative z-20 min-h-16 shrink-0 border-t border-slate-200 bg-white px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:min-h-0 sm:py-3 md:px-6">
                                <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 sm:justify-end">
                                    <div className="flex items-baseline gap-2 sm:hidden">
                                        <p className="text-xs font-medium text-slate-500">Total</p>
                                        <p className="text-[22px] font-bold leading-none text-purple-700">{Math.round(activeCriteria.reduce((acc, c) => acc + ((tempNilai[c.id] || 0) * c.weight / 100), 0))}<span className="ml-1 text-[11px] font-medium text-purple-400">/100</span></p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={requestCloseModal}
                                            className="hidden min-h-11 flex-1 rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 sm:block sm:flex-none"
                                        >
                                            Batal
                                        </button>
                                        <button type="button" onClick={requestSaveConfirmation} disabled={isSaving}
                                            className="min-h-11 flex-1 touch-manipulation rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-purple-500/20 transition-colors active:from-purple-700 active:to-indigo-700 disabled:opacity-50 sm:flex-none sm:px-6 sm:py-2.5 sm:font-bold sm:hover:from-purple-700 sm:hover:to-indigo-700">
                                            <i className="fa-solid fa-check mr-2" aria-hidden="true"></i>
                                            {isSaving ? 'Menyimpan...' : 'Simpan Nilai'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showDiscardConfirm && (
                    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                        <motion.button type="button" aria-label="Kembali ke form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDiscardConfirm(false)} className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} role="alertdialog" aria-modal="true" className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><i className="fa-solid fa-triangle-exclamation"></i></span>
                            <h3 className="mt-4 text-lg font-extrabold text-slate-900">Perubahan belum disimpan</h3>
                            <p className="mt-1 text-sm leading-relaxed text-slate-500">Nilai atau catatan yang baru diubah akan hilang jika form ditutup.</p>
                            <div className="mt-5 flex justify-end gap-2">
                                <button type="button" onClick={() => setShowDiscardConfirm(false)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100">Lanjut Mengisi</button>
                                <button type="button" onClick={() => { dismissModal(); }} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700">Buang Perubahan</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSaveConfirm && (
                    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
                        <motion.button type="button" aria-label="Batalkan penyimpanan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSaveConfirm(false)} className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} role="alertdialog" aria-modal="true" className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700"><i className="fa-solid fa-clipboard-check"></i></span>
                            <h3 className="mt-4 text-lg font-extrabold text-slate-900">Simpan penilaian?</h3>
                            <p className="mt-1 text-sm leading-relaxed text-slate-500">
                                Nilai akhir peserta ini adalah <strong className="text-slate-800">{Math.round(activeCriteria.reduce((total, criterion) => total + ((tempNilai[criterion.id] || 0) * criterion.weight / 100), 0))}</strong>.
                                {activeCriteria.some(criterion => touchedCriteria.has(criterion.id) && tempNilai[criterion.id] === 0) && ' Terdapat kriteria bernilai 0, pastikan nilai tersebut memang benar.'}
                            </p>
                            <div className="mt-5 flex justify-end gap-2">
                                <button type="button" onClick={() => setShowSaveConfirm(false)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100">Periksa Lagi</button>
                                <button type="button" onClick={() => { setShowSaveConfirm(false); void handleSaveScore(); }} className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700">Ya, Simpan</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
