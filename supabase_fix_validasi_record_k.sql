-- Hotfix error: record "k" is not assigned yet.
-- Aman dijalankan tanpa menghapus data penilaian.

CREATE OR REPLACE FUNCTION public.validasi_penilaian_juri()
RETURNS TRIGGER AS $$
DECLARE
  kategori TEXT;
  jumlah_kriteria INTEGER;
  jumlah_detail_valid INTEGER;
  hasil NUMERIC := 0;
  criterion RECORD;
  nilai NUMERIC;
  is_admin BOOLEAN := COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
BEGIN
  SELECT cabang_lomba INTO kategori FROM public.pendaftar WHERE id = NEW.pendaftar_id;
  IF kategori IS NULL THEN RAISE EXCEPTION 'Peserta tidak ditemukan'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.juri j
    JOIN public.juri_kategori jk ON jk.juri_id = j.id
    WHERE j.id = NEW.juri_id AND j.aktif = true AND jk.cabang_lomba = kategori
  ) THEN
    RAISE EXCEPTION 'Juri tidak aktif atau tidak ditugaskan pada kategori peserta';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'locked' THEN
    RAISE EXCEPTION 'Nilai sudah dikunci dan tidak dapat diubah';
  END IF;
  IF NEW.status = 'locked' AND NOT is_admin THEN
    RAISE EXCEPTION 'Hanya admin yang dapat mengunci nilai';
  END IF;

  SELECT COUNT(*) INTO jumlah_kriteria FROM public.kriteria_penilaian
  WHERE cabang_lomba = kategori AND aktif = true;
  SELECT COUNT(*) INTO jumlah_detail_valid
  FROM jsonb_object_keys(COALESCE(NEW.detail_nilai, '{}'::jsonb)) AS d(kode)
  WHERE EXISTS (
    SELECT 1 FROM public.kriteria_penilaian kp
    WHERE kp.cabang_lomba = kategori AND kp.kode = d.kode AND kp.aktif = true
  );

  IF NEW.status IN ('final','locked') AND jumlah_detail_valid <> jumlah_kriteria THEN
    RAISE EXCEPTION 'Semua kriteria wajib diisi sebelum nilai difinalkan';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_object_keys(COALESCE(NEW.detail_nilai, '{}'::jsonb)) d(kode)
    WHERE NOT EXISTS (
      SELECT 1 FROM public.kriteria_penilaian kp
      WHERE kp.cabang_lomba = kategori AND kp.kode = d.kode AND kp.aktif
    )
  ) THEN
    RAISE EXCEPTION 'Detail nilai mengandung kriteria yang tidak valid';
  END IF;

  FOR criterion IN
    SELECT * FROM public.kriteria_penilaian
    WHERE cabang_lomba = kategori AND aktif ORDER BY urutan
  LOOP
    IF NEW.detail_nilai ? criterion.kode THEN
      BEGIN
        nilai := (NEW.detail_nilai ->> criterion.kode)::NUMERIC;
      EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Nilai kriteria % harus berupa angka', criterion.kode;
      END;
      IF nilai < 0 OR nilai > criterion.nilai_maksimum THEN
        RAISE EXCEPTION 'Nilai kriteria % harus antara 0 dan %', criterion.kode, criterion.nilai_maksimum;
      END IF;
      hasil := hasil + (nilai / criterion.nilai_maksimum * 100) * (criterion.bobot / 100);
    END IF;
  END LOOP;

  NEW.nilai_total := ROUND(hasil);
  NEW.updated_at := now();
  IF NEW.status IN ('final','locked') AND (TG_OP = 'INSERT' OR OLD.status = 'draft') THEN
    NEW.finalized_at := now();
  END IF;
  IF NEW.status = 'locked' THEN
    NEW.locked_at := now();
    NEW.locked_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
