import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sharedPin = '202610';
const judgeCodes = [
  'MHQ-J1', 'MHQ-J2', 'MHQ-J3', 'MHQ-J4',
  'ADZ-J1', 'ADZ-J2',
  'NYS-J1', 'NYS-J2',
  'FSH-J1', 'FSH-J2',
];
const adminEmail = 'admin@juri.jinga.local';
const adminPin = '202609';

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib tersedia.');
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

for (const code of judgeCodes) {
  const email = `${code.toLowerCase()}@juri.jinga.local`;
  const { data: usersData, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;

  let user = usersData.users.find((item) => item.email?.toLowerCase() === email);
  if (user) {
    const { data, error } = await admin.auth.admin.updateUserById(user.id, {
      password: sharedPin,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: sharedPin,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
  }

  const { error: linkError } = await admin
    .from('juri')
    .update({ user_id: user.id })
    .eq('kode', code);
  if (linkError) throw linkError;

  console.log(`Selesai: ${code}`);
}

const { data: adminUsers, error: adminListError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (adminListError) throw adminListError;
const existingAdmin = adminUsers.users.find((item) => item.email?.toLowerCase() === adminEmail);
if (existingAdmin) {
  const { error } = await admin.auth.admin.updateUserById(existingAdmin.id, {
    password: adminPin,
    email_confirm: true,
    app_metadata: { ...existingAdmin.app_metadata, role: 'admin' },
  });
  if (error) throw error;
} else {
  const { error } = await admin.auth.admin.createUser({
    email: adminEmail,
    password: adminPin,
    email_confirm: true,
    app_metadata: { role: 'admin' },
  });
  if (error) throw error;
}

console.log(`Selesai: akun admin (${adminEmail})`);

console.log(`Semua akun juri aktif menggunakan PIN ${sharedPin}.`);
