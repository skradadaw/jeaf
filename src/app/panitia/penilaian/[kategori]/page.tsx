'use client';

import { useState, useMemo, use, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

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
};

type NilaiJuri = {
    id?: string;
    juri_id: string;
    detail_nilai: Record<string, number>;
    nilai_total: number;
    catatan: string;
    status: 'draft' | 'final';
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

export default function CategoryPenilaianPage({ params }: { params: Promise<{ kategori: string }> }) {
    const unwrappedParams = use(params);
    const currentCategoryName = categoryMap[unwrappedParams.kategori] || 'Tidak Diketahui';
    
    const [pesertaList, setPesertaList] = useState<any[]>([]);
    const [juriList, setJuriList] = useState<Juri[]>([]);
    const [selectedJuriId, setSelectedJuriId] = useState('');
    const [isJuriMenuOpen, setIsJuriMenuOpen] = useState(false);
    const [pendingJuriId, setPendingJuriId] = useState<string | null>(null);
    const [databaseError, setDatabaseError] = useState('');
    const [loading, setLoading] = useState(true);
    const confirmJuriButtonRef = useRef<HTMLButtonElement>(null);
    
    useEffect(() => {
        const fetchPeserta = async () => {
            setLoading(true);
            setDatabaseError('');

            const { data: assignments, error: assignmentError } = await supabase
                .from('juri_kategori')
                .select('juri_id')
                .eq('cabang_lomba', currentCategoryName);

            if (assignmentError) {
                setDatabaseError('Tabel multi-juri belum tersedia. Jalankan pembaruan supabase_schema.sql di Supabase SQL Editor.');
                setPesertaList([]);
                setJuriList([]);
                setLoading(false);
                return;
            }

            const juriIds = assignments?.map(item => item.juri_id) || [];
            const { data: judges, error: judgesError } = juriIds.length > 0
                ? await supabase.from('juri').select('id, kode, nama').in('id', juriIds).eq('aktif', true).order('kode')
                : { data: [], error: null };

            if (judgesError) {
                setDatabaseError('Data juri gagal dimuat: ' + judgesError.message);
            }

            const activeJudges = (judges || []) as Juri[];
            setJuriList(activeJudges);
            const storageKey = `jinga-juri-${unwrappedParams.kategori}`;
            const savedJuriId = window.localStorage.getItem(storageKey);
            const restoredJuriId = activeJudges.some(juri => juri.id === savedJuriId)
                ? savedJuriId!
                : '';
            setSelectedJuriId(restoredJuriId);

            const { data, error } = await supabase
                .from('pendaftar')
                .select('*')
                .eq('cabang_lomba', currentCategoryName)
                .order('created_at', { ascending: true });
                
            if (!error && data) {
                const participantIds = data.map(p => p.id);
                const { data: scoreRows, error: scoreError } = participantIds.length > 0
                    ? await supabase
                        .from('penilaian_juri')
                        .select('id, pendaftar_id, juri_id, detail_nilai, nilai_total, catatan, status')
                        .in('pendaftar_id', participantIds)
                    : { data: [], error: null };

                if (scoreError) {
                    setDatabaseError('Nilai juri gagal dimuat: ' + scoreError.message);
                }

                // Map the DB data to include local scoring state
                const mapped = data.map((p, index) => {
                    const currentCriteria = criteriaConfig[p.cabang_lomba] || criteriaConfig['default'];
                    const initialKriteria: Record<string, number> = {};
                    currentCriteria.forEach(c => initialKriteria[c.id] = 0);
                    const nilaiJuri = ((scoreRows || []) as Array<NilaiJuri & { pendaftar_id: string }>)
                        .filter(score => score.pendaftar_id === p.id);
                    const nilaiFinal = nilaiJuri.filter(score => score.status === 'final');
                    const lengkap = activeJudges.length > 0 && nilaiFinal.length === activeJudges.length;
                    const juriBelumMenilai = activeJudges.filter(juri => !nilaiFinal.some(score => score.juri_id === juri.id));
                    const nilaiRataRata = lengkap
                        ? Math.round(nilaiFinal.reduce((total, score) => total + score.nilai_total, 0) / nilaiFinal.length)
                        : null;
                    
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
                            : nilaiFinal.length > 0
                                ? `Menunggu ${juriBelumMenilai.map(juri => juri.nama).join(', ')}`
                                : 'Belum Dinilai',
                        total_nilai: nilaiRataRata,
                        nilai_juri: nilaiJuri,
                        initial_kriteria: initialKriteria,
                    };
                });
                setPesertaList(mapped);
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
    }, [currentCategoryName, unwrappedParams.kategori]);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('Semua Status');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activePeserta, setActivePeserta] = useState<any>(null);
    const [tempNilai, setTempNilai] = useState<Record<string, number>>({});
    const [tempCatatan, setTempCatatan] = useState('');

    // --- Export Excel ---
    const handleExportExcel = (kategoriSlug: string) => {
        try {
            if (pesertaList.length === 0) {
                alert('Tidak ada data peserta untuk kategori ini.');
                return;
            }

            const headers = [
                'No', 'Kode Peserta', 'Nama Peserta', 'Asal Sekolah', 'Kategori',
                ...juriList.flatMap(juri => [`Nilai ${juri.nama}`, `Catatan ${juri.nama}`]),
                'Status Nilai', 'Total Nilai Akhir',
            ];
            const csvRows = [headers.join(';')];

            const sortedData = [...pesertaList].sort((a, b) => (b.total_nilai ?? -1) - (a.total_nilai ?? -1));

            sortedData.forEach((p, index) => {
                const juryColumns = juriList.flatMap(juri => {
                    const score = (p.nilai_juri as NilaiJuri[]).find(item => item.juri_id === juri.id && item.status === 'final');
                    return [score?.nilai_total ?? '', `"${(score?.catatan || '').replace(/"/g, '""')}"`];
                });
                csvRows.push([
                    index + 1,
                    p.no_peserta,
                    `"${p.nama_lengkap.replace(/"/g, '""')}"`,
                    `"${p.asal.replace(/"/g, '""')}"`,
                    `"${p.kategori}"`,
                    ...juryColumns,
                    p.status_nilai,
                    p.total_nilai ?? '',
                ].join(';'));
            });

            const csvContent = '\ufeff' + csvRows.join('\n'); // Add BOM for Excel UTF-8
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Hasil_Penilaian_${kategoriSlug.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err: unknown) {
            alert('Gagal mengekspor data: ' + (err instanceof Error ? err.message : 'Terjadi kesalahan'));
        }
    };

    // --- Filtering ---
    const filteredPeserta = useMemo(() => {
        const filtered = pesertaList.filter(p => {
            const normalizedQuery = searchQuery.toLowerCase();
            const matchSearch = p.nama_lengkap.toLowerCase().includes(normalizedQuery)
                || p.no_peserta.toLowerCase().includes(normalizedQuery)
                || String(p.nomor_urut).includes(normalizedQuery);
            const matchStatus = filterStatus === 'Semua Status'
                || (filterStatus === 'Belum Dinilai' && p.status_nilai === 'Belum Dinilai')
                || (filterStatus === 'Dalam Proses' && p.status_nilai.startsWith('Menunggu'))
                || (filterStatus === 'Lengkap' && p.status_nilai === 'Penilaian Lengkap');
            return matchSearch && matchStatus;
        });

        // Setelah pencarian/filter diterapkan, nomor urut yang terlihat tetap dimulai dari 1.
        return filtered.map((peserta, index) => ({
            ...peserta,
            nomor_urut: index + 1,
        }));
    }, [pesertaList, searchQuery, filterStatus]);

    // --- Stats ---
    const stats = useMemo(() => {
        const total = pesertaList.length;
        const dinilai = pesertaList.filter(p => p.status_nilai === 'Penilaian Lengkap').length;
        const belum = total - dinilai;
        return { total, dinilai, belum };
    }, [pesertaList]);

    // --- Handlers ---
    const applyJuriChange = (nextJuriId: string) => {
        setSelectedJuriId(nextJuriId);
        window.localStorage.setItem(`jinga-juri-${unwrappedParams.kategori}`, nextJuriId);
        setIsModalOpen(false);
        setPendingJuriId(null);
    };

    const handleJuriChange = (nextJuriId: string) => {
        if (nextJuriId === selectedJuriId) return;
        setIsJuriMenuOpen(false);

        if (!selectedJuriId) {
            applyJuriChange(nextJuriId);
            return;
        }

        setPendingJuriId(nextJuriId);
    };

    useEffect(() => {
        if (!pendingJuriId) return;

        confirmJuriButtonRef.current?.focus();
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setPendingJuriId(null);
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [pendingJuriId]);

    const openScoringModal = (peserta: any) => {
        if (!selectedJuriId) {
            alert('Pilih juri aktif terlebih dahulu.');
            return;
        }
        const existingScore = (peserta.nilai_juri as NilaiJuri[]).find(score => score.juri_id === selectedJuriId);
        setActivePeserta(peserta);
        setTempNilai({ ...(existingScore?.detail_nilai || peserta.initial_kriteria) });
        setTempCatatan(existingScore?.catatan || '');
        setIsModalOpen(true);
    };

    const handleSaveScore = async () => {
        const activeCriteria = criteriaConfig[activePeserta.kategori] || criteriaConfig['default'];
        let finalScore = 0;
        
        activeCriteria.forEach(c => {
            const score = tempNilai[c.id] || 0;
            finalScore += score * (c.weight / 100);
        });
        
        const roundedScore = Math.round(finalScore);
        
        if (!selectedJuriId) return;

        const savedScore: NilaiJuri = {
            juri_id: selectedJuriId,
            detail_nilai: { ...tempNilai },
            nilai_total: roundedScore,
            catatan: tempCatatan,
            status: 'final',
        };

        const { error } = await supabase
            .from('penilaian_juri')
            .upsert({
                pendaftar_id: activePeserta.id,
                ...savedScore,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'pendaftar_id,juri_id' });
            
        if (error) {
            alert('Gagal menyimpan nilai ke database: ' + error.message);
            return;
        }
        
        setPesertaList(prev => prev.map(p => {
            if (p.id === activePeserta.id) {
                const otherScores = (p.nilai_juri as NilaiJuri[]).filter(score => score.juri_id !== selectedJuriId);
                const nilaiJuri = [...otherScores, savedScore];
                const nilaiFinal = nilaiJuri.filter(score => score.status === 'final');
                const lengkap = juriList.length > 0 && nilaiFinal.length === juriList.length;
                const juriBelumMenilai = juriList.filter(juri => !nilaiFinal.some(score => score.juri_id === juri.id));
                return {
                    ...p,
                    status_nilai: lengkap
                        ? 'Penilaian Lengkap'
                        : `Menunggu ${juriBelumMenilai.map(juri => juri.nama).join(', ')}`,
                    total_nilai: lengkap
                        ? Math.round(nilaiFinal.reduce((total, score) => total + score.nilai_total, 0) / nilaiFinal.length)
                        : null,
                    nilai_juri: nilaiJuri,
                };
            }
            return p;
        }));
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
            {databaseError && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800 flex items-start gap-3">
                    <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
                    <span>{databaseError}</span>
                </div>
            )}

            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-purple-500/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-purple-200 mb-1">Juri Aktif</p>
                    <h2 className="text-xl font-extrabold">Pilih identitas sebelum memberikan nilai</h2>
                    <p className="text-sm text-purple-100 mt-1">Nilai disimpan terpisah dan tidak menimpa penilaian juri lain.</p>
                </div>
                <div className="relative w-full md:w-80 shrink-0 z-20">
                    <button
                        type="button"
                        onClick={() => setIsJuriMenuOpen(open => !open)}
                        disabled={juriList.length === 0}
                        aria-haspopup="listbox"
                        aria-expanded={isJuriMenuOpen}
                        className="group relative z-20 flex min-h-14 w-full items-center gap-3 rounded-2xl border border-white/50 bg-white px-4 py-3 text-left shadow-lg shadow-indigo-950/10 transition-colors hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                            <i className="fa-solid fa-user-pen" aria-hidden="true"></i>
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Identitas aktif</span>
                            <span className="block truncate text-sm font-extrabold text-slate-800">
                                {juriList.find(juri => juri.id === selectedJuriId)?.nama || 'Pilih identitas juri'}
                            </span>
                        </span>
                        <i className={`fa-solid fa-chevron-down text-slate-400 transition-transform ${isJuriMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true"></i>
                    </button>

                    <AnimatePresence>
                        {isJuriMenuOpen && (
                            <>
                                <button
                                    type="button"
                                    aria-label="Tutup pilihan juri"
                                    onClick={() => setIsJuriMenuOpen(false)}
                                    className="fixed inset-0 z-10 cursor-default"
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                                    transition={{ duration: 0.16 }}
                                    role="listbox"
                                    aria-label="Pilih identitas juri"
                                    className="absolute right-0 top-[calc(100%+10px)] z-20 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-slate-800 shadow-2xl shadow-slate-900/20"
                                >
                                    <div className="px-3 pb-2 pt-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                                        Juri {currentCategoryName}
                                    </div>
                                    <div className="space-y-1">
                                        {juriList.map(juri => {
                                            const isSelected = juri.id === selectedJuriId;
                                            return (
                                                <button
                                                    key={juri.id}
                                                    type="button"
                                                    role="option"
                                                    aria-selected={isSelected}
                                                    onClick={() => handleJuriChange(juri.id)}
                                                    className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${isSelected ? 'bg-purple-50 text-purple-700' : 'hover:bg-slate-50 text-slate-700'}`}
                                                >
                                                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                        {juri.kode.split('-').pop()}
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-sm font-bold">{juri.nama}</span>
                                                        <span className="block font-mono text-[10px] text-slate-400">{juri.kode}</span>
                                                    </span>
                                                    {isSelected && <i className="fa-solid fa-circle-check text-purple-600" aria-hidden="true"></i>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-100 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 mb-1">Total Peserta ({currentCategoryName})</p>
                            <h3 className="text-3xl font-bold text-slate-800">{stats.total}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 text-xl">
                            <i className="fa-solid fa-users"></i>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 mb-1">Penilaian Lengkap</p>
                            <h3 className="text-3xl font-bold text-slate-800">{stats.dinilai}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-xl">
                            <i className="fa-solid fa-clipboard-check"></i>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-100 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-500 mb-1">Belum Lengkap</p>
                            <h3 className="text-3xl font-bold text-slate-800">{stats.belum}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 text-xl">
                            <i className="fa-solid fa-hourglass-half"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Area */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex w-full flex-col sm:flex-row gap-2 md:w-auto">
                    <div className="relative w-full md:w-80">
                        <i className="fa-solid fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input
                            type="text"
                            placeholder={`Cari peserta di ${currentCategoryName}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        />
                    </div>
                    <button 
                        onClick={() => handleExportExcel(unwrappedParams.kategori)}
                        className="flex shrink-0 items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-500/20 active:scale-[0.98]"
                    >
                        <i className="fa-solid fa-file-excel"></i>
                        Export Excel
                    </button>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
                    {['Semua Status', 'Belum Dinilai', 'Dalam Proses', 'Lengkap'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${filterStatus === status ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200/60 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-bold">No. Urut &amp; Kode Peserta</th>
                                <th className="px-6 py-4 font-bold">Informasi Peserta</th>
                                <th className="px-6 py-4 font-bold text-center">Status</th>
                                <th className="px-6 py-4 font-bold text-center">Nilai Akhir</th>
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
                                                {peserta.status_nilai === 'Penilaian Lengkap' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/50">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                        Penilaian Lengkap
                                                    </span>
                                                ) : peserta.status_nilai.startsWith('Menunggu') ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/50">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                        {peserta.status_nilai}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200/50">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                                        Belum Dinilai
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {peserta.total_nilai !== null ? (
                                                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white font-bold shadow-sm">
                                                        {peserta.total_nilai}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 font-medium">-</span>
                                                )}
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

            {/* Konfirmasi pergantian identitas juri */}
            <AnimatePresence>
                {pendingJuriId && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <motion.button
                            type="button"
                            aria-label="Batalkan pergantian juri"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setPendingJuriId(null)}
                            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.94, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 10 }}
                            transition={{ duration: 0.2 }}
                            role="alertdialog"
                            aria-modal="true"
                            aria-labelledby="judul-konfirmasi-juri"
                            aria-describedby="deskripsi-konfirmasi-juri"
                            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl shadow-slate-950/30"
                        >
                            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 px-6 pb-8 pt-6 text-white">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                                    <i className="fa-solid fa-user-shield text-xl" aria-hidden="true"></i>
                                </div>
                                <h3 id="judul-konfirmasi-juri" className="text-xl font-extrabold">Ganti identitas juri?</h3>
                                <p id="deskripsi-konfirmasi-juri" className="mt-2 text-sm leading-relaxed text-purple-100">
                                    Pastikan perangkat ini benar-benar akan digunakan oleh juri yang dipilih. Nilai berikutnya akan tercatat atas identitas tersebut.
                                </p>
                            </div>

                            <div className="-mt-3 px-6 pb-6">
                                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/60">
                                    <div className="flex items-center gap-3">
                                        <div className="min-w-0 flex-1 rounded-xl bg-slate-50 p-3">
                                            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Dari</span>
                                            <span className="block truncate text-sm font-bold text-slate-700">{juriList.find(juri => juri.id === selectedJuriId)?.nama}</span>
                                        </div>
                                        <i className="fa-solid fa-arrow-right text-purple-500" aria-hidden="true"></i>
                                        <div className="min-w-0 flex-1 rounded-xl bg-purple-50 p-3 ring-1 ring-purple-100">
                                            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-purple-400">Menjadi</span>
                                            <span className="block truncate text-sm font-bold text-purple-700">{juriList.find(juri => juri.id === pendingJuriId)?.nama}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setPendingJuriId(null)}
                                        className="min-h-11 rounded-xl px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                                    >
                                        Tetap gunakan juri ini
                                    </button>
                                    <button
                                        ref={confirmJuriButtonRef}
                                        type="button"
                                        onClick={() => applyJuriChange(pendingJuriId)}
                                        className="min-h-11 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-500/25 transition-colors hover:from-purple-700 hover:to-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-300"
                                    >
                                        Ya, ganti juri
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Scoring Modal */}
            <AnimatePresence>
                {isModalOpen && activePeserta && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        ></motion.div>
                        
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 md:p-6 text-white shrink-0 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">{activePeserta.nama_lengkap}</h2>
                                            <span className="px-2.5 py-1 bg-white/20 rounded-full text-xs font-bold backdrop-blur-md border border-white/20 shadow-sm">
                                                No. {activePeserta.nomor_urut}
                                            </span>
                                            <span className="px-2.5 py-1 bg-white/10 rounded-full text-xs font-mono font-bold backdrop-blur-md border border-white/20 shadow-sm">
                                                {activePeserta.no_peserta}
                                            </span>
                                        </div>
                                         <p className="text-purple-100 text-sm flex items-center gap-2 font-medium">
                                            <span className="flex items-center gap-1.5"><i className="fa-solid fa-user-pen opacity-70"></i> {juriList.find(juri => juri.id === selectedJuriId)?.nama}</span>
                                            <span className="text-white/30">&bull;</span>
                                            <span className="flex items-center gap-1.5"><i className="fa-solid fa-masks-theater opacity-70"></i> {activePeserta.kategori}</span>
                                            <span className="text-white/30">&bull;</span> 
                                            <span className="flex items-center gap-1.5"><i className="fa-solid fa-school opacity-70"></i> {activePeserta.asal}</span>
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => setIsModalOpen(false)}
                                        className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors shrink-0"
                                    >
                                        <i className="fa-solid fa-xmark text-lg"></i>
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body Landscape */}
                            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden bg-white">
                                {/* Left Column: Criteria */}
                                <div className="w-full lg:w-[60%] p-5 md:p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-100 space-y-5 relative">
                                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 flex gap-2.5 text-blue-800 text-xs md:text-sm shadow-sm">
                                        <i className="fa-solid fa-circle-info mt-0.5 text-blue-500"></i>
                                        <p>Geser *slider* untuk memberikan nilai <strong>0 hingga 100</strong>. Bobot dihitung otomatis.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(criteriaConfig[activePeserta.kategori] || criteriaConfig['default']).map((c, index, arr) => {
                                            const isLastOdd = index === arr.length - 1 && arr.length % 2 !== 0;
                                            return (
                                            <div key={c.id} className={`group bg-white p-4 rounded-xl border border-slate-200 hover:border-purple-300 transition-all shadow-sm hover:shadow-md ${isLastOdd ? 'md:col-span-2' : ''}`}>
                                                <div className="flex justify-between mb-4 items-start">
                                                    <div className="flex flex-col pr-3">
                                                        <label className="font-bold text-slate-800 flex items-start gap-2 text-[14px]">
                                                            <span className="w-6 h-6 rounded-md bg-purple-50 flex items-center justify-center shrink-0">
                                                                <i className={`fa-solid ${c.icon} text-purple-600 text-[11px]`}></i>
                                                            </span>
                                                            <span className="leading-tight pt-0.5">{c.label}</span>
                                                        </label>
                                                        <span className="text-[11px] text-slate-500 mt-2 leading-relaxed pl-8">
                                                            {c.indicator}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col items-end justify-start min-w-[65px] shrink-0">
                                                        <span className="font-black text-3xl text-slate-800 leading-none tracking-tight">{tempNilai[c.id] || 0}</span>
                                                        <span className="text-[9px] md:text-[10px] text-slate-400 font-bold mt-1.5 uppercase tracking-wide">
                                                            Bobot {c.weight}% <br/>
                                                            <span className="text-purple-600">{( ((tempNilai[c.id] || 0) * c.weight) / 100 ).toFixed(1)}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min="0" max="100" 
                                                    value={tempNilai[c.id] || 0}
                                                    onChange={(e) => setTempNilai({...tempNilai, [c.id]: parseInt(e.target.value)})}
                                                    className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-purple-600 outline-none focus:ring-2 focus:ring-purple-500/30 hover:bg-slate-200 transition-colors"
                                                />
                                            </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Right Column: Notes & Total */}
                                <div className="w-full lg:w-[40%] flex flex-col bg-slate-50">
                                    <div className="flex-1 p-5 md:p-6 overflow-y-auto">
                                        <label className="font-bold text-slate-800 flex items-center gap-2 mb-3.5 text-[14px]">
                                            <span className="w-7 h-7 rounded-lg bg-slate-200/50 flex items-center justify-center shrink-0">
                                                <i className="fa-solid fa-pen-nib text-slate-500 text-xs"></i>
                                            </span>
                                            Catatan Juri
                                        </label>
                                        <textarea
                                            value={tempCatatan}
                                            onChange={(e) => setTempCatatan(e.target.value)}
                                            placeholder="Tulis catatan, evaluasi, atau komentar..."
                                            className="w-full p-4 bg-white border border-slate-200 rounded-xl text-[13px] leading-relaxed focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 min-h-[120px] lg:min-h-[200px] h-full resize-none transition-all shadow-sm text-slate-700 placeholder:text-slate-400"
                                        ></textarea>
                                    </div>
                                    
                                    <div className="p-5 md:p-6 bg-white border-t border-slate-200/60 flex flex-col items-center justify-center text-center">
                                        <span className="font-extrabold text-slate-400 uppercase tracking-[0.2em] text-[10px] mb-1.5">Total Nilai Akhir</span>
                                        <span className="text-[64px] font-black bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent drop-shadow-sm leading-none">
                                            {Math.round((criteriaConfig[activePeserta.kategori] || criteriaConfig['default']).reduce((acc, c) => acc + ((tempNilai[c.id] || 0) * c.weight / 100), 0))}
                                        </span>
                                        <span className="text-[11px] text-slate-400 font-medium mt-3 px-3.5 py-1 bg-slate-100 rounded-full">Dihitung otomatis dari bobot</span>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 md:px-6 md:py-4 border-t border-slate-100 bg-white flex justify-end gap-3 shrink-0">
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl font-bold text-[14px] text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={handleSaveScore}
                                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-[14px] shadow-md shadow-purple-500/20 transition-all active:scale-[0.98] flex items-center gap-2"
                                >
                                    <i className="fa-solid fa-check"></i>
                                    Simpan Penilaian
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
