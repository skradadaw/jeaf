-- Update jumlah juri MHQ dari 2 menjadi 4.
-- Aman dijalankan berulang kali pada database yang sudah memakai sistem multi-juri.

INSERT INTO public.juri (kode, nama) VALUES
    ('MHQ-J3', 'Juri 3 MHQ'),
    ('MHQ-J4', 'Juri 4 MHQ')
ON CONFLICT (kode) DO NOTHING;

INSERT INTO public.juri_kategori (juri_id, cabang_lomba)
SELECT id, 'MHQ'
FROM public.juri
WHERE kode IN ('MHQ-J3', 'MHQ-J4')
ON CONFLICT (juri_id, cabang_lomba) DO NOTHING;

-- Hasil yang diharapkan untuk kategori yang diminta:
-- MHQ 4, Adzan 2, Menyanyi Solo 2, Fashion Show 2.
SELECT jk.cabang_lomba, COUNT(*) AS jumlah_juri
FROM public.juri_kategori jk
JOIN public.juri j ON j.id = jk.juri_id
WHERE j.aktif = true
  AND jk.cabang_lomba IN ('MHQ', 'Adzan', 'Menyanyi Solo', 'Fashion Show')
GROUP BY jk.cabang_lomba
ORDER BY jk.cabang_lomba;
