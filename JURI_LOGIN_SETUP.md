# Setup Login Juri

Juri memilih identitas dari daftar lalu memasukkan PIN yang telah ditentukan panitia. Email akun hanya dipakai secara internal oleh Supabase Auth.

## Prasyarat

1. Selesaikan migrasi sesuai urutan pada [DATABASE_SETUP.md](./DATABASE_SETUP.md).
2. Pastikan `supabase_juri_auth_migration.sql` sudah dijalankan.
3. Siapkan **Project URL** dan **service_role key** dari Supabase Dashboard → Project Settings → API.

## Membuat akun juri

Jalankan dari PowerShell pada root project:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL='PROJECT_URL_ANDA'
$env:SUPABASE_SERVICE_ROLE_KEY='SERVICE_ROLE_KEY_ANDA'
npm.cmd run setup:juri
```

Skrip `setup:juri` akan:

- membuat akun yang belum tersedia;
- memperbarui PIN akun lama;
- mengonfirmasi email internal; dan
- menghubungkan akun Auth dengan tabel `public.juri`.

Akun yang diproses:

- MHQ: `MHQ-J1` sampai `MHQ-J4`
- Adzan: `ADZ-J1` dan `ADZ-J2`
- Menyanyi Solo: `NYS-J1` dan `NYS-J2`
- Fashion Show: `FSH-J1` dan `FSH-J2`

## Verifikasi

Jalankan query **Akun juri terhubung** pada `DATABASE_SETUP.md`. Semua akun yang digunakan harus memiliki `user_id`.

## Penggantian juri MHQ darurat

Penggantian petugas mempertahankan kode, ruangan, ID juri, dan seluruh nilai yang sudah tersimpan. Akun lama dilepas dari kursi juri sehingga sesi lama tidak lagi dapat membaca atau mengubah penilaian.

Isi variabel berikut dari PowerShell pada root project:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL='PROJECT_URL_ANDA'
$env:SUPABASE_SERVICE_ROLE_KEY='SERVICE_ROLE_KEY_ANDA'
$env:JURI_REPLACEMENT_CODE='MHQ-J1'
$env:JURI_REPLACEMENT_NAME='Nama Juri Pengganti'
$env:JURI_REPLACEMENT_PIN='123456'
$env:JURI_REPLACEMENT_DRY_RUN='true'
npm.cmd run replace:juri-mhq
```

Periksa kode, ruangan, nama lama, dan nama pengganti dari hasil dry run. Jika sudah benar, jalankan pergantian sebenarnya:

```powershell
$env:JURI_REPLACEMENT_DRY_RUN='false'
npm.cmd run replace:juri-mhq
```

Juri pengganti tetap memilih kode juri yang sama pada halaman login dan menggunakan PIN baru. Jangan membuat kode juri kelima atau memindahkan ruangan ketika acara sedang berlangsung.

Setelah verifikasi selesai, hapus environment variable sensitif dari sesi PowerShell:

```powershell
Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY
Remove-Item Env:JURI_REPLACEMENT_CODE
Remove-Item Env:JURI_REPLACEMENT_NAME
Remove-Item Env:JURI_REPLACEMENT_PIN
Remove-Item Env:JURI_REPLACEMENT_DRY_RUN
```

Jangan menaruh `SUPABASE_SERVICE_ROLE_KEY` pada `.env` frontend, variabel `NEXT_PUBLIC_*`, source code, commit, atau membagikannya kepada juri.
