-- Hotfix tahap 2: mencegah pembagian ruangan MHQ berubah setelah dikunci.
-- Skrip ini TIDAK membagi ulang peserta dan aman dijalankan berulang kali.

BEGIN;

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

COMMIT;
