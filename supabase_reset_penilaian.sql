-- ==============================================================================
-- SKRIP RESET PENILAIAN PESERTA (JINGA FESTIVAL)
-- ==============================================================================
-- PERINGATAN: Skrip ini akan menghapus seluruh data penilaian juri dan
-- mengosongkan nilai semua peserta di database.
-- Data profil peserta, akun juri, dan penugasan juri TIDAK akan dihapus.
--
-- Cara menjalankan:
-- Buka Supabase Dashboard -> SQL Editor -> Tempel skrip ini -> Klik Run
-- ==============================================================================

BEGIN;

-- 1. Hapus seluruh data penilaian juri
DELETE FROM public.penilaian_juri;

-- 2. Kosongkan nilai ringkasan dan catatan juri pada tabel peserta
UPDATE public.pendaftar
SET 
    nilai_total = NULL,
    detail_nilai = NULL,
    catatan_juri = NULL;

-- 3. Bersihkan riwayat log/audit penilaian juri
-- (Dihapus terakhir agar log aksi delete otomatis di atas juga ikut terhapus)
DELETE FROM public.audit_penilaian_juri;

COMMIT;

-- ==============================================================================
-- QUERY VERIFIKASI HASIL RESET
-- Seluruh hasil count di bawah ini harus menghasilkan nilai 0
-- ==============================================================================
SELECT 
    (SELECT COUNT(*) FROM public.penilaian_juri) AS sisa_nilai_juri,
    (SELECT COUNT(*) FROM public.pendaftar WHERE nilai_total IS NOT NULL) AS sisa_peserta_ada_nilai,
    (SELECT COUNT(*) FROM public.audit_penilaian_juri) AS sisa_log_audit;
