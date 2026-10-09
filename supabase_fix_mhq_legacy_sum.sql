-- Hotfix tahap 4: hitung ulang nilai akhir dengan SUM yang sadar ruangan MHQ.
-- Tidak mengubah pembagian peserta maupun nilai individual juri.

BEGIN;

WITH score_summary AS (
  SELECT
    p.id AS pendaftar_id,
    p.cabang_lomba,
    COUNT(DISTINCT j.id)::INTEGER AS total_juri,
    COUNT(DISTINCT pj.juri_id)::INTEGER AS total_selesai,
    SUM(pj.nilai_total)::INTEGER AS jumlah_nilai
  FROM public.pendaftar AS p
  LEFT JOIN public.juri_kategori AS jk ON jk.cabang_lomba = p.cabang_lomba
  LEFT JOIN public.juri AS j
    ON j.id = jk.juri_id
   AND j.aktif
   AND (p.cabang_lomba <> 'MHQ' OR j.ruangan_mhq = p.ruangan_mhq)
  LEFT JOIN public.penilaian_juri AS pj
    ON pj.pendaftar_id = p.id
   AND pj.juri_id = j.id
   AND pj.status IN ('final', 'locked')
  GROUP BY p.id, p.cabang_lomba
)
UPDATE public.pendaftar AS p
SET nilai_total = CASE
  WHEN ss.cabang_lomba = 'MHQ'
       AND ss.total_juri = 2
       AND ss.total_selesai = 2
    THEN ss.jumlah_nilai
  WHEN ss.cabang_lomba <> 'MHQ'
       AND ss.total_juri > 0
       AND ss.total_selesai = ss.total_juri
    THEN ss.jumlah_nilai
  ELSE NULL
END
FROM score_summary AS ss
WHERE ss.pendaftar_id = p.id;

COMMIT;

-- Verifikasi: hasil kosong berarti tidak ada nilai akhir yang tidak sesuai.
WITH expected AS (
  SELECT
    p.id,
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
)
SELECT p.no_peserta, p.nilai_total AS tersimpan, e.nilai_seharusnya
FROM public.pendaftar AS p
JOIN expected AS e ON e.id = p.id
WHERE p.nilai_total IS DISTINCT FROM e.nilai_seharusnya
ORDER BY p.no_peserta;
