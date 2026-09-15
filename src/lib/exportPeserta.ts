import * as XLSX from 'xlsx';

export interface PesertaExportItem {
  id?: string;
  no_peserta?: string | null;
  nama_anak: string;
  jenis_kelamin?: string | null;
  tempat_lahir?: string | null;
  tgl_lahir?: string | null;
  asal_sekolah: string;
  cabang_lomba: string;
  nama_ortu: string;
  no_wa: string;
  no_wa_pembimbing?: string | null;
  minat_sekolah?: string | null;
  foto_url?: string | null;
  status_pembayaran?: string | null;
  status_kehadiran: string;
  waktu_kehadiran?: string | null;
  nilai_total?: number | null;
  catatan_juri?: string | null;
  created_at?: string | null;
}

/**
 * Format tanggal ke format lokal Indonesia yang mudah dibaca di Excel
 */
const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

/**
 * Format tanggal dan waktu ke format lokal Indonesia
 */
const formatDateTime = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/\./g, ':');
  } catch {
    return dateStr;
  }
};

/**
 * Ekspor data peserta ke file Excel (.xlsx)
 * @param data Array data peserta
 * @param filename Nama file saat diunduh (default: Data_Peserta_JinGa_2026.xlsx)
 */
export function exportPesertaToExcel(data: PesertaExportItem[], filename = 'Data_Peserta_JinGa_2026.xlsx') {
  if (!data || data.length === 0) {
    throw new Error('Tidak ada data peserta yang dapat diekspor.');
  }

  // Petakan data ke kolom-kolom Excel dengan header Indonesia yang jelas
  const formattedRows = data.map((item, index) => {
    // Format No WA string bersih agar 08... tidak hilang di Excel
    const waOrtu = item.no_wa ? String(item.no_wa).trim() : '-';
    const waGuru = item.no_wa_pembimbing ? String(item.no_wa_pembimbing).trim() : '-';
    const noPeserta = item.no_peserta || (item.id ? item.id.split('-')[0].toUpperCase() : '-');

    const formatMinat = (val?: string | null) => {
      if (!val) return '-';
      const clean = val.trim();
      if (clean.toLowerCase().includes('berminat')) return 'Berminat';
      if (clean.toLowerCase().includes('timbang') || clean === 'Mungkin') return 'Masih Dipertimbangkan';
      return clean;
    };

    return {
      'No.': index + 1,
      'No. Peserta': noPeserta,
      'Nama Peserta': item.nama_anak || '-',
      'Jenis Kelamin': item.jenis_kelamin || '-',
      'Tempat Lahir': item.tempat_lahir || '-',
      'Tanggal Lahir': formatDate(item.tgl_lahir),
      'Asal Sekolah': item.asal_sekolah || '-',
      'Cabang Lomba': item.cabang_lomba || '-',
      'Nama Orang Tua / Wali': item.nama_ortu || '-',
      'WhatsApp Ortu': waOrtu,
      'WhatsApp Guru / Pembimbing': waGuru,
      'Minat Masuk SD': formatMinat(item.minat_sekolah),
      'Link Foto Peserta': item.foto_url || '-',
      'Waktu Pendaftaran': formatDateTime(item.created_at)
    };
  });

  // Buat worksheet dari json data
  const worksheet = XLSX.utils.json_to_sheet(formattedRows);

  // Atur lebar kolom yang proporsional agar tidak terpotong saat dibuka
  worksheet['!cols'] = [
    { wch: 6 },  // No.
    { wch: 18 }, // No. Peserta
    { wch: 28 }, // Nama Peserta
    { wch: 16 }, // Jenis Kelamin
    { wch: 20 }, // Tempat Lahir
    { wch: 20 }, // Tanggal Lahir
    { wch: 32 }, // Asal Sekolah
    { wch: 22 }, // Cabang Lomba
    { wch: 26 }, // Nama Orang Tua
    { wch: 18 }, // WhatsApp Ortu
    { wch: 24 }, // WhatsApp Guru
    { wch: 18 }, // Minat Masuk SD
    { wch: 45 }, // Link Foto Peserta
    { wch: 22 }, // Waktu Pendaftaran
  ];

  // Buat workbook dan lampirkan worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Peserta');

  // Pastikan nama file berakhiran .xlsx
  const finalFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;

  // Tulis file dan otomatis trigger download di browser
  XLSX.writeFile(workbook, finalFilename);
}
