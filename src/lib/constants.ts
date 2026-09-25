// Konfigurasi Terpusat Cabang Lomba & Kuota Peserta JinGa 2026
// Total Kuota Keseluruhan: 520 Peserta

export interface CabangLombaConfig {
  id: number;
  dbValue: string;
  title: string;
  category: 'islami' | 'seni' | 'ketangkasan';
  icon: string;
  faIcon: string;
  target: string;
  desc: string;
  quota: number;
  price: string;
  prefix: string;
  progressHex: string;
  classes: {
    border: string;
    tagBg: string;
    tagText: string;
    priceText: string;
    btnBg: string;
    btnHover: string;
    btnText: string;
    progressBar: string;
  };
}

export const CABANG_LOMBA_LIST: CabangLombaConfig[] = [
  {
    id: 1,
    dbValue: 'MHQ',
    title: 'Lomba MHQ',
    category: 'islami',
    icon: '📖',
    faIcon: 'fa-solid fa-book-quran',
    target: 'TK A & B',
    desc: 'Uji hafalan surah-surah pendek pilihan dengan tartil, makhraj yang benar, dan adab tilawah.',
    quota: 50, // Kuota disesuaikan: 60 - 10 = 50 (Pengurangan 10 dialihkan ke Tendangan Penalti)
    price: 'Gratis',
    prefix: 'MHQ',
    progressHex: '#10B981',
    classes: {
      border: 'border-emerald-200',
      tagBg: 'bg-emerald-100',
      tagText: 'text-emerald-800',
      priceText: 'text-emerald-600',
      btnBg: 'bg-emerald-50',
      btnHover: 'hover:bg-emerald-600',
      btnText: 'text-emerald-700',
      progressBar: 'bg-emerald-500'
    }
  },
  {
    id: 2,
    dbValue: 'Karya Kolase',
    title: 'Lomba Karya Kolase',
    category: 'seni',
    icon: '✂️',
    faIcon: 'fa-solid fa-scissors',
    target: 'TK A & B',
    desc: 'Berkreasi membuat seni kolase yang indah untuk melatih kreativitas dan motorik halus.',
    quota: 32, // Kuota disesuaikan: 60 - 28 = 32
    price: 'Gratis',
    prefix: 'KLS',
    progressHex: '#F59E0B',
    classes: {
      border: 'border-amber-200',
      tagBg: 'bg-amber-100',
      tagText: 'text-amber-800',
      priceText: 'text-amber-600',
      btnBg: 'bg-amber-50',
      btnHover: 'hover:bg-amber-600',
      btnText: 'text-amber-700',
      progressBar: 'bg-amber-500'
    }
  },
  {
    id: 3,
    dbValue: 'Mewarnai',
    title: 'Lomba Mewarnai',
    category: 'seni',
    icon: '🎨',
    faIcon: 'fa-solid fa-palette',
    target: 'TK A & B',
    desc: 'Mengekspresikan imajinasi dan gradasi warna ceria pada sketsa petualang cilik JinGa.',
    quota: 130, // Kuota ditambahkan: 126 + 4 = 130
    price: 'Gratis',
    prefix: 'WAR',
    progressHex: '#F59E0B',
    classes: {
      border: 'border-amber-200',
      tagBg: 'bg-amber-100',
      tagText: 'text-amber-800',
      priceText: 'text-amber-600',
      btnBg: 'bg-amber-50',
      btnHover: 'hover:bg-amber-600',
      btnText: 'text-amber-700',
      progressBar: 'bg-amber-500'
    }
  },
  {
    id: 4,
    dbValue: 'Menyanyi Solo',
    title: 'Lomba Menyanyi Solo',
    category: 'seni',
    icon: '🎵',
    faIcon: 'fa-solid fa-microphone',
    target: 'TK A & B',
    desc: 'Menumbuhkan keberanian dan bakat tarik suara anak dengan lagu-lagu anak ceria.',
    quota: 40, // Kuota ditambahkan: 32 + 8 = 40
    price: 'Gratis',
    prefix: 'NYS',
    progressHex: '#F59E0B',
    classes: {
      border: 'border-amber-200',
      tagBg: 'bg-amber-100',
      tagText: 'text-amber-800',
      priceText: 'text-amber-600',
      btnBg: 'bg-amber-50',
      btnHover: 'hover:bg-amber-600',
      btnText: 'text-amber-700',
      progressBar: 'bg-amber-500'
    }
  },
  {
    id: 5,
    dbValue: 'Fashion Show',
    title: 'Lomba Fashion Show',
    category: 'seni',
    icon: '👗',
    faIcon: 'fa-solid fa-shirt',
    target: 'Putra & Putri',
    desc: 'Peragaan busana muslim/muslimah cilik bertema "Little Explorer" yang syar\'i, anggun, dan percaya diri.',
    quota: 60, // Kuota dikembalikan ke 60 peserta
    price: 'Gratis',
    prefix: 'FSH',
    progressHex: '#F59E0B',
    classes: {
      border: 'border-amber-200',
      tagBg: 'bg-amber-100',
      tagText: 'text-amber-800',
      priceText: 'text-amber-600',
      btnBg: 'bg-amber-50',
      btnHover: 'hover:bg-amber-600',
      btnText: 'text-amber-700',
      progressBar: 'bg-amber-500'
    }
  },
  {
    id: 6,
    dbValue: 'Adzan',
    title: 'Lomba Adzan',
    category: 'islami',
    icon: '🗣️',
    faIcon: 'fa-solid fa-volume-high',
    target: 'Khusus Ikhwan',
    desc: 'Melantunkan panggilan adzan Subuh/Dzuhur dengan kemerduan nada, kejelasan makhraj, dan adab muadzin.',
    quota: 40, // Kuota ditambahkan: 32 + 8 = 40
    price: 'Gratis',
    prefix: 'ADZ',
    progressHex: '#10B981',
    classes: {
      border: 'border-emerald-200',
      tagBg: 'bg-emerald-100',
      tagText: 'text-emerald-800',
      priceText: 'text-emerald-600',
      btnBg: 'bg-emerald-50',
      btnHover: 'hover:bg-emerald-600',
      btnText: 'text-emerald-700',
      progressBar: 'bg-emerald-500'
    }
  },
  {
    id: 7,
    dbValue: 'Tendangan Penalti',
    title: 'Lomba Tendangan Penalti',
    category: 'ketangkasan',
    icon: '⚽',
    faIcon: 'fa-solid fa-futbol',
    target: 'Ketangkasan',
    desc: 'Tantangan ketepatan menendang bola ke gawang untuk melatih fokus dan motorik anak.',
    quota: 168, // Kuota ditambahkan: 140 + 28 = 168 (Tambahan 28 dialihkan dari Mewarnai -18 dan MHQ -10)
    price: 'Gratis',
    prefix: 'PNL',
    progressHex: '#0284C7',
    classes: {
      border: 'border-sky-200',
      tagBg: 'bg-sky-100',
      tagText: 'text-sky-800',
      priceText: 'text-sky-600',
      btnBg: 'bg-sky-50',
      btnHover: 'hover:bg-sky-600',
      btnText: 'text-sky-700',
      progressBar: 'bg-sky-500'
    }
  },
];

