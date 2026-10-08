# Panduan Database Supabase

Dokumen ini adalah acuan utama untuk menjalankan query SQL JinGa Festival. Jalankan file melalui **Supabase Dashboard → SQL Editor** menggunakan project yang benar.

> Sebelum migrasi database produksi, buat backup dan uji terlebih dahulu pada project staging. Jangan menjalankan dua langkah secara paralel.

## Pilih jalur instalasi

### A. Project Supabase baru

Jalankan berurutan:

1. `supabase_schema.sql`
2. `supabase_juri_auth_migration.sql`
3. `supabase_admin_auth_migration.sql`
4. `supabase_penilaian_hardening.sql`
5. `supabase_penilaian_four_categories_fix.sql`
6. `supabase_remove_draft_lock.sql`
7. `supabase_penilaian_performance.sql`
8. Buat dan hubungkan akun juri mengikuti `JURI_LOGIN_SETUP.md`.

`supabase_schema.sql` sudah memuat tabel dasar, storage peserta, sistem multi-juri, empat juri MHQ, dan dua juri untuk cabang lainnya. Karena itu, jangan menjalankan `supabase_multi_juri_migration.sql` atau `supabase_update_juri_mhq.sql` pada jalur ini.

### B. Database lama yang baru memiliki tabel `pendaftar`

Jalankan berurutan:

1. Pastikan struktur awal dari `supabase_schema.sql` yang dibutuhkan aplikasi sudah tersedia.
2. `supabase_multi_juri_migration.sql`
3. `supabase_juri_auth_migration.sql`
4. `supabase_admin_auth_migration.sql`
5. `supabase_penilaian_hardening.sql`
6. `supabase_penilaian_four_categories_fix.sql`
7. `supabase_remove_draft_lock.sql`
8. `supabase_penilaian_performance.sql`
9. Buat dan hubungkan akun juri mengikuti `JURI_LOGIN_SETUP.md`.

Jika database lama masih mempunyai dua juri MHQ, jalankan `supabase_update_juri_mhq.sql` setelah langkah 2. Skrip ini idempoten dan hanya menambahkan `MHQ-J3` serta `MHQ-J4` jika belum ada.

## Fungsi setiap file

| File | Fungsi | Kapan dijalankan |
| --- | --- | --- |
| `supabase_schema.sql` | Bootstrap tabel peserta, storage, nomor peserta, dan struktur multi-juri | Project baru |
| `supabase_multi_juri_migration.sql` | Menambahkan tabel serta trigger multi-juri ke database lama | Upgrade database lama |
| `supabase_update_juri_mhq.sql` | Menambah juri ketiga dan keempat untuk MHQ | Hanya database lama yang masih memiliki dua juri MHQ |
| `supabase_juri_auth_migration.sql` | Menghubungkan juri dengan Supabase Auth dan memasang RLS juri | Setelah struktur multi-juri tersedia |
| `supabase_admin_auth_migration.sql` | Memberikan policy pengelolaan kepada akun dengan role admin | Setelah auth juri |
| `supabase_penilaian_hardening.sql` | Menambah kriteria, audit, validasi nilai, dan realtime | Setelah policy auth |
| `supabase_penilaian_four_categories_fix.sql` | Membatasi portal juri ke empat kategori, memperbaiki ringkasan, audit, dan locking | Setelah hardening |
| `supabase_remove_draft_lock.sql` | Menjadikan setiap simpan sebagai nilai final yang tetap dapat diedit | Langkah migrasi utama terakhir |
| `supabase_penilaian_performance.sql` | Menambah RPC dashboard, pembaruan per peserta, indeks, dan Broadcast privat | Setelah migrasi penghapusan draft |
| `supabase_fix_validasi_record_k.sql` | Hotfix historis untuk error `record "k" is not assigned yet` | Hanya instalasi lama yang belum menjalankan dua migrasi terakhir |

## Skrip yang tidak perlu dijalankan pada instalasi terkini

- `supabase_fix_validasi_record_k.sql` dipertahankan untuk pemulihan instalasi lama. Fungsi validasinya akan digantikan oleh `supabase_penilaian_four_categories_fix.sql` dan `supabase_remove_draft_lock.sql`.
- `supabase_update_juri_mhq.sql` tidak diperlukan jika bootstrap atau migrasi multi-juri terbaru sudah menghasilkan empat juri MHQ.

## Verifikasi setelah migrasi

Jalankan query berikut satu per satu di SQL Editor.

### Jumlah juri aktif

```sql
SELECT
  jk.cabang_lomba,
  COUNT(*) AS jumlah_juri
FROM public.juri_kategori AS jk
JOIN public.juri AS j ON j.id = jk.juri_id
WHERE j.aktif
  AND jk.cabang_lomba IN ('MHQ', 'Adzan', 'Menyanyi Solo', 'Fashion Show')
GROUP BY jk.cabang_lomba
ORDER BY jk.cabang_lomba;
```

Hasil yang diharapkan: MHQ memiliki 4 juri; Adzan, Menyanyi Solo, dan Fashion Show masing-masing memiliki 2 juri.

### Akun juri terhubung

```sql
SELECT kode, nama, user_id, aktif
FROM public.juri
WHERE kode LIKE 'MHQ-%'
   OR kode LIKE 'ADZ-%'
   OR kode LIKE 'NYS-%'
   OR kode LIKE 'FSH-%'
ORDER BY kode;
```

Semua juri yang akan login harus memiliki `user_id`.

### Kriteria penilaian aktif

```sql
SELECT
  cabang_lomba,
  COUNT(*) AS jumlah_kriteria,
  SUM(bobot) AS total_bobot
FROM public.kriteria_penilaian
WHERE aktif
GROUP BY cabang_lomba
ORDER BY cabang_lomba;
```

Setiap kategori harus mempunyai total bobot `100`.

### Status penyimpanan nilai

```sql
SELECT column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'penilaian_juri'
  AND column_name = 'status';
```

Setelah `supabase_remove_draft_lock.sql`, nilai default yang diharapkan adalah `'final'::text`.

## Catatan keamanan

- Jangan menaruh `SUPABASE_SERVICE_ROLE_KEY` pada variabel `NEXT_PUBLIC_*`, source code, commit, atau screenshot.
- Jalankan setup akun hanya dari komputer administrator.
- Jangan membuka policy `SELECT`, `UPDATE`, atau `DELETE` kepada role `anon` untuk tabel penilaian.
- Jika salah satu langkah gagal, hentikan urutan migrasi, simpan pesan error lengkap, dan perbaiki langkah tersebut sebelum melanjutkan.
