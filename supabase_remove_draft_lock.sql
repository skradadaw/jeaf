-- Menyederhanakan alur penilaian: setiap nilai yang disimpan langsung dianggap selesai.
-- Jalankan setelah supabase_penilaian_four_categories_fix.sql.

CREATE OR REPLACE FUNCTION public.validasi_penilaian_juri()
RETURNS TRIGGER AS $$
DECLARE
  kategori TEXT;
  jumlah_kriteria INTEGER;
  jumlah_detail_valid INTEGER;
  total_bobot NUMERIC;
  hasil NUMERIC := 0;
  criterion RECORD;
  nilai NUMERIC;
BEGIN
  SELECT cabang_lomba INTO kategori
  FROM public.pendaftar
  WHERE id = NEW.pendaftar_id;

  IF kategori IS NULL THEN
    RAISE EXCEPTION 'Peserta tidak ditemukan';
  END IF;
  IF kategori NOT IN ('MHQ', 'Adzan', 'Menyanyi Solo', 'Fashion Show') THEN
    RAISE EXCEPTION 'Kategori tidak tersedia untuk portal juri';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM public.juri j
    JOIN public.juri_kategori jk ON jk.juri_id = j.id
    WHERE j.id = NEW.juri_id
      AND j.aktif
      AND jk.cabang_lomba = kategori
  ) THEN
    RAISE EXCEPTION 'Juri tidak aktif atau tidak ditugaskan pada kategori peserta';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.pendaftar_id IS DISTINCT FROM OLD.pendaftar_id
      OR NEW.juri_id IS DISTINCT FROM OLD.juri_id THEN
      RAISE EXCEPTION 'Identitas peserta dan juri tidak dapat diubah';
    END IF;
    IF NEW.version <> OLD.version + 1 THEN
      RAISE EXCEPTION 'Nilai telah berubah di perangkat lain. Muat ulang sebelum menyimpan';
    END IF;
  ELSE
    NEW.version := 1;
  END IF;

  -- Status dipertahankan sebagai kolom internal untuk kompatibilitas data lama,
  -- tetapi tidak lagi memiliki alur draft atau locked.
  NEW.status := 'final';

  SELECT COUNT(*), COALESCE(SUM(bobot), 0)
  INTO jumlah_kriteria, total_bobot
  FROM public.kriteria_penilaian
  WHERE cabang_lomba = kategori AND aktif;

  IF jumlah_kriteria = 0 OR total_bobot <> 100 THEN
    RAISE EXCEPTION 'Konfigurasi kriteria kategori tidak valid';
  END IF;

  SELECT COUNT(*) INTO jumlah_detail_valid
  FROM jsonb_object_keys(COALESCE(NEW.detail_nilai, '{}'::jsonb)) d(kode)
  WHERE EXISTS (
    SELECT 1
    FROM public.kriteria_penilaian kp
    WHERE kp.cabang_lomba = kategori AND kp.kode = d.kode AND kp.aktif
  );

  IF jumlah_detail_valid <> jumlah_kriteria THEN
    RAISE EXCEPTION 'Semua kriteria wajib diisi sebelum nilai disimpan';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM jsonb_object_keys(COALESCE(NEW.detail_nilai, '{}'::jsonb)) d(kode)
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.kriteria_penilaian kp
      WHERE kp.cabang_lomba = kategori AND kp.kode = d.kode AND kp.aktif
    )
  ) THEN
    RAISE EXCEPTION 'Detail nilai mengandung kriteria yang tidak valid';
  END IF;

  FOR criterion IN
    SELECT *
    FROM public.kriteria_penilaian
    WHERE cabang_lomba = kategori AND aktif
    ORDER BY urutan
  LOOP
    IF jsonb_typeof(NEW.detail_nilai -> criterion.kode) <> 'number' THEN
      RAISE EXCEPTION 'Nilai kriteria % harus berupa angka', criterion.kode;
    END IF;
    nilai := (NEW.detail_nilai ->> criterion.kode)::NUMERIC;
    IF nilai < 0 OR nilai > criterion.nilai_maksimum THEN
      RAISE EXCEPTION 'Nilai kriteria % harus antara 0 dan %', criterion.kode, criterion.nilai_maksimum;
    END IF;
    hasil := hasil + (nilai / criterion.nilai_maksimum * 100) * (criterion.bobot / 100);
  END LOOP;

  NEW.nilai_total := ROUND(hasil);
  NEW.updated_at := now();
  NEW.finalized_at := COALESCE(NEW.finalized_at, now());
  NEW.locked_at := NULL;
  NEW.locked_by := NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ubah data lama menjadi nilai biasa. Kriteria draft yang belum pernah disentuh
