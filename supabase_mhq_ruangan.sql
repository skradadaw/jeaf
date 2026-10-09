-- Migrasi kanonis MHQ: pembagian ruangan, penguncian, dua juri per ruangan,
-- validasi nilai lintas ruangan, RPC dashboard, dan rekalkulasi SUM.
-- Aman dijalankan ulang: pembagian peserta yang sudah dikunci tidak diubah.

BEGIN;

CREATE TABLE IF NOT EXISTS public.versi_migrasi_aplikasi (
  migration_key TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.versi_migrasi_aplikasi ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin membaca versi migrasi" ON public.versi_migrasi_aplikasi;
CREATE POLICY "Admin membaca versi migrasi"
ON public.versi_migrasi_aplikasi FOR SELECT TO authenticated
USING (COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false));

ALTER TABLE public.pendaftar
  ADD COLUMN IF NOT EXISTS ruangan_mhq SMALLINT CHECK (ruangan_mhq IN (1, 2));

ALTER TABLE public.juri
  ADD COLUMN IF NOT EXISTS ruangan_mhq SMALLINT CHECK (ruangan_mhq IN (1, 2));

UPDATE public.juri SET ruangan_mhq = 1 WHERE kode IN ('MHQ-J1', 'MHQ-J2');
UPDATE public.juri SET ruangan_mhq = 2 WHERE kode IN ('MHQ-J3', 'MHQ-J4');

