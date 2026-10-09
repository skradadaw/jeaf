import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split(/\r?\n/).flatMap((line) => {
  const index = line.indexOf('=');
  return index > 0 ? [[line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')]] : [];
}));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const fail = (error) => { if (error) throw error; };
const { data: jurors, error: jurorError } = await supabase.from('juri').select('id,kode,ruangan_mhq').eq('aktif', true).in('kode', ['MHQ-J1', 'MHQ-J2', 'MHQ-J3', 'MHQ-J4']).order('kode');
fail(jurorError);
const { data: criteria, error: criteriaError } = await supabase.from('kriteria_penilaian').select('kode,nilai_maksimum').eq('cabang_lomba', 'MHQ').eq('aktif', true).order('urutan');
fail(criteriaError);
if (!criteria?.length) throw new Error('Kriteria aktif MHQ tidak ditemukan');
const scores = Object.fromEntries(criteria.map((criterion) => [criterion.kode, Math.max(1, Math.round(Number(criterion.nilai_maksimum) * 0.9))]));
const { error: resetScoresError } = await supabase.from('penilaian_juri').delete().not('id', 'is', null);
fail(resetScoresError);
const { error: resetAuditError } = await supabase.from('audit_penilaian_juri').delete().not('id', 'is', null);
fail(resetAuditError);
const { error: resetParticipantsError } = await supabase.from('pendaftar').update({ nilai_total: null, detail_nilai: null, catatan_juri: null }).not('id', 'is', null);
fail(resetParticipantsError);
const { data: roomOne, error: roomOneError } = await supabase.from('pendaftar').select('id,nama_anak,ruangan_mhq').eq('cabang_lomba', 'MHQ').eq('ruangan_mhq', 1).order('created_at').limit(5);
fail(roomOneError);
const { data: roomTwo, error: roomTwoError } = await supabase.from('pendaftar').select('id,nama_anak,ruangan_mhq').eq('cabang_lomba', 'MHQ').eq('ruangan_mhq', 2).order('created_at').limit(5);
fail(roomTwoError);
if (roomOne.length < 5 || roomTwo.length < 5) throw new Error('Masing-masing ruangan membutuhkan minimal 5 peserta');
const participants = [...roomOne, ...roomTwo];
for (const [index, participant] of participants.entries()) {
  const roomJurors = jurors.filter((juror) => juror.ruangan_mhq === participant.ruangan_mhq);
  if (roomJurors.length < 2) throw new Error(`Juri aktif untuk ruang ${participant.ruangan_mhq} tidak lengkap`);
  const selectedJurors = index % 5 < 3 ? roomJurors : roomJurors.slice(0, 1);
  for (const juror of selectedJurors) {
    const { error } = await supabase.from('penilaian_juri').upsert({ pendaftar_id: participant.id, juri_id: juror.id, detail_nilai: scores, catatan: 'Uji alur penilaian MHQ', status: 'final' }, { onConflict: 'pendaftar_id,juri_id' });
    fail(error);
  }
}
const { data: result, error: resultError } = await supabase.from('pendaftar').select('id,nama_anak,ruangan_mhq,nilai_total').in('id', participants.map((p) => p.id)).order('nama_anak');
fail(resultError);
console.log(JSON.stringify({ participants: result, expected: '3 peserta bernilai 36 (2 juri x 18), 2 peserta NULL (1 juri)', jurors }, null, 2));
