'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import BadgeStatus from '@/components/BadgeStatus';
import Link from 'next/link';
import PesertaModal from '@/components/PesertaModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { toast } from 'react-hot-toast';
import CustomSelect from '@/components/CustomSelect';

export default function DataPesertaPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCabang, setFilterCabang] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeserta, setSelectedPeserta] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{isOpen: boolean, id: string, name: string}>({ isOpen: false, id: '', name: '' });
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Data options for filter
  const cabangLombaList = [
    'Semua', 'Adzan', 'Fashion Show', 'MHQ', 'Karya Kolase', 'Mewarnai', 'Tendangan Penalti', 'Menyanyi Solo'
  ];

  const getCabangColor = (cabang: string) => {
    switch (cabang) {
      case 'Adzan': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Fashion Show': return 'bg-pink-50 text-pink-600 border-pink-200';
      case 'MHQ': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'Karya Kolase': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'Mewarnai': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'Tendangan Penalti': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Menyanyi Solo': return 'bg-rose-50 text-rose-600 border-rose-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

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
    const newWaktu = newStatus === 'Hadir' ? new Date().toISOString() : null;
    
    // Optimistic update
    setRegistrations(prev => 
      prev.map(reg => reg.id === id ? { ...reg, status_kehadiran: newStatus, waktu_kehadiran: newWaktu } : reg)
    );

    const { error } = await supabase
      .from('pendaftar')
      .update({ status_kehadiran: newStatus, waktu_kehadiran: newWaktu })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
      toast.error('Gagal mengubah status kehadiran.');
      // Revert if error
      fetchRegistrations();
    } else {
      toast.success(`Status ${newStatus === 'Hadir' ? 'berhasil diabsen' : 'dibatalkan'}`);
    }
  };

  const deletePeserta = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setConfirmDelete({ isOpen: true, id, name });
  };

  const handleConfirmDelete = async () => {
    const { id } = confirmDelete;
    
    // Optimistic update
    setRegistrations(prev => prev.filter(reg => reg.id !== id));
    setConfirmDelete({ isOpen: false, id: '', name: '' });

    const { error } = await supabase
      .from('pendaftar')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting data:', error);
      toast.error(`Gagal menghapus data: ${error.message}`);
      fetchRegistrations();
    } else {
      toast.success('Data peserta berhasil dihapus');
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

  // Reset pagination when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCabang, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      
      {/* Data Table Card */}
      <div className="bg-white rounded-[20px] shadow-sm shadow-slate-200/50 border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Table Toolbar */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-white">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
              <input 
                type="text" 
                placeholder="Cari nama atau asal sekolah..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
              />
            </div>
            <div className="relative min-w-[200px]">
              <CustomSelect 
                size="sm"
                value={filterCabang} 
                onChange={(val) => setFilterCabang(val)}
                options={cabangLombaList.map(c => ({ value: c, label: c, icon: c === 'Semua' ? 'fa-solid fa-filter' : 'fa-solid fa-trophy' }))}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl w-full md:w-auto justify-center shadow-sm">
            Total Data: <span className="text-sky-600 font-bold bg-sky-100 px-2 py-0.5 rounded-md">{filteredData.length}</span>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-4">ID & Nama Peserta</th>
                <th className="px-6 py-4">Asal Sekolah</th>
                <th className="px-6 py-4">Cabang Lomba</th>
                <th className="px-6 py-4">Kontak (WA)</th>
                <th className="px-6 py-4">Kehadiran</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <i className="fa-solid fa-circle-notch fa-spin text-3xl text-sky-500 mb-3"></i>
                    <p className="text-sm text-slate-500 font-medium">Memuat data peserta...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    <i className="fa-regular fa-folder-open text-4xl mb-3 text-slate-300"></i>
                    <p className="text-sm font-medium">Tidak ada data pendaftar yang cocok.</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((reg) => (
                  <tr 
                    key={reg.id} 
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => openModal(reg)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img 
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${reg.nama_anak}&backgroundColor=0ea5e9,0284c7`} 
                          alt={reg.nama_anak} 
                          className="w-11 h-11 rounded-full shadow-sm border-2 border-white"
                        />
                        <div>
                          <p className="font-bold text-slate-800 text-sm mb-0.5 group-hover:text-sky-600 transition-colors">{reg.nama_anak}</p>
                          <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md" title={reg.id}>{reg.no_peserta || reg.id.split('-')[0].toUpperCase()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                          <i className="fa-solid fa-school text-[10px]"></i>
                        </div>
                        <p className="text-xs font-semibold text-slate-700 truncate max-w-[150px]">{reg.asal_sekolah}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold border ${getCabangColor(reg.cabang_lomba)}`}>
                        {reg.cabang_lomba}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        {reg.no_wa && (
                          <a href={`https://wa.me/${reg.no_wa.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[11px] font-bold text-slate-600 hover:text-emerald-600 group/wa transition-colors w-fit" title="Chat Orang Tua">
                            <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover/wa:bg-emerald-500 group-hover/wa:text-white transition-colors">
                              <i className="fa-brands fa-whatsapp text-sm"></i>
                            </div>
                            Ortu
                          </a>
                        )}
                        {reg.no_wa_pembimbing && (
                          <a href={`https://wa.me/${reg.no_wa_pembimbing.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[11px] font-bold text-slate-600 hover:text-teal-600 group/wa transition-colors w-fit" title="Chat Guru">
                            <div className="w-6 h-6 rounded-md bg-teal-50 text-teal-500 flex items-center justify-center group-hover/wa:bg-teal-500 group-hover/wa:text-white transition-colors">
                              <i className="fa-brands fa-whatsapp text-sm"></i>
                            </div>
                            Guru
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={(e) => toggleKehadiran(e, reg.id, reg.status_kehadiran)}
                        className={`relative inline-flex items-center justify-center w-28 h-8 rounded-full transition-all border shadow-sm ${
                          reg.status_kehadiran === 'Hadir' 
                            ? 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-500/20 hover:bg-emerald-600' 
                            : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                        }`}
                        title="Ubah status kehadiran"
                      >
                        <span className={`text-xs font-bold ${reg.status_kehadiran === 'Hadir' ? 'ml-3' : 'mr-3'}`}>
                          {reg.status_kehadiran}
                        </span>
                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm transition-all duration-300 ${
                          reg.status_kehadiran === 'Hadir' 
                            ? 'left-1 text-emerald-500' 
                            : 'right-1 text-slate-400 bg-slate-100'
                        }`}>
                          <i className={`fa-solid ${reg.status_kehadiran === 'Hadir' ? 'fa-check' : 'fa-minus'} text-[10px]`}></i>
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={(e) => deletePeserta(e, reg.id, reg.nama_anak)}
                        className="w-8 h-8 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors inline-flex items-center justify-center"
                        title="Hapus data peserta"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Info / Footer */}
        {!loading && filteredData.length > 0 && (
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 font-medium">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} data
            </p>
            
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-white hover:text-sky-600 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors"
                title="Halaman Sebelumnya"
              >
                <i className="fa-solid fa-chevron-left text-[10px]"></i>
              </button>
              
              <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar max-w-[200px] sm:max-w-none">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      currentPage === page 
                      ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30' 
                      : 'border border-slate-200 text-slate-600 hover:bg-white hover:text-sky-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-white hover:text-sky-600 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-500 transition-colors"
                title="Halaman Berikutnya"
              >
                <i className="fa-solid fa-chevron-right text-[10px]"></i>
              </button>
            </div>
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

      {/* Confirm Delete Dialog */}
      <ConfirmDialog 
        isOpen={confirmDelete.isOpen}
        title="Hapus Peserta?"
        message={`Apakah Anda yakin ingin menghapus data peserta "${confirmDelete.name}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: '', name: '' })}
      />

    </div>
  );
}