CREATE TABLE IF NOT EXISTS public.pengaturan_mhq (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
  pembagian_dikunci BOOLEAN NOT NULL DEFAULT false,
  jumlah_peserta_awal INTEGER,
  batas_ruang_1 INTEGER,
  dikunci_pada TIMESTAMPTZ,
  dikunci_oleh UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

INSERT INTO public.pengaturan_mhq (id) VALUES (true) ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.pengaturan_mhq ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pengguna login membaca pengaturan MHQ" ON public.pengaturan_mhq;
CREATE POLICY "Pengguna login membaca pengaturan MHQ"
ON public.pengaturan_mhq FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS pendaftar_mhq_ruangan_idx
ON public.pendaftar (cabang_lomba, ruangan_mhq);

CREATE OR REPLACE FUNCTION public.tempatkan_pendaftar_baru_mhq()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.cabang_lomba = 'MHQ'
       AND COALESCE((SELECT pembagian_dikunci FROM public.pengaturan_mhq WHERE id), false)
    THEN
      NEW.ruangan_mhq := 2;
    ELSIF NEW.cabang_lomba IS DISTINCT FROM 'MHQ' THEN
      NEW.ruangan_mhq := NULL;
    END IF;
  ELSIF NEW.cabang_lomba IS DISTINCT FROM OLD.cabang_lomba THEN
    IF NEW.cabang_lomba = 'MHQ'
       AND COALESCE((SELECT pembagian_dikunci FROM public.pengaturan_mhq WHERE id), false)
    THEN
      -- Peserta yang benar-benar dipindahkan dari cabang lain ke MHQ dianggap
      -- pendaftar baru dan ditempatkan di Ruang 2.
      NEW.ruangan_mhq := 2;
    ELSIF NEW.cabang_lomba IS DISTINCT FROM 'MHQ' THEN
      NEW.ruangan_mhq := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tempatkan_pendaftar_baru_mhq_trigger ON public.pendaftar;
CREATE TRIGGER tempatkan_pendaftar_baru_mhq_trigger
BEFORE INSERT OR UPDATE OF cabang_lomba ON public.pendaftar
FOR EACH ROW EXECUTE FUNCTION public.tempatkan_pendaftar_baru_mhq();

-- Setelah pembagian dikunci, peserta yang tetap berada di cabang MHQ tidak boleh
-- berpindah ruangan akibat migrasi ulang atau pembaruan data biasa.
CREATE OR REPLACE FUNCTION public.cegah_perubahan_ruangan_mhq()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.cabang_lomba = 'MHQ'
     AND NEW.cabang_lomba = 'MHQ'
     AND NEW.ruangan_mhq IS DISTINCT FROM OLD.ruangan_mhq
     AND COALESCE((SELECT pembagian_dikunci FROM public.pengaturan_mhq WHERE id), false)
  THEN
    RAISE EXCEPTION 'Pembagian ruangan MHQ sudah dikunci dan tidak dapat diubah';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cegah_perubahan_ruangan_mhq_trigger ON public.pendaftar;
CREATE TRIGGER cegah_perubahan_ruangan_mhq_trigger
BEFORE UPDATE OF ruangan_mhq ON public.pendaftar
FOR EACH ROW EXECUTE FUNCTION public.cegah_perubahan_ruangan_mhq();

CREATE OR REPLACE FUNCTION public.get_status_ruangan_mhq()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT JSONB_BUILD_OBJECT(
    'pembagian_dikunci', pm.pembagian_dikunci,
    'jumlah_peserta_awal', pm.jumlah_peserta_awal,
    'batas_ruang_1', pm.batas_ruang_1,
    'dikunci_pada', pm.dikunci_pada,
    'jumlah_ruang_1', COUNT(p.id) FILTER (WHERE p.ruangan_mhq = 1),
    'jumlah_ruang_2', COUNT(p.id) FILTER (WHERE p.ruangan_mhq = 2),
    'belum_dibagi', COUNT(p.id) FILTER (WHERE p.ruangan_mhq IS NULL)
  )
  FROM public.pengaturan_mhq AS pm
  LEFT JOIN public.pendaftar AS p ON p.cabang_lomba = 'MHQ'
  WHERE pm.id
  GROUP BY pm.id, pm.pembagian_dikunci, pm.jumlah_peserta_awal,
           pm.batas_ruang_1, pm.dikunci_pada;
$$;

-- Pembagian berlangsung otomatis saat migrasi dijalankan. Dua puluh lima peserta
-- pertama berdasarkan nomor peserta masuk Ruang 1; seluruh sisanya ke Ruang 2.
DO $$
DECLARE
  total_peserta INTEGER;
  v_batas_ruang_1 INTEGER;
  sudah_dikunci BOOLEAN;
BEGIN
  SELECT pembagian_dikunci INTO sudah_dikunci
  FROM public.pengaturan_mhq WHERE id FOR UPDATE;

  IF sudah_dikunci THEN
    RETURN;
  END IF;

  SELECT COUNT(*)::INTEGER INTO total_peserta
  FROM public.pendaftar WHERE cabang_lomba = 'MHQ';
  v_batas_ruang_1 := LEAST(25, total_peserta);

  WITH peserta_berurutan AS (
    SELECT id, ROW_NUMBER() OVER (
      ORDER BY substring(no_peserta FROM '([0-9]+)$')::INTEGER NULLS LAST,
               no_peserta, created_at, id
    ) AS urutan
    FROM public.pendaftar
    WHERE cabang_lomba = 'MHQ'
  )
  UPDATE public.pendaftar AS p
  SET ruangan_mhq = CASE WHEN pb.urutan <= 25 THEN 1 ELSE 2 END
  FROM peserta_berurutan AS pb
  WHERE p.id = pb.id;

  UPDATE public.pengaturan_mhq
  SET pembagian_dikunci = true,
      jumlah_peserta_awal = COALESCE(jumlah_peserta_awal, total_peserta),
      batas_ruang_1 = v_batas_ruang_1,
      dikunci_pada = COALESCE(dikunci_pada, now()),
      dikunci_oleh = NULL
  WHERE id;

  UPDATE public.pendaftar AS p
  SET nilai_total = (
    SELECT CASE WHEN COUNT(DISTINCT pj.juri_id) = 2
      THEN SUM(pj.nilai_total)::INTEGER ELSE NULL END
    FROM public.penilaian_juri pj
    JOIN public.juri j ON j.id = pj.juri_id AND j.aktif
    WHERE pj.pendaftar_id = p.id
      AND pj.status IN ('final','locked')
      AND j.ruangan_mhq = p.ruangan_mhq
  )
  WHERE p.cabang_lomba = 'MHQ';

END;
$$;

DROP FUNCTION IF EXISTS public.kunci_pembagian_ruangan_mhq();
REVOKE ALL ON FUNCTION public.get_status_ruangan_mhq() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_status_ruangan_mhq() TO authenticated;

-- Juri MHQ hanya boleh menyimpan nilai peserta pada ruangannya.
CREATE OR REPLACE FUNCTION public.validasi_ruangan_penilaian_mhq()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ruang_peserta SMALLINT;
  ruang_juri SMALLINT;
  kategori TEXT;
BEGIN
  SELECT cabang_lomba, ruangan_mhq INTO kategori, ruang_peserta
  FROM public.pendaftar WHERE id = NEW.pendaftar_id;

  IF kategori = 'MHQ' THEN
    SELECT ruangan_mhq INTO ruang_juri FROM public.juri WHERE id = NEW.juri_id;
    IF ruang_peserta IS NULL THEN
      RAISE EXCEPTION 'Pembagian ruangan MHQ belum dikunci';
    END IF;
    IF ruang_juri IS DISTINCT FROM ruang_peserta THEN
      RAISE EXCEPTION 'Juri hanya dapat menilai peserta di ruangannya';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validasi_ruangan_penilaian_mhq_trigger ON public.penilaian_juri;
CREATE TRIGGER validasi_ruangan_penilaian_mhq_trigger
BEFORE INSERT OR UPDATE ON public.penilaian_juri
FOR EACH ROW EXECUTE FUNCTION public.validasi_ruangan_penilaian_mhq();

-- Nilai akhir memakai jumlah nilai dua juri yang ditugaskan ke ruangan peserta.
CREATE OR REPLACE FUNCTION public.sync_nilai_akhir_peserta()
RETURNS TRIGGER AS $$
DECLARE
  target_pendaftar UUID := CASE WHEN TG_OP = 'DELETE' THEN OLD.pendaftar_id ELSE NEW.pendaftar_id END;
  total_juri INTEGER;
  total_selesai INTEGER;
  jumlah_nilai INTEGER;
BEGIN
  SELECT COUNT(DISTINCT j.id) INTO total_juri
  FROM public.pendaftar p
  JOIN public.juri_kategori jk ON jk.cabang_lomba = p.cabang_lomba
  JOIN public.juri j ON j.id = jk.juri_id AND j.aktif = true
    AND (p.cabang_lomba <> 'MHQ' OR j.ruangan_mhq = p.ruangan_mhq)
  WHERE p.id = target_pendaftar;

  SELECT COUNT(DISTINCT pj.juri_id),
    SUM(pj.nilai_total)::INTEGER
  INTO total_selesai, jumlah_nilai
  FROM public.penilaian_juri pj
  JOIN public.juri j ON j.id = pj.juri_id AND j.aktif = true
  JOIN public.pendaftar p ON p.id = pj.pendaftar_id
  JOIN public.juri_kategori jk ON jk.juri_id = pj.juri_id AND jk.cabang_lomba = p.cabang_lomba
  WHERE pj.pendaftar_id = target_pendaftar
    AND pj.status IN ('final','locked')
    AND (p.cabang_lomba <> 'MHQ' OR j.ruangan_mhq = p.ruangan_mhq);

  UPDATE public.pendaftar
  SET nilai_total = CASE WHEN total_juri > 0 AND total_selesai = total_juri THEN jumlah_nilai ELSE NULL END
  WHERE id = target_pendaftar;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_dashboard_penilaian(p_kategori TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_admin BOOLEAN := COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
  caller_juri_id UUID;
  caller_room SMALLINT;
  result JSONB;
BEGIN
  IF NOT caller_is_admin THEN
    SELECT j.id, j.ruangan_mhq INTO caller_juri_id, caller_room
    FROM public.juri j
    JOIN public.juri_kategori jk ON jk.juri_id = j.id
    WHERE j.user_id = auth.uid() AND j.aktif AND jk.cabang_lomba = p_kategori
    LIMIT 1;
    IF caller_juri_id IS NULL THEN RAISE EXCEPTION 'Tidak memiliki akses ke kategori ini'; END IF;
  END IF;

  WITH active_judges AS MATERIALIZED (
    SELECT j.id, j.kode, j.nama, j.user_id, j.ruangan_mhq
    FROM public.juri_kategori jk
    JOIN public.juri j ON j.id = jk.juri_id AND j.aktif
    WHERE jk.cabang_lomba = p_kategori
  ),
  score_summary AS MATERIALIZED (
    SELECT p.id AS pendaftar_id,
      COUNT(DISTINCT aj.id)::INTEGER AS jumlah_juri,
      COUNT(DISTINCT pj.juri_id)::INTEGER AS jumlah_selesai,
      CASE WHEN COUNT(DISTINCT aj.id) > 0 AND COUNT(DISTINCT pj.juri_id) = COUNT(DISTINCT aj.id)
        THEN SUM(pj.nilai_total)::INTEGER
        ELSE NULL END AS nilai_akhir,
      COALESCE(ARRAY_AGG(aj.nama ORDER BY aj.kode) FILTER (WHERE pj.id IS NULL), ARRAY[]::TEXT[]) AS juri_belum
    FROM public.pendaftar p
    JOIN active_judges aj ON p_kategori <> 'MHQ' OR aj.ruangan_mhq = p.ruangan_mhq
    LEFT JOIN public.penilaian_juri pj ON pj.pendaftar_id = p.id AND pj.juri_id = aj.id
      AND pj.status IN ('final','locked')
    WHERE p.cabang_lomba = p_kategori
    GROUP BY p.id
  ),
  visible_scores AS MATERIALIZED (
    SELECT pj.pendaftar_id,
      JSONB_AGG(JSONB_BUILD_OBJECT(
        'id', pj.id, 'pendaftar_id', pj.pendaftar_id, 'juri_id', pj.juri_id,
        'detail_nilai', pj.detail_nilai, 'nilai_total', pj.nilai_total,
        'catatan', pj.catatan, 'version', pj.version
      ) ORDER BY pj.juri_id) AS scores
    FROM public.penilaian_juri pj
    JOIN active_judges aj ON aj.id = pj.juri_id
    WHERE caller_is_admin OR pj.juri_id = caller_juri_id
    GROUP BY pj.pendaftar_id
  )
  SELECT JSONB_BUILD_OBJECT(
    'criteria', COALESCE((SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
      'kode', kp.kode, 'label', kp.label, 'bobot', kp.bobot,
      'nilai_maksimum', kp.nilai_maksimum, 'urutan', kp.urutan
    ) ORDER BY kp.urutan) FROM public.kriteria_penilaian kp
      WHERE kp.cabang_lomba = p_kategori AND kp.aktif), '[]'::JSONB),
    'juries', COALESCE((SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
      'id', aj.id, 'kode', aj.kode, 'nama', aj.nama,
      'user_id', aj.user_id, 'ruangan_mhq', aj.ruangan_mhq
    ) ORDER BY aj.kode) FROM active_judges aj
      WHERE caller_is_admin OR aj.id = caller_juri_id), '[]'::JSONB),
    'room_settings', CASE WHEN p_kategori = 'MHQ' THEN public.get_status_ruangan_mhq() ELSE NULL END,
    'participants', COALESCE((SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
      'id', p.id, 'created_at', p.created_at, 'no_peserta', p.no_peserta,
      'nama_anak', p.nama_anak, 'asal_sekolah', p.asal_sekolah,
      'cabang_lomba', p.cabang_lomba, 'ruangan_mhq', p.ruangan_mhq,
      'jumlah_juri', COALESCE(ss.jumlah_juri, 0),
      'jumlah_selesai', COALESCE(ss.jumlah_selesai, 0),
      'nilai_akhir', CASE WHEN caller_is_admin THEN ss.nilai_akhir ELSE NULL END,
      'juri_belum', COALESCE(TO_JSONB(ss.juri_belum), '[]'::JSONB),
      'nilai_juri', COALESCE(vs.scores, '[]'::JSONB)
    ) ORDER BY substring(p.no_peserta FROM '([0-9]+)$')::INTEGER NULLS LAST,
      p.no_peserta, p.created_at)
      FROM public.pendaftar p
      LEFT JOIN score_summary ss ON ss.pendaftar_id = p.id
      LEFT JOIN visible_scores vs ON vs.pendaftar_id = p.id
      WHERE p.cabang_lomba = p_kategori
        AND (caller_is_admin OR p_kategori <> 'MHQ' OR p.ruangan_mhq = caller_room)
    ), '[]'::JSONB)
  ) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_status_penilaian_peserta(p_pendaftar_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_admin BOOLEAN := COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
  caller_juri_id UUID;
  participant_category TEXT;
  participant_room SMALLINT;
  result JSONB;
BEGIN
  SELECT p.cabang_lomba, p.ruangan_mhq INTO participant_category, participant_room
  FROM public.pendaftar p WHERE p.id = p_pendaftar_id;
  IF participant_category IS NULL THEN RAISE EXCEPTION 'Peserta tidak ditemukan'; END IF;

  IF NOT caller_is_admin THEN
    SELECT j.id INTO caller_juri_id
    FROM public.juri j JOIN public.juri_kategori jk ON jk.juri_id = j.id
    WHERE j.user_id = auth.uid() AND j.aktif AND jk.cabang_lomba = participant_category
      AND (participant_category <> 'MHQ' OR j.ruangan_mhq = participant_room)
    LIMIT 1;
    IF caller_juri_id IS NULL THEN RAISE EXCEPTION 'Tidak memiliki akses ke peserta ini'; END IF;
  END IF;

  WITH active_judges AS MATERIALIZED (
    SELECT j.id, j.kode, j.nama
    FROM public.juri_kategori jk JOIN public.juri j ON j.id = jk.juri_id AND j.aktif
    WHERE jk.cabang_lomba = participant_category
      AND (participant_category <> 'MHQ' OR j.ruangan_mhq = participant_room)
  ), summary AS (
    SELECT COUNT(DISTINCT aj.id)::INTEGER AS jumlah_juri,
      COUNT(DISTINCT pj.juri_id)::INTEGER AS jumlah_selesai,
      CASE WHEN COUNT(DISTINCT aj.id) > 0 AND COUNT(DISTINCT pj.juri_id) = COUNT(DISTINCT aj.id)
        THEN SUM(pj.nilai_total)::INTEGER
        ELSE NULL END AS nilai_akhir,
      COALESCE(ARRAY_AGG(aj.nama ORDER BY aj.kode) FILTER (WHERE pj.id IS NULL), ARRAY[]::TEXT[]) AS juri_belum
    FROM active_judges aj LEFT JOIN public.penilaian_juri pj
      ON pj.pendaftar_id = p_pendaftar_id AND pj.juri_id = aj.id
      AND pj.status IN ('final','locked')
  ), visible_scores AS (
    SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
      'id', pj.id, 'pendaftar_id', pj.pendaftar_id, 'juri_id', pj.juri_id,
      'detail_nilai', pj.detail_nilai, 'nilai_total', pj.nilai_total,
      'catatan', pj.catatan, 'version', pj.version
    ) ORDER BY pj.juri_id), '[]'::JSONB) AS scores
    FROM public.penilaian_juri pj JOIN active_judges aj ON aj.id = pj.juri_id
    WHERE pj.pendaftar_id = p_pendaftar_id AND (caller_is_admin OR pj.juri_id = caller_juri_id)
  )
  SELECT JSONB_BUILD_OBJECT(
    'id', p.id, 'created_at', p.created_at, 'no_peserta', p.no_peserta,
    'nama_anak', p.nama_anak, 'asal_sekolah', p.asal_sekolah,
    'cabang_lomba', p.cabang_lomba, 'ruangan_mhq', p.ruangan_mhq,
    'jumlah_juri', s.jumlah_juri, 'jumlah_selesai', s.jumlah_selesai,
    'nilai_akhir', CASE WHEN caller_is_admin THEN s.nilai_akhir ELSE NULL END,
    'juri_belum', TO_JSONB(s.juri_belum), 'nilai_juri', vs.scores
  ) INTO result
  FROM public.pendaftar p CROSS JOIN summary s CROSS JOIN visible_scores vs
  WHERE p.id = p_pendaftar_id;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_dashboard_penilaian(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_dashboard_penilaian(TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.get_status_penilaian_peserta(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_status_penilaian_peserta(UUID) TO authenticated;

-- Setiap ruangan MHQ harus selalu mempunyai tepat dua juri aktif.
DO $$
DECLARE
  room_number SMALLINT;
  judge_count INTEGER;
BEGIN
  FOREACH room_number IN ARRAY ARRAY[1::SMALLINT, 2::SMALLINT]
  LOOP
    SELECT COUNT(DISTINCT j.id)::INTEGER INTO judge_count
    FROM public.juri AS j
    JOIN public.juri_kategori AS jk ON jk.juri_id = j.id
    WHERE jk.cabang_lomba = 'MHQ'
      AND j.ruangan_mhq = room_number
      AND j.aktif;

    IF judge_count <> 2 THEN
      RAISE EXCEPTION 'Ruang % harus mempunyai tepat 2 juri aktif; ditemukan %', room_number, judge_count;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.jaga_dua_juri_mhq_dari_perubahan_juri()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  locked BOOLEAN := COALESCE((SELECT pembagian_dikunci FROM public.pengaturan_mhq WHERE id), false);
  assigned_to_mhq BOOLEAN;
  active_judges_in_room INTEGER;
BEGIN
  IF NOT locked THEN RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.juri_kategori
    WHERE juri_id = OLD.id AND cabang_lomba = 'MHQ'
  ) INTO assigned_to_mhq;

  IF TG_OP = 'DELETE' AND assigned_to_mhq AND OLD.aktif THEN
    RAISE EXCEPTION 'Juri aktif MHQ tidak dapat dihapus karena setiap ruangan wajib memiliki 2 juri';
  END IF;

  IF TG_OP = 'UPDATE' AND assigned_to_mhq THEN
    IF OLD.aktif AND NOT NEW.aktif THEN
      RAISE EXCEPTION 'Juri MHQ tidak dapat dinonaktifkan karena setiap ruangan wajib memiliki 2 juri aktif';
    END IF;
    IF NEW.ruangan_mhq IS DISTINCT FROM OLD.ruangan_mhq THEN
      RAISE EXCEPTION 'Ruangan juri MHQ sudah dikunci';
    END IF;
    IF NOT OLD.aktif AND NEW.aktif THEN
      SELECT COUNT(DISTINCT j.id)::INTEGER INTO active_judges_in_room
      FROM public.juri AS j
      JOIN public.juri_kategori AS jk ON jk.juri_id = j.id
      WHERE jk.cabang_lomba = 'MHQ'
        AND j.ruangan_mhq = NEW.ruangan_mhq
        AND j.aktif
        AND j.id <> NEW.id;
      IF active_judges_in_room >= 2 THEN
        RAISE EXCEPTION 'Ruang % sudah memiliki 2 juri aktif', NEW.ruangan_mhq;
      END IF;
    END IF;
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS jaga_dua_juri_mhq_dari_perubahan_juri_trigger ON public.juri;
CREATE TRIGGER jaga_dua_juri_mhq_dari_perubahan_juri_trigger
BEFORE UPDATE OF aktif, ruangan_mhq OR DELETE ON public.juri
FOR EACH ROW EXECUTE FUNCTION public.jaga_dua_juri_mhq_dari_perubahan_juri();

CREATE OR REPLACE FUNCTION public.jaga_dua_juri_mhq_dari_penugasan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  locked BOOLEAN := COALESCE((SELECT pembagian_dikunci FROM public.pengaturan_mhq WHERE id), false);
  target_juri_id UUID := CASE WHEN TG_OP = 'DELETE' THEN OLD.juri_id ELSE NEW.juri_id END;
  target_category TEXT := CASE WHEN TG_OP = 'DELETE' THEN OLD.cabang_lomba ELSE NEW.cabang_lomba END;
  target_room SMALLINT;
  target_active BOOLEAN;
  active_judges_in_room INTEGER;
BEGIN
  IF NOT locked OR target_category <> 'MHQ' THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  SELECT ruangan_mhq, aktif INTO target_room, target_active
  FROM public.juri WHERE id = target_juri_id;

  IF TG_OP = 'DELETE' AND target_active THEN
    RAISE EXCEPTION 'Penugasan juri aktif MHQ tidak dapat dihapus karena setiap ruangan wajib memiliki 2 juri';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Penugasan juri MHQ sudah dikunci';
  END IF;

  IF TG_OP = 'INSERT' AND target_active THEN
    IF target_room IS NULL THEN
      RAISE EXCEPTION 'Ruangan juri MHQ wajib ditentukan sebelum penugasan';
    END IF;
    SELECT COUNT(DISTINCT j.id)::INTEGER INTO active_judges_in_room
    FROM public.juri AS j
    JOIN public.juri_kategori AS jk ON jk.juri_id = j.id
    WHERE jk.cabang_lomba = 'MHQ'
      AND j.ruangan_mhq = target_room
      AND j.aktif
      AND j.id <> target_juri_id;
    IF active_judges_in_room >= 2 THEN
      RAISE EXCEPTION 'Ruang % sudah memiliki 2 juri aktif', target_room;
    END IF;
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS jaga_dua_juri_mhq_dari_penugasan_trigger ON public.juri_kategori;
CREATE TRIGGER jaga_dua_juri_mhq_dari_penugasan_trigger
BEFORE INSERT OR UPDATE OR DELETE ON public.juri_kategori
FOR EACH ROW EXECUTE FUNCTION public.jaga_dua_juri_mhq_dari_penugasan();

-- Rekalkulasi terakhir memastikan nilai lama dan nilai baru memakai SUM dari
-- dua juri aktif yang sesuai dengan ruangan peserta.
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

INSERT INTO public.versi_migrasi_aplikasi (migration_key, version, applied_at)
VALUES ('mhq_rooms', '2026.10.09.1', now())
ON CONFLICT (migration_key) DO UPDATE SET
  version = EXCLUDED.version,
  applied_at = EXCLUDED.applied_at;

COMMIT;
