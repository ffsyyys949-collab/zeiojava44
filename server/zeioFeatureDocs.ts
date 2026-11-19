/**
 * DOKUMENTASI INTERNAL FITUR ZE.io (SINGLE SOURCE OF TRUTH UNTUK ZE AI)
 *
 * PENTING:
 * File ini adalah referensi resmi arsitektur, menu, submenu, tombol, alur kerja,
 * dan status fitur ZE.io berdasarkan implementasi kode nyata.
 * Perbarui file ini setiap kali ada penambahan, perubahan, atau penonaktifan fitur di ZE.io.
 */

export type ZeioFeatureStatus = 'AKTIF' | 'SOON' | 'BELUM_TERSEDIA';

export interface ZeioFeatureDocItem {
  id: string;
  name: string;
  aliases: string[];
  status: ZeioFeatureStatus;
  location: string;
  summary: string;
  howToUse: string[];
  accessRequirement: string;
}

export const ZEIO_DOCS_LAST_UPDATED = '2026-11-03';

export const ZEIO_FEATURE_CATALOG: ZeioFeatureDocItem[] = [
  {
    id: 'beranda-updates',
    name: 'Beranda (Tab Updates)',
    aliases: ['beranda', 'home', 'updates', 'halaman utama'],
    status: 'AKTIF',
    location: 'Tab navigasi bawah paling kiri "Updates" (rute "/" atau "/updates")',
    summary:
      'Halaman utama ZE.io dengan background video air hitam bergerak, header akses cepat (Search, Notifikasi, Key Store, dan Owner Panel khusus Owner/Admin), banner video & lirik musik realtime, barisan Story 24 jam, serta 8 kartu menu FEATURES.',
    howToUse: [
      'Buka aplikasi ZE.io atau tekan tab "Updates" di navigasi bawah.',
      'Gunakan ikon Search di kanan atas untuk mencari pengguna lewat @username atau ZE ID (contoh: ZE-XXXXXX).',
      'Gunakan ikon Lonceng (Bell) di kanan atas untuk melihat pengumuman global, status Key Store, dan permintaan pertemanan.',
      'Gunakan ikon Keranjang (ShoppingCart) di kanan atas untuk membuka Key Store.',
      'Gulir ke bagian FEATURES untuk memilih fitur aktif ZE.io.'
    ],
    accessRequirement: 'Semua pengguna yang sudah login.'
  },
  {
    id: 'stories',
    name: 'Story / Cerita 24 Jam',
    aliases: ['story', 'stories', 'cerita', 'status foto', 'status video'],
    status: 'AKTIF',
    location: 'Bagian atas Beranda (Updates) tepat di bawah banner utama',
    summary:
      'Fitur berbagi foto atau video pendek ala Story dengan indikator cincin hijau (#00FF88) untuk story yang belum dilihat.',
    howToUse: [
      'Di Beranda (Updates), tekan tombol "+ Cerita Anda" atau ikon tambah pada avatar kamu.',
      'Pilih foto atau video dari perangkat lalu unggah.',
      'Ketuk avatar teman di barisan Story untuk menonton story layar penuh, atau hapus story milikmu sendiri lewat tombol hapus di Story Viewer.'
    ],
    accessRequirement: 'Semua pengguna yang sudah login.'
  },
  {
    id: 'tiktok-no-wm',
    name: 'TikTok No WM (TikTok Downloader)',
    aliases: ['tiktok', 'tiktok no wm', 'tiktok downloader', 'download tiktok', 'unduh tiktok', 'tanpa watermark', 'vt'],
    status: 'AKTIF',
    location: 'Beranda (Updates) > bagian FEATURES > kartu "TikTok No WM"',
    summary:
      'Pengunduh video MP4 (HD/SD) dan audio MP3 dari link TikTok/Douyin bersih tanpa watermark, lengkap dengan riwayat unduhan dan opsi putar langsung sebagai musik latar ZE.io.',
    howToUse: [
      'Buka kartu "TikTok No WM" di Beranda.',
      'Tempel (Paste) tautan video TikTok pada kolom input link lalu proses.',
      'Pilih tombol unduh Video Tanpa Watermark (MP4) atau Audio (MP3), atau tekan tombol putar sebagai musik untuk memutarnya di background player ZE.io.'
    ],
    accessRequirement: 'Semua pengguna yang sudah login.'
  },
  {
    id: 'settings',
    name: 'Settings (Pengaturan Aplikasi, Tema Global & FPS Lock)',
    aliases: ['settings', 'pengaturan', 'setelan', 'fps', 'fps lock', '120 fps', '90 fps', '60 fps', 'tema', 'theme', 'privasi', 'penyimpanan'],
    status: 'AKTIF',
    location: 'Beranda (Updates) > bagian FEATURES > kartu "Settings"',
    summary:
      'Pusat pengaturan ZE.io yang mencakup Akun, Privasi, Avatar, Daftar, Chat, Notifikasi, Penyimpanan dan Data, Bahasa Aplikasi, Bantuan, Undang Teman, Tema Global, serta pengunci performa FPS Lock (60 / 90 / 120 FPS + GPU Boost).',
    howToUse: [
      'Di Beranda, ketuk kartu "Settings".',
      'Pilih submenu yang diinginkan seperti Akun, Privasi, Chat, Penyimpanan, atau Tema Global.',
      'Untuk mengatur kelancaran layar, aktifkan FPS Lock dan pilih target 60 FPS, 90 FPS, atau 120 FPS beserta GPU Boost.'
    ],
    accessRequirement: 'Semua pengguna yang sudah login.'
  },
  {
    id: 'ze-ai',
    name: 'ZE AI (Smart AI Chatbot)',
    aliases: ['ze ai', 'ai', 'chatbot', 'asisten ai'],
    status: 'AKTIF',
    location: 'Beranda (Updates) > bagian FEATURES > kartu "ZE AI" (rute "/ai")',
    summary:
      'Asisten AI resmi ZE.io bergaya santai/akrab yang memahami seluruh fitur ZE.io, mendukung obrolan teks, analisis kiriman foto & video, hapus pesan satuan/riwayat, serta gerbang perintah khusus berbasis Key (/rw dan /bug).',
    howToUse: [
      'Buka kartu "ZE AI" di Beranda.',
      'Ketik pertanyaan atau obrolan di kolom bawah, atau tekan ikon lampiran media untuk mengirim foto/video.',
      'Untuk membuka modul khusus pemegang Key, ketik "/rw" atau "/bug" lalu masukkan kode Key resmi yang masih aktif.'
    ],
    accessRequirement: 'Semua pengguna untuk chat AI; wajib Key aktif untuk perintah "/rw" dan "/bug".'
  },
  {
    id: 'community',
    name: 'Community (Komunitas)',
    aliases: ['community', 'communitie', 'komunitas', 'forum'],
    status: 'AKTIF',
    location: 'Beranda > kartu "Community" ATAU tab navigasi bawah "Communitie" (rute "/comm")',
    summary:
      'Wadah komunitas kreator dan diskusi bertema (seperti Beatmakers Indonesia, TikTok Sound Trends, Anime & Aesthetic Creators) di mana pengguna bisa bergabung, berdiskusi di ruang komunitas, atau membuat komunitas baru.',
    howToUse: [
      'Tekan tab "Communitie" di bawah atau kartu "Community" di Beranda.',
      'Pilih salah satu komunitas untuk masuk ke ruang obrolan komunitas.',
      'Tekan tombol buat komunitas baru jika ingin membangun komunitas sendiri.'
    ],
    accessRequirement: 'Semua pengguna yang sudah login.'
  },
  {
    id: 'group-chat',
    name: 'Group Chat (Chat Group)',
    aliases: ['group chat', 'chat group', 'grup', 'grup chat', 'obrolan grup', 'buat group', 'buat grup'],
    status: 'AKTIF',
    location: 'Beranda (Updates) > bagian FEATURES > kartu "Group Chat" (rute "/group-chat")',
    summary:
      'Fitur obrolan grup realtime dengan daftar grup, pencarian grup, pembuatan grup baru, ruang percakapan grup di atas background video transparan Black Liquid Glass, halaman Info Grup, serta fitur tambah anggota.',
    howToUse: [
      'Buka kartu "Group Chat" di Beranda untuk melihat daftar grup atau mencari nama grup.',
      'Tekan tombol "+ Buat Group" di kanan atas untuk membuat grup baru dan memilih anggota.',
      'Ketuk salah satu grup untuk masuk ke ruang obrolan grup dan mengirim pesan.',
      'Ketuk nama grup atau ikon Info (i) di kanan atas ruang grup untuk melihat daftar anggota dan menekan "+ Tambah Anggota".'
    ],
    accessRequirement: 'Semua pengguna yang sudah login.'
  },
  {
    id: 'zhd-ai',
    name: 'ZHD AI (Wink HD Photo & Video AI Enhancer)',
    aliases: ['zhd', 'zhd ai', 'wink hd', 'hd photo', 'hd video', 'penjernih foto', 'upscale', 'hd ai'],
    status: 'AKTIF',
    location: 'Beranda (Updates) > bagian FEATURES > kartu "ZHD AI" (rute "/wink-hd")',
    summary:
      'Fitur peningkat ketajaman dan resolusi foto maupun video menjadi HD menggunakan pemrosesan Super Resolution (pilihan 2x atau 4x upscale), lengkap dengan slider perbandingan Before/After dan tombol unduh hasil.',
    howToUse: [
      'Buka kartu "ZHD AI" di Beranda.',
      'Pilih tingkat peningkatan (2x atau 4x), lalu unggah foto/video dari galeri atau coba sampel preset yang tersedia.',
      'Geser slider Before/After untuk membandingkan hasil sebelum dan sesudah dijernihkan, lalu tekan tombol Download untuk menyimpan.'
    ],
    accessRequirement: 'Semua pengguna yang sudah login.'
  },
  {
    id: 'web-to-apk',
    name: 'WEB TO APK (Android App Builder)',
    aliases: ['web to apk', 'webtoapk', 'apk', 'buat apk', 'convert web ke apk', 'android app builder'],
    status: 'SOON',
    location: 'Beranda (Updates) > bagian FEATURES > kartu "WEB TO APK" (berlabel badge SOON)',
    summary:
      'Menu konversi website menjadi APK saat ini berstatus SOON (segera hadir) dan dinonaktifkan sementara.',
    howToUse: [
      'Kartu "WEB TO APK" tetap ditampilkan di Beranda dengan label "SOON".',
      'Saat kartu ditekan, sistem hanya menampilkan notifikasi kecil "Fitur akan segera hadir." dan tidak mengarahkan ke halaman lain.'
    ],
    accessRequirement: 'Belum dapat digunakan karena masih berstatus SOON.'
  },
  {
    id: 'tag-no',
    name: 'TAG NO (Caller ID & Tag Nomor)',
    aliases: ['tag no', 'tagno', 'tag nomor', 'caller id', 'cek nomor', 'lacak nomor'],
    status: 'SOON',
    location: 'Beranda (Updates) > bagian FEATURES > kartu "TAG NO" (berlabel badge SOON)',
    summary:
      'Menu identifikasi & tag nomor telepon saat ini berstatus SOON (segera hadir) dan dinonaktifkan sementara.',
    howToUse: [
      'Kartu "TAG NO" tetap ditampilkan di Beranda dengan label "SOON".',
      'Saat kartu ditekan, sistem hanya menampilkan notifikasi kecil "Fitur akan segera hadir." dan tidak mengarahkan ke halaman lain.'
    ],
    accessRequirement: 'Belum dapat digunakan karena masih berstatus SOON.'
  },
  {
    id: 'music-lab',
    name: 'Music Lab & Background Music Player',
    aliases: ['music', 'music lab', 'musik', 'bg music', 'lagu', 'youtube music', 'mini player', 'tautan jadi musik'],
    status: 'AKTIF',
    location: 'Tab navigasi bawah "Music" (rute "/music") & tombol musik di Banner Beranda',
    summary:
      'Pemutar musik dan video latar belakang dari link TikTok, YouTube, atau audio web yang tetap memutar audio saat pengguna berpindah menu, dilengkapi kontrol Play/Pause, Shuffle, Loop, dan Riwayat Lagu.',
    howToUse: [
      'Buka tab "Music" di navigasi bawah atau tekan tombol link musik pada banner Beranda.',
      'Masukkan link video TikTok atau YouTube lalu tekan putar.',
      'Musik akan tetap berjalan di latar belakang dengan Global Mini Player saat kamu membuka chat atau menu lain.'
    ],
    accessRequirement: 'Semua pengguna yang sudah login.'
  },
  {
    id: 'chats-private-notes',
    name: 'Chats (Chat Pribadi, Direktori Pengguna, Notes 24 Jam & Call)',
    aliases: ['chats', 'chat pribadi', 'dm', 'pesan pribadi', 'notes', 'catatan', 'video call', 'voice call', 'telepon', 'tambah teman'],
    status: 'AKTIF',
    location: 'Tab navigasi bawah "Chats" (rute "/chats")',
    summary:
      'Pusat komunikasi ZE.io berisi Catatan Singkat 24 jam (Notes dengan emoji), tab "Chat" (percakapan 1-on-1 dengan emoji, stiker, serta Voice/Video Call WebRTC), tab "Pengguna" (direktori seluruh user ZE.io + status online), tombol "+ Tambah Teman" via ZE ID, dan tombol "Global" menuju Global Chat.',
    howToUse: [
      'Buka tab "Chats" di navigasi bawah.',
      'Tekan "+ Tambah Teman" di kanan atas untuk mengundang teman menggunakan ZE ID (ZE-XXXXXX) atau cari langsung di sub-tab "Pengguna".',
      'Ketuk "+ Catatan" pada avatar kamu di baris atas untuk membuat catatan singkat berdurasi 24 jam.',
      'Ketuk nama teman untuk membuka ruang chat pribadi, mengirim stiker/emoji, atau memulai panggilan suara/video.'
    ],
    accessRequirement: 'Semua pengguna yang sudah login.'
  },
  {
    id: 'global-chat',
    name: 'ZE.io Global Chat',
    aliases: ['global chat', 'chat global', 'obrolan global', 'room global'],
    status: 'AKTIF',
    location: 'Tab bawah "Chats" > tekan tombol "Global" di bagian atas (rute "/global")',
    summary:
      'Halaman ruang obrolan publik realtime lintas perangkat dan negara dengan tampilan transparan Black Liquid Glass di atas video air hitam, menampilkan jumlah user online, bendera negara, badge role (Owner/Admin/VIP/Centang Biru), emoji picker, dan sticker picker.',
    howToUse: [
      'Buka tab "Chats" di navigasi bawah, lalu tekan tombol tab "Global".',
      'Halaman akan berpindah penuh ke "ZE.io Global Chat".',
      'Ketik pesan, pilih emoji atau stiker di kolom bawah, lalu kirim untuk mengobrol realtime dengan semua pengguna ZE.io.',
      'Ketuk foto/nama pengirim pesan jika ingin melihat profilnya, atau tekan tombol panah kiri di kiri atas untuk kembali ke Chats.'
    ],
    accessRequirement: 'Semua pengguna yang sudah login.'
  },
  {
    id: 'profile-you',
    name: 'Profil Pengguna (Tab You) & Sistem Role Badge',
    aliases: ['you', 'profil', 'profile', 'edit profil', 'foto profil', 'centang biru', 'centang perak', 'vip', 'admin', 'ze id', 'logout', 'keluar'],
    status: 'AKTIF',
    location: 'Tab navigasi bawah paling kanan "You" (rute "/you")',
    summary:
      'Halaman profil akun yang menampilkan avatar, nama tampilan, @username, ZE ID unik, badge role (Owner / Admin Centang Perak / VIP + Centang Biru), bio, jumlah teman & story, tombol Edit Profil, dan tombol Logout.',
    howToUse: [
      'Tekan tab "You" di kanan bawah.',
      'Tekan "Edit Profil" atau ketuk foto profil untuk mengganti foto, nama tampilan, maupun bio.',
      'Ketuk profil pengguna lain di chat/pencarian untuk melihat jumlah pengikut, suka profil, postingan, mengikuti (Ikuti), menyukai profil, chat, atau video call.'
    ],
    accessRequirement: 'Semua pengguna yang sudah login.'
  },
  {
    id: 'key-store',
    name: 'Key Store (Pembelian Key via QRIS & Verifikasi Owner)',
    aliases: ['key store', 'keystore', 'beli key', 'harga key', 'qris', 'bukti transfer', 'cara beli key', 'key'],
    status: 'AKTIF',
    location: 'Header kanan atas Beranda (Updates) > ikon Keranjang (ShoppingCart)',
    summary:
      'Toko resmi pembelian lisensi Key ZE.io menggunakan pembayaran QRIS dan unggah bukti transfer yang diverifikasi langsung oleh Owner sebelum Key dikirim ke Notifikasi.',
    howToUse: [
      'Tekan ikon Keranjang (Key Store) di pojok kanan atas Beranda.',
      'Pilih durasi Key yang tersedia: 1 Jam (Rp15.000), 1 Minggu (Rp30.000), 1 Bulan (Rp55.000), atau Permanen (Rp70.000).',
      'Sistem membuat pesanan dengan ID transaksi unik dan menampilkan kode QRIS pembayaran.',
      'Setelah membayar lewat QRIS, tekan menu "KIRIM BUKTI TRANSFER" dan unggah foto/screenshot bukti pembayaran.',
      'Status pesanan berubah menjadi "MENUNGGU PERSETUJUAN OWNER". Pengguna belum menerima Key sebelum disetujui Owner.',
      'Begitu Owner menyetujui pembayaran, Key otomatis dibuat/diaktifkan dan dikirim melalui menu Notifikasi ZE.io (ikon Lonceng). Jika ditolak, alasan penolakan tampil dan pengguna bisa mengirim ulang bukti.'
    ],
    accessRequirement: 'Semua pengguna yang sudah login.'
  },
  {
    id: 'rw-booster',
    name: 'RW Hidden Menu (Game Booster & VPN Engine)',
    aliases: ['/rw', 'rw', 'game booster', 'vpn', 'booster'],
    status: 'AKTIF',
    location: 'Di dalam chat "ZE AI" > ketik perintah "/rw" lalu masukkan Key aktif',
    summary:
      'Panel optimasi game dan VPN multi-server (Indonesia, Singapore, Malaysia, Philippines, Thailand, Vietnam) dengan tes ping realtime, WakeLock layar, pembersih cache memori, serta pantauan baterai dan suhu.',
    howToUse: [
      'Pastikan kamu sudah memiliki Key aktif dari Key Store.',
      'Buka menu "ZE AI" dari Beranda, lalu kirim pesan "/rw".',
      'Saat ZE AI meminta "Masukkan key untuk melanjutkan:", kirim kode Key kamu.',
      'Setelah tervalidasi, panel RW Game Booster akan terbuka.'
    ],
    accessRequirement: 'Wajib memiliki Key resmi ZE.io yang masih aktif.'
  },
  {
    id: 'lutvoid-bug-system',
    name: 'Lutvoid Bug System (/bug atau /panel)',
    aliases: ['/bug', '/panel', 'lutvoid', 'bug system', 'sender'],
    status: 'AKTIF',
    location: 'Di dalam chat "ZE AI" > ketik perintah "/bug" atau "/panel" lalu masukkan Key aktif',
    summary:
      'Konsol khusus pemegang Key dengan tampilan Home, Console, Sender management, dan Control simulator.',
    howToUse: [
      'Pastikan kamu memiliki Key resmi ZE.io yang masih aktif.',
      'Buka menu "ZE AI", ketik "/bug" atau "/panel", lalu kirim kode Key saat diminta.',
      'Setelah Key valid, antarmuka Lutvoid Bug System akan terbuka penuh.'
    ],
    accessRequirement: 'Wajib memiliki Key resmi ZE.io yang masih aktif.'
  },
  {
    id: 'owner-control-panel',
    name: 'Owner Control Panel (Dashboard Owner & Admin)',
    aliases: ['owner', 'owner panel', 'dashboard owner', 'verifikasi pembayaran', 'admin panel'],
    status: 'AKTIF',
    location: 'Header kanan atas Beranda (Updates) > ikon Mahkota (Crown)',
    summary:
      'Panel kendali khusus Owner dan Admin untuk memantau statistik aplikasi, memverifikasi/menyetujui/menolak bukti transfer Key Store (khusus Owner), mengirim notifikasi pengumuman global, mengelola status VIP & Admin, mengelola pengguna, serta membuat/mencabut Key.',
    howToUse: [
      'Login menggunakan akun berstatus OWNER atau ADMIN, lalu tekan ikon Mahkota (Crown) di kanan atas Beranda.',
      'Masukkan password verifikasi Owner jika diminta.',
      'Gunakan menu Payments untuk memeriksa bukti transfer pembeli Key Store dan menyetujui atau menolak pesanan.'
    ],
    accessRequirement: 'Hanya dapat diakses oleh akun OWNER atau ADMIN (tombol tidak muncul untuk pengguna biasa).'
  }
];

