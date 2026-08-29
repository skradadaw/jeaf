'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
import CustomDatePicker from '@/components/CustomDatePicker';
import CustomSelect from '@/components/CustomSelect';
import { supabase } from '@/lib/supabase';
import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export default function DaftarPage() {
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
    const fileInputRef = useRef<HTMLInputElement>(null);

    const toTitleCase = (str: string) => {
        return str.replace(
            /\w\S*/g,
            (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        let val = e.target.value.replace(/\D/g, ''); // hanya angka
        if (val.startsWith('0')) {
            val = val.substring(1); // hapus 0 di depan
        }
        if (val.startsWith('62')) {
            val = val.substring(2); // hapus 62
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (fileError) return;
        if (!formData.tanggalLahir) {
            alert('Silakan isi tanggal lahir');
            return;
        }
        
        setIsSubmitting(true);
        
        try {
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

            const { data: insertData, error: insertError } = await supabase
                .from('pendaftar')
                .insert([
                    {
                        nama_anak: formData.namaAnak,
                        jenis_kelamin: formData.jenisKelamin || '-',
                        tgl_lahir: formData.tanggalLahir.toISOString(),
                        asal_sekolah: formData.asalSekolah,
                        cabang_lomba: formData.lomba,
                        nama_ortu: formData.namaWali,
                        no_wa: formData.waWali,
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
                alert("Pendaftaran berhasil! Silakan periksa WhatsApp Anda untuk info pembayaran.");
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

    return (
        <div className="bg-sky-50 min-h-screen font-sans">
            {/* Header Sederhana */}
            <div className="bg-white border-b-4 border-amber-300 px-4 py-4 shadow-sm relative z-10">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-sky-500 p-0.5 shadow-sm group-hover:scale-105 transition-transform">
                            <img src="/assets/hero-poster.png" alt="JinGa" className="w-full h-full object-cover rounded-[10px]" />
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
                <div className="absolute bottom-20 -right-10 text-6xl opacity-20 transform rotate-12">🚀</div>

                <div className="text-center mb-10 space-y-3 relative z-10">
                    <span className="inline-block px-4 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold tracking-wider uppercase">
                        🎫 Tiket Petualangan
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold font-bubbly text-slate-900">
                        Formulir Pendaftaran
                    </h1>
                    <p className="text-slate-600 font-medium">
                        Ayo daftarkan jagoan cilik Anda untuk mengikuti ekspedisi seru ini!
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
                                                <p className="font-mono font-bold text-slate-700 text-sm bg-slate-200/50 px-2.5 py-1 rounded-lg inline-block">{registeredData.id.split('-')[0].toUpperCase()}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="pt-1">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Asal Sekolah (TK/RA)</p>
                                            <p className="font-bold text-slate-700 text-sm line-clamp-1">{registeredData.asal_sekolah}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            </div>


                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
                                <a 
                                    href={`https://wa.me/6283820741280?text=Halo%20Admin%2C%20saya%20ingin%20konfirmasi%20pendaftaran%20ananda%20*${encodeURIComponent(registeredData.nama_anak)}*%20untuk%20lomba%20*${encodeURIComponent(registeredData.cabang_lomba)}*.%20ID%20Pendaftaran%3A%20${registeredData.id.split('-')[0]}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="w-full sm:w-auto flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-2xl font-bold transition-all shadow-[0_8px_16px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2.5 hover:-translate-y-1 active:translate-y-0"
                                >
                                    <i className="fa-brands fa-whatsapp text-2xl"></i> Konfirmasi Admin
                                </a>
                                
                                <button 
                                    onClick={handleDownloadPDF} 
                                    className="w-full sm:w-auto flex-1 px-6 py-4 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white rounded-2xl font-bold transition-all shadow-[0_8px_16px_rgba(14,165,233,0.3)] flex items-center justify-center gap-2.5 hover:-translate-y-1 active:translate-y-0"
                                >
                                    <i className="fa-solid fa-file-pdf text-xl"></i> Unduh Tiket (PDF)
                                </button>
                            </div>
                            
                            <div className="pt-6">
                                <button onClick={() => window.location.href = '/'} className="text-slate-400 hover:text-slate-700 font-bold transition-colors underline decoration-slate-200 hover:decoration-slate-400 underline-offset-4">
                                    <i className="fa-solid fa-arrow-left mr-1"></i> Kembali ke Beranda
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form className="space-y-8" onSubmit={handleSubmit}>
                        
                        {/* Data Anak */}
                        <div>
                            <h2 className="text-xl font-bold font-bubbly text-sky-600 border-b-2 border-sky-100 pb-2 mb-6 flex items-center gap-2">
                                <i className="fa-solid fa-child-reaching text-amber-400"></i> Data Penjelajah Cilik
                            </h2>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Nama Lengkap Peserta *</label>
                                    <input type="text" value={formData.namaAnak} onChange={(e) => handleTextChange(e, 'namaAnak', true)} className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 bg-slate-50 focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20 transition-all outline-none font-medium text-slate-700 placeholder:text-slate-400" placeholder="Contoh: Muhammad Ali" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Jenis Kelamin *</label>
                                    <CustomSelect 
                                        name="jenisKelamin" 
                                        value={formData.jenisKelamin}
                                        onChange={(val) => setFormData({...formData, jenisKelamin: val})}
                                        options={[
                                            { value: "Laki-laki", label: "Laki-laki", icon: "fa-solid fa-mars", color: "bg-sky-100 text-sky-600" },
                                            { value: "Perempuan", label: "Perempuan", icon: "fa-solid fa-venus", color: "bg-rose-100 text-rose-600" },
                                        ]} 
                                        required 
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Tempat Lahir *</label>
                                        <input type="text" value={formData.tempatLahir} onChange={(e) => handleTextChange(e, 'tempatLahir', true)} className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 bg-slate-50 focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20 transition-all outline-none font-medium text-slate-700 placeholder:text-slate-400" placeholder="Contoh: Purwakarta" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Tanggal Lahir *</label>
                                        <CustomDatePicker name="tanggal_lahir" value={formData.tanggalLahir} onChange={(date) => setFormData({...formData, tanggalLahir: date})} required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Asal Sekolah (TK/RA) *</label>
                                    <input type="text" value={formData.asalSekolah} onChange={(e) => handleTextChange(e, 'asalSekolah', true)} className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 bg-slate-50 focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20 transition-all outline-none font-medium text-slate-700 placeholder:text-slate-400" placeholder="Contoh: TK Al-Muhajirin" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Apakah berminat menyekolahkan anak di SD Plus 3 Al-Muhajirin? *</label>
                                    <CustomSelect 
                                        name="minatSekolah" 
                                        value={formData.minatSekolah}
                                        onChange={(val) => setFormData({...formData, minatSekolah: val})}
                                        options={[
                                            { value: "Ya, Berminat", label: "Ya, Berminat", icon: "fa-solid fa-check", color: "bg-emerald-100 text-emerald-600" },
                                            { value: "Mungkin", label: "Mungkin", icon: "fa-solid fa-question", color: "bg-amber-100 text-amber-600" },
                                            { value: "Tidak", label: "Tidak", icon: "fa-solid fa-xmark", color: "bg-rose-100 text-rose-600" },
                                        ]} 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Pas Foto Anak *</label>
                                    <div className="relative">
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg, image/png, image/jpg" className="w-full rounded-2xl border-2 border-slate-200 px-4 py-2 bg-slate-50 focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20 transition-all outline-none font-medium text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-100 file:text-sky-700 hover:file:bg-sky-200 cursor-pointer" required />
                                    </div>
                                    {fileError ? (
                                        <p className="mt-2 text-xs text-red-500 font-semibold flex items-center gap-1.5">
                                            <i className="fa-solid fa-circle-exclamation"></i> {fileError}
                                        </p>
                                    ) : (
                                        <p className="mt-2 text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                                            <i className="fa-solid fa-circle-info text-sky-500"></i> Format: JPG/PNG, Maks. 2MB
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Data Kontak */}
                        <div>
                            <h2 className="text-xl font-bold font-bubbly text-emerald-600 border-b-2 border-emerald-100 pb-2 mb-6 flex items-center gap-2">
                                <i className="fa-solid fa-address-book text-amber-400"></i> Data Kontak Pendamping
                            </h2>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Nama Orang Tua / Wali *</label>
                                    <input type="text" value={formData.namaWali} onChange={(e) => handleTextChange(e, 'namaWali', true)} className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 transition-all outline-none font-medium text-slate-700 placeholder:text-slate-400" placeholder="Nama ayah/ibu" required />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">No. WhatsApp Orang Tua *</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">+62</span>
                                            <input type="tel" value={formData.waWali} onChange={(e) => handlePhoneChange(e, 'waWali')} className="w-full rounded-2xl border-2 border-slate-200 pl-12 pr-4 py-3 bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 transition-all outline-none font-medium text-slate-700 placeholder:text-slate-400" placeholder="8123456..." required minLength={9} maxLength={13} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">No. WhatsApp Guru/Pembimbing *</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">+62</span>
                                            <input type="tel" value={formData.waGuru} onChange={(e) => handlePhoneChange(e, 'waGuru')} className="w-full rounded-2xl border-2 border-slate-200 pl-12 pr-4 py-3 bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/20 transition-all outline-none font-medium text-slate-700 placeholder:text-slate-400" placeholder="8123456..." required minLength={9} maxLength={13} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pilihan Lomba */}
                        <div>
                            <h2 className="text-xl font-bold font-bubbly text-amber-600 border-b-2 border-amber-100 pb-2 mb-6 flex items-center gap-2">
                                <i className="fa-solid fa-trophy text-amber-400"></i> Pilihan Ekspedisi Lomba
                            </h2>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Pilih Cabang Lomba *</label>
                                <CustomSelect 
                                    name="lomba" 
                                    value={formData.lomba}
                                    onChange={(val) => setFormData({...formData, lomba: val})}
                                    options={[
                                        { value: "MHQ", label: "Lomba MHQ (Hafalan Al-Qur'an)", icon: "fa-solid fa-book-quran", color: "bg-emerald-100 text-emerald-600" },
                                        { value: "Kolase", label: "Lomba Karya Kolase", icon: "fa-solid fa-scissors", color: "bg-amber-100 text-amber-600" },
                                        { value: "Mewarnai", label: "Lomba Mewarnai", icon: "fa-solid fa-palette", color: "bg-rose-100 text-rose-600" },
                                        { value: "Menyanyi", label: "Lomba Menyanyi Solo", icon: "fa-solid fa-microphone", color: "bg-sky-100 text-sky-600" },
                                        { value: "Fashion", label: "Lomba Fashion Show", icon: "fa-solid fa-shirt", color: "bg-fuchsia-100 text-fuchsia-600" },
                                        { value: "Adzan", label: "Lomba Adzan", icon: "fa-solid fa-volume-high", color: "bg-emerald-100 text-emerald-600" },
                                        { value: "Penalti", label: "Lomba Tendangan Penalti", icon: "fa-solid fa-futbol", color: "bg-indigo-100 text-indigo-600" }
                                    ]} 
                                    required 
                                />
                                <p className="mt-2 text-xs text-amber-600 font-semibold flex items-center gap-1.5">
                                    <i className="fa-solid fa-circle-info"></i> Pastikan pilihan lomba sudah sesuai dengan minat anak.
                                </p>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6">
                            <button type="submit" disabled={isSubmitting} className={`w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-extrabold text-lg transition-all ${isSubmitting ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 shadow-lg shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98]'}`}>
                                {isSubmitting ? (
                                    <>
                                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-paper-plane"></i>
                                        Daftarkan Sekarang!
                                    </>
                                )}
                            </button>
                        </div>
                        
                    </form>
                    )}
                </div>
                
                {/* Footer Minimalis */}
                <div className="text-center mt-10 text-slate-400 text-sm font-medium">
                    &copy; 2026 JinGa Explorers Academy Festival
                </div>
            </div>
        </div>
    );
}
