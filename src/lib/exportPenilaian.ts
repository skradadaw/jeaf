import * as XLSX from 'xlsx';

type ExportCriterion = {
  id: string;
  label: string;
  weight: number;
};

type ExportJudge = {
  id: string;
  kode: string;
  nama: string;
};

type ExportScore = {
  juri_id: string;
  detail_nilai: Record<string, number>;
  nilai_total: number;
  catatan: string;
};

type ExportParticipant = {
  nomor_urut: number;
  no_peserta: string;
  nama_lengkap: string;
  asal: string;
  kategori: string;
  status_nilai: string;
  total_nilai: number | null;
  nilai_juri: ExportScore[];
};

type ExportPenilaianOptions = {
  kategori: string;
  peserta: ExportParticipant[];
  juri: ExportJudge[];
  kriteria: ExportCriterion[];
};

const safeText = (value: unknown) => {
  const text = String(value ?? '');
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
};

const safeSheetName = (value: string, fallback: string) => {
  const cleaned = value.replace(/[\\/?*\[\]:]/g, ' ').replace(/\s+/g, ' ').trim();
  return (cleaned || fallback).slice(0, 31);
};

const applySheetLayout = (worksheet: XLSX.WorkSheet, widths: number[]) => {
  worksheet['!cols'] = widths.map((wch) => ({ wch }));
  if (worksheet['!ref']) worksheet['!autofilter'] = { ref: worksheet['!ref'] };
};

export function exportPenilaianToExcel({ kategori, peserta, juri, kriteria }: ExportPenilaianOptions) {
  if (peserta.length === 0) throw new Error('Tidak ada data peserta yang dapat diekspor.');
  if (juri.length === 0) throw new Error('Daftar juri aktif tidak tersedia.');

  const workbook = XLSX.utils.book_new();
  const rankedParticipants = [...peserta].sort((first, second) =>
    (second.total_nilai ?? -1) - (first.total_nilai ?? -1)
      || first.nomor_urut - second.nomor_urut
  );
  let currentRank = 0;

  const accumulationRows = rankedParticipants.map((participant) => {
    const row: Record<string, string | number> = {
      Peringkat: participant.total_nilai === null ? '' : ++currentRank,
      'No. Urut': participant.nomor_urut,
      'Kode Peserta': safeText(participant.no_peserta),
      'Nama Peserta': safeText(participant.nama_lengkap),
      'Asal Sekolah': safeText(participant.asal),
    };

    juri.forEach((judge) => {
      const score = participant.nilai_juri.find((item) => item.juri_id === judge.id);
      row[`Nilai ${judge.nama}`] = score?.nilai_total ?? '';
    });

    row['Status Penilaian'] = safeText(participant.status_nilai);
    row['Nilai Akhir'] = participant.total_nilai ?? '';
    return row;
  });

  const accumulationSheet = XLSX.utils.json_to_sheet(accumulationRows);
  applySheetLayout(accumulationSheet, [11, 10, 18, 30, 30, ...juri.map(() => 20), 28, 14]);
  XLSX.utils.book_append_sheet(workbook, accumulationSheet, 'Akumulasi');

  const participantsByNumber = [...peserta].sort((first, second) => first.nomor_urut - second.nomor_urut);
  juri.forEach((judge, judgeIndex) => {
    const judgeRows = participantsByNumber.map((participant) => {
      const score = participant.nilai_juri.find((item) => item.juri_id === judge.id);
      const row: Record<string, string | number> = {
        'No. Urut': participant.nomor_urut,
        'Kode Peserta': safeText(participant.no_peserta),
        'Nama Peserta': safeText(participant.nama_lengkap),
        'Asal Sekolah': safeText(participant.asal),
      };

      kriteria.forEach((criterion) => {
        row[`${criterion.label} (${criterion.weight}%)`] = score?.detail_nilai?.[criterion.id] ?? '';
      });

      row['Total Nilai'] = score?.nilai_total ?? '';
      row['Catatan Juri'] = safeText(score?.catatan || '');
      row.Status = score ? 'Sudah Dinilai' : 'Belum Dinilai';
      return row;
    });

    const judgeSheet = XLSX.utils.json_to_sheet(judgeRows);
    applySheetLayout(judgeSheet, [10, 18, 30, 30, ...kriteria.map(() => 30), 14, 36, 16]);
    const sheetName = safeSheetName(`${judge.kode} - ${judge.nama}`, `Juri ${judgeIndex + 1}`);
    XLSX.utils.book_append_sheet(workbook, judgeSheet, sheetName);
  });

  const categoryName = kategori.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `Hasil_Penilaian_${categoryName}_${date}.xlsx`, { compression: true });
}