export function buildZeioSystemKnowledgePrompt(): string {
  const activeLines = ZEIO_FEATURE_CATALOG.filter((f) => f.status === 'AKTIF')
    .map(
      (f, idx) =>
        `${idx + 1}. [${f.status}] ${f.name}\n` +
        `   - Lokasi UI: ${f.location}\n` +
        `   - Fungsi: ${f.summary}\n` +
        `   - Cara Pakai: ${f.howToUse.join(' ')}\n` +
        `   - Akses: ${f.accessRequirement}`
    )
    .join('\n');

  const soonLines = ZEIO_FEATURE_CATALOG.filter((f) => f.status === 'SOON')
    .map(
      (f, idx) =>
        `${idx + 1}. [${f.status}] ${f.name}\n` +
        `   - Lokasi UI: ${f.location}\n` +
        `   - Status & Perilaku Nyata: ${f.summary} ${f.howToUse.join(' ')}`
    )
    .join('\n');

  return `
=== DOKUMENTASI INTERNAL RESMI EKOSISTEM ZE.io (VERSI ${ZEIO_DOCS_LAST_UPDATED}) ===
Gunakan dokumentasi kode asli di bawah ini sebagai SATU-SATUNYA sumber kebenaran saat menjawab pertanyaan tentang aplikasi ZE.io:

A. DAFTAR FITUR AKTIF DI ZE.io:
${activeLines}

B. DAFTAR FITUR BERSTATUS "SOON" (BELUM AKTIF / SEGERA HADIR):
${soonLines}

C. ATURAN WAJIB & ANTI-HALUSINASI UNTUK ZE AI:
1. Akurasi Kode Nyata: Jelaskan fungsi, lokasi menu/tombol, syarat akses, harga Key, dan langkah penggunaan HANYA berdasarkan daftar resmi di atas.
2. Bedakan Status Fitur dengan Tegas:
   - Fitur AKTIF: Jelaskan lokasi dan cara pakainya dengan jelas.
   - Fitur SOON ("WEB TO APK" dan "TAG NO"): Wajib jelaskan bahwa kartunya ada di Beranda dengan label "SOON", saat ini dinonaktifkan sementara, dan kalau ditekan hanya memunculkan notifikasi "Fitur akan segera hadir." tanpa membuka halaman lain. Jangan pernah bilang kedua fitur itu sudah bisa dipakai sekarang!
   - Fitur BELUM TERSEDIA / TIDAK ADA di ZE.io: Jika user menanyakan fitur yang tidak ada di daftar atas (contoh: live streaming publik, marketplace belanja barang, top-up diamond game otomatis, trading crypto, telepon seluler reguler GSM, dsb.), katakan dengan jujur bahwa fitur tersebut belum tersedia / tidak ada di ZE.io saat ini.
3. Dilarang Mengarang: JANGAN PERNAH menebak, mengarang nama tombol, mengarang perintah slash selain "/rw" dan "/bug" (atau "/panel"), atau mengarang harga paket di luar harga resmi Key Store (1 Jam Rp15.000, 1 Minggu Rp30.000, 1 Bulan Rp55.000, Permanen Rp70.000).
4. Jujur Bila Tidak Tahu: Jika ditanya hal spesifik di luar pengetahuanmu atau data internal pribadinya yang tidak dikirim ke chat, jawab dengan jujur dan santai bahwa kamu tidak tahu / tidak punya akses ke data itu, jangan mengarang jawaban.
================================================================================
`.trim();
}

