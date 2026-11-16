export interface OdooTaskItem {
  id: string;
  sprint: 'Sprint 1: Dokumentasi & Gerbang Masuk' | 'Sprint 2: Bahasa Adaptif (Pemula/Menengah/Expert)' | 'Sprint 3: Integritas Mesin & UI In-Workout' | 'Sprint 4: Ekosistem Wearable & Otomasi';
  epic: string;
  title: string;
  stage: 'Done' | 'In Progress' | 'To Do';
  priority: 'High' | 'Medium' | 'Low';
  storyPoints: number;
  auditRef: string;
  assigneeRole: string;
  description: string;
  acceptanceCriteria: string[];
}

export const ODOO_SPRINT_TASKS: OdooTaskItem[] = [
  {
    id: 'ODOO-101',
    sprint: 'Sprint 1: Dokumentasi & Gerbang Masuk',
    epic: 'EPIC-01: Documentation-First & Odoo Governance',
    title: 'Penyusunan Blueprint Dokumentasi Produk & Portal npm run doc:dev',
    stage: 'Done',
    priority: 'High',
    storyPoints: 5,
    auditRef: 'Temuan #3 (R-24, R-26, C-2)',
    assigneeRole: 'Product Manager & Tech Lead',
    description:
      'Menyusun dokumentasi arsitektur, value proposition, kamus kosakata multi-tier, dan papan Sprint Odoo yang dapat diakses melalui perintah npm run doc:dev serta di dalam aplikasi.',
    acceptanceCriteria: [
      'Tersedia perintah npm run doc:dev dan npm run doc di package.json',
      'Tersedia berkas docs/odoo-sprint.md dan docs/odoo-tasks-import.csv siap impor ke modul Odoo Project',
      'Tersedia tampilan interaktif Sprint Odoo & Dokumentasi di dalam aplikasi web',
    ],
  },
  {
    id: 'ODOO-102',
    sprint: 'Sprint 1: Dokumentasi & Gerbang Masuk',
    epic: 'EPIC-02: Onboarding, Value Proposition & Local Auth',
    title: 'Implementasi Gerbang Awal: Value Proposition & Login Akun Atlet Lokal',
    stage: 'Done',
    priority: 'High',
    storyPoints: 8,
    auditRef: 'Temuan #1 (R-20, R-37, C-3)',
    assigneeRole: 'Frontend & UX Engineer',
    description:
      'Membangun halaman gerbang awal (AuthLandingGate) yang menjelaskan masalah hybrid training yang diselesaikan RKStride, menampilkan simulasi meter ACWR, serta menyediakan fitur Login dan Registrasi akun atlet lokal (IndexedDB/localStorage) beserta pemilihan level awal.',
    acceptanceCriteria: [
      'Pengguna baru disambut oleh penjelasan Value Proposition RKStride dan alasan mengapa aplikasi ini dibutuhkan sebelum masuk ke dasbor',
      'Tersedia form Login Akun Atlet, Registrasi Atlet Baru (Nama, Email/ID, PIN, Usia, Berat, Tinggi, Level), dan Masuk Cepat Evaluasi',
      'Tersedia tombol Keluar (Logout) dan penanda identitas atlet aktif di HeaderNavbar',
      'Seluruh elemen interaktif memenuhi batas sentuh 44px, bebas literal hex, dan lolos audit aksesibilitas',
    ],
  },
  {
    id: 'ODOO-201',
    sprint: 'Sprint 2: Bahasa Adaptif (Pemula/Menengah/Expert)',
    epic: 'EPIC-03: Adaptive Experience Tiering',
    title: 'Sistem Kosakata & Tampilan Adaptif: Pemula, Menengah, dan Expert',
    stage: 'Done',
    priority: 'High',
    storyPoints: 8,
    auditRef: 'Temuan #2 (R-06, R-31, C-1)',
    assigneeRole: 'UX Researcher & Frontend Engineer',
    description:
      'Mengubah istilah dan kedalaman metrik di seluruh komponen utama berdasarkan tingkat pengalaman yang dipilih pengguna (Pemula: bahasa sehari-hari bebas jargon; Menengah: panduan terstruktur dengan ACWR & RPE; Expert: terminologi penuh sRPE, TRIMP, Karvonen HRR, dan pemilihan metode Coupled/Uncoupled/EWMA).',
    acceptanceCriteria: [
      'Pengguna dapat mengganti mode Pemula / Menengah / Expert kapan saja dari Header maupun halaman Login',
      'Kartu beban kerja dan pencatat latihan menampilkan istilah yang sesuai dengan level aktif',
      'Mode Pemula menyembunyikan rumus akademis rumit dan menggantinya dengan instruksi praktis yang mudah dipahami',
    ],
  },
  {
    id: 'ODOO-202',
    sprint: 'Sprint 2: Bahasa Adaptif (Pemula/Menengah/Expert)',
    epic: 'EPIC-03: Adaptive Experience Tiering',
    title: 'Penyeragaman Bahasa Indonesia & Penghapusan Em Dash / CTA Generik',
    stage: 'Done',
    priority: 'Low',
    storyPoints: 3,
    auditRef: 'Temuan #6 & #10 (R-02, R-05, R-15)',
    assigneeRole: 'Copywriter & Frontend Engineer',
    description:
      'Menghapus seluruh karakter em dash pada UI/dokumentasi serta menyeragamkan label bahasa Inggris yang masih tercampur di WorkoutLogger, ScheduleCustomizer, SmartwatchSyncCard, PostWorkoutDebriefModal, dan Footer ke Bahasa Indonesia sesuai DESIGN.md.',
    acceptanceCriteria: [
      'Nol karakter em dash di seluruh komponen UI dan dokumentasi',
      'Seluruh tombol CTA menyebutkan aksi spesifik dalam Bahasa Indonesia (menggantikan Done, Close, Add Set, Save & Log)',
    ],
  },
  {
    id: 'ODOO-301',
    sprint: 'Sprint 3: Integritas Mesin & UI In-Workout',
    epic: 'EPIC-04: Sports Science Engine Wiring',
    title: 'Pembersihan Data Asumsi Default & Sinkronisasi Rumus Beban UI-Engine',
    stage: 'To Do',
    priority: 'High',
    storyPoints: 5,
    auditRef: 'Temuan #4 & #7 (R-17, R-23, R-26, R-38)',
    assigneeRole: 'Sports Scientist & Full-Stack Engineer',
    description:
      'Menghapus asumsi target lomba Jakarta Half Marathon pada pengguna baru, menyamakan rumus skor per latihan di WorkoutLogger dengan calculateStrengthLoad, menggunakan flag isLegStrain untuk mendeteksi Deadlift/Hip Thrust, serta menghitung lastFastRunHoursAgo secara aktual.',
    acceptanceCriteria: [
      'Skor beban per gerakan di kartu latihan konsisten dengan Total Strength Load',
      'Gerakan Romanian Deadlift, Conventional Deadlift, dan Hip Thrust memicu proteksi jendela pemulihan kaki 48 jam',
      'Arah ke-2 guardrail (Lari Cepat ke Leg Day < 24 jam) aktif di kartu rekomendasi harian',
    ],
  },
  {
    id: 'ODOO-302',
    sprint: 'Sprint 3: Integritas Mesin & UI In-Workout',
    epic: 'EPIC-04: Sports Science Engine Wiring',
    title: 'Eksposur Metrik Mesin ke UI: Estimasi 1RM, PR Badge, Hard Sets Mingguan & Zona Karvonen',
    stage: 'To Do',
    priority: 'High',
    storyPoints: 8,
    auditRef: 'Temuan #7 (R-26, R-36, C-2)',
    assigneeRole: 'Frontend Engineer',
    description:
      'Menghubungkan fungsi mesin yang sudah ada di workload.ts (estimate1RM, detectPersonalRecord, calculateWeeklyMuscleVolume, calculateKarvonenHeartRateZones, serta input HRV & nyeri tendon) ke komponen visual.',
    acceptanceCriteria: [
      'Tabel set menampilkan estimasi 1RM dan indikator rekor pribadi (PR)',
      'Tab Beban menampilkan distribusi set kerja keras (hard sets) per kelompok otot mingguan',
      'Pemilih protokol lari menampilkan rentang detak jantung (bpm) spesifik berdasarkan profil Karvonen atlet',
    ],
  },
  {
    id: 'ODOO-401',
    sprint: 'Sprint 4: Ekosistem Wearable & Otomasi',
    epic: 'EPIC-05: Wearable Parser & Motion Hygiene',
    title: 'Perbaikan Parser File .fit/.gpx/.tcx Tanpa Angka Palsu & Kepatuhan MOTION 1',
    stage: 'To Do',
    priority: 'High',
    storyPoints: 5,
    auditRef: 'Temuan #5, #8, #9 (R-01, R-17, R-19, R-38)',
    assigneeRole: 'Systems Engineer',
    description:
      'Memperbaiki parser file jam pintar agar mendukung XML .gpx/.tcx dan menolak file biner .fit yang rusak dengan pesan error jujur (tanpa fallback angka palsu), meneruskan workoutDetected ke catatan latihan, serta menghapus animasi spin abadi dan borderLeft dekoratif.',
    acceptanceCriteria: [
      'Unggahan file yang gagal di-parse menampilkan pesan error jelas tanpa mengisi angka tidur/RHR fiktif',
      'Data lari dari file impor otomatis terhubung ke log latihan',
      'Tidak ada animasi berulang tanpa henti (patuh MOTION 1) dan borderLeft hanya untuk status risiko nyata',
    ],
  },
];

export function generateOdooCsvContent(): string {
  const headers = [
    'External ID',
    'Project',
    'Sprint / Milestone',
    'Epic / Tag',
    'Task Title',
    'Stage',
    'Priority',
    'Story Points',
    'Audit Reference',
    'Assigned Role',
    'Description',
    'Acceptance Criteria',
  ];

  const escapeCsv = (val: string | number) => {
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = ODOO_SPRINT_TASKS.map((t) =>
    [
      t.id,
      'RKStride - Pulse Hybrid Athletics',
      t.sprint,
      t.epic,
      t.title,
      t.stage,
      t.priority,
      t.storyPoints,
      t.auditRef,
      t.assigneeRole,
      t.description,
      t.acceptanceCriteria.join(' | '),
    ]
      .map(escapeCsv)
      .join(',')
  );

  return [headers.map(escapeCsv).join(','), ...rows].join('\n');
}
