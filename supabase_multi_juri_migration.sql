-- Migrasi khusus database JinGa yang sudah memiliki tabel public.pendaftar.
-- Jalankan seluruh isi file ini di Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.juri (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    kode TEXT NOT NULL UNIQUE,
    nama TEXT NOT NULL,
    aktif BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.juri_kategori (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    juri_id UUID NOT NULL REFERENCES public.juri(id) ON DELETE CASCADE,
    cabang_lomba TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (juri_id, cabang_lomba)
);

CREATE TABLE IF NOT EXISTS public.penilaian_juri (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pendaftar_id UUID NOT NULL REFERENCES public.pendaftar(id) ON DELETE CASCADE,
    juri_id UUID NOT NULL REFERENCES public.juri(id) ON DELETE CASCADE,
    detail_nilai JSONB NOT NULL DEFAULT '{}'::jsonb,
    nilai_total INTEGER NOT NULL DEFAULT 0 CHECK (nilai_total >= 0 AND nilai_total <= 100),
    catatan TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (pendaftar_id, juri_id)
);

CREATE INDEX IF NOT EXISTS penilaian_juri_pendaftar_idx
ON public.penilaian_juri (pendaftar_id);

CREATE INDEX IF NOT EXISTS juri_kategori_cabang_idx
ON public.juri_kategori (cabang_lomba);

ALTER TABLE public.juri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.juri_kategori ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penilaian_juri ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Izinkan panitia membaca juri" ON public.juri;
CREATE POLICY "Izinkan panitia membaca juri"
ON public.juri FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Izinkan panitia membaca penugasan juri" ON public.juri_kategori;
CREATE POLICY "Izinkan panitia membaca penugasan juri"
ON public.juri_kategori FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Izinkan panitia membaca penilaian juri" ON public.penilaian_juri;
CREATE POLICY "Izinkan panitia membaca penilaian juri"
ON public.penilaian_juri FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Izinkan panitia menambah penilaian juri" ON public.penilaian_juri;
CREATE POLICY "Izinkan panitia menambah penilaian juri"
ON public.penilaian_juri FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Izinkan panitia mengubah penilaian juri" ON public.penilaian_juri;
CREATE POLICY "Izinkan panitia mengubah penilaian juri"
ON public.penilaian_juri FOR UPDATE TO anon USING (true) WITH CHECK (true);

INSERT INTO public.juri (kode, nama) VALUES
    ('ADZ-J1', 'Juri 1 Adzan'), ('ADZ-J2', 'Juri 2 Adzan'),
    ('FSH-J1', 'Juri 1 Fashion Show'), ('FSH-J2', 'Juri 2 Fashion Show'),
    ('MHQ-J1', 'Juri 1 MHQ'), ('MHQ-J2', 'Juri 2 MHQ'),
    ('MHQ-J3', 'Juri 3 MHQ'), ('MHQ-J4', 'Juri 4 MHQ'),
    ('KLS-J1', 'Juri 1 Karya Kolase'), ('KLS-J2', 'Juri 2 Karya Kolase'),
    ('WAR-J1', 'Juri 1 Mewarnai'), ('WAR-J2', 'Juri 2 Mewarnai'),
    ('PNL-J1', 'Juri 1 Tendangan Penalti'), ('PNL-J2', 'Juri 2 Tendangan Penalti'),
    ('NYS-J1', 'Juri 1 Menyanyi Solo'), ('NYS-J2', 'Juri 2 Menyanyi Solo')
ON CONFLICT (kode) DO NOTHING;

INSERT INTO public.juri_kategori (juri_id, cabang_lomba)
SELECT j.id, mapping.cabang_lomba
FROM public.juri j
JOIN (VALUES
    ('ADZ-J1', 'Adzan'), ('ADZ-J2', 'Adzan'),
    ('FSH-J1', 'Fashion Show'), ('FSH-J2', 'Fashion Show'),
    ('MHQ-J1', 'MHQ'), ('MHQ-J2', 'MHQ'),
    ('MHQ-J3', 'MHQ'), ('MHQ-J4', 'MHQ'),
    ('KLS-J1', 'Karya Kolase'), ('KLS-J2', 'Karya Kolase'),
    ('WAR-J1', 'Mewarnai'), ('WAR-J2', 'Mewarnai'),
    ('PNL-J1', 'Tendangan Penalti'), ('PNL-J2', 'Tendangan Penalti'),
    ('NYS-J1', 'Menyanyi Solo'), ('NYS-J2', 'Menyanyi Solo')
) AS mapping(kode, cabang_lomba) ON mapping.kode = j.kode
ON CONFLICT (juri_id, cabang_lomba) DO NOTHING;

CREATE OR REPLACE FUNCTION sync_nilai_akhir_peserta()
RETURNS TRIGGER AS $$
DECLARE
    target_pendaftar UUID;
    nilai_rata_rata INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_pendaftar := OLD.pendaftar_id;
    ELSE
        target_pendaftar := NEW.pendaftar_id;
    END IF;

    SELECT ROUND(AVG(nilai_total))::INTEGER
    INTO nilai_rata_rata
    FROM public.penilaian_juri
    WHERE pendaftar_id = target_pendaftar AND status = 'final';

    UPDATE public.pendaftar
    SET nilai_total = nilai_rata_rata
    WHERE id = target_pendaftar;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_nilai_akhir_peserta_trigger ON public.penilaian_juri;
CREATE TRIGGER sync_nilai_akhir_peserta_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.penilaian_juri
FOR EACH ROW EXECUTE FUNCTION sync_nilai_akhir_peserta();

-- Pemeriksaan hasil migrasi. Hasil awal yang benar: 16 juri dan 16 penugasan.
SELECT
    (SELECT COUNT(*) FROM public.juri) AS jumlah_juri,
    (SELECT COUNT(*) FROM public.juri_kategori) AS jumlah_penugasan;
