-- Optimasi baca/tulis dashboard penilaian juri.
-- Jalankan setelah supabase_remove_draft_lock.sql.
-- Aman dijalankan berulang kali.

CREATE INDEX IF NOT EXISTS pendaftar_kategori_created_idx
ON public.pendaftar (cabang_lomba, created_at);

CREATE INDEX IF NOT EXISTS juri_kategori_cabang_juri_idx
ON public.juri_kategori (cabang_lomba, juri_id);

CREATE OR REPLACE FUNCTION public.get_dashboard_penilaian(p_kategori TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_is_admin BOOLEAN := COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
  caller_juri_id UUID;
  result JSONB;
BEGIN
  IF NOT caller_is_admin THEN
    SELECT j.id
    INTO caller_juri_id
    FROM public.juri AS j
    JOIN public.juri_kategori AS jk ON jk.juri_id = j.id
    WHERE j.user_id = auth.uid()
      AND j.aktif
      AND jk.cabang_lomba = p_kategori
    LIMIT 1;

    IF caller_juri_id IS NULL THEN
      RAISE EXCEPTION 'Tidak memiliki akses ke kategori ini';
    END IF;
  END IF;

  WITH active_judges AS MATERIALIZED (
    SELECT j.id, j.kode, j.nama, j.user_id
    FROM public.juri_kategori AS jk
    JOIN public.juri AS j ON j.id = jk.juri_id AND j.aktif
    WHERE jk.cabang_lomba = p_kategori
  ),
  score_summary AS MATERIALIZED (
    SELECT
      p.id AS pendaftar_id,
      COUNT(DISTINCT aj.id)::INTEGER AS jumlah_juri,
      COUNT(DISTINCT pj.juri_id)::INTEGER AS jumlah_selesai,
      CASE
        WHEN COUNT(DISTINCT aj.id) > 0
          AND COUNT(DISTINCT pj.juri_id) = COUNT(DISTINCT aj.id)
        THEN SUM(pj.nilai_total)::INTEGER
        ELSE NULL
      END AS nilai_akhir,
      COALESCE(
        ARRAY_AGG(aj.nama ORDER BY aj.kode) FILTER (WHERE pj.id IS NULL),
        ARRAY[]::TEXT[]
      ) AS juri_belum
    FROM public.pendaftar AS p
    JOIN active_judges AS aj ON true
    LEFT JOIN public.penilaian_juri AS pj
      ON pj.pendaftar_id = p.id AND pj.juri_id = aj.id
    WHERE p.cabang_lomba = p_kategori
    GROUP BY p.id
  ),
  visible_scores AS MATERIALIZED (
    SELECT
      pj.pendaftar_id,
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'id', pj.id,
          'pendaftar_id', pj.pendaftar_id,
          'juri_id', pj.juri_id,
          'detail_nilai', pj.detail_nilai,
          'nilai_total', pj.nilai_total,
          'catatan', pj.catatan,
          'version', pj.version
        ) ORDER BY pj.juri_id
      ) AS scores
    FROM public.penilaian_juri AS pj
    JOIN active_judges AS aj ON aj.id = pj.juri_id
    WHERE caller_is_admin OR pj.juri_id = caller_juri_id
    GROUP BY pj.pendaftar_id
  )
  SELECT JSONB_BUILD_OBJECT(
    'criteria', COALESCE((
      SELECT JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'kode', kp.kode,
          'label', kp.label,
          'bobot', kp.bobot,
          'nilai_maksimum', kp.nilai_maksimum,
          'urutan', kp.urutan
        ) ORDER BY kp.urutan
      )
      FROM public.kriteria_penilaian AS kp
      WHERE kp.cabang_lomba = p_kategori AND kp.aktif
    ), '[]'::JSONB),
    'juries', COALESCE((
      SELECT JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'id', aj.id,
          'kode', aj.kode,
          'nama', aj.nama,
          'user_id', aj.user_id
        ) ORDER BY aj.kode
      )
      FROM active_judges AS aj
      WHERE caller_is_admin OR aj.id = caller_juri_id
    ), '[]'::JSONB),
    'participants', COALESCE((
      SELECT JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'id', p.id,
          'created_at', p.created_at,
          'no_peserta', p.no_peserta,
          'nama_anak', p.nama_anak,
          'asal_sekolah', p.asal_sekolah,
          'cabang_lomba', p.cabang_lomba,
          'jumlah_juri', COALESCE(ss.jumlah_juri, 0),
          'jumlah_selesai', COALESCE(ss.jumlah_selesai, 0),
          'nilai_akhir', CASE WHEN caller_is_admin THEN ss.nilai_akhir ELSE NULL END,
          'juri_belum', COALESCE(TO_JSONB(ss.juri_belum), '[]'::JSONB),
          'nilai_juri', COALESCE(vs.scores, '[]'::JSONB)
        ) ORDER BY
          substring(p.no_peserta FROM '([0-9]+)$')::INTEGER NULLS LAST,
          p.no_peserta,
          p.created_at
      )
      FROM public.pendaftar AS p
      LEFT JOIN score_summary AS ss ON ss.pendaftar_id = p.id
      LEFT JOIN visible_scores AS vs ON vs.pendaftar_id = p.id
      WHERE p.cabang_lomba = p_kategori
    ), '[]'::JSONB)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_dashboard_penilaian(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_dashboard_penilaian(TEXT) TO authenticated;

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
  result JSONB;
BEGIN
  SELECT p.cabang_lomba
  INTO participant_category
  FROM public.pendaftar AS p
  WHERE p.id = p_pendaftar_id;

  IF participant_category IS NULL THEN
    RAISE EXCEPTION 'Peserta tidak ditemukan';
  END IF;

  IF NOT caller_is_admin THEN
    SELECT j.id
    INTO caller_juri_id
    FROM public.juri AS j
    JOIN public.juri_kategori AS jk ON jk.juri_id = j.id
    WHERE j.user_id = auth.uid()
      AND j.aktif
      AND jk.cabang_lomba = participant_category
    LIMIT 1;

    IF caller_juri_id IS NULL THEN
      RAISE EXCEPTION 'Tidak memiliki akses ke peserta ini';
    END IF;
  END IF;

  WITH active_judges AS MATERIALIZED (
    SELECT j.id, j.kode, j.nama
    FROM public.juri_kategori AS jk
    JOIN public.juri AS j ON j.id = jk.juri_id AND j.aktif
    WHERE jk.cabang_lomba = participant_category
  ),
  summary AS (
    SELECT
      COUNT(DISTINCT aj.id)::INTEGER AS jumlah_juri,
      COUNT(DISTINCT pj.juri_id)::INTEGER AS jumlah_selesai,
      CASE
        WHEN COUNT(DISTINCT aj.id) > 0
          AND COUNT(DISTINCT pj.juri_id) = COUNT(DISTINCT aj.id)
        THEN SUM(pj.nilai_total)::INTEGER
        ELSE NULL
      END AS nilai_akhir,
      COALESCE(
        ARRAY_AGG(aj.nama ORDER BY aj.kode) FILTER (WHERE pj.id IS NULL),
        ARRAY[]::TEXT[]
      ) AS juri_belum
    FROM active_judges AS aj
    LEFT JOIN public.penilaian_juri AS pj
      ON pj.pendaftar_id = p_pendaftar_id AND pj.juri_id = aj.id
  ),
  visible_scores AS (
    SELECT COALESCE(JSONB_AGG(
      JSONB_BUILD_OBJECT(
        'id', pj.id,
        'pendaftar_id', pj.pendaftar_id,
        'juri_id', pj.juri_id,
        'detail_nilai', pj.detail_nilai,
        'nilai_total', pj.nilai_total,
        'catatan', pj.catatan,
        'version', pj.version
      ) ORDER BY pj.juri_id
    ), '[]'::JSONB) AS scores
    FROM public.penilaian_juri AS pj
    JOIN active_judges AS aj ON aj.id = pj.juri_id
    WHERE pj.pendaftar_id = p_pendaftar_id
      AND (caller_is_admin OR pj.juri_id = caller_juri_id)
  )
  SELECT JSONB_BUILD_OBJECT(
    'id', p.id,
    'created_at', p.created_at,
    'no_peserta', p.no_peserta,
    'nama_anak', p.nama_anak,
    'asal_sekolah', p.asal_sekolah,
    'cabang_lomba', p.cabang_lomba,
    'jumlah_juri', s.jumlah_juri,
    'jumlah_selesai', s.jumlah_selesai,
    'nilai_akhir', CASE WHEN caller_is_admin THEN s.nilai_akhir ELSE NULL END,
    'juri_belum', TO_JSONB(s.juri_belum),
    'nilai_juri', vs.scores
  ) INTO result
  FROM public.pendaftar AS p
  CROSS JOIN summary AS s
  CROSS JOIN visible_scores AS vs
  WHERE p.id = p_pendaftar_id;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_status_penilaian_peserta(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_status_penilaian_peserta(UUID) TO authenticated;

-- Broadcast privat hanya membawa ID peserta, tanpa nilai atau catatan juri.
DROP POLICY IF EXISTS "Juri menerima pembaruan penilaian" ON realtime.messages;
CREATE POLICY "Juri menerima pembaruan penilaian"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.messages.extension = 'broadcast'
  AND SPLIT_PART((SELECT realtime.topic()), ':', 1) = 'penilaian'
  AND (
    COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
    OR EXISTS (
      SELECT 1
      FROM public.juri AS j
      JOIN public.juri_kategori AS jk ON jk.juri_id = j.id
      WHERE j.user_id = auth.uid()
        AND j.aktif
        AND jk.cabang_lomba = SPLIT_PART((SELECT realtime.topic()), ':', 2)
    )
  )
);

CREATE OR REPLACE FUNCTION public.broadcast_perubahan_penilaian()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_pendaftar UUID := CASE WHEN TG_OP = 'DELETE' THEN OLD.pendaftar_id ELSE NEW.pendaftar_id END;
  target_category TEXT;
BEGIN
  SELECT p.cabang_lomba
  INTO target_category
  FROM public.pendaftar AS p
  WHERE p.id = target_pendaftar;

  IF target_category IS NOT NULL THEN
    PERFORM realtime.send(
      JSONB_BUILD_OBJECT('pendaftar_id', target_pendaftar),
      'score_changed',
      'penilaian:' || target_category,
      true
    );
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS zz_broadcast_perubahan_penilaian ON public.penilaian_juri;
CREATE TRIGGER zz_broadcast_perubahan_penilaian
AFTER INSERT OR UPDATE OR DELETE ON public.penilaian_juri
FOR EACH ROW EXECUTE FUNCTION public.broadcast_perubahan_penilaian();