-- diisi 0 agar tidak ada data yang hilang saat fitur draft dihapus.
WITH normalized AS (
  SELECT
    pj.id,
    jsonb_object_agg(
      kp.kode,
      COALESCE(pj.detail_nilai -> kp.kode, to_jsonb(0))
    ) AS detail_nilai
  FROM public.penilaian_juri pj
  JOIN public.pendaftar p ON p.id = pj.pendaftar_id
  JOIN public.kriteria_penilaian kp
    ON kp.cabang_lomba = p.cabang_lomba AND kp.aktif
  WHERE pj.status <> 'final'
     OR pj.locked_at IS NOT NULL
     OR pj.locked_by IS NOT NULL
  GROUP BY pj.id
)
UPDATE public.penilaian_juri pj
SET
  detail_nilai = normalized.detail_nilai,
  status = 'final',
  version = pj.version + 1,
  locked_at = NULL,
  locked_by = NULL
FROM normalized
WHERE pj.id = normalized.id;

ALTER TABLE public.penilaian_juri
  ALTER COLUMN status SET DEFAULT 'final';

ALTER TABLE public.penilaian_juri
  DROP CONSTRAINT IF EXISTS penilaian_juri_status_check;

ALTER TABLE public.penilaian_juri
  ADD CONSTRAINT penilaian_juri_status_check CHECK (status = 'final');

CREATE OR REPLACE FUNCTION public.get_ringkasan_penilaian(p_kategori TEXT)
RETURNS TABLE (
  pendaftar_id UUID,
  jumlah_juri INTEGER,
  jumlah_selesai INTEGER,
  nilai_akhir INTEGER,
  juri_belum TEXT[]
) AS $$
BEGIN
  IF p_kategori NOT IN ('MHQ', 'Adzan', 'Menyanyi Solo', 'Fashion Show') THEN
    RAISE EXCEPTION 'Kategori tidak tersedia untuk portal juri';
  END IF;
  IF NOT (
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR EXISTS (
      SELECT 1
      FROM public.juri j
      JOIN public.juri_kategori jk ON jk.juri_id = j.id
      WHERE j.user_id = auth.uid()
        AND j.aktif
        AND jk.cabang_lomba = p_kategori
    )
  ) THEN
    RAISE EXCEPTION 'Tidak memiliki akses ke kategori ini';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    COUNT(DISTINCT j.id)::INTEGER,
    COUNT(DISTINCT pj.juri_id)::INTEGER,
    CASE
      WHEN COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
       AND COUNT(DISTINCT pj.juri_id) = COUNT(DISTINCT j.id)
      THEN SUM(pj.nilai_total)::INTEGER
      ELSE NULL
    END,
    COALESCE(array_agg(j.nama ORDER BY j.kode) FILTER (
      WHERE pj.id IS NULL
    ), ARRAY[]::TEXT[])
  FROM public.pendaftar p
  JOIN public.juri_kategori jk ON jk.cabang_lomba = p.cabang_lomba
  JOIN public.juri j ON j.id = jk.juri_id AND j.aktif
  LEFT JOIN public.penilaian_juri pj
    ON pj.pendaftar_id = p.id AND pj.juri_id = j.id
  WHERE p.cabang_lomba = p_kategori
  GROUP BY p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.get_ringkasan_penilaian(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ringkasan_penilaian(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.recalculate_nilai_peserta(target_id UUID)
RETURNS VOID AS $$
DECLARE
  total_juri INTEGER;
  total_selesai INTEGER;
  jumlah INTEGER;
BEGIN
  SELECT COUNT(DISTINCT j.id) INTO total_juri
  FROM public.pendaftar p
  JOIN public.juri_kategori jk ON jk.cabang_lomba = p.cabang_lomba
  JOIN public.juri j ON j.id = jk.juri_id AND j.aktif
  WHERE p.id = target_id;

  SELECT COUNT(DISTINCT pj.juri_id), SUM(pj.nilai_total)::INTEGER
  INTO total_selesai, jumlah
  FROM public.penilaian_juri pj
  JOIN public.pendaftar p ON p.id = pj.pendaftar_id
  JOIN public.juri j ON j.id = pj.juri_id AND j.aktif
  JOIN public.juri_kategori jk
    ON jk.juri_id = pj.juri_id AND jk.cabang_lomba = p.cabang_lomba
  WHERE pj.pendaftar_id = target_id;

  UPDATE public.pendaftar
  SET nilai_total = CASE
    WHEN total_juri > 0 AND total_selesai = total_juri THEN jumlah
    ELSE NULL
  END
  WHERE id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.sync_nilai_akhir_peserta()
RETURNS TRIGGER AS $$
DECLARE
  target_pendaftar UUID := CASE
    WHEN TG_OP = 'DELETE' THEN OLD.pendaftar_id
    ELSE NEW.pendaftar_id
  END;
BEGIN
  PERFORM public.recalculate_nilai_peserta(target_pendaftar);
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$
DECLARE
  peserta RECORD;
BEGIN
  FOR peserta IN
    SELECT id
    FROM public.pendaftar
    WHERE cabang_lomba IN ('MHQ', 'Adzan', 'Menyanyi Solo', 'Fashion Show')
  LOOP
    PERFORM public.recalculate_nilai_peserta(peserta.id);
  END LOOP;
END;
$$;
