-- Buat tabel pendaftar
CREATE TABLE public.pendaftar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    nama_anak TEXT NOT NULL,
    jenis_kelamin TEXT NOT NULL,
    tempat_lahir TEXT,
    tgl_lahir DATE NOT NULL,
    asal_sekolah TEXT NOT NULL,
    cabang_lomba TEXT NOT NULL,
    nama_ortu TEXT NOT NULL,
    no_wa TEXT NOT NULL,
    no_wa_pembimbing TEXT,
    foto_url TEXT,
    minat_sekolah TEXT,
    status_pembayaran TEXT DEFAULT 'Menunggu' NOT NULL,
    status_kehadiran TEXT DEFAULT 'Belum Hadir' NOT NULL,
    waktu_kehadiran TIMESTAMP WITH TIME ZONE
);

-- Atur kebijakan keamanan (Row Level Security / RLS)
ALTER TABLE public.pendaftar ENABLE ROW LEVEL SECURITY;

-- Izinkan anon (pendaftar publik) untuk MENGIRIM / INSERT data
CREATE POLICY "Izinkan publik untuk mendaftar" 
ON public.pendaftar 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Izinkan anon (karena ini tanpa auth admin yang ketat) untuk MEMBACA data di dashboard
CREATE POLICY "Izinkan panitia membaca data" 
ON public.pendaftar 
FOR SELECT 
TO anon 
USING (true);

-- Izinkan anon untuk MENGUBAH (UPDATE) data pendaftar (untuk mengubah status kehadiran)
CREATE POLICY "Izinkan panitia mengubah data" 
ON public.pendaftar 
FOR UPDATE 
TO anon 
USING (true)
WITH CHECK (true);

-- Izinkan anon untuk MENGHAPUS (DELETE) data pendaftar
CREATE POLICY "Izinkan panitia menghapus data" 
ON public.pendaftar 
FOR DELETE 
TO anon 
USING (true);

-- Buat storage bucket untuk menyimpan foto anak
INSERT INTO storage.buckets (id, name, public) 
VALUES ('foto-peserta', 'foto-peserta', true);

-- Izinkan publik untuk upload ke storage bucket 'foto-peserta'
CREATE POLICY "Izinkan publik upload foto" 
ON storage.objects 
FOR INSERT 
TO anon 
WITH CHECK (bucket_id = 'foto-peserta');

-- Izinkan publik untuk melihat foto
CREATE POLICY "Izinkan publik melihat foto" 
ON storage.objects 
FOR SELECT 
TO anon 
USING (bucket_id = 'foto-peserta');
 
-- Tambahan kolom untuk fitur Penilaian Juri
ALTER TABLE public.pendaftar ADD COLUMN IF NOT EXISTS nilai_total INTEGER, ADD COLUMN IF NOT EXISTS detail_nilai JSONB, ADD COLUMN IF NOT EXISTS catatan_juri TEXT;

-- Tambahan kolom untuk nomor peserta & tempat lahir
ALTER TABLE public.pendaftar ADD COLUMN IF NOT EXISTS no_peserta TEXT;
ALTER TABLE public.pendaftar ADD COLUMN IF NOT EXISTS tempat_lahir TEXT;

-- Trigger untuk membuat nomor peserta otomatis saat ada pendaftar baru atau perpindahan cabang lomba
CREATE OR REPLACE FUNCTION generate_no_peserta()
RETURNS TRIGGER AS $$
DECLARE
    prefix TEXT;
    seq INT;
BEGIN
    -- Hanya jalankan jika pendaftaran baru (INSERT) atau cabang lomba diubah (UPDATE)
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

        SELECT COUNT(*) INTO seq
        FROM public.pendaftar
        WHERE cabang_lomba = NEW.cabang_lomba AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

        seq := seq + 1;
        NEW.no_peserta := prefix || '-2026-' || LPAD(seq::text, 3, '0');
        
        -- Reset nilai lomba sebelumnya jika berpindah cabang lomba
        IF TG_OP = 'UPDATE' THEN
            NEW.nilai_total := NULL;
            NEW.detail_nilai := NULL;
            NEW.catatan_juri := NULL;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_no_peserta_trigger ON public.pendaftar;
CREATE TRIGGER set_no_peserta_trigger
BEFORE INSERT OR UPDATE OF cabang_lomba ON public.pendaftar
FOR EACH ROW
EXECUTE FUNCTION generate_no_peserta();

-- ============================================================
-- Sistem penilaian multi-juri
-- Jalankan bagian ini di Supabase SQL Editor untuk database lama.
-- ============================================================

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

-- Jumlah juri awal: MHQ 4 juri, cabang lainnya 2 juri.
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

-- Pertahankan kolom nilai lama sebagai jumlah nilai final semua juri.
CREATE OR REPLACE FUNCTION sync_nilai_akhir_peserta()
RETURNS TRIGGER AS $$
DECLARE
    target_pendaftar UUID;
    jumlah_nilai INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_pendaftar := OLD.pendaftar_id;
    ELSE
        target_pendaftar := NEW.pendaftar_id;
    END IF;

    SELECT SUM(nilai_total)::INTEGER
    INTO jumlah_nilai
    FROM public.penilaian_juri
    WHERE pendaftar_id = target_pendaftar AND status = 'final';

    UPDATE public.pendaftar
    SET nilai_total = jumlah_nilai
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
