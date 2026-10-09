-- Uji integrasi MHQ dua ruangan tanpa menyimpan data uji.
-- Jalankan melalui Supabase SQL Editor setelah seluruh migrasi dan hotfix MHQ.
-- Skrip hanya memakai peserta yang belum pernah dinilai dan selalu diakhiri ROLLBACK.

BEGIN;

DO $$
DECLARE
  participant_room_1 UUID;
  participant_room_2 UUID;
  judges_room_1 UUID[];
  judges_room_2 UUID[];
  details_100 JSONB;
  details_90 JSONB;
  criteria_count INTEGER;
  total_weight NUMERIC;
  current_total INTEGER;
  current_score INTEGER;
  status_payload JSONB;
BEGIN
  -- Memungkinkan pemeriksaan RPC admin di dalam transaksi SQL Editor ini saja.
  PERFORM set_config(
    'request.jwt.claims',
    '{"app_metadata":{"role":"admin"}}',
    true
  );

  SELECT p.id
  INTO participant_room_1
  FROM public.pendaftar AS p
  WHERE p.cabang_lomba = 'MHQ'
    AND p.ruangan_mhq = 1
    AND NOT EXISTS (
      SELECT 1 FROM public.penilaian_juri AS pj WHERE pj.pendaftar_id = p.id
    )
  ORDER BY substring(p.no_peserta FROM '([0-9]+)$')::INTEGER NULLS LAST,
    p.no_peserta,
    p.created_at
  LIMIT 1;

  SELECT p.id
  INTO participant_room_2
  FROM public.pendaftar AS p
  WHERE p.cabang_lomba = 'MHQ'
    AND p.ruangan_mhq = 2
    AND NOT EXISTS (
      SELECT 1 FROM public.penilaian_juri AS pj WHERE pj.pendaftar_id = p.id
    )
  ORDER BY substring(p.no_peserta FROM '([0-9]+)$')::INTEGER NULLS LAST,
    p.no_peserta,
    p.created_at
  LIMIT 1;

  IF participant_room_1 IS NULL OR participant_room_2 IS NULL THEN
    RAISE EXCEPTION 'Tes membutuhkan satu peserta tanpa nilai di setiap ruangan MHQ';
  END IF;

  SELECT ARRAY_AGG(j.id ORDER BY j.kode)
  INTO judges_room_1
  FROM public.juri AS j
  JOIN public.juri_kategori AS jk ON jk.juri_id = j.id
  WHERE jk.cabang_lomba = 'MHQ'
    AND j.ruangan_mhq = 1
    AND j.aktif;

  SELECT ARRAY_AGG(j.id ORDER BY j.kode)
  INTO judges_room_2
  FROM public.juri AS j
  JOIN public.juri_kategori AS jk ON jk.juri_id = j.id
  WHERE jk.cabang_lomba = 'MHQ'
    AND j.ruangan_mhq = 2
    AND j.aktif;

  IF COALESCE(array_length(judges_room_1, 1), 0) <> 2
    OR COALESCE(array_length(judges_room_2, 1), 0) <> 2 THEN
    RAISE EXCEPTION 'Tes membutuhkan tepat dua juri aktif di setiap ruangan MHQ';
  END IF;

  SELECT
    JSONB_OBJECT_AGG(kp.kode, TO_JSONB(kp.nilai_maksimum)),
    JSONB_OBJECT_AGG(kp.kode, TO_JSONB(ROUND(kp.nilai_maksimum * 0.9)::INTEGER)),
    COUNT(*)::INTEGER,
    COALESCE(SUM(kp.bobot), 0)
  INTO details_100, details_90, criteria_count, total_weight
  FROM public.kriteria_penilaian AS kp
  WHERE kp.cabang_lomba = 'MHQ'
    AND kp.aktif;

  IF criteria_count = 0 OR total_weight <> 100 THEN
    RAISE EXCEPTION 'Konfigurasi kriteria MHQ tidak valid';
  END IF;

  -- Ruang 1: nilai belum lengkap setelah juri pertama.
  INSERT INTO public.penilaian_juri (
    pendaftar_id, juri_id, detail_nilai, nilai_total, catatan, status
  ) VALUES (
    participant_room_1, judges_room_1[1], details_100, 0, '[TEST ROLLBACK] Ruang 1 Juri 1', 'final'
  )
  RETURNING nilai_total INTO current_score;

  IF current_score <> 100 THEN
    RAISE EXCEPTION 'Nilai juri pertama Ruang 1 seharusnya 100, ditemukan %', current_score;
  END IF;

  SELECT p.nilai_total INTO current_total
  FROM public.pendaftar AS p WHERE p.id = participant_room_1;
  IF current_total IS NOT NULL THEN
    RAISE EXCEPTION 'Nilai akhir Ruang 1 harus kosong sebelum kedua juri selesai, ditemukan %', current_total;
  END IF;

  SELECT public.get_status_penilaian_peserta(participant_room_1) INTO status_payload;
  IF (status_payload ->> 'jumlah_juri')::INTEGER <> 2
    OR (status_payload ->> 'jumlah_selesai')::INTEGER <> 1
    OR status_payload ->> 'nilai_akhir' IS NOT NULL THEN
    RAISE EXCEPTION 'Status 1/2 juri Ruang 1 tidak sesuai: %', status_payload;
  END IF;

  -- Ruang 1: SUM muncul setelah juri kedua selesai.
  INSERT INTO public.penilaian_juri (
    pendaftar_id, juri_id, detail_nilai, nilai_total, catatan, status
  ) VALUES (
    participant_room_1, judges_room_1[2], details_100, 0, '[TEST ROLLBACK] Ruang 1 Juri 2', 'final'
  );

  SELECT p.nilai_total INTO current_total
  FROM public.pendaftar AS p WHERE p.id = participant_room_1;
  IF current_total <> 200 THEN
    RAISE EXCEPTION 'SUM dua juri Ruang 1 seharusnya 200, ditemukan %', current_total;
  END IF;

  SELECT public.get_status_penilaian_peserta(participant_room_1) INTO status_payload;
  IF (status_payload ->> 'jumlah_juri')::INTEGER <> 2
    OR (status_payload ->> 'jumlah_selesai')::INTEGER <> 2
    OR (status_payload ->> 'nilai_akhir')::INTEGER <> 200 THEN
    RAISE EXCEPTION 'Status 2/2 juri Ruang 1 tidak sesuai: %', status_payload;
  END IF;

  -- Perubahan nilai salah satu juri harus menghitung ulang SUM dan version.
  UPDATE public.penilaian_juri
  SET detail_nilai = details_90,
    catatan = '[TEST ROLLBACK] Ruang 1 Juri 1 diperbarui',
    version = version + 1
  WHERE pendaftar_id = participant_room_1
    AND juri_id = judges_room_1[1]
  RETURNING nilai_total INTO current_score;

  IF current_score <> 90 THEN
    RAISE EXCEPTION 'Nilai hasil edit seharusnya 90, ditemukan %', current_score;
  END IF;

  SELECT p.nilai_total INTO current_total
  FROM public.pendaftar AS p WHERE p.id = participant_room_1;
  IF current_total <> 190 THEN
    RAISE EXCEPTION 'SUM setelah edit seharusnya 190, ditemukan %', current_total;
  END IF;

  -- Ruang 2 harus memakai dua juri Ruang 2 dan menghasilkan SUM sendiri.
  INSERT INTO public.penilaian_juri (
    pendaftar_id, juri_id, detail_nilai, nilai_total, catatan, status
  ) VALUES
    (participant_room_2, judges_room_2[1], details_100, 0, '[TEST ROLLBACK] Ruang 2 Juri 1', 'final'),
    (participant_room_2, judges_room_2[2], details_100, 0, '[TEST ROLLBACK] Ruang 2 Juri 2', 'final');

  SELECT p.nilai_total INTO current_total
  FROM public.pendaftar AS p WHERE p.id = participant_room_2;
  IF current_total <> 200 THEN
    RAISE EXCEPTION 'SUM dua juri Ruang 2 seharusnya 200, ditemukan %', current_total;
  END IF;

  SELECT public.get_status_penilaian_peserta(participant_room_2) INTO status_payload;
  IF (status_payload ->> 'jumlah_juri')::INTEGER <> 2
    OR (status_payload ->> 'jumlah_selesai')::INTEGER <> 2
    OR (status_payload ->> 'nilai_akhir')::INTEGER <> 200 THEN
    RAISE EXCEPTION 'Status 2/2 juri Ruang 2 tidak sesuai: %', status_payload;
  END IF;

  -- Juri dari ruangan lain wajib ditolak oleh trigger database.
  BEGIN
    INSERT INTO public.penilaian_juri (
      pendaftar_id, juri_id, detail_nilai, nilai_total, catatan, status
    ) VALUES (
      participant_room_1, judges_room_2[1], details_100, 0, '[TEST ROLLBACK] Lintas ruangan', 'final'
    );
    RAISE EXCEPTION 'TEST_FAILED_WRONG_ROOM_WAS_ACCEPTED';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'TEST_FAILED_WRONG_ROOM_WAS_ACCEPTED' THEN
      RAISE;
    END IF;
    IF SQLERRM NOT LIKE '%Juri hanya dapat menilai peserta di ruangannya%' THEN
      RAISE EXCEPTION 'Penolakan lintas ruangan menghasilkan error yang tidak sesuai: %', SQLERRM;
    END IF;
  END;

  RAISE NOTICE 'LULUS: Ruang 1 1/2 -> 2/2 -> edit SUM, Ruang 2 2/2, dan penolakan lintas ruangan.';
END;
$$;

-- Wajib: semua nilai, audit, dan perubahan nilai_total dari tes dibatalkan.
ROLLBACK;
