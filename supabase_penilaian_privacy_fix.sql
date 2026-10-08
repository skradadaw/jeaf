-- Menutup nilai akhir gabungan dari respons RPC akun juri.
-- Admin tetap menerima jumlah nilai akhir; juri menerima NULL.
-- Jalankan melalui Supabase SQL Editor setelah supabase_penilaian_performance.sql.

BEGIN;

DO $$
DECLARE
  function_name TEXT;
  function_oid OID;
  old_definition TEXT;
  new_definition TEXT;
BEGIN
  FOREACH function_name IN ARRAY ARRAY['get_dashboard_penilaian', 'get_status_penilaian_peserta']
  LOOP
    SELECT p.oid
    INTO function_oid
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = function_name
    LIMIT 1;

    IF function_oid IS NULL THEN
      RAISE EXCEPTION 'Fungsi public.% tidak ditemukan', function_name;
    END IF;

    old_definition := pg_get_functiondef(function_oid);
    new_definition := regexp_replace(
      old_definition,
      '(''nilai_akhir''\s*,\s*)(ss|s)\.nilai_akhir',
      '\1CASE WHEN caller_is_admin THEN \2.nilai_akhir ELSE NULL END',
      'gi'
    );

    IF new_definition = old_definition AND old_definition !~* '''nilai_akhir''\s*,\s*case\s+when\s+caller_is_admin' THEN
      RAISE EXCEPTION 'Pola nilai_akhir pada fungsi public.% tidak dikenali', function_name;
    END IF;

    IF new_definition IS DISTINCT FROM old_definition THEN
      EXECUTE new_definition;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_ringkasan_penilaian(p_kategori TEXT)
RETURNS TABLE (
  pendaftar_id UUID,
  jumlah_juri INTEGER,
  jumlah_selesai INTEGER,
  nilai_akhir INTEGER,
  juri_belum TEXT[]
) AS $$
DECLARE
  caller_is_admin BOOLEAN := COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
BEGIN
  IF p_kategori NOT IN ('MHQ', 'Adzan', 'Menyanyi Solo', 'Fashion Show') THEN
    RAISE EXCEPTION 'Kategori tidak tersedia untuk portal juri';
  END IF;

  IF NOT (
    caller_is_admin
    OR EXISTS (
      SELECT 1
      FROM public.juri AS j
      JOIN public.juri_kategori AS jk ON jk.juri_id = j.id
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
      WHEN caller_is_admin AND COUNT(DISTINCT pj.juri_id) = COUNT(DISTINCT j.id)
      THEN SUM(pj.nilai_total)::INTEGER
      ELSE NULL
    END,
    COALESCE(ARRAY_AGG(j.nama ORDER BY j.kode) FILTER (WHERE pj.id IS NULL), ARRAY[]::TEXT[])
  FROM public.pendaftar AS p
  JOIN public.juri_kategori AS jk ON jk.cabang_lomba = p.cabang_lomba
  JOIN public.juri AS j ON j.id = jk.juri_id AND j.aktif
  LEFT JOIN public.penilaian_juri AS pj
    ON pj.pendaftar_id = p.id AND pj.juri_id = j.id
  WHERE p.cabang_lomba = p_kategori
  GROUP BY p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.get_ringkasan_penilaian(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ringkasan_penilaian(TEXT) TO authenticated;

COMMIT;
