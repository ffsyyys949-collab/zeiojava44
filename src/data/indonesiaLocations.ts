// ============================================================================
// INDONESIA LOCATION DATA SYSTEM
// Hierarchical location structure with authentic administrative consistency:
// Provinsi -> Kota/Kabupaten -> Kecamatan -> Kelurahan/Desa -> Kode Pos -> Node
// ============================================================================

export interface IndonesiaLocation {
  id: string;
  provinsi: string;
  kotaKabupaten: string;
  kecamatan: string;
  kelurahan: string;
  kampungLingkungan: string;
  rt: string;
  rw: string;
  kodePos: string;
  nodeName: string;
  wilayahOperasional: string;
  latencyMs: number;
}

export const INDONESIA_LOCATIONS: IndonesiaLocation[] = [
  // --- DKI JAKARTA ---
  {
    id: 'jkt-01',
    provinsi: 'DKI Jakarta',
    kotaKabupaten: 'Jakarta Selatan',
    kecamatan: 'Kebayoran Baru',
    kelurahan: 'Senayan',
    kampungLingkungan: 'Jl. Senopati Lingkungan 03',
    rt: '004',
    rw: '002',
    kodePos: '12190',
    nodeName: 'JKT-SELATAN-CORE-01',
    wilayahOperasional: 'Regional Jabodetabek (WIB)',
    latencyMs: 14
  },
  {
    id: 'jkt-02',
    provinsi: 'DKI Jakarta',
    kotaKabupaten: 'Jakarta Pusat',
    kecamatan: 'Menteng',
    kelurahan: 'Gondangdia',
    kampungLingkungan: 'Cikini Raya Barat',
    rt: '002',
    rw: '005',
    kodePos: '10350',
    nodeName: 'JKT-PUSAT-GATEWAY-02',
    wilayahOperasional: 'Regional Jabodetabek (WIB)',
    latencyMs: 12
  },
  {
    id: 'jkt-03',
    provinsi: 'DKI Jakarta',
    kotaKabupaten: 'Jakarta Barat',
    kecamatan: 'Kebon Jeruk',
    kelurahan: 'Kedoya Selatan',
    kampungLingkungan: 'Puri Pesanggrahan Indah',
    rt: '006',
    rw: '008',
    kodePos: '11520',
    nodeName: 'JKT-BARAT-CORE-03',
    wilayahOperasional: 'Regional Jabodetabek (WIB)',
    latencyMs: 16
  },
  {
    id: 'jkt-04',
    provinsi: 'DKI Jakarta',
    kotaKabupaten: 'Jakarta Timur',
    kecamatan: 'Pulo Gadung',
    kelurahan: 'Rawamangun',
    kampungLingkungan: 'Cipinang Timur Blok B',
    rt: '003',
    rw: '007',
    kodePos: '13220',
    nodeName: 'JKT-TIMUR-RELAY-01',
    wilayahOperasional: 'Regional Jabodetabek (WIB)',
    latencyMs: 15
  },
  {
    id: 'jkt-05',
    provinsi: 'DKI Jakarta',
    kotaKabupaten: 'Jakarta Utara',
    kecamatan: 'Kelapa Gading',
    kelurahan: 'Kelapa Gading Barat',
    kampungLingkungan: 'Boulevard Gading Sektor 4',
    rt: '009',
    rw: '004',
    kodePos: '14240',
    nodeName: 'JKT-UTARA-EDGE-02',
    wilayahOperasional: 'Regional Jabodetabek (WIB)',
    latencyMs: 18
  },

  // --- JAWA BARAT ---
  {
    id: 'jbr-01',
    provinsi: 'Jawa Barat',
    kotaKabupaten: 'Kota Bandung',
    kecamatan: 'Coblong',
    kelurahan: 'Dago',
    kampungLingkungan: 'Tubagus Ismail Raya',
    rt: '005',
    rw: '006',
    kodePos: '40135',
    nodeName: 'BDG-UTARA-HUB-01',
    wilayahOperasional: 'Regional Jawa Barat (WIB)',
    latencyMs: 19
  },
  {
    id: 'jbr-02',
    provinsi: 'Jawa Barat',
    kotaKabupaten: 'Kota Bogor',
    kecamatan: 'Bogor Tengah',
    kelurahan: 'Babakan',
    kampungLingkungan: 'Sempur Kaler Lingkungan 01',
    rt: '001',
    rw: '003',
    kodePos: '16128',
    nodeName: 'BGR-CENTRAL-RELAY-02',
    wilayahOperasional: 'Regional Jawa Barat (WIB)',
    latencyMs: 17
  },
  {
    id: 'jbr-03',
    provinsi: 'Jawa Barat',
    kotaKabupaten: 'Kota Bekasi',
    kecamatan: 'Bekasi Selatan',
    kelurahan: 'Pekayon Jaya',
    kampungLingkungan: 'Kemang Pratama Raya',
    rt: '007',
    rw: '011',
    kodePos: '17148',
    nodeName: 'BKS-SELATAN-EDGE-01',
    wilayahOperasional: 'Regional Jawa Barat (WIB)',
    latencyMs: 16
  },
  {
    id: 'jbr-04',
    provinsi: 'Jawa Barat',
    kotaKabupaten: 'Kabupaten Tangerang',
    kecamatan: 'Kelapa Dua',
    kelurahan: 'Bencongan',
    kampungLingkungan: 'Karawaci Boulevard Sektor 7',
    rt: '003',
    rw: '009',
    kodePos: '15810',
    nodeName: 'TNG-WEST-NODE-03',
    wilayahOperasional: 'Regional Banten-Jabar (WIB)',
    latencyMs: 15
  },
  {
    id: 'jbr-05',
    provinsi: 'Jawa Barat',
    kotaKabupaten: 'Kota Depok',
    kecamatan: 'Beji',
    kelurahan: 'Pondok Cina',
    kampungLingkungan: 'Margonda Raya Lingkungan 02',
    rt: '004',
    rw: '005',
    kodePos: '16424',
    nodeName: 'DPK-MARGONDA-CORE-01',
    wilayahOperasional: 'Regional Jawa Barat (WIB)',
    latencyMs: 16
  },

  // --- JAWA TENGAH & D.I. YOGYAKARTA ---
  {
    id: 'jtg-01',
    provinsi: 'Jawa Tengah',
    kotaKabupaten: 'Kota Semarang',
    kecamatan: 'Banyumanik',
    kelurahan: 'Srondol Wetan',
    kampungLingkungan: 'Komp. Bina Marga Indah',
    rt: '002',
    rw: '004',
    kodePos: '50263',
    nodeName: 'SMG-SELATAN-HUB-01',
    wilayahOperasional: 'Regional Jawa Tengah (WIB)',
    latencyMs: 23
  },
  {
    id: 'jtg-02',
    provinsi: 'Jawa Tengah',
    kotaKabupaten: 'Kota Surakarta (Solo)',
    kecamatan: 'Banjarsari',
    kelurahan: 'Manahan',
    kampungLingkungan: 'Mangkubumen Barat',
    rt: '003',
    rw: '008',
    kodePos: '57139',
    nodeName: 'SLO-MANAHAN-EDGE-02',
    wilayahOperasional: 'Regional Jawa Tengah (WIB)',
    latencyMs: 24
  },
  {
    id: 'diy-01',
    provinsi: 'D.I. Yogyakarta',
    kotaKabupaten: 'Kabupaten Sleman',
    kecamatan: 'Depok',
    kelurahan: 'Caturtunggal',
    kampungLingkungan: 'Seturan Karangmalang',
    rt: '005',
    rw: '012',
    kodePos: '55281',
    nodeName: 'YOG-DEPOK-NODE-01',
    wilayahOperasional: 'Regional D.I. Yogyakarta (WIB)',
    latencyMs: 22
  },

  // --- JAWA TIMUR ---
  {
    id: 'jtm-01',
    provinsi: 'Jawa Timur',
    kotaKabupaten: 'Kota Surabaya',
    kecamatan: 'Wonokromo',
    kelurahan: 'Darmo',
    kampungLingkungan: 'Jl. Raya Darmo Blok C',
    rt: '001',
    rw: '003',
    kodePos: '60241',
    nodeName: 'SBY-CENTRAL-CORE-01',
    wilayahOperasional: 'Regional Jawa Timur (WIB)',
    latencyMs: 21
  },
  {
    id: 'jtm-02',
    provinsi: 'Jawa Timur',
    kotaKabupaten: 'Kota Surabaya',
    kecamatan: 'Gubeng',
    kelurahan: 'Airlangga',
    kampungLingkungan: 'Dharmawangsa Asri',
    rt: '004',
    rw: '007',
    kodePos: '60286',
    nodeName: 'SBY-GUBENG-RELAY-02',
    wilayahOperasional: 'Regional Jawa Timur (WIB)',
    latencyMs: 20
  },
  {
    id: 'jtm-03',
    provinsi: 'Jawa Timur',
    kotaKabupaten: 'Kota Malang',
    kecamatan: 'Lowokwaru',
    kelurahan: 'Ketawanggede',
    kampungLingkungan: 'Soekarno Hatta Indah',
    rt: '008',
    rw: '002',
    kodePos: '65145',
    nodeName: 'MLG-UTARA-EDGE-01',
    wilayahOperasional: 'Regional Jawa Timur (WIB)',
    latencyMs: 25
  },

  // --- BALI & NUSA TENGGARA ---
  {
    id: 'bli-01',
    provinsi: 'Bali',
    kotaKabupaten: 'Kota Denpasar',
    kecamatan: 'Denpasar Selatan',
    kelurahan: 'Sanur Kauh',
    kampungLingkungan: 'Banjar Penyaringan Indah',
    rt: '002',
    rw: '005',
    kodePos: '80227',
    nodeName: 'DPS-SANUR-GATEWAY-01',
    wilayahOperasional: 'Regional Bali & Nusa Tenggara (WITA)',
    latencyMs: 28
  },
  {
    id: 'bli-02',
    provinsi: 'Bali',
    kotaKabupaten: 'Kabupaten Badung',
    kecamatan: 'Kuta Utara',
    kelurahan: 'Tibubeneng',
    kampungLingkungan: 'Canggu Permai Lingkungan 02',
    rt: '003',
    rw: '004',
    kodePos: '80361',
    nodeName: 'BDG-CANGGU-EDGE-02',
    wilayahOperasional: 'Regional Bali & Nusa Tenggara (WITA)',
    latencyMs: 29
  },

  // --- SUMATERA UTARA & SUMATERA BARAT & RIAU ---
  {
    id: 'sum-01',
    provinsi: 'Sumatera Utara',
    kotaKabupaten: 'Kota Medan',
    kecamatan: 'Medan Petisah',
    kelurahan: 'Petisah Tengah',
    kampungLingkungan: 'Jl. Gatot Subroto Sektor 01',
    rt: '002',
    rw: '003',
    kodePos: '20112',
    nodeName: 'MDN-PETISAH-CORE-01',
    wilayahOperasional: 'Regional Sumatera Utara (WIB)',
    latencyMs: 26
  },
  {
    id: 'sum-02',
    provinsi: 'Riau',
    kotaKabupaten: 'Kota Pekanbaru',
    kecamatan: 'Tampan',
    kelurahan: 'Simpang Baru',
    kampungLingkungan: 'Subrantas Permai Blok D',
    rt: '004',
    rw: '009',
    kodePos: '28293',
    nodeName: 'PKU-TAMPAN-HUB-02',
    wilayahOperasional: 'Regional Riau (WIB)',
    latencyMs: 27
  },
  {
    id: 'sum-03',
    provinsi: 'Sumatera Selatan',
    kotaKabupaten: 'Kota Palembang',
    kecamatan: 'Ilir Barat I',
    kelurahan: 'Bukit Lama',
    kampungLingkungan: 'Padang Selasa Asri',
    rt: '001',
    rw: '006',
    kodePos: '30139',
    nodeName: 'PLM-ILIR-NODE-01',
    wilayahOperasional: 'Regional Sumatera Selatan (WIB)',
    latencyMs: 25
  },

  // --- SULAWESI SELATAN & SULAWESI UTARA ---
  {
    id: 'sul-01',
    provinsi: 'Sulawesi Selatan',
    kotaKabupaten: 'Kota Makassar',
    kecamatan: 'Panakkukang',
    kelurahan: 'Masale',
    kampungLingkungan: 'Boulevard Panakkukang Mas',
    rt: '005',
    rw: '003',
    kodePos: '90231',
    nodeName: 'UPG-PANAKKUKANG-CORE-01',
    wilayahOperasional: 'Regional Sulawesi (WITA)',
    latencyMs: 34
  },
  {
    id: 'sul-02',
    provinsi: 'Sulawesi Utara',
    kotaKabupaten: 'Kota Manado',
    kecamatan: 'Malalayang',
    kelurahan: 'Bahu',
    kampungLingkungan: 'Wolter Monginsidi Atas',
    rt: '002',
    rw: '004',
    kodePos: '95115',
    nodeName: 'MND-MALALAYANG-EDGE-02',
    wilayahOperasional: 'Regional Sulawesi Utara (WITA)',
    latencyMs: 38
  },

  // --- KALIMANTAN TIMUR & KALIMANTAN SELATAN ---
  {
    id: 'kal-01',
    provinsi: 'Kalimantan Timur',
    kotaKabupaten: 'Kota Balikpapan',
    kecamatan: 'Balikpapan Kota',
    kelurahan: 'Klandasan Ulu',
    kampungLingkungan: 'Sudirman Boulevard Lingkungan 02',
    rt: '006',
    rw: '002',
    kodePos: '76112',
    nodeName: 'BPN-KLANDASAN-HUB-01',
    wilayahOperasional: 'Regional Kalimantan (WITA)',
    latencyMs: 32
  },
  {
    id: 'kal-02',
    provinsi: 'Kalimantan Selatan',
    kotaKabupaten: 'Kota Banjarmasin',
    kecamatan: 'Banjarmasin Tengah',
    kelurahan: 'Kertak Baru Ilir',
    kampungLingkungan: 'Lambung Mangkurat Sektor 01',
    rt: '003',
    rw: '005',
    kodePos: '70111',
    nodeName: 'BJM-TENGAH-EDGE-02',
    wilayahOperasional: 'Regional Kalimantan (WITA)',
    latencyMs: 33
  }
];

export function getRandomIndonesiaLocation(): IndonesiaLocation {
  const index = Math.floor(Math.random() * INDONESIA_LOCATIONS.length);
  return INDONESIA_LOCATIONS[index];
}
