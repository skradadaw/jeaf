'use client';

import { useState, useMemo, use, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const categoriesList = [
    { name: 'Adzan', slug: 'adzan', icon: 'fa-microphone' },
    { name: 'Fashion Show', slug: 'fashion-show', icon: 'fa-person-dress' },
    { name: 'MHQ', slug: 'mhq', icon: 'fa-book-quran' },
    { name: 'Karya Kolase', slug: 'karya-kolase', icon: 'fa-palette' },
    { name: 'Mewarnai', slug: 'mewarnai', icon: 'fa-fill-drip' },
    { name: 'Tendangan Penalti', slug: 'tendangan-penalti', icon: 'fa-futbol' },
    { name: 'Menyanyi Solo', slug: 'menyanyi-solo', icon: 'fa-music' },
];

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
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchPeserta = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('pendaftar')
                .select('*')
                .eq('cabang_lomba', currentCategoryName)
                .order('created_at', { ascending: false });
                
            if (!error && data) {
                // Map the DB data to include local scoring state
                const mapped = data.map((p) => {
                    const currentCriteria = criteriaConfig[p.cabang_lomba] || criteriaConfig['default'];
                    const initialKriteria: Record<string, number> = {};
                    currentCriteria.forEach(c => initialKriteria[c.id] = 0);
                    
                    return {
                        id: p.id,
                        no_peserta: p.no_peserta || p.id.split('-')[0].toUpperCase(),
                        nama_lengkap: p.nama_anak,
                        asal: p.asal_sekolah,
                        kategori: p.cabang_lomba,
                        status_nilai: p.nilai_total !== null && p.nilai_total !== undefined ? 'Sudah Dinilai' : 'Belum Dinilai',
                        total_nilai: p.nilai_total || 0,
                        kriteria: p.detail_nilai || initialKriteria,
                        catatan_juri: p.catatan_juri || ''
                    };
                });
                setPesertaList(mapped);
            }
            setLoading(false);
        };
        
        if (currentCategoryName !== 'Tidak Diketahui') {
            fetchPeserta();
        } else {
            setLoading(false);
        }
    }, [currentCategoryName]);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('Semua Status'); // Semua Status, Belum Dinilai, Sudah Dinilai
    const [exportKategori, setExportKategori] = useState('Semua');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activePeserta, setActivePeserta] = useState<any>(null);
    const [tempNilai, setTempNilai] = useState<Record<string, number>>({});
    const [tempCatatan, setTempCatatan] = useState('');

    // --- Export Excel ---
    const handleExportExcel = async (kategoriSlug: string) => {
        try {
            // Ambil data ASCENDING agar urutan (001, 002) sesuai dengan waktu pendaftaran
            let query = supabase.from('pendaftar').select('*').order('created_at', { ascending: true });
            
            if (kategoriSlug !== 'Semua') {
                const targetCategory = categoryMap[kategoriSlug] || kategoriSlug;
                query = query.eq('cabang_lomba', targetCategory);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            if (!data || data.length === 0) {
                alert('Tidak ada data peserta untuk kategori ini.');
                return;
            }

            const headers = ['No', 'ID Pendaftar', 'Nama Peserta', 'Asal Sekolah', 'Kategori', 'Status Nilai', 'Total Nilai Akhir', 'Catatan Juri'];
            const csvRows = [headers.join(';')];

            // Urutkan data berdasarkan nilai tertinggi sebelum dimasukkan ke Excel
            const sortedData = data.sort((a, b) => (b.nilai_total || 0) - (a.nilai_total || 0));

            sortedData.forEach((p, index) => {
                const no = index + 1;
                const idPendaftar = p.no_peserta || p.id.split('-')[0].toUpperCase();
                const nama = `"${(p.nama_anak || '').replace(/"/g, '""')}"`;
                const asal = `"${(p.asal_sekolah || '').replace(/"/g, '""')}"`;
                const kat = `"${p.cabang_lomba || ''}"`;
                const status = p.nilai_total !== null && p.nilai_total !== undefined ? 'Sudah Dinilai' : 'Belum Dinilai';
                const total = p.nilai_total || 0;
                const catatan = `"${(p.catatan_juri || '').replace(/"/g, '""')}"`;

                csvRows.push([no, idPendaftar, nama, asal, kat, status, total, catatan].join(';'));
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
        } catch (err: any) {
            alert('Gagal mengekspor data: ' + err.message);
        }
    };

    // --- Filtering ---
    const filteredPeserta = useMemo(() => {
        return pesertaList.filter(p => {
            const matchSearch = p.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) || p.no_peserta.toLowerCase().includes(searchQuery.toLowerCase());
            const matchStatus = filterStatus === 'Semua Status' || p.status_nilai === filterStatus;
            return matchSearch && matchStatus;
        });
    }, [pesertaList, searchQuery, filterStatus]);

    // --- Stats ---
    const stats = useMemo(() => {
        const total = pesertaList.length;
        const dinilai = pesertaList.filter(p => p.status_nilai === 'Sudah Dinilai').length;
        const belum = total - dinilai;
        return { total, dinilai, belum };
    }, [pesertaList]);

    // --- Handlers ---
    const openScoringModal = (peserta: any) => {
        setActivePeserta(peserta);
        setTempNilai({ ...peserta.kriteria });
        setTempCatatan(peserta.catatan_juri || '');
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
        
        // Simpan ke Supabase
        const { error } = await supabase
            .from('pendaftar')
            .update({
                nilai_total: roundedScore,
                detail_nilai: tempNilai,
                catatan_juri: tempCatatan
            })
            .eq('id', activePeserta.id);
            
        if (error) {
            alert('Gagal menyimpan nilai ke database: ' + error.message);
            return;
        }
        
        setPesertaList(prev => prev.map(p => {
            if (p.id === activePeserta.id) {
                return {
                    ...p,
                    status_nilai: 'Sudah Dinilai',
                    total_nilai: roundedScore,
                    kriteria: { ...tempNilai },
                    catatan_juri: tempCatatan
                };
            }
            return p;
        }));
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
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
                            <p className="text-sm font-semibold text-slate-500 mb-1">Sudah Dinilai</p>
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
                            <p className="text-sm font-semibold text-slate-500 mb-1">Belum Dinilai</p>
                            <h3 className="text-3xl font-bold text-slate-800">{stats.belum}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 text-xl">
                            <i className="fa-solid fa-hourglass-half"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Tabs & Export Button */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4 overflow-hidden">
                <div className="flex overflow-x-auto hide-scrollbar w-full lg:w-auto">
                    <div className="flex gap-2 min-w-max">
                        {categoriesList.map((cat) => {
                            const isActive = currentCategoryName === cat.name;
                            return (
                                <Link 
                                    key={cat.slug} 
                                    href={`/panitia/penilaian/${cat.slug}`}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                                        isActive 
                                        ? 'bg-purple-50 text-purple-700 border border-purple-100 shadow-sm' 
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                    }`}
                                >
                                    <i className={`fa-solid ${cat.icon} ${isActive ? 'text-purple-500' : 'text-slate-400'}`}></i>
                                    {cat.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
                
                <div className="px-2 pb-2 lg:pb-0 lg:pr-2 w-full lg:w-auto shrink-0 flex items-center gap-2">
                    <select 
                        value={exportKategori}
                        onChange={(e) => setExportKategori(e.target.value)}
                        className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer w-full lg:w-40 shadow-sm"
                    >
                        <option value="Semua">Semua Kategori</option>
                        {categoriesList.map(c => (
                            <option key={c.slug} value={c.slug}>{c.name}</option>
                        ))}
                    </select>
                    <button 
                        onClick={() => handleExportExcel(exportKategori)}
                        className="w-full lg:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-500/20 active:scale-[0.98] shrink-0"
                    >
                        <i className="fa-solid fa-file-excel"></i>
                        Export
                    </button>
                </div>
            </div>

            {/* Filters Area */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
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
                <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
                    {['Semua Status', 'Belum Dinilai', 'Sudah Dinilai'].map(status => (
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
                                <th className="px-6 py-4 font-bold">No. Peserta</th>
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
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                    <i className="fa-solid fa-hashtag mr-1 text-[10px] text-slate-400"></i>
                                                    {peserta.no_peserta}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800">{peserta.nama_lengkap}</span>
                                                    <span className="text-xs text-slate-500">{peserta.asal}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {peserta.status_nilai === 'Sudah Dinilai' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/50">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                        Sudah Dinilai
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200/50">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                                        Belum Dinilai
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {peserta.status_nilai === 'Sudah Dinilai' ? (
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
                                                    <i className={`fa-solid ${peserta.status_nilai === 'Sudah Dinilai' ? 'fa-pen-to-square' : 'fa-star'}`}></i>
                                                    {peserta.status_nilai === 'Sudah Dinilai' ? 'Edit Nilai' : 'Beri Nilai'}
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
                                                {activePeserta.no_peserta}
                                            </span>
                                        </div>
                                        <p className="text-purple-100 text-sm flex items-center gap-2 font-medium">
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
