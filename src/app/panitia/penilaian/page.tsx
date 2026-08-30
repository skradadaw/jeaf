import { redirect } from 'next/navigation';

export default function PenilaianRootPage() {
    // Redirect otomatis ke kategori pertama (Adzan)
    redirect('/panitia/penilaian/adzan');
}
