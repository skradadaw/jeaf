'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CustomDatePicker from '@/components/CustomDatePicker';
import CustomSelect from '@/components/CustomSelect';
import { supabase } from '@/lib/supabase';
import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { CABANG_LOMBA_LIST, KUOTA_PER_CABANG, PREFIX_PER_CABANG } from '@/lib/constants';

function DaftarFormContent() {
    const searchParams = useSearchParams();
    const queryLomba = searchParams.get('lomba');

    const [formData, setFormData] = useState({
        namaAnak: '',
        jenisKelamin: '',
        tempatLahir: '',
        tanggalLahir: null as Date | null,
        asalSekolah: '',
        namaWali: '',
        waWali: '',
        waGuru: '',
        lomba: '',
        minatSekolah: ''
    });

    const [fileError, setFileError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [registeredData, setRegisteredData] = useState<any>(null);
    const [lombaCounts, setLombaCounts] = useState<Record<string, number>>({});
    const [isLoadingCounts, setIsLoadingCounts] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Ambil kuota dan jumlah pendaftar real-time
    useEffect(() => {
        const fetchCounts = async () => {
            const { data, error } = await supabase
                .from('pendaftar')
                .select('cabang_lomba');

            if (!error && data) {
                const counts: Record<string, number> = {};
                data.forEach((row: any) => {
                    const c = (row.cabang_lomba || '').trim();
                    if (c) counts[c] = (counts[c] || 0) + 1;
                });
                setLombaCounts(counts);
            }
            setIsLoadingCounts(false);
        };

        fetchCounts();

        const channel = supabase
            .channel('realtime-daftar-pendaftar')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'pendaftar' },
                () => {
                    fetchCounts();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Set pilihan lomba dari URL query param jika ada
    useEffect(() => {
        if (queryLomba && KUOTA_PER_CABANG[queryLomba]) {
            setFormData(prev => ({ ...prev, lomba: queryLomba }));
        }
    }, [queryLomba]);

    const toTitleCase = (str: string) => {
        return str.replace(
            /\w\S*/g,
            (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.startsWith('0')) {
            val = val.substring(1);
        }
        if (val.startsWith('62')) {
            val = val.substring(2);
        }
        setFormData({ ...formData, [field]: val });
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>, field: string, capitalize = false) => {
        let val = e.target.value;
        if (capitalize) {
            val = toTitleCase(val);
        }
        setFormData({ ...formData, [field]: val });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFileError('');
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setFileError('Ukuran file maksimal 2MB.');
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
            if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
                setFileError('Format file harus JPG atau PNG.');
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
        }
    };

    // Validasi apakah cabang lomba yang dipilih penuh
    const selectedLombaConfig = CABANG_LOMBA_LIST.find(c => c.dbValue === formData.lomba);
    const terisiCurrent = selectedLombaConfig ? (lombaCounts[selectedLombaConfig.dbValue] || 0) : 0;
    const kuotaCurrent = selectedLombaConfig ? selectedLombaConfig.quota : 60;
    const sisaCurrent = Math.max(0, kuotaCurrent - terisiCurrent);
    const isSelectedLombaFull = Boolean(formData.lomba && sisaCurrent === 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (fileError) return;

        if (!formData.namaAnak.trim()) {
            alert('Silakan isi nama lengkap anak');
            return;
        }

        if (!formData.jenisKelamin) {
            alert('Silakan pilih jenis kelamin anak');
            return;
        }

        if (!formData.asalSekolah.trim()) {
            alert('Silakan isi asal sekolah anak');
            return;
        }

        if (!formData.tempatLahir.trim()) {
            alert('Silakan isi tempat lahir anak');
            return;
        }

        if (!formData.tanggalLahir) {
            alert('Silakan isi tanggal lahir peserta');
            return;
        }

        if (!fileInputRef.current?.files?.[0]) {
            alert('Silakan unggah pas foto peserta (wajib diisi)');
            return;
        }

        if (!formData.namaWali.trim()) {
            alert('Silakan isi nama orang tua / wali');
            return;
        }

        if (!formData.waWali.trim()) {
            alert('Silakan isi nomor WhatsApp orang tua');
            return;
        }

        if (!formData.waGuru.trim()) {
            alert('Silakan isi nomor WhatsApp guru / pembimbing');
            return;
        }

        if (!formData.lomba) {
            alert('Silakan pilih cabang lomba');
            return;
        }

        if (!formData.minatSekolah) {
            alert('Silakan pilih minat pendaftaran ke SD Plus 3 Al-Muhajirin');
            return;
        }

        // Cek kuota sebelum submit
        const maxQuota = KUOTA_PER_CABANG[formData.lomba] || 60;
        const currentFilled = lombaCounts[formData.lomba] || 0;
        if (currentFilled >= maxQuota) {
            alert(`Mohon maaf, kuota untuk cabang "${formData.lomba}" sudah PENUH (${maxQuota}/${maxQuota} peserta). Silakan pilih cabang lomba lain yang masih tersedia.`);
            return;
        }

        setIsSubmitting(true);

        try {
            // Format tanggal lokal YYYY-MM-DD untuk menghindari timezone shift pada kolom DATE PostgreSQL
            const d = formData.tanggalLahir;
            const localDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            // Cek Duplikat Peserta (1 Peserta 1 Lomba)
            const { data: existingData, error: checkError } = await supabase
                .from('pendaftar')
                .select('id, cabang_lomba')
                .ilike('nama_anak', formData.namaAnak.trim())
                .eq('tgl_lahir', localDateStr)
                .ilike('asal_sekolah', formData.asalSekolah.trim());

            if (checkError) {
                throw new Error('Gagal memverifikasi data peserta: ' + checkError.message);
            }

            if (existingData && existingData.length > 0) {
                alert(`Pendaftaran Ditolak: Peserta bernama "${formData.namaAnak}" sudah terdaftar di cabang lomba "${existingData[0].cabang_lomba}". (Satu anak hanya boleh mengikuti maksimal 1 cabang lomba).`);
                setIsSubmitting(false);
                return;
            }

            // Verifikasi Kuota Langsung ke Database untuk Menghindari Race Condition
            const { count: countLomba, error: countErr } = await supabase
                .from('pendaftar')
                .select('*', { count: 'exact', head: true })
                .eq('cabang_lomba', formData.lomba);

            if (countErr) console.error("Gagal menghitung urutan peserta", countErr);

            if ((countLomba || 0) >= maxQuota) {
                alert(`Mohon maaf, kuota pendaftaran untuk cabang "${formData.lomba}" baru saja PENUH (Maksimal ${maxQuota} peserta). Silakan pilih cabang lomba lain.`);
                setIsSubmitting(false);
                return;
            }

            let fotoUrl = null;
            const file = fileInputRef.current?.files?.[0];

            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('foto-peserta')
                    .upload(fileName, file);

                if (uploadError) throw new Error('Gagal mengunggah foto: ' + uploadError.message);

                const { data: { publicUrl } } = supabase.storage
                    .from('foto-peserta')
                    .getPublicUrl(fileName);
                fotoUrl = publicUrl;
            }

            // Generate No Peserta berdasarkan prefix cabang lomba
            const prefix = PREFIX_PER_CABANG[formData.lomba] || 'JEA';
            const nextNum = (countLomba || 0) + 1;
            const noPesertaBaru = `${prefix}-2026-${nextNum.toString().padStart(3, '0')}`;

            const { data: insertData, error: insertError } = await supabase
                .from('pendaftar')
                .insert([
                    {
                        nama_anak: formData.namaAnak.trim(),
                        jenis_kelamin: formData.jenisKelamin || '-',
                        tempat_lahir: formData.tempatLahir.trim(),
                        tgl_lahir: localDateStr,
                        asal_sekolah: formData.asalSekolah.trim(),
                        cabang_lomba: formData.lomba,
                        nama_ortu: formData.namaWali.trim(),
                        no_wa: formData.waWali.trim(),
                        no_wa_pembimbing: formData.waGuru.trim(),
                        no_peserta: noPesertaBaru,
                        foto_url: fotoUrl,
                        minat_sekolah: formData.minatSekolah,
                        status_pembayaran: 'Menunggu'
                    }
                ])
                .select();

            if (insertError) throw new Error('Gagal menyimpan data: ' + insertError.message);

            if (insertData && insertData.length > 0) {
                setRegisteredData(insertData[0]);
            } else {
                alert("Pendaftaran berhasil! Silakan simpan nomor peserta Anda.");
            }

            // Reset form
            setFormData({
                namaAnak: '', jenisKelamin: '', tempatLahir: '', tanggalLahir: null,
                asalSekolah: '', namaWali: '', waWali: '', waGuru: '', lomba: '', minatSekolah: ''
            });
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownloadPDF = async () => {
        const ticketElement = document.getElementById('ticket-container');
        if (!ticketElement) return;

        try {
            const width = ticketElement.offsetWidth * 2;
            const height = ticketElement.offsetHeight * 2;

            const imgData = await toPng(ticketElement, {
                cacheBust: true,
                backgroundColor: '#ffffff',
                pixelRatio: 2,
                style: { margin: '0', transform: 'none' }
            });

            const pdf = new jsPDF({
                orientation: width > height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [width, height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, width, height);
            pdf.save(`Tiket_JinGa_${registeredData?.nama_anak.replace(/\s+/g, '_') || 'Peserta'}.pdf`);
        } catch (error) {
            console.error('Error generating PDF', error);
            alert('Gagal mengunduh PDF, silakan screenshot layar ini.');
        }
    };

    // Options dropdown cabang lomba dengan icon persis seperti di halaman utama
    const selectOptions = CABANG_LOMBA_LIST.map(item => {
        return {
            value: item.dbValue,
            label: item.title,
            icon: item.icon,
            color: `${item.classes.tagBg} ${item.classes.tagText}`
        };
    });

    return (
        <div className="bg-sky-50 min-h-screen font-sans overflow-x-hidden">
            {/* Header Sederhana */}
            <div className="bg-white border-b-4 border-amber-300 px-4 py-4 shadow-sm relative z-10">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-12 h-12 group-hover:scale-105 transition-transform flex-shrink-0">
                            <img src="/assets/logo.png" alt="Logo JinGa" className="w-full h-full object-contain drop-shadow-sm" />
                        </div>
                        <span className="text-xl font-bold font-bubbly text-sky-600 tracking-wide group-hover:text-amber-500 transition-colors">JinGa <span className="text-amber-400">2026</span></span>
                    </Link>
                    <Link href="/" className="text-sm font-bold text-slate-500 hover:text-sky-600 px-4 py-2 bg-slate-100 hover:bg-sky-100 rounded-full transition-colors flex items-center gap-2">
                        <i className="fa-solid fa-house"></i>
                        <span className="hidden sm:inline">Kembali</span>
                    </Link>
                </div>
            </div>

            {/* Form Container */}
            <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16 relative">

                {/* Dekorasi Background */}
                <div className="absolute top-10 -left-10 text-6xl opacity-20 transform -rotate-12">🎈</div>
                <div className="text-center mb-8 space-y-2 relative z-10">
                    <span className="inline-block px-3.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold tracking-wide uppercase">
                        🌟 JinGa Festival 2026
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-bubbly">
                        Formulir Pendaftaran
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 font-medium max-w-lg mx-auto">
                        Daftarkan ananda untuk mengikuti cabang lomba pilihan di JinGa Festival 2026.
                    </p>
                </div>

                <div className="bg-white p-6 sm:p-10 rounded-3xl border-4 border-white shadow-bubbly relative z-10">
                    {registeredData ? (
                        <div className="text-center space-y-6">
                            <div className="w-24 h-24 bg-gradient-to-tr from-emerald-400 to-emerald-500 text-white rounded-full flex items-center justify-center mx-auto text-5xl mb-4 shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-bounce-soft">
                                <i className="fa-solid fa-check"></i>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-extrabold font-bubbly text-slate-900 tracking-tight">Yeay! Pendaftaran Berhasil! 🎉</h2>
                            <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
                                Tiket petualangan ananda sudah siap. Silakan unduh tiket ini atau *screenshot* untuk ditunjukkan ke panitia saat acara.
                            </p>

                            {/* Tiket Container */}
                            <div className="max-w-sm mx-auto mb-8">
                                <div id="ticket-container" className="bg-white p-0 rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden relative ticket-cutout w-full text-left">
                                    {/* Ticket Header */}
                                    <div className="bg-gradient-to-br from-sky-500 to-sky-700 p-6 sm:p-8 text-white text-left relative overflow-hidden">
                                        <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-10 transform rotate-12">
                                            <i className="fa-solid fa-ticket text-8xl"></i>
                                        </div>
                                        <div className="relative z-10">
                                            <span className="bg-amber-400 text-slate-900 text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-widest mb-3 inline-block shadow-sm">Official Ticket</span>
                                            <h3 className="font-bubbly text-3xl font-bold leading-tight mb-1 text-white">JinGa Festival 2026</h3>
                                            <p className="text-sky-200 text-xs font-medium tracking-wide flex items-center gap-1.5"><i className="fa-solid fa-location-dot"></i> SD Plus 3 Al-Muhajirin</p>
                                        </div>
                                    </div>

                                    {/* Dashed Separator */}
                                    <div className="relative flex items-center justify-between -mt-4 -mb-4 z-10">
                                        <div className="w-8 h-8 bg-slate-50 rounded-full border border-slate-200 border-l-0 -ml-4 shadow-inner"></div>
                                        <div className="flex-1 border-t-2 border-dashed border-slate-300 mx-2"></div>
                                        <div className="w-8 h-8 bg-slate-50 rounded-full border border-slate-200 border-r-0 -mr-4 shadow-inner"></div>
                                    </div>

                                    {/* Ticket Body */}
                                    <div className="bg-white p-6 sm:p-8 relative text-center">
                                        <div className="bg-slate-50 p-4 rounded-2xl inline-block shadow-inner mb-8 border border-slate-100">
                                            <QRCode value={registeredData.id} size={150} level="H" />
                                        </div>

                                        <div className="space-y-5 text-left bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nama Penjelajah</p>
                                                <p className="font-extrabold text-slate-800 text-xl leading-none">{registeredData.nama_anak}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-1">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Kategori Lomba</p>
                                                    <p className="font-bold text-amber-600 text-sm bg-amber-50 px-2.5 py-1 rounded-lg inline-block border border-amber-100">{registeredData.cabang_lomba}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">ID Tiket</p>
                                                    <p className="font-mono font-bold text-slate-700 text-sm bg-slate-200/50 px-2.5 py-1 rounded-lg inline-block">{registeredData.no_peserta || registeredData.id.split('-')[0].toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tombol Aksi Download & Baru */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                                <button
                                    onClick={handleDownloadPDF}
                                    className="w-full sm:flex-1 bg-gradient-to-r from-sky-500 to-sky-600 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <i className="fa-solid fa-download"></i> Unduh PDF Tiket
                                </button>
                                <button
                                    onClick={() => setRegisteredData(null)}
                                    className="w-full sm:flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <i className="fa-solid fa-user-plus"></i> Daftar Peserta Lain
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8">

                            {/* Data Diri Peserta */}
                            <div>
                                <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3 mb-5">
                                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-bold">
                                        <i className="fa-solid fa-id-card"></i>
                                    </div>
                                    <h2 className="text-base sm:text-lg font-bold text-slate-800">
                                        Identitas Calon Peserta Lomba
                                    </h2>
                                </div>

                                <div className="space-y-4 sm:space-y-5">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                                            Nama Lengkap Anak <span className="text-rose-500 font-bold">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.namaAnak}
                                            onChange={(e) => handleTextChange(e, 'namaAnak', true)}
                                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 sm:py-3 bg-slate-50/70 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 transition-all outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400"
                                            placeholder="Contoh: Ahmad Zaky Pratama"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                                                Jenis Kelamin <span className="text-rose-500 font-bold">*</span>
                                            </label>
                                            <CustomSelect
                                                name="jenisKelamin"
                                                value={formData.jenisKelamin}
                                                onChange={(val) => setFormData({ ...formData, jenisKelamin: val })}
                                                options={[
                                                    { value: "Laki-laki", label: "Laki-laki", icon: "fa-solid fa-mars", color: "bg-blue-100 text-blue-600" },
                                                    { value: "Perempuan", label: "Perempuan", icon: "fa-solid fa-venus", color: "bg-pink-100 text-pink-600" }
                                                ]}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                                                Asal Sekolah / TK <span className="text-rose-500 font-bold">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.asalSekolah}
                                                onChange={(e) => handleTextChange(e, 'asalSekolah', true)}
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 sm:py-3 bg-slate-50/70 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 transition-all outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400"
                                                placeholder="Contoh: TK Al-Muhajirin"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                                                Tempat Lahir <span className="text-rose-500 font-bold">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.tempatLahir}
                                                onChange={(e) => handleTextChange(e, 'tempatLahir', true)}
                                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 sm:py-3 bg-slate-50/70 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 transition-all outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400"
                                                placeholder="Kota kelahiran"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                                                Tanggal Lahir <span className="text-rose-500 font-bold">*</span>
                                            </label>
                                            <CustomDatePicker
                                                value={formData.tanggalLahir}
                                                onChange={(date) => setFormData({ ...formData, tanggalLahir: date })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                                            Unggah Pas Foto Peserta <span className="text-rose-500 font-bold">*</span>
                                        </label>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="image/png, image/jpeg, image/jpg"
                                            required
                                            className="w-full rounded-xl border-2 border-dashed border-slate-300 p-2.5 sm:p-3 bg-slate-50 focus:bg-white focus:border-sky-500 transition-all outline-none text-xs sm:text-sm font-medium text-slate-600 file:mr-3 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-bold file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200 cursor-pointer"
                                        />
                                        {fileError ? (
                                            <p className="mt-1.5 text-xs text-rose-500 font-semibold">{fileError}</p>
                                        ) : (
                                            <p className="mt-1.5 text-xs text-slate-500 font-medium flex items-center gap-1.5">
                                                <i className="fa-solid fa-circle-info text-sky-500 text-[11px]"></i> Pas foto setengah badan (Format: JPG/PNG, Maks. 2MB)
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Data Kontak Pendamping */}
                            <div>
                                <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3 mb-5">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                                        <i className="fa-solid fa-address-book"></i>
                                    </div>
                                    <h2 className="text-base sm:text-lg font-bold text-slate-800">
                                        Data Kontak Pendamping
                                    </h2>
                                </div>

                                <div className="space-y-4 sm:space-y-5">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                                            Nama Orang Tua / Wali <span className="text-rose-500 font-bold">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.namaWali}
                                            onChange={(e) => handleTextChange(e, 'namaWali', true)}
                                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 sm:py-3 bg-slate-50/70 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400"
                                            placeholder="Nama ayah / ibu / wali peserta"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                                                No. WhatsApp Orang Tua <span className="text-rose-500 font-bold">*</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs sm:text-sm">+62</span>
                                                <input
                                                    type="tel"
                                                    value={formData.waWali}
                                                    onChange={(e) => handlePhoneChange(e, 'waWali')}
                                                    className="w-full rounded-xl border border-slate-200 pl-11 pr-4 py-2.5 sm:py-3 bg-slate-50/70 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400"
                                                    placeholder="8123456..."
                                                    required
                                                    minLength={9}
                                                    maxLength={13}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                                                No. WhatsApp Guru / Pembimbing <span className="text-rose-500 font-bold">*</span>
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs sm:text-sm">+62</span>
                                                <input
                                                    type="tel"
                                                    value={formData.waGuru}
                                                    onChange={(e) => handlePhoneChange(e, 'waGuru')}
                                                    className="w-full rounded-xl border border-slate-200 pl-11 pr-4 py-2.5 sm:py-3 bg-slate-50/70 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400"
                                                    placeholder="8123456..."
                                                    required
                                                    minLength={9}
                                                    maxLength={13}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pilihan Lomba */}
                            <div>
                                <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3 mb-5">
                                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">
                                        <i className="fa-solid fa-trophy"></i>
                                    </div>
                                    <h2 className="text-base sm:text-lg font-bold text-slate-800">
                                        Pilihan Cabang Lomba
                                    </h2>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                                        Pilih Cabang Lomba <span className="text-rose-500 font-bold">*</span>
                                    </label>
                                    <CustomSelect
                                        name="lomba"
                                        value={formData.lomba}
                                        onChange={(val) => setFormData({ ...formData, lomba: val })}
                                        options={selectOptions}
                                        required
                                    />

                                    <p className="mt-2 text-xs text-slate-500 font-medium flex items-center gap-1.5">
                                        <i className="fa-solid fa-circle-info text-amber-500 text-[11px]"></i> Pastikan cabang lomba yang dipilih sesuai dengan usia dan minat peserta.
                                    </p>
                                </div>
                            </div>

                            {/* Minat SPMB SD Plus 3 Al-Muhajirin */}
                            <div>
                                <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3 mb-5">
                                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center text-xs font-bold">
                                        <i className="fa-solid fa-school"></i>
                                    </div>
                                    <h2 className="text-base sm:text-lg font-bold text-slate-800">
                                        Minat Masuk SD Plus 3 Al-Muhajirin
                                    </h2>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 leading-snug">
                                        Apakah Bapak/Ibu berminat mendaftarkan Ananda melanjutkan pendidikan di SD Plus 3 Al-Muhajirin? <span className="text-rose-500 font-bold">*</span>
                                    </label>
                                    <p className="text-xs text-slate-400 mb-3">
                                        Pendataan awal untuk informasi & konsultasi SPMB.
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, minatSekolah: 'Berminat' })}
                                            className={`p-3.5 sm:p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3.5 cursor-pointer ${formData.minatSekolah === 'Berminat'
                                                    ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 shadow-sm ring-4 ring-emerald-500/10'
                                                    : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 text-slate-700 hover:border-slate-300'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-base shrink-0 transition-colors ${formData.minatSekolah === 'Berminat'
                                                    ? 'bg-emerald-500 text-white shadow-sm'
                                                    : 'bg-white border border-slate-200 text-slate-400'
                                                }`}>
                                                <i className="fa-solid fa-circle-check"></i>
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-slate-900">Berminat</div>
                                                <div className="text-xs text-slate-500 mt-0.5">Tertarik melanjutkan ke SD Plus 3 Al-Muhajirin</div>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, minatSekolah: 'Masih Dipertimbangkan' })}
                                            className={`p-3.5 sm:p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3.5 cursor-pointer ${formData.minatSekolah === 'Masih Dipertimbangkan'
                                                    ? 'border-amber-500 bg-amber-50/80 text-amber-950 shadow-sm ring-4 ring-amber-500/10'
                                                    : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 text-slate-700 hover:border-slate-300'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-base shrink-0 transition-colors ${formData.minatSekolah === 'Masih Dipertimbangkan'
                                                    ? 'bg-amber-500 text-white shadow-sm'
                                                    : 'bg-white border border-slate-200 text-slate-400'
                                                }`}>
                                                <i className="fa-solid fa-clock-rotate-left"></i>
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm text-slate-900">Masih Dipertimbangkan</div>
                                                <div className="text-xs text-slate-500 mt-0.5">Sedang mempertimbangkan pilihan sekolah</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4 sm:pt-6">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full flex items-center justify-center gap-3 px-8 py-3.5 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all ${isSubmitting
                                            ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                                        }`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <i className="fa-solid fa-circle-notch fa-spin"></i>
                                            Memverifikasi & Mendaftar...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-paper-plane"></i>
                                            Daftarkan Sekarang
                                        </>
                                    )}
                                </button>
                            </div>

                        </form>
                    )}
                </div>

                {/* Footer Minimalis */}
                <div className="text-center mt-10 text-slate-400 text-sm font-medium">
                    &copy; 2026 JinGa Explorers Academy Festival • SD Plus 3 Al-Muhajirin
                </div>
            </div>
        </div>
    );
}

export default function DaftarPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-sky-50 flex items-center justify-center">
                <div className="text-center p-8 bg-white rounded-3xl shadow-sm border border-slate-100">
                    <i className="fa-solid fa-circle-notch fa-spin text-4xl text-sky-500 mb-3"></i>
                    <p className="font-bold text-slate-600 text-sm">Memuat Formulir Pendaftaran...</p>
                </div>
            </div>
        }>
            <DaftarFormContent />
        </Suspense>
    );
}