// Total Kuota Peserta (50 + 32 + 130 + 40 + 60 + 40 + 168 = 520)
export const TOTAL_KUOTA_TARGET = CABANG_LOMBA_LIST.reduce((sum, item) => sum + item.quota, 0);

export const KUOTA_PER_CABANG: Record<string, number> = CABANG_LOMBA_LIST.reduce((acc, curr) => {
  acc[curr.dbValue] = curr.quota;
  return acc;
}, {} as Record<string, number>);

export const PREFIX_PER_CABANG: Record<string, string> = CABANG_LOMBA_LIST.reduce((acc, curr) => {
  acc[curr.dbValue] = curr.prefix;
  return acc;
}, {} as Record<string, string>);

export interface CabangThemeConfig {
  icon: string;
  emoji: string;
  color: string;
  bg: string;
  text: string;
  border: string;
  iconColor: string;
  iconBg: string;
}

export const CABANG_CONFIG: Record<string, CabangThemeConfig> = {
  'Adzan': { 
    icon: 'fa-solid fa-volume-high',
    emoji: '🗣️',
    color: 'bg-indigo-100 text-indigo-700',
    bg: 'bg-indigo-50/90',
    text: 'text-indigo-700',
    border: 'border-indigo-200/80',
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50 text-indigo-600',
  },
  'Fashion Show': { 
    icon: 'fa-solid fa-vest-patches',
    emoji: '👗',
    color: 'bg-rose-100 text-rose-700',
    bg: 'bg-rose-50/90',
    text: 'text-rose-700',
    border: 'border-rose-200/80',
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-50 text-rose-600',
  },
  'MHQ': { 
    icon: 'fa-solid fa-book-quran',
    emoji: '📖',
    color: 'bg-emerald-100 text-emerald-700',
    bg: 'bg-emerald-50/90',
    text: 'text-emerald-800',
    border: 'border-emerald-200/80',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50 text-emerald-600',
  },
  'Karya Kolase': { 
    icon: 'fa-solid fa-scissors',
    emoji: '✂️',
    color: 'bg-orange-100 text-orange-700',
    bg: 'bg-orange-50/90',
    text: 'text-orange-800',
    border: 'border-orange-200/80',
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50 text-orange-600',
  },
  'Mewarnai': { 
    icon: 'fa-solid fa-palette',
    emoji: '🎨',
    color: 'bg-amber-100 text-amber-700',
    bg: 'bg-amber-50/90',
    text: 'text-amber-800',
    border: 'border-amber-200/80',
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50 text-amber-600',
  },
  'Tendangan Penalti': { 
    icon: 'fa-solid fa-futbol',
    emoji: '⚽',
    color: 'bg-sky-100 text-sky-700',
    bg: 'bg-sky-50/90',
    text: 'text-sky-700',
    border: 'border-sky-200/80',
    iconColor: 'text-sky-600',
    iconBg: 'bg-sky-50 text-sky-600',
  },
  'Menyanyi Solo': { 
    icon: 'fa-solid fa-microphone',
    emoji: '🎵',
    color: 'bg-purple-100 text-purple-700',
    bg: 'bg-purple-50/90',
    text: 'text-purple-700',
    border: 'border-purple-200/80',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50 text-purple-600',
  },
};

