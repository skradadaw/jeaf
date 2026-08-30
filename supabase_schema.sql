-- Buat tabel pendaftar
CREATE TABLE public.pendaftar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    nama_anak TEXT NOT NULL,
    jenis_kelamin TEXT NOT NULL,
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
ALTER TABLE public.pendaftar ADD COLUMN nilai_total INTEGER, ADD COLUMN detail_nilai JSONB, ADD COLUMN catatan_juri TEXT;

-- Tambahan kolom untuk nomor peserta urut & konsisten
ALTER TABLE public.pendaftar ADD COLUMN no_peserta TEXT;

-- Script UPDATE untuk mengisi data lama (Jalankan sekali di SQL Editor Supabase)
-- DO $$
-- DECLARE
--     rec RECORD;
--     prefix TEXT;
--     seq INT;
-- BEGIN
--     FOR rec IN 
--         SELECT id, cabang_lomba, created_at 
--         FROM public.pendaftar 
--         ORDER BY created_at ASC
--     LOOP
--         CASE rec.cabang_lomba
--             WHEN 'Adzan' THEN prefix := 'ADZ';
--             WHEN 'Fashion Show' THEN prefix := 'FSH';
--             WHEN 'MHQ' THEN prefix := 'MHQ';
--             WHEN 'Karya Kolase' THEN prefix := 'KOL';
--             WHEN 'Mewarnai' THEN prefix := 'WAR';
--             WHEN 'Tendangan Penalti' THEN prefix := 'PEN';
--             WHEN 'Menyanyi Solo' THEN prefix := 'NYA';
--             ELSE prefix := 'JEA';
--         END CASE;
--         
--         SELECT COUNT(*) INTO seq
--         FROM public.pendaftar
--         WHERE cabang_lomba = rec.cabang_lomba AND created_at <= rec.created_at;
--         
--         UPDATE public.pendaftar
--         SET no_peserta = prefix || '-2026-' || LPAD(seq::text, 3, '0')
--         WHERE id = rec.id;
--     END LOOP;
-- END;
-- $$ LANGUAGE plpgsql;

-- Trigger untuk membuat nomor peserta otomatis saat ada pendaftar baru
CREATE OR REPLACE FUNCTION generate_no_peserta()
RETURNS TRIGGER AS $$
DECLARE
    prefix TEXT;
    seq INT;
BEGIN
    CASE NEW.cabang_lomba
        WHEN 'Adzan' THEN prefix := 'ADZ';
        WHEN 'Fashion Show' THEN prefix := 'FSH';
        WHEN 'MHQ' THEN prefix := 'MHQ';
        WHEN 'Karya Kolase' THEN prefix := 'KOL';
        WHEN 'Mewarnai' THEN prefix := 'WAR';
        WHEN 'Tendangan Penalti' THEN prefix := 'PEN';
        WHEN 'Menyanyi Solo' THEN prefix := 'NYA';
        ELSE prefix := 'JEA';
    END CASE;

    SELECT COUNT(*) INTO seq
    FROM public.pendaftar
    WHERE cabang_lomba = NEW.cabang_lomba;

    seq := seq + 1;
    NEW.no_peserta := prefix || '-2026-' || LPAD(seq::text, 3, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_no_peserta_trigger
BEFORE INSERT ON public.pendaftar
FOR EACH ROW
EXECUTE FUNCTION generate_no_peserta();