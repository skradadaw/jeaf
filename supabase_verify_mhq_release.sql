-- Pemeriksaan drift rilis MHQ. Hanya SELECT dan tidak mengubah data.
-- Jalankan sebagai satu query setelah supabase_mhq_ruangan.sql.

WITH
room_counts AS (
  SELECT room_number,
    COUNT(DISTINCT jk.juri_id)::INTEGER AS judge_count
  FROM (VALUES (1::SMALLINT), (2::SMALLINT)) AS rooms(room_number)
  LEFT JOIN public.juri AS j
    ON j.ruangan_mhq = rooms.room_number AND j.aktif
  LEFT JOIN public.juri_kategori AS jk
    ON jk.juri_id = j.id AND jk.cabang_lomba = 'MHQ'
  GROUP BY room_number
),
required_triggers(trigger_name, table_name) AS (
  VALUES
    ('tempatkan_pendaftar_baru_mhq_trigger', 'pendaftar'),
    ('cegah_perubahan_ruangan_mhq_trigger', 'pendaftar'),
    ('validasi_ruangan_penilaian_mhq_trigger', 'penilaian_juri'),
    ('jaga_dua_juri_mhq_dari_perubahan_juri_trigger', 'juri'),
    ('jaga_dua_juri_mhq_dari_penugasan_trigger', 'juri_kategori')
),
installed_triggers AS (
  SELECT t.tgname AS trigger_name, c.relname AS table_name
  FROM pg_catalog.pg_trigger AS t
  JOIN pg_catalog.pg_class AS c ON c.oid = t.tgrelid
  JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
  WHERE NOT t.tgisinternal
    AND n.nspname = 'public'
),
expected_scores AS (
  SELECT p.id,
    CASE
      WHEN COUNT(DISTINCT j.id) = 2 AND COUNT(DISTINCT pj.juri_id) = 2
        THEN SUM(pj.nilai_total)::INTEGER
      ELSE NULL
    END AS nilai_seharusnya
  FROM public.pendaftar AS p
  LEFT JOIN public.juri_kategori AS jk ON jk.cabang_lomba = 'MHQ'
  LEFT JOIN public.juri AS j
    ON j.id = jk.juri_id
   AND j.aktif
   AND j.ruangan_mhq = p.ruangan_mhq
  LEFT JOIN public.penilaian_juri AS pj
    ON pj.pendaftar_id = p.id
   AND pj.juri_id = j.id
   AND pj.status IN ('final', 'locked')
  WHERE p.cabang_lomba = 'MHQ'
  GROUP BY p.id
),
checks AS (
  SELECT 1 AS urutan, 'Versi migrasi'::TEXT AS pemeriksaan,
    EXISTS (
      SELECT 1 FROM public.versi_migrasi_aplikasi
      WHERE migration_key = 'mhq_rooms' AND version = '2026.10.09.1'
    ) AS lulus,
    COALESCE((
      SELECT 'Versi terpasang: ' || version
      FROM public.versi_migrasi_aplikasi
      WHERE migration_key = 'mhq_rooms'
    ), 'Penanda versi mhq_rooms belum tersedia') AS detail

  UNION ALL

  SELECT 2, 'Kolom ruangan', COUNT(*) = 2,
    FORMAT('Kolom ditemukan: %s/2', COUNT(*))
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name = 'ruangan_mhq'
    AND table_name IN ('pendaftar', 'juri')

  UNION ALL

  SELECT 3, 'Pembagian dikunci',
    COALESCE((SELECT pm.pembagian_dikunci FROM public.pengaturan_mhq AS pm WHERE pm.id), false),
    COALESCE((
      SELECT FORMAT(
        'dikunci=%s, peserta_awal=%s, batas_ruang_1=%s',
        pm.pembagian_dikunci,
        COALESCE(pm.jumlah_peserta_awal::TEXT, 'null'),
        COALESCE(pm.batas_ruang_1::TEXT, 'null')
      )
      FROM public.pengaturan_mhq AS pm WHERE pm.id
    ), 'Baris pengaturan MHQ belum tersedia')

  UNION ALL

  SELECT 4, 'Peserta mempunyai ruangan', COUNT(*) = 0,
    FORMAT('Peserta MHQ tanpa ruangan: %s', COUNT(*))
  FROM public.pendaftar
  WHERE cabang_lomba = 'MHQ' AND ruangan_mhq IS NULL

  UNION ALL

  SELECT 5, 'Dua juri aktif per ruangan', BOOL_AND(judge_count = 2),
    STRING_AGG(FORMAT('Ruang %s=%s', room_number, judge_count), ', ' ORDER BY room_number)
  FROM room_counts

  UNION ALL

  SELECT 6, 'Trigger perlindungan lengkap', COUNT(i.trigger_name) = COUNT(*),
    FORMAT('Trigger ditemukan: %s/%s', COUNT(i.trigger_name), COUNT(*))
  FROM required_triggers AS r
  LEFT JOIN installed_triggers AS i USING (trigger_name, table_name)

  UNION ALL

  SELECT 7, 'Fungsi dashboard lengkap',
    to_regprocedure('public.get_dashboard_penilaian(text)') IS NOT NULL
      AND to_regprocedure('public.get_status_penilaian_peserta(uuid)') IS NOT NULL
      AND to_regprocedure('public.get_status_ruangan_mhq()') IS NOT NULL,
    'Memeriksa tiga RPC dashboard/status'

  UNION ALL

  SELECT 8, 'Tidak ada nilai lintas ruangan', COUNT(*) = 0,
    FORMAT('Nilai lintas ruangan: %s', COUNT(*))
  FROM public.penilaian_juri AS pj
  JOIN public.pendaftar AS p ON p.id = pj.pendaftar_id
  JOIN public.juri AS j ON j.id = pj.juri_id
  WHERE p.cabang_lomba = 'MHQ'
    AND j.ruangan_mhq IS DISTINCT FROM p.ruangan_mhq

  UNION ALL

  SELECT 9, 'SUM nilai akhir konsisten', COUNT(*) = 0,
    FORMAT('Nilai akhir tidak sesuai: %s', COUNT(*))
  FROM public.pendaftar AS p
  JOIN expected_scores AS e ON e.id = p.id
  WHERE p.nilai_total IS DISTINCT FROM e.nilai_seharusnya

  UNION ALL

  SELECT 10, 'Akun juri aktif terhubung', COUNT(*) = 0,
    FORMAT('Juri MHQ aktif tanpa akun: %s', COUNT(*))
  FROM public.juri AS j
  JOIN public.juri_kategori AS jk ON jk.juri_id = j.id
  WHERE jk.cabang_lomba = 'MHQ'
    AND j.aktif
    AND j.user_id IS NULL
)
SELECT
  urutan,
  pemeriksaan,
  lulus,
  detail,
  CASE WHEN BOOL_AND(lulus) OVER () THEN 'LULUS' ELSE 'GAGAL' END AS status_release
FROM checks
ORDER BY urutan;
