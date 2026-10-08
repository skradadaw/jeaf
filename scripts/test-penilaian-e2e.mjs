import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !anonKey || !serviceKey) throw new Error('Kredensial Supabase belum lengkap.');

const service = createClient(url, serviceKey, { auth: { persistSession: false } });
const makeClient = () => createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const categories = [
  { name: 'MHQ', codes: ['MHQ-J1', 'MHQ-J2', 'MHQ-J3', 'MHQ-J4'] },
  { name: 'Adzan', codes: ['ADZ-J1', 'ADZ-J2'] },
  { name: 'Menyanyi Solo', codes: ['NYS-J1', 'NYS-J2'] },
  { name: 'Fashion Show', codes: ['FSH-J1', 'FSH-J2'] },
];

const testedParticipants = [];
const results = [];
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function login(email, password) {
  const client = makeClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

async function scorePayload(category, seed) {
  const { data, error } = await service.from('kriteria_penilaian')
    .select('kode,nilai_maksimum').eq('cabang_lomba', category).eq('aktif', true).order('urutan');
  if (error) throw error;
  return Object.fromEntries(data.map((criterion, index) => [criterion.kode, Math.min(criterion.nilai_maksimum, 70 + seed + index)]));
}

try {
  const { count: initialScoreCount, error: initialError } = await service.from('penilaian_juri').select('id', { count: 'exact', head: true });
  if (initialError) throw initialError;
  assert(initialScoreCount === 0, 'Pengujian dihentikan karena database sudah memiliki nilai.');

  const admin = await login('admin@juri.jinga.local', '202609');

  for (const category of categories) {
    console.log(`[${category.name}] menyiapkan data uji`);
    const { data: participants, error: participantError } = await service.from('pendaftar')
      .select('id,nilai_total').eq('cabang_lomba', category.name).order('created_at').limit(2);
    if (participantError) throw participantError;
    assert(participants.length > 0, `${category.name}: tidak memiliki peserta untuk diuji.`);
    const participant = participants[0];
    testedParticipants.push(participant.id);

    const judgeSessions = [];
    for (const [index, code] of category.codes.entries()) {
      const client = await login(`${code.toLowerCase()}@juri.jinga.local`, '202610');
      const { data: judge, error: judgeError } = await client.from('juri').select('id,kode').eq('kode', code).single();
      if (judgeError) throw judgeError;
      judgeSessions.push({ client, judge, detail: await scorePayload(category.name, index + 1) });
    }

    // Klien lama yang masih mengirim status draft harus dinormalisasi menjadi nilai biasa.
    console.log(`[${category.name}] menguji penyimpanan langsung`);
    let response = await judgeSessions[0].client.from('penilaian_juri').insert({
      pendaftar_id: participant.id, juri_id: judgeSessions[0].judge.id,
      detail_nilai: judgeSessions[0].detail, nilai_total: 0, status: 'draft', version: 1, catatan: 'E2E simpan',
    }).select('id,status,version,nilai_total').single();
    if (response.error) throw response.error;
    assert(response.data.status === 'final' && response.data.version === 1, `${category.name}: nilai tidak tersimpan langsung.`);

    let check = await service.from('pendaftar').select('nilai_total').eq('id', participant.id).single();
    assert(check.data?.nilai_total === null, `${category.name}: nilai akhir muncul sebelum semua juri selesai.`);

    // Juri kedua tidak boleh membaca detail juri pertama.
    check = await judgeSessions[1].client.from('penilaian_juri').select('id').eq('pendaftar_id', participant.id);
    if (check.error) throw check.error;
    assert(check.data.length === 0, `${category.name}: RLS membocorkan nilai juri lain.`);

    // Simpan juri lainnya; sebelum juri terakhir nilai akhir harus tetap null.
    const finalTotals = [response.data.nilai_total];
    for (let index = 1; index < judgeSessions.length; index++) {
      console.log(`[${category.name}] simpan juri ${index + 1}`);
      const session = judgeSessions[index];
      const finalPayload = {
        pendaftar_id: participant.id, juri_id: session.judge.id, detail_nilai: session.detail,
        nilai_total: 0, status: 'final', version: 1, catatan: 'E2E simpan',
      };
      response = await session.client.from('penilaian_juri').insert(finalPayload).select('id,status,version,nilai_total,detail_nilai').single();
      if (response.error) throw response.error;
      finalTotals.push(response.data.nilai_total);
      if (index < judgeSessions.length - 1) {
        check = await service.from('pendaftar').select('nilai_total').eq('id', participant.id).single();
        assert(check.data?.nilai_total === null, `${category.name}: nilai akhir muncul sebelum semua juri selesai.`);
      }
    }

    const expectedTotal = finalTotals.reduce((sum, value) => sum + value, 0);
    check = await service.from('pendaftar').select('nilai_total').eq('id', participant.id).single();
    assert(check.data?.nilai_total === expectedTotal, `${category.name}: jumlah nilai akhir tidak sesuai.`);

    // Ringkasan aman harus lengkap.
    check = await judgeSessions[0].client.rpc('get_ringkasan_penilaian', { p_kategori: category.name });
    if (check.error) throw check.error;
    const summary = check.data.find((item) => item.pendaftar_id === participant.id);
    assert(summary?.jumlah_selesai === category.codes.length && summary?.nilai_akhir === expectedTotal, `${category.name}: ringkasan tidak sesuai.`);

    // Simulasi dua perangkat memakai version yang sama: penyimpanan kedua harus ditolak.
    const first = judgeSessions[0];
    console.log(`[${category.name}] menguji konflik versi`);
    response = await first.client.from('penilaian_juri').update({ version: 2, catatan: 'E2E concurrency A' })
      .eq('pendaftar_id', participant.id).eq('juri_id', first.judge.id).select('version').single();
    if (response.error) throw response.error;
    const staleUpdate = await first.client.from('penilaian_juri').update({ version: 2, catatan: 'E2E concurrency B' })
      .eq('pendaftar_id', participant.id).eq('juri_id', first.judge.id);
    assert(Boolean(staleUpdate.error), `${category.name}: konflik version tidak ditolak.`);

    // Percobaan kategori salah harus ditolak.
    console.log(`[${category.name}] menguji kategori salah`);
    const otherCategory = categories.find(item => item.name !== category.name);
    const { data: otherParticipants } = await service.from('pendaftar').select('id').eq('cabang_lomba', otherCategory.name).limit(1);
    const wrongAttempt = await first.client.from('penilaian_juri').insert({
      pendaftar_id: otherParticipants[0].id, juri_id: first.judge.id, detail_nilai: first.detail,
      nilai_total: 0, status: 'final', version: 1,
    });
    assert(Boolean(wrongAttempt.error), `${category.name}: juri dapat menilai kategori lain.`);

    // Status lock dari klien lama diabaikan dan nilai tetap dapat diedit juri.
    console.log(`[${category.name}] memastikan fitur kunci sudah tidak aktif`);
    const { data: currentFirst, error: currentError } = await admin.from('penilaian_juri')
      .select('detail_nilai,version').eq('pendaftar_id', participant.id).eq('juri_id', first.judge.id).single();
    if (currentError) throw currentError;
    response = await admin.from('penilaian_juri').update({ status: 'locked', version: currentFirst.version + 1, detail_nilai: currentFirst.detail_nilai })
      .eq('pendaftar_id', participant.id).eq('juri_id', first.judge.id).select('status,locked_at,version').single();
    if (response.error) throw response.error;
    assert(response.data.status === 'final' && response.data.locked_at === null, `${category.name}: status kunci masih aktif.`);
    const unlockedUpdate = await first.client.from('penilaian_juri').update({ version: response.data.version + 1, catatan: 'Tetap dapat diedit' })
      .eq('pendaftar_id', participant.id).eq('juri_id', first.judge.id);
    assert(!unlockedUpdate.error, `${category.name}: nilai tidak dapat diedit setelah disimpan.`);

    results.push({ category: category.name, judges: category.codes.length, total: expectedTotal, status: 'LULUS' });
  }

  const { count: auditCount, error: auditError } = await service.from('audit_penilaian_juri')
    .select('id', { count: 'exact', head: true }).in('pendaftar_id', testedParticipants);
  if (auditError) throw auditError;
  assert(auditCount > 0, 'Audit log tidak mencatat pengujian.');
  console.table(results);
  console.log(`Audit tercatat: ${auditCount} perubahan`);
} finally {
  if (testedParticipants.length) {
    await service.from('penilaian_juri').delete().in('pendaftar_id', testedParticipants);
    await service.from('pendaftar').update({ nilai_total: null }).in('id', testedParticipants);
    await service.from('audit_penilaian_juri').delete().in('pendaftar_id', testedParticipants);
  }
  const [scoresLeft, totalsLeft, auditsLeft] = await Promise.all([
    service.from('penilaian_juri').select('id', { count: 'exact', head: true }),
    service.from('pendaftar').select('id', { count: 'exact', head: true }).not('nilai_total', 'is', null),
    service.from('audit_penilaian_juri').select('id', { count: 'exact', head: true }),
  ]);
  console.log(`Cleanup: nilai=${scoresLeft.count}, total_terisi=${totalsLeft.count}, audit=${auditsLeft.count}`);
}
