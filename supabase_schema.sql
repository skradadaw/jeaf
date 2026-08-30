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
