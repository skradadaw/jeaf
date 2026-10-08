-- Perbaikan lanjutan khusus MHQ, Adzan, Menyanyi Solo, dan Fashion Show.

ALTER TABLE public.penilaian_juri ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Juri hanya boleh membaca identitas, penugasan, dan detail nilainya sendiri.
DROP POLICY IF EXISTS "Juri membaca daftar juri" ON public.juri;
DROP POLICY IF EXISTS "Juri membaca identitas sendiri" ON public.juri;
CREATE POLICY "Juri membaca identitas sendiri" ON public.juri
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Juri membaca daftar penugasan" ON public.juri_kategori;
DROP POLICY IF EXISTS "Juri membaca penugasannya" ON public.juri_kategori;
CREATE POLICY "Juri membaca penugasannya" ON public.juri_kategori
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.juri j
  WHERE j.id = juri_kategori.juri_id AND j.user_id = auth.uid() AND j.aktif
));

DROP POLICY IF EXISTS "Juri membaca progres cabangnya" ON public.penilaian_juri;
DROP POLICY IF EXISTS "Juri membaca nilainya sendiri" ON public.penilaian_juri;
CREATE POLICY "Juri membaca nilainya sendiri" ON public.penilaian_juri
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.juri j
  WHERE j.id = penilaian_juri.juri_id AND j.user_id = auth.uid() AND j.aktif
));

