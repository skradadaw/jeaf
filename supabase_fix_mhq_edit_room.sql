-- Hotfix tahap 1: edit data peserta tidak boleh mengubah ruangan MHQ.
-- Skrip ini hanya mengganti fungsi trigger dan TIDAK membagi ulang peserta.

BEGIN;

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

COMMIT;
