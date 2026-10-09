import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const judgeCode = (process.env.JURI_REPLACEMENT_CODE || '').trim().toUpperCase();
const replacementName = (process.env.JURI_REPLACEMENT_NAME || '').trim();
const replacementPin = (process.env.JURI_REPLACEMENT_PIN || '').trim();
const dryRun = (process.env.JURI_REPLACEMENT_DRY_RUN || '').trim().toLowerCase() === 'true';

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib tersedia.');
}
if (!/^MHQ-J[1-4]$/.test(judgeCode)) {
  throw new Error('JURI_REPLACEMENT_CODE harus salah satu dari MHQ-J1 sampai MHQ-J4.');
}
if (replacementName.length < 3 || replacementName.length > 100) {
  throw new Error('JURI_REPLACEMENT_NAME harus terdiri dari 3 sampai 100 karakter.');
}
if (!/^\d{6}$/.test(replacementPin)) {
  throw new Error('JURI_REPLACEMENT_PIN harus tepat 6 digit.');
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: judgeSeat, error: judgeError } = await admin
  .from('juri')
  .select('id, kode, nama, user_id, aktif, ruangan_mhq')
  .eq('kode', judgeCode)
  .single();

if (judgeError || !judgeSeat) {
  throw new Error(`Kursi juri ${judgeCode} tidak ditemukan: ${judgeError?.message || 'data kosong'}`);
}
if (!judgeSeat.aktif || ![1, 2].includes(judgeSeat.ruangan_mhq)) {
  throw new Error(`${judgeCode} harus aktif dan sudah ditempatkan di Ruang 1 atau Ruang 2.`);
}
if (!judgeSeat.user_id) {
  throw new Error(`${judgeCode} belum terhubung ke akun Auth lama.`);
}

const { data: oldUserData, error: oldUserError } = await admin.auth.admin.getUserById(judgeSeat.user_id);
if (oldUserError || !oldUserData.user?.email) {
  throw new Error(`Akun Auth lama ${judgeCode} tidak ditemukan: ${oldUserError?.message || 'email kosong'}`);
}

const oldUser = oldUserData.user;
const canonicalEmail = `${judgeCode.toLowerCase()}@juri.jinga.local`;
const { data: listedUsers, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listError) throw listError;

const canonicalOwner = listedUsers.users.find((user) => user.email?.toLowerCase() === canonicalEmail);
if (canonicalOwner && canonicalOwner.id !== oldUser.id) {
  throw new Error(`Email login ${canonicalEmail} sudah dipakai akun lain yang tidak terhubung ke ${judgeCode}.`);
}

console.log(`Kursi: ${judgeCode} · Ruang ${judgeSeat.ruangan_mhq}`);
console.log(`Petugas lama: ${judgeSeat.nama}`);
console.log(`Petugas pengganti: ${replacementName}`);

if (dryRun) {
  console.log('DRY RUN selesai. Tidak ada akun atau data juri yang diubah.');
  process.exit(0);
}

const retiredEmail = `${judgeCode.toLowerCase()}-retired-${Date.now()}@juri.jinga.local`;
const oldEmail = oldUser.email;
let oldEmailWasMoved = false;
let replacementUser = null;
let judgeSeatWasRelinked = false;

try {
  if (oldEmail.toLowerCase() === canonicalEmail) {
    const { error: moveOldEmailError } = await admin.auth.admin.updateUserById(oldUser.id, {
      email: retiredEmail,
      email_confirm: true,
    });
    if (moveOldEmailError) throw moveOldEmailError;
    oldEmailWasMoved = true;
  }

  const { data: createdUserData, error: createUserError } = await admin.auth.admin.createUser({
    email: canonicalEmail,
    password: replacementPin,
    email_confirm: true,
    user_metadata: { judge_code: judgeCode, judge_name: replacementName },
  });
  if (createUserError || !createdUserData.user) {
    throw createUserError || new Error('Akun pengganti tidak berhasil dibuat.');
  }
  replacementUser = createdUserData.user;

  const { data: updatedSeat, error: relinkError } = await admin
    .from('juri')
    .update({ user_id: replacementUser.id, nama: replacementName })
    .eq('id', judgeSeat.id)
    .eq('user_id', oldUser.id)
    .select('id, kode, nama, user_id, aktif, ruangan_mhq')
    .single();
  if (relinkError || !updatedSeat) {
    throw relinkError || new Error('Kursi juri gagal dihubungkan ke akun pengganti.');
  }
  judgeSeatWasRelinked = true;

  const { error: deleteOldUserError } = await admin.auth.admin.deleteUser(oldUser.id);
  if (deleteOldUserError) {
    console.warn(`PERINGATAN: akun lama sudah tidak terhubung ke kursi juri, tetapi gagal dihapus: ${deleteOldUserError.message}`);
  }

  console.log(`Selesai: ${judgeCode} tetap di Ruang ${updatedSeat.ruangan_mhq} dengan petugas ${updatedSeat.nama}.`);
  console.log('Nilai lama tetap terhubung ke kursi juri yang sama. Akun lama tidak lagi memiliki akses penilaian.');
} catch (error) {
  if (!judgeSeatWasRelinked) {
    if (replacementUser) {
      const { error: cleanupError } = await admin.auth.admin.deleteUser(replacementUser.id);
      if (cleanupError) console.error(`Pemulihan akun pengganti gagal: ${cleanupError.message}`);
    }
    if (oldEmailWasMoved) {
      const { error: restoreError } = await admin.auth.admin.updateUserById(oldUser.id, {
        email: oldEmail,
        email_confirm: true,
      });
      if (restoreError) console.error(`Pemulihan email akun lama gagal: ${restoreError.message}`);
    }
  }
  throw error;
}
