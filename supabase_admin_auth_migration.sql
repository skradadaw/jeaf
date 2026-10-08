-- Jalankan setelah supabase_juri_auth_migration.sql.
-- Memberikan akses penuh hanya kepada akun dengan app_metadata.role = admin.

DROP POLICY IF EXISTS "Admin membaca seluruh peserta" ON public.pendaftar;
CREATE POLICY "Admin membaca seluruh peserta"
ON public.pendaftar FOR SELECT TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admin membaca seluruh juri" ON public.juri;
CREATE POLICY "Admin membaca seluruh juri"
ON public.juri FOR SELECT TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admin membaca seluruh penugasan" ON public.juri_kategori;
CREATE POLICY "Admin membaca seluruh penugasan"
ON public.juri_kategori FOR SELECT TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admin membaca seluruh penilaian" ON public.penilaian_juri;
CREATE POLICY "Admin membaca seluruh penilaian"
ON public.penilaian_juri FOR SELECT TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admin menambah penilaian" ON public.penilaian_juri;
CREATE POLICY "Admin menambah penilaian"
ON public.penilaian_juri FOR INSERT TO authenticated
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admin mengubah penilaian" ON public.penilaian_juri;
CREATE POLICY "Admin mengubah penilaian"
ON public.penilaian_juri FOR UPDATE TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
