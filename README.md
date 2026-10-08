# JinGa Festival 2026

Aplikasi pendaftaran peserta, presensi, dan penilaian multi-juri untuk JinGa Festival 2026. Dibangun menggunakan Next.js 16 dan Supabase.

## Menjalankan aplikasi

1. Salin konfigurasi Supabase ke `.env`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=ANON_KEY_ANDA
   ```

2. Pasang dependensi dan jalankan development server:

   ```powershell
   npm install
   npm run dev
   ```

3. Buka [http://localhost:3000](http://localhost:3000).

## Dokumentasi database

- [Panduan instalasi dan migrasi SQL](./DATABASE_SETUP.md)
- [Setup akun login juri](./JURI_LOGIN_SETUP.md)

Ikuti urutan pada `DATABASE_SETUP.md`. Jangan menjalankan semua file SQL secara acak karena beberapa file merupakan migrasi lanjutan atau hotfix untuk versi lama.

## Pemeriksaan sebelum deploy

```powershell
npm run lint
npm run build
```

File `.env` dan service-role key tidak boleh disimpan ke Git.
