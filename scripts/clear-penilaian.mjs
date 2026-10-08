import { createClient } from '@supabase/supabase-js';

if (!process.argv.includes('--yes')) {
  throw new Error('Tambahkan --yes untuk mengonfirmasi penghapusan seluruh data penilaian.');
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum tersedia.');
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const countRows = async (table, filter) => {
  let query = supabase.from(table).select('id', { count: 'exact', head: true });
  if (filter) query = filter(query);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
};

const before = {
  nilaiJuri: await countRows('penilaian_juri'),
  pesertaDenganNilai: await countRows('pendaftar', (query) => query.not('nilai_total', 'is', null)),
  audit: await countRows('audit_penilaian_juri'),
};

const { error: scoreError } = await supabase
  .from('penilaian_juri')
  .delete()
  .not('id', 'is', null);
if (scoreError) throw scoreError;

const { error: participantError } = await supabase
  .from('pendaftar')
  .update({ nilai_total: null, detail_nilai: null, catatan_juri: null })
  .not('id', 'is', null);
if (participantError) throw participantError;

// Penghapusan nilai membuat entri audit baru, sehingga audit dibersihkan terakhir.
const { error: auditError } = await supabase
  .from('audit_penilaian_juri')
  .delete()
  .not('id', 'is', null);
if (auditError) throw auditError;

const after = {
  nilaiJuri: await countRows('penilaian_juri'),
  pesertaDenganNilai: await countRows('pendaftar', (query) => query.not('nilai_total', 'is', null)),
  audit: await countRows('audit_penilaian_juri'),
};

if (Object.values(after).some((count) => count !== 0)) {
  throw new Error(`Pembersihan belum tuntas: ${JSON.stringify(after)}`);
}

console.log(JSON.stringify({ before, after }, null, 2));
