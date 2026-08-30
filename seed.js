const { createClient } = require('@supabase/supabase-js');

const url = 'https://pkeatehjyjegfjoqtfhz.supabase.co';
const key = 'sb_publishable_MpBfskfHkVrH7GW40MXyew_dnP8MDON';

const supabase = createClient(url, key);

// Helper to omit ID since we'll let supabase or crypto generate it
const baseData = [
    // Adzan (5)
    { nama_anak: 'Ahmad Budi', jenis_kelamin: 'Laki-laki', tgl_lahir: '2015-01-01', asal_sekolah: 'SDIT Al-Furqon', cabang_lomba: 'Adzan', status_kehadiran: 'Belum Hadir', no_wa: '081234567890', nama_ortu: 'Budi Santoso' },
    { nama_anak: 'Muhammad Ali', jenis_kelamin: 'Laki-laki', tgl_lahir: '2015-01-02', asal_sekolah: 'SDN 1 Jakarta', cabang_lomba: 'Adzan', status_kehadiran: 'Belum Hadir', no_wa: '081234567891', nama_ortu: 'Ali bin Abi Thalib' },
    { nama_anak: 'Rizky Pratama', jenis_kelamin: 'Laki-laki', tgl_lahir: '2015-01-03', asal_sekolah: 'MI Al-Hidayah', cabang_lomba: 'Adzan', status_kehadiran: 'Hadir', waktu_kehadiran: new Date().toISOString(), no_wa: '081234567892', nama_ortu: 'Pratama' },
    { nama_anak: 'Fajar Shiddiq', jenis_kelamin: 'Laki-laki', tgl_lahir: '2015-01-04', asal_sekolah: 'SD Muhammadiyah 2', cabang_lomba: 'Adzan', status_kehadiran: 'Belum Hadir', no_wa: '081234567893', nama_ortu: 'Shiddiq' },
    { nama_anak: 'Zaki Mubarak', jenis_kelamin: 'Laki-laki', tgl_lahir: '2015-01-05', asal_sekolah: 'SDIT Nurul Fikri', cabang_lomba: 'Adzan', status_kehadiran: 'Hadir', waktu_kehadiran: new Date().toISOString(), no_wa: '081234567894', nama_ortu: 'Mubarak' },

    // Fashion Show (5)
    { nama_anak: 'Siti Aminah', jenis_kelamin: 'Perempuan', tgl_lahir: '2015-01-06', asal_sekolah: 'TK Bintang Kecil', cabang_lomba: 'Fashion Show', status_kehadiran: 'Belum Hadir', no_wa: '082233445501', nama_ortu: 'Amin' },
    { nama_anak: 'Aisyah Putri', jenis_kelamin: 'Perempuan', tgl_lahir: '2015-01-07', asal_sekolah: 'TK Al-Azhar', cabang_lomba: 'Fashion Show', status_kehadiran: 'Belum Hadir', no_wa: '082233445502', nama_ortu: 'Putra' },
    { nama_anak: 'Nadia Salsabila', jenis_kelamin: 'Perempuan', tgl_lahir: '2015-01-08', asal_sekolah: 'SDIT Darussalam', cabang_lomba: 'Fashion Show', status_kehadiran: 'Hadir', waktu_kehadiran: new Date().toISOString(), no_wa: '082233445503', nama_ortu: 'Salsabil' },
    { nama_anak: 'Zahra Larasati', jenis_kelamin: 'Perempuan', tgl_lahir: '2015-01-09', asal_sekolah: 'TK Mutiara Hati', cabang_lomba: 'Fashion Show', status_kehadiran: 'Belum Hadir', no_wa: '082233445504', nama_ortu: 'Laras' },
    { nama_anak: 'Raisa Andriana', jenis_kelamin: 'Perempuan', tgl_lahir: '2015-01-10', asal_sekolah: 'SDN 3 Bandung', cabang_lomba: 'Fashion Show', status_kehadiran: 'Hadir', waktu_kehadiran: new Date().toISOString(), no_wa: '082233445505', nama_ortu: 'Andrian' },

    // MHQ (5)
    { nama_anak: 'Gita Harmoni', jenis_kelamin: 'Perempuan', tgl_lahir: '2015-01-11', asal_sekolah: 'SDN 3 Surabaya', cabang_lomba: 'MHQ', status_kehadiran: 'Belum Hadir', no_wa: '083344556601', nama_ortu: 'Harmon' },
    { nama_anak: 'Umar Faruq', jenis_kelamin: 'Laki-laki', tgl_lahir: '2015-01-12', asal_sekolah: 'SDIT Al-Irsyad', cabang_lomba: 'MHQ', status_kehadiran: 'Hadir', waktu_kehadiran: new Date().toISOString(), no_wa: '083344556602', nama_ortu: 'Faruq' },
    { nama_anak: 'Hafizhah Khairunnisa', jenis_kelamin: 'Perempuan', tgl_lahir: '2015-01-13', asal_sekolah: 'MI Muhammadiyah', cabang_lomba: 'MHQ', status_kehadiran: 'Belum Hadir', no_wa: '083344556603', nama_ortu: 'Khairun' },
    { nama_anak: 'Bilal Abdurrahman', jenis_kelamin: 'Laki-laki', tgl_lahir: '2015-01-14', asal_sekolah: 'SDIT Insan Kamil', cabang_lomba: 'MHQ', status_kehadiran: 'Belum Hadir', no_wa: '083344556604', nama_ortu: 'Abdurrahman' },
    { nama_anak: 'Ruqayyah binti Ali', jenis_kelamin: 'Perempuan', tgl_lahir: '2015-01-15', asal_sekolah: 'SDN 1 Malang', cabang_lomba: 'MHQ', status_kehadiran: 'Hadir', waktu_kehadiran: new Date().toISOString(), no_wa: '083344556605', nama_ortu: 'Ali' },

    // Karya Kolase (5)
    { nama_anak: 'Teater Merdeka', jenis_kelamin: 'Laki-laki', tgl_lahir: '2015-01-16', asal_sekolah: 'SD Al-Azhar', cabang_lomba: 'Karya Kolase', status_kehadiran: 'Hadir', waktu_kehadiran: new Date().toISOString(), no_wa: '084455667701', nama_ortu: 'Merdeka' },
    { nama_anak: 'Bima Sakti', jenis_kelamin: 'Laki-laki', tgl_lahir: '2015-01-17', asal_sekolah: 'SDN 2 Jakarta', cabang_lomba: 'Karya Kolase', status_kehadiran: 'Belum Hadir', no_wa: '084455667702', nama_ortu: 'Sakti' },
    { nama_anak: 'Arjuna', jenis_kelamin: 'Laki-laki', tgl_lahir: '2015-01-18', asal_sekolah: 'TK Tunas Bangsa', cabang_lomba: 'Karya Kolase', status_kehadiran: 'Belum Hadir', no_wa: '084455667703', nama_ortu: 'Pandu' },
    { nama_anak: 'Saraswati', jenis_kelamin: 'Perempuan', tgl_lahir: '2015-01-19', asal_sekolah: 'SD Pelita Hati', cabang_lomba: 'Karya Kolase', status_kehadiran: 'Hadir', waktu_kehadiran: new Date().toISOString(), no_wa: '084455667704', nama_ortu: 'Saras' },
    { nama_anak: 'Rama', jenis_kelamin: 'Laki-laki', tgl_lahir: '2015-01-20', asal_sekolah: 'SDN 4 Bandung', cabang_lomba: 'Karya Kolase', status_kehadiran: 'Belum Hadir', no_wa: '084455667705', nama_ortu: 'Dasarata' },

    // Mewarnai (5)
    { nama_anak: 'Rina Nose', jenis_kelamin: 'Perempuan', tgl_lahir: '2015-01-21', asal_sekolah: 'SMPN 1 Malang', cabang_lomba: 'Mewarnai', status_kehadiran: 'Hadir', waktu_kehadiran: new Date().toISOString(), no_wa: '085566778801', nama_ortu: 'Nose' },
    { nama_anak: 'Dinda Hauw', jenis_kelamin: 'Perempuan', tgl_lahir: '2015-01-22', asal_sekolah: 'TK Kuncup Mekar', cabang_lomba: 'Mewarnai', status_kehadiran: 'Belum Hadir', no_wa: '085566778802', nama_ortu: 'Hauw' },
    { nama_anak: 'Kevin Sanjaya', jenis_kelamin: 'Laki-laki', tgl_lahir: '2015-01-23', asal_sekolah: 'TK Al-Falah', cabang_lomba: 'Mewarnai', status_kehadiran: 'Hadir', waktu_kehadiran: new Date().toISOString(), no_wa: '085566778803', nama_ortu: 'Sanjaya' },
    { nama_anak: 'Syifa Hadju', jenis_kelamin: 'Perempuan', tgl_lahir: '2015-01-24', asal_sekolah: 'SDN 1 Bogor', cabang_lomba: 'Mewarnai', status_kehadiran: 'Belum Hadir', no_wa: '085566778804', nama_ortu: 'Hadju' },
    { nama_anak: 'Jefri Nichol', jenis_kelamin: 'Laki-laki', tgl_lahir: '2015-01-25', asal_sekolah: 'TK Kasih Ibu', cabang_lomba: 'Mewarnai', status_kehadiran: 'Belum Hadir', no_wa: '085566778805', nama_ortu: 'Nichol' },

    // Tendangan Penalti (5)
    { nama_anak: 'Bambang Pamungkas', jenis_kelamin: 'Laki-laki', tgl_lahir: '2015-01-26', asal_sekolah: 'SDN 11 Jakarta', cabang_lomba: 'Tendangan Penalti', status_kehadiran: 'Hadir', waktu_kehadiran: new Date().toISOString(), no_wa: '086677889901', nama_ortu: 'Pamungkas' },
    { nama_anak: 'Egy Maulana', jenis_kelamin: 'Laki-laki', tgl_lahir: '2015-01-27', asal_sekolah: 'SDIT Cordova', cabang_lomba: 'Tendangan Penalti', status_kehadiran: 'Belum Hadir', no_wa: '086677889902', nama_ortu: 'Maulana' },
    { nama_anak: 'Witan Sulaeman', jenis_kelamin: 'Laki-laki', tgl_lahir: '2015-01-28', asal_sekolah: 'MI Al-Khoir', cabang_lomba: 'Tendangan Penalti', status_kehadiran: 'Hadir', waktu_kehadiran: new Date().toISOString(), no_wa: '086677889903', nama_ortu: 'Sulaeman' },
    { nama_anak: 'Asnawi Mangkualam', jenis_kelamin: 'Laki-laki', tgl_lahir: '2015-01-29', asal_sekolah: 'SDN 2 Makassar', cabang_lomba: 'Tendangan Penalti', status_kehadiran: 'Belum Hadir', no_wa: '086677889904', nama_ortu: 'Mangkualam' },
    { nama_anak: 'Pratama Arhan', jenis_kelamin: 'Laki-laki', tgl_lahir: '2015-01-30', asal_sekolah: 'SD Bina Bangsa', cabang_lomba: 'Tendangan Penalti', status_kehadiran: 'Belum Hadir', no_wa: '086677889905', nama_ortu: 'Arhan' },

    // Menyanyi Solo (5)
    { nama_anak: 'Citra Kirana', jenis_kelamin: 'Perempuan', tgl_lahir: '2015-02-01', asal_sekolah: 'SDN 5 Bandung', cabang_lomba: 'Menyanyi Solo', status_kehadiran: 'Hadir', waktu_kehadiran: new Date().toISOString(), no_wa: '087788990001', nama_ortu: 'Kirana' },
    { nama_anak: 'Lyodra Ginting', jenis_kelamin: 'Perempuan', tgl_lahir: '2015-02-02', asal_sekolah: 'SD Tarakanita', cabang_lomba: 'Menyanyi Solo', status_kehadiran: 'Belum Hadir', no_wa: '087788990002', nama_ortu: 'Ginting' },
    { nama_anak: 'Tiara Andini', jenis_kelamin: 'Perempuan', tgl_lahir: '2015-02-03', asal_sekolah: 'SDN 1 Jember', cabang_lomba: 'Menyanyi Solo', status_kehadiran: 'Hadir', waktu_kehadiran: new Date().toISOString(), no_wa: '087788990003', nama_ortu: 'Andini' },
    { nama_anak: 'Mahalini', jenis_kelamin: 'Perempuan', tgl_lahir: '2015-02-04', asal_sekolah: 'SD Saraswati', cabang_lomba: 'Menyanyi Solo', status_kehadiran: 'Belum Hadir', no_wa: '087788990004', nama_ortu: 'Raharja' },
    { nama_anak: 'Ziva Magnolya', jenis_kelamin: 'Perempuan', tgl_lahir: '2015-02-05', asal_sekolah: 'SD BPK Penabur', cabang_lomba: 'Menyanyi Solo', status_kehadiran: 'Belum Hadir', no_wa: '087788990005', nama_ortu: 'Magnolya' },
];

async function seed() {
    for (const p of baseData) {
        // Let Supabase generate the UUID id automatically by omitting it
        const { data, error } = await supabase.from('pendaftar').insert(p).select();
        if (error) {
            console.error('Error inserting', p.nama_anak, error.message);
        } else {
            console.log('Inserted', p.nama_anak, '->', data[0].id);
        }
    }
    console.log('Done');
}

seed();
