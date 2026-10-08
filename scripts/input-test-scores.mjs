import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const juryPin = process.env.TEST_JURY_PIN || '202610';
const adminPin = process.env.TEST_ADMIN_PIN || '202609';
const countArgument = process.argv.find((argument) => argument.startsWith('--count='));
const participantsPerCategory = Number(countArgument?.slice('--count='.length) || 5);

if (!url || !anonKey || !serviceKey) {
  throw new Error('Kredensial Supabase belum lengkap.');
}

if (!Number.isInteger(participantsPerCategory) || participantsPerCategory < 1 || participantsPerCategory > 50) {
  throw new Error('Argumen --count harus berupa bilangan bulat antara 1 dan 50.');
}

const categories = ['MHQ', 'Adzan', 'Menyanyi Solo', 'Fashion Show'];
const service = createClient(url, serviceKey, { auth: { persistSession: false } });
const makeClient = () => createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function login(email, password) {
  const client = makeClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Login ${email} gagal: ${error.message}`);
  return client;
}

const admin = await login('admin@juri.jinga.local', adminPin);
const results = [];

for (const category of categories) {
  const [{ data: participants, error: participantError }, { data: juries, error: juryError }, { data: criteria, error: criteriaError }] = await Promise.all([
    service.from('pendaftar').select('id,no_peserta,nama_anak').eq('cabang_lomba', category).order('created_at'),
    service.from('juri_kategori').select('juri:juri_id(id,kode,nama,aktif)').eq('cabang_lomba', category),
    service.from('kriteria_penilaian').select('kode,nilai_maksimum,urutan').eq('cabang_lomba', category).eq('aktif', true).order('urutan'),
  ]);

  if (participantError) throw participantError;
  if (juryError) throw juryError;
  if (criteriaError) throw criteriaError;

  const participantIds = participants.map((participant) => participant.id);
  const { data: existingScores, error: existingError } = participantIds.length
    ? await service.from('penilaian_juri').select('pendaftar_id').in('pendaftar_id', participantIds)
    : { data: [], error: null };
  if (existingError) throw existingError;

  const scoredParticipantIds = new Set(existingScores.map((score) => score.pendaftar_id));
  const selectedParticipants = participants
    .filter((participant) => !scoredParticipantIds.has(participant.id))
    .slice(0, participantsPerCategory);
  const activeJuries = juries.map((assignment) => assignment.juri).filter((jury) => jury?.aktif).sort((a, b) => a.kode.localeCompare(b.kode));

  if (selectedParticipants.length < participantsPerCategory) {
    throw new Error(`${category}: peserta tanpa nilai kurang dari ${participantsPerCategory}.`);
  }
  if (activeJuries.length === 0) throw new Error(`${category}: tidak memiliki juri aktif.`);
  if (criteria.length === 0) throw new Error(`${category}: tidak memiliki kriteria aktif.`);

  const jurySessions = [];
  for (const jury of activeJuries) {
    jurySessions.push({ jury, client: await login(`${jury.kode.toLowerCase()}@juri.jinga.local`, juryPin) });
  }

  for (const [participantIndex, participant] of selectedParticipants.entries()) {
    const juryScores = [];

    for (const [juryIndex, session] of jurySessions.entries()) {
      const detail = Object.fromEntries(criteria.map((criterion, criterionIndex) => [
        criterion.kode,
        Math.min(Number(criterion.nilai_maksimum), 78 + participantIndex * 2 + juryIndex + criterionIndex),
      ]));

      const { data: saved, error: saveError } = await session.client
        .from('penilaian_juri')
        .insert({
          pendaftar_id: participant.id,
          juri_id: session.jury.id,
          detail_nilai: detail,
          nilai_total: 0,
          status: 'final',
          version: 1,
          catatan: `Data uji ${participantsPerCategory} peserta per cabang`,
        })
        .select('nilai_total')
        .single();

      if (saveError) throw new Error(`${category} / ${participant.nama_anak} / ${session.jury.kode}: ${saveError.message}`);
      juryScores.push({ kode: session.jury.kode, nilai: Number(saved.nilai_total) });
    }

    const expectedTotal = juryScores.reduce((total, score) => total + score.nilai, 0);
    const { data: storedParticipant, error: storedError } = await service
      .from('pendaftar')
      .select('nilai_total')
      .eq('id', participant.id)
      .single();
    if (storedError) throw storedError;

    const { data: dashboard, error: dashboardError } = await admin.rpc('get_dashboard_penilaian', { p_kategori: category });
    if (dashboardError) throw dashboardError;
    const summary = dashboard.participants.find((item) => item.id === participant.id);

    results.push({
      kategori: category,
      peserta: participant.nama_anak,
      nomor: participant.no_peserta,
      nilai_juri: juryScores.map((score) => `${score.kode}:${score.nilai}`).join(', '),
      jumlah_tampilan: expectedTotal,
      jumlah_database: storedParticipant.nilai_total,
      jumlah_rpc: summary?.nilai_akhir,
    });
  }
}

console.table(results);

const invalid = results.filter((result) => result.jumlah_database !== result.jumlah_tampilan || result.jumlah_rpc !== result.jumlah_tampilan);
if (invalid.length > 0) {
  console.error(`PERINGATAN: ${invalid.length} nilai ringkasan database masih memakai rumus lama. Tampilan admin tetap menjumlahkan nilai juri dengan benar.`);
  process.exitCode = 2;
} else {
  console.log(`Berhasil: ${results.length} peserta dinilai dan seluruh jumlah akhir sesuai.`);
}
