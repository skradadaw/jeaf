-- Hotfix tahap 3: setiap ruangan MHQ wajib mempunyai tepat dua juri aktif.
-- Skrip tidak mengubah nilai maupun pembagian peserta.

BEGIN;

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

COMMIT;
