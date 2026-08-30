'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import BadgeStatus from '@/components/BadgeStatus';
import Link from 'next/link';
import PesertaModal from '@/components/PesertaModal';

export default function DataPesertaPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCabang, setFilterCabang] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeserta, setSelectedPeserta] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Data options for filter
  const cabangLombaList = [
    'Semua', 'Adzan', 'Fashion Show', 'MHQ', 'Karya Kolase', 'Mewarnai', 'Tendangan Penalti', 'Menyanyi Solo'
  ];

  const fetchRegistrations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pendaftar')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching data:', error);
    } else {
      setRegistrations(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const toggleKehadiran = async (e: React.MouseEvent, id: string, currentStatus: string) => {
    e.stopPropagation();
    const newStatus = currentStatus === 'Hadir' ? 'Belum Hadir' : 'Hadir';
    
    // Optimistic update
    setRegistrations(prev => 
      prev.map(reg => reg.id === id ? { ...reg, status_kehadiran: newStatus } : reg)
    );

    const { error } = await supabase
      .from('pendaftar')
      .update({ status_kehadiran: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
      alert('Gagal mengubah status kehadiran. Pastikan RLS UPDATE sudah diizinkan di Supabase.');
      // Revert if error
      fetchRegistrations();
    }
  };

  const deletePeserta = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    const isConfirmed = window.confirm(`Apakah Anda yakin ingin menghapus data peserta "${name}"? Tindakan ini tidak dapat dibatalkan.`);
    
    if (isConfirmed) {
      // Optimistic update
      setRegistrations(prev => prev.filter(reg => reg.id !== id));

      const { error } = await supabase
        .from('pendaftar')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting data:', error);
        alert('Gagal menghapus data. Pastikan RLS DELETE sudah diizinkan di Supabase.');
        fetchRegistrations();
      }
    }
  };

  const openModal = (reg: any) => {
    setSelectedPeserta(reg);
    setIsModalOpen(true);
  };

  const handleUpdateSuccess = (updatedData: any) => {
    setRegistrations(prev => prev.map(r => r.id === updatedData.id ? { ...r, ...updatedData } : r));
    setSelectedPeserta(updatedData);
  };

  // Filter data based on search query and cabang lomba
  const filteredData = registrations.filter(reg => {
    const matchesSearch = reg.nama_anak.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          reg.asal_sekolah.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCabang = filterCabang === 'Semua' || reg.cabang_lomba === filterCabang;
    return matchesSearch && matchesCabang;
  });

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Manajemen Data Peserta</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola data pendaftaran, cek kehadiran manual, dan hapus data tidak valid.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/panitia/scan" className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm shadow-indigo-500/20">
            <i className="fa-solid fa-qrcode"></i> Scan Tiket
          </Link>
        </div>
      </div>

      {/* Toolbar (Filters & Search) */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Cari nama / sekolah..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:bg-white transition-all"
            />
          </div>
          <select 
            value={filterCabang} 
            onChange={(e) => setFilterCabang(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:bg-white transition-all cursor-pointer"
          >
            {cabangLombaList.map(cabang => (
              <option key={cabang} value={cabang}>{cabang}</option>
            ))}
          </select>
        </div>
        
        <div className="text-sm font-semibold text-slate-500 bg-slate-100 px-4 py-2 rounded-xl w-full md:w-auto text-center">
          Total: <span className="text-slate-800">{filteredData.length}</span> Peserta
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-4">ID & Nama Peserta</th>
                <th className="px-6 py-4">Cabang Lomba</th>
                <th className="px-6 py-4">Kontak (WA)</th>
                <th className="px-6 py-4">Status Kehadiran</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center">
                    <i className="fa-solid fa-circle-notch fa-spin text-3xl text-sky-500 mb-3"></i>
                    <p className="text-sm text-slate-500 font-medium">Memuat data peserta...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                    <i className="fa-regular fa-folder-open text-4xl mb-3 text-slate-300"></i>
                    <p className="text-sm font-medium">Tidak ada data pendaftar yang cocok.</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((reg) => (
                  <tr 
                    key={reg.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => openModal(reg)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-sm shrink-0">
                          {reg.nama_anak.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{reg.nama_anak}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5" title={reg.id}>{reg.id.split('-')[0].toUpperCase()}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{reg.asal_sekolah}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                      {reg.cabang_lomba}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <a href={`https://wa.me/${(reg.no_wa || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors w-fit" title="Chat Orang Tua">
                          <i className="fa-brands fa-whatsapp"></i> Ortu: {reg.no_wa || '-'}
                        </a>
                        {reg.no_wa_pembimbing && (
                          <a href={`https://wa.me/${reg.no_wa_pembimbing.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-1.5 rounded-lg hover:bg-teal-100 transition-colors w-fit" title="Chat Guru/Pembimbing">
                            <i className="fa-brands fa-whatsapp"></i> Guru: {reg.no_wa_pembimbing}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={(e) => toggleKehadiran(e, reg.id, reg.status_kehadiran)}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all border ${
                          reg.status_kehadiran === 'Hadir' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                        title="Klik untuk ubah status kehadiran"
                      >
                        <i className={`fa-solid ${reg.status_kehadiran === 'Hadir' ? 'fa-check-circle' : 'fa-circle-xmark'}`}></i> 
                        {reg.status_kehadiran === 'Hadir' ? 'Hadir' : 'Belum'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={(e) => deletePeserta(e, reg.id, reg.nama_anak)}
                        className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center mx-auto focus:outline-none focus:ring-2 focus:ring-rose-500/50 opacity-0 group-hover:opacity-100"
                        title="Hapus Data"
                      >
                        <i className="fa-regular fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Info / Footer (Optional) */}
        {!loading && filteredData.length > 0 && (
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between text-xs text-slate-500 font-medium">
            <p>Menampilkan semua data yang difilter</p>
            <p>Otomatis disinkronisasi dengan Database</p>
          </div>
        )}
      </div>

      {/* Detail Modal Component */}
      <PesertaModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        peserta={selectedPeserta}
        onUpdateSuccess={handleUpdateSuccess}
      />

    </div>
  );
}
