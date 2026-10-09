BEGIN;

DELETE FROM public.penilaian_juri;

UPDATE public.pendaftar
SET nilai_total = NULL,
    detail_nilai = NULL,
    catatan_juri = NULL
WHERE nilai_total IS NOT NULL
   OR detail_nilai IS NOT NULL
   OR catatan_juri IS NOT NULL;

COMMIT;
