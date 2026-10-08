-- Menetapkan NYA sebagai prefix resmi nomor peserta Menyanyi Solo.
-- Kode akun juri NYS-J1/NYS-J2 tidak berubah karena bukan nomor peserta.

BEGIN;

LOCK TABLE public.pendaftar IN SHARE ROW EXCLUSIVE MODE;

DO $$
DECLARE
  current_max INTEGER;
  conflict RECORD;
  later_id UUID;
BEGIN
  SELECT COALESCE(MAX(substring(no_peserta FROM '([0-9]+)$')::INTEGER), 0)
  INTO current_max
  FROM public.pendaftar
  WHERE cabang_lomba = 'Menyanyi Solo';

  -- Jika NYS dan NYA memakai nomor urut yang sama, peserta yang mendaftar
  -- lebih akhir dipindahkan ke nomor terakhir berikutnya.
  FOR conflict IN
    SELECT
      nys.id AS nys_id,
      nys.created_at AS nys_created_at,
      nya.id AS nya_id,
      nya.created_at AS nya_created_at
    FROM public.pendaftar AS nys
    JOIN public.pendaftar AS nya
      ON nya.cabang_lomba = 'Menyanyi Solo'
     AND nya.no_peserta LIKE 'NYA-2026-%'
     AND substring(nya.no_peserta FROM '([0-9]+)$') = substring(nys.no_peserta FROM '([0-9]+)$')
    WHERE nys.cabang_lomba = 'Menyanyi Solo'
      AND nys.no_peserta LIKE 'NYS-2026-%'
    ORDER BY GREATEST(nys.created_at, nya.created_at)
  LOOP
    current_max := current_max + 1;
    later_id := CASE
      WHEN conflict.nys_created_at > conflict.nya_created_at THEN conflict.nys_id
      ELSE conflict.nya_id
    END;

    UPDATE public.pendaftar
    SET no_peserta = 'NYA-2026-' || LPAD(current_max::TEXT, 3, '0')
    WHERE id = later_id;
  END LOOP;

  UPDATE public.pendaftar
  SET no_peserta = regexp_replace(no_peserta, '^NYS-', 'NYA-')
  WHERE cabang_lomba = 'Menyanyi Solo'
    AND no_peserta LIKE 'NYS-2026-%';
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_no_peserta()
RETURNS TRIGGER AS $$
DECLARE
    prefix TEXT;
    seq INT;
BEGIN
    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND NEW.cabang_lomba IS DISTINCT FROM OLD.cabang_lomba) THEN
        CASE NEW.cabang_lomba
            WHEN 'Adzan' THEN prefix := 'ADZ';
            WHEN 'Fashion Show' THEN prefix := 'FSH';
            WHEN 'MHQ' THEN prefix := 'MHQ';
            WHEN 'Karya Kolase' THEN prefix := 'KLS';
            WHEN 'Mewarnai' THEN prefix := 'WAR';
            WHEN 'Tendangan Penalti' THEN prefix := 'PNL';
            WHEN 'Menyanyi Solo' THEN prefix := 'NYA';
            ELSE prefix := 'JEA';
        END CASE;

        -- Mencegah dua pendaftaran bersamaan mengambil nomor yang sama.
        PERFORM pg_advisory_xact_lock(hashtext('no_peserta:' || NEW.cabang_lomba));

        SELECT COALESCE(MAX(substring(no_peserta FROM '([0-9]+)$')::INTEGER), 0) + 1
        INTO seq
        FROM public.pendaftar
        WHERE cabang_lomba = NEW.cabang_lomba
          AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);

        NEW.no_peserta := prefix || '-2026-' || LPAD(seq::TEXT, 3, '0');

        IF TG_OP = 'UPDATE' THEN
            NEW.nilai_total := NULL;
            NEW.detail_nilai := NULL;
            NEW.catatan_juri := NULL;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;

SELECT no_peserta, nama_anak
FROM public.pendaftar
WHERE cabang_lomba = 'Menyanyi Solo'
ORDER BY no_peserta;