/**
 * Fallback pintar berbasis dokumentasi nyata ZE.io apabila koneksi ke model AI sedang tidak tersedia.
 * Memastikan jawaban seputar ZE.io tetap 100% akurat dan jujur tanpa mengarang.
 */
export function matchZeioFeatureFallback(rawMessage: string): string | null {
  const q = (rawMessage || '').trim().toLowerCase();
  if (!q) return null;

  // 1. Cek pertanyaan tentang fitur SOON (WEB TO APK & TAG NO)
  if (q.includes('web to apk') || q.includes('webtoapk') || (q.includes('apk') && (q.includes('web') || q.includes('menu') || q.includes('fitur') || q.includes('bikin') || q.includes('buat')))) {
    return 'Menu **WEB TO APK** di Beranda ZE.io saat ini statusnya masih **SOON** (segera hadir) dan lagi dinonaktifkan sementara bro. Kalau kartunya lo tekan, bakal muncul notifikasi *"Fitur akan segera hadir."* dan belum bisa dibuka sekarang. Tunggu update berikutnya ya!';
  }

  if (q.includes('tag no') || q.includes('tagno') || q.includes('tag nomor') || q.includes('caller id') || q.includes('lacak nomor') || q.includes('cek nomor')) {
    return 'Menu **TAG NO** (Caller ID & Tag Nomor) di Beranda ZE.io saat ini berstatus **SOON** dan belum aktif bro. Kalau lo klik kartunya di bagian Features Beranda, cuma bakal muncul notifikasi *"Fitur akan segera hadir."* Ditunggu aja rilis resminya ya!';
  }

  if (q.includes('soon') || q.includes('segera hadir') || q.includes('belum aktif') || q.includes('nonaktif')) {
    return 'Di ZE.io sekarang ada **2 menu berstatus SOON** di Beranda (bagian FEATURES), yaitu **WEB TO APK** dan **TAG NO** bro. Keduanya masih dinonaktifkan sementara dan kalau diklik bakal muncul info *"Fitur akan segera hadir."* Sementara 6 kartu lainnya (**TikTok No WM, Settings, ZE AI, Community, Group Chat, ZHD AI**) aktif penuh dan siap lo gas!';
  }

  // 2. Cek pertanyaan rangkuman semua fitur / menu ZE.io
  if (
    (q.includes('fitur') || q.includes('menu')) &&
    (q.includes('apa aja') || q.includes('apa saja') || q.includes('semua') || q.includes('daftar') || q.includes('ze.io') || q.includes('zeio') || q.includes('jelaskan'))
  ) {
    return (
      'Ini daftar lengkap fitur asli di **ZE.io** sesuai yang ada di aplikasi sekarang bro:\n\n' +
      '1. **Fitur AKTIF di Beranda (Updates)**:\n' +
      '   - **TikTok No WM**: Download video MP4 & audio MP3 TikTok tanpa watermark + putar jadi musik.\n' +
      '   - **Settings**: Pengaturan akun, privasi, chat, penyimpanan, Tema Global, & FPS Lock (60/90/120 FPS).\n' +
      '   - **ZE AI**: Chat AI santai (teks/foto/video) + akses perintah `/rw` & `/bug` (wajib Key aktif).\n' +
      '   - **Community**: Gabung & buat komunitas kreator.\n' +
      '   - **Group Chat**: Daftar grup, buat grup baru (`+ Buat Group`), & ruang obrolan grup realtime.\n' +
      '   - **ZHD AI**: Penjernih foto & video jadi HD (upscale 2x/4x + slider Before/After).\n' +
      '2. **Navigasi & Sosial AKTIF Lainnya**:\n' +
      '   - **Story 24 Jam** di Beranda, **Music Lab** (tab `Music` untuk putar lagu TikTok/YouTube di background), **Chats** (chat pribadi, Voice/Video Call, Notes 24 jam, direktori `Pengguna`, & `ZE.io Global Chat`), **Key Store** (ikon keranjang di kanan atas Beranda via QRIS + persetujuan Owner), **Owner Control Panel** (ikon mahkota khusus Owner/Admin), dan profil **You**.\n' +
      '3. **Fitur Berstatus SOON (Belum Aktif)**:\n' +
      '   - **WEB TO APK** dan **TAG NO** (kalau ditekan muncul *"Fitur akan segera hadir."*).'
    );
  }

  // 3. Key Store / Pembelian Key / QRIS
  if (q.includes('key store') || q.includes('keystore') || q.includes('beli key') || q.includes('harga key') || q.includes('qris') || q.includes('bukti transfer')) {
    return (
      'Buat beli Key resmi di **Key Store ZE.io**, caranya gampang bro:\n' +
      '1. Tekan ikon **Keranjang (ShoppingCart)** di pojok kanan atas **Beranda**.\n' +
      '2. Pilih paket Key: **1 Jam (Rp15.000)**, **1 Minggu (Rp30.000)**, **1 Bulan (Rp55.000)**, atau **Permanen (Rp70.000)**.\n' +
      '3. Bayar sesuai kode **QRIS** yang muncul, terus klik **KIRIM BUKTI TRANSFER** buat upload screenshot bukti bayar lo.\n' +
      '4. Status pesanan bakal jadi **MENUNGGU PERSETUJUAN OWNER**. Begitu di-approve sama Owner, kode Key otomatis dikirim ke menu **Notifikasi** (ikon Lonceng di Beranda)!'
    );
  }

  // 4. Perintah /rw atau /bug
  if (q.includes('/rw') || q.includes('game booster') || q.includes('vpn')) {
    return 'Fitur **RW Game Booster & VPN** bisa lo buka langsung dari chat **ZE AI** ini bro! Caranya tinggal ketik `/rw`, terus masukin **Key resmi ZE.io** yang masih aktif pas diminta. Kalau belum punya Key, lo bisa beli dulu di **Key Store** (ikon keranjang di kanan atas Beranda).';
  }

  if (q.includes('/bug') || q.includes('/panel') || q.includes('lutvoid')) {
    return 'Konsol **Lutvoid Bug System** dibuka lewat chat **ZE AI** dengan mengetik `/bug` atau `/panel`, lalu masukkan **Key resmi ZE.io** yang masih aktif untuk verifikasi. Tanpa Key aktif, panelnya gak bakal kebuka bro.';
  }

  // 5. ZHD AI / Wink HD
  if (q.includes('zhd') || q.includes('wink hd') || q.includes('jernih') || (q.includes('hd') && (q.includes('foto') || q.includes('video')))) {
    return 'Buat bikin foto atau video jadi jernih/HD, buka kartu **ZHD AI** di bagian **FEATURES Beranda** bro! Di sana lo tinggal pilih mode upscale **2x** atau **4x**, upload foto/video lo, cek bedanya lewat slider Before/After, terus langsung klik **Download** hasilnya.';
  }

  // 6. Global Chat & Group Chat
  if (q.includes('global chat') || q.includes('chat global')) {
    return 'Buat masuk ke **ZE.io Global Chat**, tekan tab **Chats** di navigasi bawah lalu pilih tombol **Global** di bagian atas bro. Lo bakal masuk ke halaman Global Chat realtime buat ngobrol, kirim stiker, atau emoji bareng semua user ZE.io dari berbagai daerah & negara!';
  }

  if (q.includes('group chat') || q.includes('chat group') || q.includes('buat grup') || q.includes('buat group')) {
    return 'Fitur **Group Chat** aktif bro! Buka kartu **Group Chat** di bagian **FEATURES Beranda**. Di halaman itu lo bisa cari grup, klik **+ Buat Group** buat bikin grup baru bareng teman, masuk ke ruang obrolan grup, atau klik ikon Info **(i)** di kanan atas ruang grup buat **+ Tambah Anggota**.';
  }

  // 7. Owner Panel / Admin / VIP / Centang Biru
  if (q.includes('owner') || q.includes('centang biru') || q.includes('centang perak') || q.includes('vip') || q.includes('admin')) {
    return 'Di ZE.io ada sistem role resmi bro: **OWNER** (pemilik utama dengan akses penuh Owner Control Panel & verifikasi bukti bayar Key Store), **ADMIN** (badge centang perak yang diangkat Owner), dan **VIP** (otomatis dapat badge VIP + centang biru sesuai durasi). Tombol **Owner Control Panel** (ikon Mahkota di kanan atas Beranda) cuma muncul khusus buat akun Owner atau Admin.';
  }

  // 8. Settings / FPS Lock / Tema
  if (q.includes('fps') || q.includes('settings') || q.includes('pengaturan') || q.includes('tema')) {
    return 'Menu **Settings** ada di bagian **FEATURES Beranda** bro. Di dalamnya lengkap banget: ada pengaturan Akun, Privasi, Chat, Notifikasi, Penyimpanan, **Tema Global**, sampai **FPS Lock (60 / 90 / 120 FPS + GPU Boost)** biar animasi ZE.io makin mulus!';
  }

  // 9. Deteksi pertanyaan fitur yang jelas TIDAK ADA di ZE.io agar jujur & tidak mengarang
  if (
    q.includes('top up') ||
    q.includes('topup') ||
    q.includes('belanja') ||
    q.includes('marketplace') ||
    q.includes('shop ') ||
    q.includes('live streaming') ||
    q.includes('crypto') ||
    q.includes('bitcoin') ||
    q.includes('nft') ||
    q.includes('dana kaget') ||
    q.includes('pinjol') ||
    q.includes('slot') ||
    q.includes('export ipa') ||
    q.includes('ios build')
  ) {
    return 'Jujur aja nih bro, fitur itu **belum tersedia / gak ada di ZE.io** saat ini. Gue gak mau ngarang info yang gak ada di aplikasi. Kalau lo mau tau fitur apa aja yang beneran aktif sekarang di ZE.io, tanya aja langsung ke gue ya!';
  }

  return null;
}