-- Ringkasan aman: tidak pernah mengembalikan angka atau catatan juri lain.
CREATE OR REPLACE FUNCTION public.get_ringkasan_penilaian(p_kategori TEXT)
RETURNS TABLE (
  pendaftar_id UUID,
  jumlah_juri INTEGER,
  jumlah_selesai INTEGER,
  nilai_akhir INTEGER,
  juri_belum TEXT[]
) AS $$
BEGIN
  IF p_kategori NOT IN ('MHQ','Adzan','Menyanyi Solo','Fashion Show') THEN
    RAISE EXCEPTION 'Kategori tidak tersedia untuk portal juri';
  END IF;
  IF NOT (
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR EXISTS (
      SELECT 1 FROM public.juri j
      JOIN public.juri_kategori jk ON jk.juri_id = j.id
      WHERE j.user_id = auth.uid() AND j.aktif AND jk.cabang_lomba = p_kategori
    )
  ) THEN
    RAISE EXCEPTION 'Tidak memiliki akses ke kategori ini';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    COUNT(DISTINCT j.id)::INTEGER,
    COUNT(DISTINCT pj.juri_id) FILTER (WHERE pj.status IN ('final','locked'))::INTEGER,
    CASE
      WHEN COUNT(DISTINCT pj.juri_id) FILTER (WHERE pj.status IN ('final','locked')) = COUNT(DISTINCT j.id)
      THEN ROUND(AVG(pj.nilai_total) FILTER (WHERE pj.status IN ('final','locked')))::INTEGER
      ELSE NULL
    END,
    COALESCE(array_agg(j.nama ORDER BY j.kode) FILTER (
      WHERE NOT EXISTS (
        SELECT 1 FROM public.penilaian_juri done
        WHERE done.pendaftar_id = p.id AND done.juri_id = j.id AND done.status IN ('final','locked')
      )
    ), ARRAY[]::TEXT[])
  FROM public.pendaftar p
  JOIN public.juri_kategori jk ON jk.cabang_lomba = p.cabang_lomba
  JOIN public.juri j ON j.id = jk.juri_id AND j.aktif
  LEFT JOIN public.penilaian_juri pj ON pj.pendaftar_id = p.id AND pj.juri_id = j.id
  WHERE p.cabang_lomba = p_kategori
  GROUP BY p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.get_ringkasan_penilaian(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ringkasan_penilaian(TEXT) TO authenticated;

-- Perbaiki audit DELETE tanpa menyentuh record NEW yang tidak tersedia.
CREATE OR REPLACE FUNCTION public.audit_perubahan_penilaian()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_penilaian_juri
      (penilaian_juri_id, pendaftar_id, juri_id, aksi, status_lama, data_lama, actor_user_id, actor_role)
    VALUES
      (OLD.id, OLD.pendaftar_id, OLD.juri_id, TG_OP, OLD.status, to_jsonb(OLD), auth.uid(), COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', 'juri'));
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_penilaian_juri
      (penilaian_juri_id, pendaftar_id, juri_id, aksi, status_baru, data_baru, actor_user_id, actor_role)
    VALUES
      (NEW.id, NEW.pendaftar_id, NEW.juri_id, TG_OP, NEW.status, to_jsonb(NEW), auth.uid(), COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', 'juri'));
    RETURN NEW;
  END IF;

  INSERT INTO public.audit_penilaian_juri
    (penilaian_juri_id, pendaftar_id, juri_id, aksi, status_lama, status_baru, data_lama, data_baru, actor_user_id, actor_role)
  VALUES
    (NEW.id, NEW.pendaftar_id, NEW.juri_id, TG_OP, OLD.status, NEW.status, to_jsonb(OLD), to_jsonb(NEW), auth.uid(), COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', 'juri'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Validasi transisi status dan optimistic locking disisipkan ke fungsi validasi aktif.
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
  is_admin BOOLEAN := COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
BEGIN
  SELECT cabang_lomba INTO kategori FROM public.pendaftar WHERE id = NEW.pendaftar_id;
  IF kategori IS NULL THEN RAISE EXCEPTION 'Peserta tidak ditemukan'; END IF;
  IF kategori NOT IN ('MHQ','Adzan','Menyanyi Solo','Fashion Show') THEN RAISE EXCEPTION 'Kategori tidak tersedia untuk portal juri'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.juri j JOIN public.juri_kategori jk ON jk.juri_id = j.id
    WHERE j.id = NEW.juri_id AND j.aktif AND jk.cabang_lomba = kategori
  ) THEN RAISE EXCEPTION 'Juri tidak aktif atau tidak ditugaskan pada kategori peserta'; END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'locked' THEN RAISE EXCEPTION 'Nilai sudah dikunci dan tidak dapat diubah'; END IF;
    IF NEW.version <> OLD.version + 1 THEN RAISE EXCEPTION 'Nilai telah berubah di perangkat lain. Muat ulang sebelum menyimpan'; END IF;
    IF NOT is_admin AND OLD.status = 'final' AND NEW.status <> 'final' THEN RAISE EXCEPTION 'Nilai final tidak dapat dikembalikan menjadi draft'; END IF;
  ELSE
    NEW.version := 1;
  END IF;
  IF NEW.status = 'locked' AND NOT is_admin THEN RAISE EXCEPTION 'Hanya admin yang dapat mengunci nilai'; END IF;

  SELECT COUNT(*), COALESCE(SUM(bobot),0) INTO jumlah_kriteria, total_bobot
  FROM public.kriteria_penilaian WHERE cabang_lomba = kategori AND aktif;
  IF jumlah_kriteria = 0 OR total_bobot <> 100 THEN RAISE EXCEPTION 'Konfigurasi kriteria kategori tidak valid'; END IF;

  SELECT COUNT(*) INTO jumlah_detail_valid
  FROM jsonb_object_keys(COALESCE(NEW.detail_nilai, '{}'::jsonb)) d(kode)
  WHERE EXISTS (SELECT 1 FROM public.kriteria_penilaian kp WHERE kp.cabang_lomba = kategori AND kp.kode = d.kode AND kp.aktif);
  IF NEW.status IN ('final','locked') AND jumlah_detail_valid <> jumlah_kriteria THEN RAISE EXCEPTION 'Semua kriteria wajib diisi sebelum nilai difinalkan'; END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_object_keys(COALESCE(NEW.detail_nilai, '{}'::jsonb)) d(kode)
    WHERE NOT EXISTS (SELECT 1 FROM public.kriteria_penilaian kp WHERE kp.cabang_lomba = kategori AND kp.kode = d.kode AND kp.aktif)
  ) THEN RAISE EXCEPTION 'Detail nilai mengandung kriteria yang tidak valid'; END IF;

  FOR criterion IN SELECT * FROM public.kriteria_penilaian WHERE cabang_lomba = kategori AND aktif ORDER BY urutan LOOP
    IF NEW.detail_nilai ? criterion.kode THEN
      IF jsonb_typeof(NEW.detail_nilai -> criterion.kode) <> 'number' THEN RAISE EXCEPTION 'Nilai kriteria % harus berupa angka', criterion.kode; END IF;
      nilai := (NEW.detail_nilai ->> criterion.kode)::NUMERIC;
      IF nilai < 0 OR nilai > criterion.nilai_maksimum THEN RAISE EXCEPTION 'Nilai kriteria % harus antara 0 dan %', criterion.kode, criterion.nilai_maksimum; END IF;
      hasil := hasil + (nilai / criterion.nilai_maksimum * 100) * (criterion.bobot / 100);
    END IF;
  END LOOP;

  NEW.nilai_total := ROUND(hasil);
  NEW.updated_at := now();
  IF NEW.status IN ('final','locked') AND (TG_OP = 'INSERT' OR OLD.status = 'draft') THEN NEW.finalized_at := now(); END IF;
  IF NEW.status = 'locked' THEN NEW.locked_at := now(); NEW.locked_by := auth.uid(); END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fungsi tunggal untuk menghitung nilai akhir seorang peserta.
CREATE OR REPLACE FUNCTION public.recalculate_nilai_peserta(target_id UUID)
RETURNS VOID AS $$
DECLARE total_juri INTEGER; total_selesai INTEGER; rata INTEGER;
BEGIN
  SELECT COUNT(DISTINCT j.id) INTO total_juri
  FROM public.pendaftar p JOIN public.juri_kategori jk ON jk.cabang_lomba=p.cabang_lomba
  JOIN public.juri j ON j.id=jk.juri_id AND j.aktif WHERE p.id=target_id;
  SELECT COUNT(DISTINCT pj.juri_id), ROUND(AVG(pj.nilai_total))::INTEGER INTO total_selesai, rata
  FROM public.penilaian_juri pj JOIN public.juri j ON j.id=pj.juri_id AND j.aktif
  WHERE pj.pendaftar_id=target_id AND pj.status IN ('final','locked');
  UPDATE public.pendaftar SET nilai_total=CASE WHEN total_juri>0 AND total_selesai=total_juri THEN rata ELSE NULL END WHERE id=target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path=public;

CREATE OR REPLACE FUNCTION public.recalculate_after_jury_change()
RETURNS TRIGGER AS $$
DECLARE kategori_target TEXT;
BEGIN
  IF TG_TABLE_NAME = 'juri_kategori' THEN
    kategori_target := CASE WHEN TG_OP = 'DELETE' THEN OLD.cabang_lomba ELSE NEW.cabang_lomba END;
  ELSE
    FOR kategori_target IN SELECT cabang_lomba FROM public.juri_kategori WHERE juri_id=NEW.id LOOP
      PERFORM public.recalculate_nilai_peserta(p.id) FROM public.pendaftar p WHERE p.cabang_lomba=kategori_target;
    END LOOP;
    RETURN NEW;
  END IF;
  PERFORM public.recalculate_nilai_peserta(p.id) FROM public.pendaftar p WHERE p.cabang_lomba=kategori_target;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path=public;

DROP TRIGGER IF EXISTS recalculate_after_juri_active ON public.juri;
CREATE TRIGGER recalculate_after_juri_active AFTER UPDATE OF aktif ON public.juri
FOR EACH ROW WHEN (OLD.aktif IS DISTINCT FROM NEW.aktif) EXECUTE FUNCTION public.recalculate_after_jury_change();
DROP TRIGGER IF EXISTS recalculate_after_assignment ON public.juri_kategori;
CREATE TRIGGER recalculate_after_assignment AFTER INSERT OR UPDATE OR DELETE ON public.juri_kategori
FOR EACH ROW EXECUTE FUNCTION public.recalculate_after_jury_change();
