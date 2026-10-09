-- Migrasi nilai akhir: jumlah seluruh nilai juri, bukan rata-rata.
-- Jalankan satu kali melalui Supabase SQL Editor.
-- Aman dijalankan ulang pada instalasi yang sudah memakai sistem penilaian terbaru.

BEGIN;

-- Perbarui fungsi-fungsi aktif tanpa mengubah parameter, hak akses, atau struktur
-- responsnya. pg_get_functiondef dipakai agar migrasi tetap cocok dengan versi
-- fungsi yang saat ini sudah terpasang pada database.
DO $$
DECLARE
  target_function RECORD;
  old_definition TEXT;
  new_definition TEXT;
BEGIN
  FOR target_function IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS arguments
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'sync_nilai_akhir_peserta',
        'recalculate_nilai_peserta',
        'get_ringkasan_penilaian',
        'get_dashboard_penilaian',
        'get_status_penilaian_peserta'
      )
  LOOP
    old_definition := pg_get_functiondef(target_function.oid);
    new_definition := old_definition;

    -- Bentuk yang dipakai migrasi penilaian terbaru.
    new_definition := regexp_replace(
      new_definition,
      'round\s*\(\s*avg\s*\(\s*pj\.nilai_total\s*\)\s*\)\s*::\s*integer',
      'sum(pj.nilai_total)::integer',
      'gi'
    );

    -- Bentuk yang dipakai schema/migrasi multi-juri lama.
    new_definition := regexp_replace(
      new_definition,
      'round\s*\(\s*avg\s*\(\s*nilai_total\s*\)\s*\)\s*::\s*integer',
      'sum(nilai_total)::integer',
      'gi'
    );

    -- Bentuk agregat dengan FILTER dari migrasi hardening lama.
    new_definition := regexp_replace(
      new_definition,
      'round\s*\(\s*avg\s*\(\s*pj\.nilai_total\s*\)\s*filter\s*\(([^;]+?)\)\s*\)\s*::\s*integer',
      '(sum(pj.nilai_total) filter (\1))::integer',
      'gi'
    );

    IF new_definition IS DISTINCT FROM old_definition THEN
      EXECUTE new_definition;
      RAISE NOTICE 'Fungsi %.%(%) diperbarui ke penjumlahan.', 'public', target_function.proname, target_function.arguments;
    ELSE
      RAISE NOTICE 'Fungsi %.%(%) tidak memerlukan perubahan atau sudah memakai SUM.', 'public', target_function.proname, target_function.arguments;
    END IF;
  END LOOP;
END;
$$;

-- Hitung ulang nilai_total seluruh peserta. Nilai hanya diterbitkan jika semua
-- juri aktif pada cabang peserta tersebut sudah memberikan nilai.
WITH score_summary AS (
  SELECT
    p.id AS pendaftar_id,
    COUNT(DISTINCT j.id)::INTEGER AS total_juri,
    COUNT(DISTINCT pj.juri_id)::INTEGER AS total_selesai,
    SUM(pj.nilai_total)::INTEGER AS jumlah_nilai
  FROM public.pendaftar AS p
  LEFT JOIN public.juri_kategori AS jk ON jk.cabang_lomba = p.cabang_lomba
  LEFT JOIN public.juri AS j ON j.id = jk.juri_id AND j.aktif
    AND (p.cabang_lomba <> 'MHQ' OR j.ruangan_mhq = p.ruangan_mhq)
  LEFT JOIN public.penilaian_juri AS pj
    ON pj.pendaftar_id = p.id
   AND pj.juri_id = j.id
   AND pj.status IN ('final', 'locked')
  GROUP BY p.id
)
UPDATE public.pendaftar AS p
SET nilai_total = CASE
  WHEN ss.total_juri > 0 AND ss.total_selesai = ss.total_juri
    THEN ss.jumlah_nilai
  ELSE NULL
END
FROM score_summary AS ss
WHERE ss.pendaftar_id = p.id;

COMMIT;

-- Hasil pemeriksaan setelah migrasi. Kolom sesuai harus bernilai true.
SELECT
  p.no_peserta,
  p.nama_anak,
  p.cabang_lomba,
  p.nilai_total AS nilai_akhir_tersimpan,
  SUM(pj.nilai_total)::INTEGER AS jumlah_nilai_juri,
  p.nilai_total = SUM(pj.nilai_total)::INTEGER AS sesuai
FROM public.pendaftar AS p
JOIN public.penilaian_juri AS pj ON pj.pendaftar_id = p.id
JOIN public.juri AS j ON j.id = pj.juri_id
  AND (p.cabang_lomba <> 'MHQ' OR j.ruangan_mhq = p.ruangan_mhq)
WHERE p.nilai_total IS NOT NULL
GROUP BY p.id, p.no_peserta, p.nama_anak, p.cabang_lomba, p.nilai_total
ORDER BY p.cabang_lomba, p.no_peserta;
