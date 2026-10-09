import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const juryPin = process.env.TEST_JURY_PIN || '202610';

if (!url || !anonKey || !serviceKey) {
  throw new Error('Kredensial Supabase belum lengkap.');
}

const service = createClient(url, serviceKey, { auth: { persistSession: false } });
const makeClient = () => createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function login(email, password) {
  const client = makeClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Login ${email} gagal: ${error.message}`);
  return { client, user: data.user };
}

// 5 Peserta target MHQ (Ruang 1: MHQ-2026-001 s/d MHQ-2026-005)
const targetNomor = [
  'MHQ-2026-001',
  'MHQ-2026-002',
  'MHQ-2026-003',
  'MHQ-2026-004',
  'MHQ-2026-005',
];

// Data nilai yang realistis dan beragam untuk masing-masing peserta dari Juri 1 dan Juri 2
const scoreDefinitions = {
  'MHQ-2026-001': {
    juri1: {
      detail: { kelancaran: 92, ketepatan: 88, tajwid: 86, adab: 95 },
      catatan: 'Hafalan sangat lancar, makhraj huruf jelas, adab panggung sangat baik.',
    },
    juri2: {
      detail: { kelancaran: 90, ketepatan: 86, tajwid: 84, adab: 92 },
      catatan: 'Tartil dan percaya diri, perhatikan panjang mad pada akhir ayat.',
    },
  },
  'MHQ-2026-002': {
    juri1: {
      detail: { kelancaran: 95, ketepatan: 92, tajwid: 90, adab: 96 },
      catatan: "Masya Allah bacaan sangat tartil, irama indah dan tajwid rapi.",
    },
    juri2: {
      detail: { kelancaran: 94, ketepatan: 90, tajwid: 88, adab: 95 },
      catatan: 'Fasikh, sangat tenang dalam melafalkan surah. Penampilan memuaskan.',
    },
  },
  'MHQ-2026-003': {
    juri1: {
      detail: { kelancaran: 86, ketepatan: 84, tajwid: 82, adab: 90 },
      catatan: 'Hafalan cukup baik, ada sedikit ragu di awal surah namun dapat melanjutkan.',
    },
    juri2: {
      detail: { kelancaran: 88, ketepatan: 82, tajwid: 80, adab: 90 },
      catatan: 'Suara lantang dan berani tampil, perlu diasah kembali makharijul huruf.',
    },
  },
  'MHQ-2026-004': {
    juri1: {
      detail: { kelancaran: 89, ketepatan: 87, tajwid: 85, adab: 92 },
      catatan: 'Pelafalan mantap dan adab santun. Ghunnah sudah terdengar baik.',
    },
    juri2: {
      detail: { kelancaran: 91, ketepatan: 85, tajwid: 86, adab: 91 },
      catatan: 'Hafalan kuat, artikulasi jelas, pertahankan kualitas bacaan.',
    },
  },
  'MHQ-2026-005': {
    juri1: {
      detail: { kelancaran: 96, ketepatan: 94, tajwid: 92, adab: 98 },
      catatan: 'Istimewa, hafalan mutqin, tajwid dan waqaf ibtida sangat presisi.',
    },
    juri2: {
      detail: { kelancaran: 95, ketepatan: 93, tajwid: 91, adab: 97 },
      catatan: 'Penampilan luar biasa, tenang, merdu, dan penuh penghayatan.',
    },
  },
};

async function main() {
  console.log('Mengambil data 5 peserta MHQ...');
  const { data: participants, error: pError } = await service
    .from('pendaftar')
    .select('id, no_peserta, nama_anak, asal_sekolah, ruangan_mhq, status_kehadiran')
    .eq('cabang_lomba', 'MHQ')
    .in('no_peserta', targetNomor)
    .order('no_peserta');

  if (pError || !participants || participants.length !== 5) {
    throw new Error(`Gagal mengambil 5 peserta target: ${pError?.message || `Hanya ditemukan ${participants?.length} peserta`}`);
  }

  // Ambil data juri MHQ Ruang 1
  const { data: juries, error: jError } = await service
    .from('juri')
    .select('id, kode, nama, ruangan_mhq, aktif')
    .in('kode', ['MHQ-J1', 'MHQ-J2'])
    .order('kode');

  if (jError || !juries || juries.length !== 2) {
    throw new Error(`Juri MHQ Ruang 1 tidak lengkap: ${jError?.message}`);
  }

  const juri1 = juries.find((j) => j.kode === 'MHQ-J1');
  const juri2 = juries.find((j) => j.kode === 'MHQ-J2');

  console.log('Melakukan autentikasi Juri 1 & Juri 2...');
  const session1 = await login('mhq-j1@juri.jinga.local', juryPin);
  const session2 = await login('mhq-j2@juri.jinga.local', juryPin);

  const results = [];

  for (const participant of participants) {
    console.log(`\nMemproses [${participant.no_peserta}] ${participant.nama_anak}...`);

    // Tandai kehadiran jika belum
    if (participant.status_kehadiran !== 'Hadir') {
      const { error: attendError } = await service
        .from('pendaftar')
        .update({
          status_kehadiran: 'Hadir',
          waktu_kehadiran: new Date().toISOString(),
        })
        .eq('id', participant.id);

      if (attendError) {
        console.warn(`Peringatan update kehadiran: ${attendError.message}`);
      }
    }

    const scoreData = scoreDefinitions[participant.no_peserta];
    if (!scoreData) {
      throw new Error(`Definisi nilai untuk ${participant.no_peserta} tidak ditemukan.`);
    }

    // Input nilai Juri 1
    const { data: savedJ1, error: errJ1 } = await session1.client
      .from('penilaian_juri')
      .upsert(
        {
          pendaftar_id: participant.id,
          juri_id: juri1.id,
          detail_nilai: scoreData.juri1.detail,
          catatan: scoreData.juri1.catatan,
          status: 'final',
          version: 1,
        },
        { onConflict: 'pendaftar_id,juri_id' }
      )
      .select('nilai_total')
      .single();

    if (errJ1) {
      throw new Error(`Gagal input nilai Juri 1 untuk ${participant.nama_anak}: ${errJ1.message}`);
    }

    // Input nilai Juri 2
    const { data: savedJ2, error: errJ2 } = await session2.client
      .from('penilaian_juri')
      .upsert(
        {
          pendaftar_id: participant.id,
          juri_id: juri2.id,
          detail_nilai: scoreData.juri2.detail,
          catatan: scoreData.juri2.catatan,
          status: 'final',
          version: 1,
        },
        { onConflict: 'pendaftar_id,juri_id' }
      )
      .select('nilai_total')
      .single();

    if (errJ2) {
      throw new Error(`Gagal input nilai Juri 2 untuk ${participant.nama_anak}: ${errJ2.message}`);
    }

    // Periksa hasil update di tabel pendaftar
    const { data: updatedParticipant, error: fetchErr } = await service
      .from('pendaftar')
      .select('nilai_total, status_kehadiran')
      .eq('id', participant.id)
      .single();

    if (fetchErr) throw fetchErr;

    const expectedTotal = savedJ1.nilai_total + savedJ2.nilai_total;

    results.push({
      no_peserta: participant.no_peserta,
      nama_anak: participant.nama_anak,
      asal_sekolah: participant.asal_sekolah,
      ruangan: participant.ruangan_mhq,
      nilai_juri1: savedJ1.nilai_total,
      nilai_juri2: savedJ2.nilai_total,
      total_nilai: updatedParticipant.nilai_total,
      expected: expectedTotal,
      status: updatedParticipant.nilai_total === expectedTotal ? 'VALID' : 'MISMATCH',
    });
  }

  console.log('\n================ HASIL PENILAIAN 5 PESERTA MHQ ================');
  console.table(results);

  // Verifikasi via get_dashboard_penilaian
  const adminClient = makeClient();
  const adminPin = process.env.TEST_ADMIN_PIN || '202609';
  await adminClient.auth.signInWithPassword({
    email: 'admin@juri.jinga.local',
    password: adminPin,
  });

  const { data: dashboard, error: dashErr } = await adminClient.rpc('get_dashboard_penilaian', {
    p_kategori: 'MHQ',
  });

  if (dashErr) {
    console.error('Error saat verifikasi dashboard:', dashErr.message);
  } else {
    const scoredInDash = dashboard.participants.filter((p) => targetNomor.includes(p.no_peserta));
    console.log('\nStatus pada Dashboard:');
    scoredInDash.forEach((p) => {
      console.log(
        `- ${p.no_peserta} (${p.nama_anak}): Nilai Akhir = ${p.nilai_akhir}, Selesai = ${p.jumlah_selesai}/${p.jumlah_juri} juri`
      );
    });
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
