-- Login juri sederhana (Kode Juri + PIN) dengan Supabase Auth di belakang layar.
-- Jalankan setelah supabase_multi_juri_migration.sql.

ALTER TABLE public.juri
ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS juri_user_id_idx ON public.juri (user_id);

-- Hubungkan otomatis akun Auth yang emailnya memakai pola:
-- kode-juri@juri.jinga.local, contoh: adz-j1@juri.jinga.local
UPDATE public.juri AS j
SET user_id = u.id
FROM auth.users AS u
WHERE lower(u.email) = lower(j.kode) || '@juri.jinga.local'
  AND j.user_id IS DISTINCT FROM u.id;

ALTER TABLE public.pendaftar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.juri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.juri_kategori ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penilaian_juri ENABLE ROW LEVEL SECURITY;

-- Hapus akses penilaian lama yang terbuka untuk anon.
DROP POLICY IF EXISTS "Izinkan panitia membaca juri" ON public.juri;
DROP POLICY IF EXISTS "Izinkan panitia membaca penugasan juri" ON public.juri_kategori;
DROP POLICY IF EXISTS "Izinkan panitia membaca penilaian juri" ON public.penilaian_juri;
DROP POLICY IF EXISTS "Izinkan panitia menambah penilaian juri" ON public.penilaian_juri;
DROP POLICY IF EXISTS "Izinkan panitia mengubah penilaian juri" ON public.penilaian_juri;

DROP POLICY IF EXISTS "Juri membaca identitas sendiri" ON public.juri;
DROP POLICY IF EXISTS "Juri membaca daftar juri" ON public.juri;
CREATE POLICY "Juri membaca daftar juri"
ON public.juri FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Juri membaca penugasannya" ON public.juri_kategori;
DROP POLICY IF EXISTS "Juri membaca daftar penugasan" ON public.juri_kategori;
CREATE POLICY "Juri membaca daftar penugasan"
ON public.juri_kategori FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Juri membaca peserta cabangnya" ON public.pendaftar;
CREATE POLICY "Juri membaca peserta cabangnya"
ON public.pendaftar FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.juri
    JOIN public.juri_kategori ON juri_kategori.juri_id = juri.id
    WHERE juri.user_id = auth.uid()
      AND juri.aktif = true
      AND juri_kategori.cabang_lomba = pendaftar.cabang_lomba
  )
);

-- Semua juri pada cabang dapat membaca progres agar status "menunggu juri" tetap akurat.
-- INSERT/UPDATE tetap dikunci hanya untuk identitas yang sedang login.
DROP POLICY IF EXISTS "Juri membaca progres cabangnya" ON public.penilaian_juri;
CREATE POLICY "Juri membaca progres cabangnya"
ON public.penilaian_juri FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.pendaftar p
    JOIN public.juri j ON j.user_id = auth.uid() AND j.aktif = true
    JOIN public.juri_kategori jk ON jk.juri_id = j.id
    WHERE p.id = penilaian_juri.pendaftar_id
      AND jk.cabang_lomba = p.cabang_lomba
  )
);

DROP POLICY IF EXISTS "Juri menambah nilainya sendiri" ON public.penilaian_juri;
CREATE POLICY "Juri menambah nilainya sendiri"
ON public.penilaian_juri FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.juri j
    JOIN public.juri_kategori jk ON jk.juri_id = j.id
    JOIN public.pendaftar p ON p.id = penilaian_juri.pendaftar_id
    WHERE j.id = penilaian_juri.juri_id
      AND j.user_id = auth.uid()
      AND j.aktif = true
      AND jk.cabang_lomba = p.cabang_lomba
  )
);

DROP POLICY IF EXISTS "Juri mengubah nilainya sendiri" ON public.penilaian_juri;
CREATE POLICY "Juri mengubah nilainya sendiri"
ON public.penilaian_juri FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.juri WHERE juri.id = penilaian_juri.juri_id AND juri.user_id = auth.uid())
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.juri j
    JOIN public.juri_kategori jk ON jk.juri_id = j.id
    JOIN public.pendaftar p ON p.id = penilaian_juri.pendaftar_id
    WHERE j.id = penilaian_juri.juri_id
      AND j.user_id = auth.uid()
      AND j.aktif = true
      AND jk.cabang_lomba = p.cabang_lomba
  )
);

-- Nilai akhir peserta baru muncul setelah semua juri aktif menyelesaikan penilaian.
CREATE OR REPLACE FUNCTION public.sync_nilai_akhir_peserta()
RETURNS TRIGGER AS $$
DECLARE
  target_pendaftar UUID;
  total_juri INTEGER;
  total_selesai INTEGER;
  nilai_rata_rata INTEGER;
BEGIN
  target_pendaftar := CASE WHEN TG_OP = 'DELETE' THEN OLD.pendaftar_id ELSE NEW.pendaftar_id END;

  SELECT COUNT(DISTINCT j.id)
  INTO total_juri
  FROM public.pendaftar p
  JOIN public.juri_kategori jk ON jk.cabang_lomba = p.cabang_lomba
  JOIN public.juri j ON j.id = jk.juri_id AND j.aktif = true
  WHERE p.id = target_pendaftar;

  SELECT COUNT(*), ROUND(AVG(pj.nilai_total))::INTEGER
  INTO total_selesai, nilai_rata_rata
  FROM public.penilaian_juri pj
  JOIN public.juri j ON j.id = pj.juri_id AND j.aktif = true
  WHERE pj.pendaftar_id = target_pendaftar AND pj.status = 'final';

  UPDATE public.pendaftar
  SET nilai_total = CASE WHEN total_juri > 0 AND total_selesai = total_juri THEN nilai_rata_rata ELSE NULL END
  WHERE id = target_pendaftar;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Pemeriksaan: semua juri harus sudah mempunyai user_id sebelum dipakai.
SELECT kode, nama, user_id
FROM public.juri
ORDER BY kode;
