import fs from 'fs';
import path from 'path';
import {
  Member,
  TrainingSchedule,
  AttendanceRecord,
  MonthlyDue,
  CashTransaction,
  NewsAgenda,
  WhatsAppConfig,
  ReminderLog,
} from './types';
import { getNeonDatabase, saveNeonDatabase } from './neon-db';

export interface AppData {
  academyName: string;
  monthlyDueAmount: number;
  members: Member[];
  schedules: TrainingSchedule[];
  attendances: AttendanceRecord[];
  dues: MonthlyDue[];
  transactions: CashTransaction[];
  news: NewsAgenda[];
  whatsappConfig: WhatsAppConfig;
  reminderLogs: ReminderLog[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'volleyball_db.json');

const INITIAL_DATA: AppData = {
  academyName: 'Akademi Voly Smart 09',
  monthlyDueAmount: 10000,
  whatsappConfig: {
    provider: 'SIMULATOR',
    apiKey: '',
    senderNumber: '081234567890',
    webhookUrl: '',
    autoReminderEnabled: true,
    reminderHoursBefore: 4,
    messageTemplate: `🏐 *PENGINGAT LATIHAN BOLA VOLI* 🏐\n\nHalo *{nama}*,\nJangan lupa jadwal latihan bola voli hari ini:\n\n📅 *Hari/Tanggal:* {tanggal}\n⏰ *Waktu:* {jam} WIB *(Harap hadir 15 menit sebelumnya)*\n📍 *Lokasi:* {lokasi}\n👨‍🏫 *Pelatih:* Coach {pelatih}\n📋 *Materi:* {materi}\n\nPastikan membawa jersey latihan, sepatu voli, dan botol minum. Semangat berlatih! 💪🔥\n_- Pengurus {akademi}_`,
  },
  members: [
    {
      id: 'm-1',
      registrationNumber: 'SMART-2026-001',
      name: 'Acin',
      age: 15,
      gender: 'Putri',
      birthDate: '2011-01-01',
      phone: '087860033144',
      parentPhone: '087860033144',
      position: 'All-Round',
      category: 'U-15',
      status: 'Aktif',
      joinDate: '2026-01-10',
      address: 'Sidoarjo',
      notes: 'Anggota Baru',
    },
    {
      id: 'm-2',
      registrationNumber: 'SMART-2026-002',
      name: 'Syafiq',
      age: 10,
      gender: 'Putra',
      birthDate: '2016-01-01',
      phone: '085648800377',
      parentPhone: '085648800377',
      position: 'All-Round',
      category: 'U-12',
      status: 'Aktif',
      joinDate: '2026-01-10',
      address: 'Sidoarjo',
      notes: 'Anggota Baru',
    },
    {
      id: 'm-3',
      registrationNumber: 'SMART-2026-003',
      name: 'Dzaki',
      age: 14,
      gender: 'Putra',
      birthDate: '2012-01-01',
      phone: '089616071684',
      parentPhone: '089616071684',
      position: 'All-Round',
      category: 'U-15',
      status: 'Aktif',
      joinDate: '2026-01-10',
      address: 'Sidoarjo',
      notes: 'Anggota Baru',
    },
    {
      id: 'm-4',
      registrationNumber: 'SMART-2026-004',
      name: 'Cllara',
      age: 13,
      gender: 'Putri',
      birthDate: '2013-01-01',
      phone: '087721246555',
      parentPhone: '087721246555',
      position: 'All-Round',
      category: 'U-15',
      status: 'Aktif',
      joinDate: '2026-01-10',
      address: 'Sidoarjo',
      notes: 'Anggota Baru',
    },
    {
      id: 'm-5',
      registrationNumber: 'SMART-2026-005',
      name: 'Nindy',
      age: 12,
      gender: 'Putri',
      birthDate: '2014-01-01',
      phone: '082326937211',
      parentPhone: '082326937211',
      position: 'All-Round',
      category: 'U-12',
      status: 'Aktif',
      joinDate: '2026-01-10',
      address: 'Sidoarjo',
      notes: 'Anggota Baru',
    },
    {
      id: 'm-6',
      registrationNumber: 'SMART-2026-006',
      name: 'Shefty',
      age: 12,
      gender: 'Putri',
      birthDate: '2014-01-01',
      phone: '085850877879',
      parentPhone: '085850877879',
      position: 'All-Round',
      category: 'U-12',
      status: 'Aktif',
      joinDate: '2026-01-10',
      address: 'Sidoarjo',
      notes: 'Anggota Baru',
    },
    {
      id: 'm-7',
      registrationNumber: 'SMART-2026-007',
      name: 'Bram',
      age: 13,
      gender: 'Putra',
      birthDate: '2013-01-01',
      phone: '085607855184',
      parentPhone: '085607855184',
      position: 'All-Round',
      category: 'U-15',
      status: 'Aktif',
      joinDate: '2026-01-10',
      address: 'Sidoarjo',
      notes: 'Anggota Baru',
    },
    {
      id: 'm-8',
      registrationNumber: 'SMART-2026-008',
      name: 'Galih',
      age: 10,
      gender: 'Putra',
      birthDate: '2016-01-01',
      phone: '085645482731',
      parentPhone: '085645482731',
      position: 'All-Round',
      category: 'U-12',
      status: 'Aktif',
      joinDate: '2026-01-10',
      address: 'Sidoarjo',
      notes: 'Anggota Baru',
    },
    {
      id: 'm-9',
      registrationNumber: 'SMART-2026-009',
      name: 'Hana',
      age: 12,
      gender: 'Putri',
      birthDate: '2014-01-01',
      phone: '085743093968',
      parentPhone: '085743093968',
      position: 'All-Round',
      category: 'U-12',
      status: 'Aktif',
      joinDate: '2026-01-10',
      address: 'Sidoarjo',
      notes: 'Anggota Baru',
    },
    {
      id: 'm-10',
      registrationNumber: 'SMART-2026-010',
      name: 'Zahra',
      age: 13,
      gender: 'Putri',
      birthDate: '2013-01-01',
      phone: '085604905523',
      parentPhone: '085604905523',
      position: 'All-Round',
      category: 'U-15',
      status: 'Aktif',
      joinDate: '2026-01-10',
      address: 'Sidoarjo',
      notes: 'Anggota Baru',
    },
    {
      id: 'm-11',
      registrationNumber: 'SMART-2026-011',
      name: 'Keke',
      age: 11,
      gender: 'Putri',
      birthDate: '2015-01-01',
      phone: '085715860922',
      parentPhone: '085715860922',
      position: 'All-Round',
      category: 'U-12',
      status: 'Aktif',
      joinDate: '2026-01-10',
      address: 'Sidoarjo',
      notes: 'Anggota Baru',
    },
    {
      id: 'm-12',
      registrationNumber: 'SMART-2026-012',
      name: 'Fajar',
      age: 16,
      gender: 'Putra',
      birthDate: '2010-01-01',
      phone: '081515437135',
      parentPhone: '081515437135',
      position: 'All-Round',
      category: 'U-18',
      status: 'Aktif',
      joinDate: '2026-01-10',
      address: 'Sidoarjo',
      notes: 'Anggota Baru',
    },
    {
      id: 'm-13',
      registrationNumber: 'SMART-2026-013',
      name: 'Alben',
      age: 16,
      gender: 'Putra',
      birthDate: '2010-01-01',
      phone: '081228235746',
      parentPhone: '081228235746',
      position: 'All-Round',
      category: 'U-18',
      status: 'Aktif',
      joinDate: '2026-01-10',
      address: 'Sidoarjo',
      notes: 'Anggota Baru',
    },
    {
      id: 'm-14',
      registrationNumber: 'SMART-2026-014',
      name: 'Toscano',
      age: 16,
      gender: 'Putra',
      birthDate: '2010-01-01',
      phone: '089519375696',
      parentPhone: '089519375696',
      position: 'All-Round',
      category: 'U-18',
      status: 'Aktif',
      joinDate: '2026-01-10',
      address: 'Sidoarjo',
      notes: 'Anggota Baru',
    },
    {
      id: 'm-15',
      registrationNumber: 'SMART-2026-015',
      name: 'Taufiq',
      age: 16,
      gender: 'Putra',
      birthDate: '2010-01-01',
      phone: '083131333873',
      parentPhone: '083131333873',
      position: 'All-Round',
      category: 'U-18',
      status: 'Aktif',
      joinDate: '2026-01-10',
      address: 'Sidoarjo',
      notes: 'Anggota Baru',
    },
  ],
  schedules: [
    {
      id: 'sch-selasa',
      day: 'Selasa',
      title: 'Latihan Rutin Hari Selasa',
      category: 'Semua Kategori',
      date: '2026-10-13',
      startTime: '20:00',
      endTime: '22:00',
      location: 'Lapangan Smart 09 Taman Pondok Legi',
      coachName: 'Pelatih Smart 09',
      focusMaterial: 'Latihan Rutin',
      reminderSent: false,
      reminderHoursBefore: 4,
    },
    {
      id: 'sch-kamis',
      day: 'Kamis',
      title: 'Latihan Rutin Hari Kamis',
      category: 'Semua Kategori',
      date: '2026-10-15',
      startTime: '20:00',
      endTime: '22:00',
      location: 'Lapangan Smart 09 Taman Pondok Legi',
      coachName: 'Pelatih Smart 09',
      focusMaterial: 'Latihan Rutin',
      reminderSent: false,
      reminderHoursBefore: 4,
    },
    {
      id: 'sch-sabtu',
      day: 'Sabtu',
      title: 'Latihan Rutin Hari Sabtu',
      category: 'Semua Kategori',
      date: '2026-10-17',
      startTime: '15:30',
      endTime: '20:00',
      location: 'Lapangan Smart 09 Taman Pondok Legi',
      coachName: 'Pelatih Smart 09',
      focusMaterial: 'Latihan Rutin',
      reminderSent: false,
      reminderHoursBefore: 4,
    },
  ],
  attendances: [],
  dues: [],
  transactions: [
    {
      id: 'tx-1',
      type: 'INCOME',
      category: 'Saldo Awal',
      amount: 1500000,
      description: 'Saldo kas pembukaan akademi',
      date: '2026-01-01',
      receiptNumber: 'KAS-IN-20260101',
      recordedBy: 'Admin Bendahara',
    },
    {
      id: 'tx-2',
      type: 'EXPENSE',
      category: 'Peralatan/Bola',
      amount: 850000,
      description: 'Pembelian 2 unit Bola Voli Mikasa V200W & Peluit Fox40',
      date: '2026-01-15',
      receiptNumber: 'KAS-OUT-20260115',
      recordedBy: 'Admin Sarpras',
    },
    {
      id: 'tx-3',
      type: 'EXPENSE',
      category: 'Sewa Lapangan',
      amount: 400000,
      description: 'Sewa GOR Voli Indoor Siliwangi (4 Jam sesi latihan)',
      date: '2026-01-28',
      receiptNumber: 'KAS-OUT-20260128',
      recordedBy: 'Admin Operasional',
    },
    {
      id: 'tx-4',
      type: 'INCOME',
      category: 'Sponsorship',
      amount: 2000000,
      description: 'Sponsorship CV Sumber Jaya Sport untuk jersey latihan',
      date: '2026-02-05',
      receiptNumber: 'KAS-IN-20260205',
      recordedBy: 'Admin Bendahara',
    },
    {
      id: 'tx-5',
      type: 'EXPENSE',
      category: 'P3K',
      amount: 175000,
      description: 'Kinesio tape, spray dingin analgesik pereda nyeri, perban',
      date: '2026-02-12',
      receiptNumber: 'KAS-OUT-20260212',
      recordedBy: 'Coach Bambang',
    }
  ],
  news: [
    {
      id: 'news-1',
      title: 'Persiapan Kejuaraan Daerah Bola Voli Junior Piala Pelajar 2026',
      category: 'AGENDA',
      date: '2026-10-15',
      author: 'Head Coach Li Qiujiang',
      location: 'GOR Saparua Bandung',
      summary: 'Akademi akan mengirimkan 2 tim (Putra U-18 & Putri U-15) pada kejurda pekan depan.',
      content: `Pemberitahuan kepada seluruh atlet dan wali murid bahwa Akademi Bola Voly Smart  akan mengirimkan perwakilan dalam Kejuaraan Daerah Piala Pelajar Jawa Barat 2026.\n\nJadwal Technical Meeting:\n- Hari/Tanggal: Kamis, 15 Oktober 2026\n- Tempat: Gedung KONI\n\nSeluruh pemain yang terpilih diharapkan menjaga kebugaran fisik, pola makan, dan istirahat yang cukup.`,
      isPinned: true,
    },
    {
      id: 'news-2',
      title: 'Pemberitahuan Jadwal Latihan Intensif & Sosialisasi WhatsApp Reminder',
      category: 'PENGUMUMAN',
      date: '2026-10-04',
      author: 'Pengurus Akademi',
      summary: 'Mulai pekan ini reminder kehadiran latihan akan dikirim otomatis 4 jam sebelum sesi dimulai.',
      content: `Demi meningkatkan kedisiplinan dan koordinasi kehadiran atlet di lapangan, manajemen kini mengaktifkan sistem notifikasi otomatis WhatsApp yang akan mengingatkan atlet dan wali murid tepat 4 jam sebelum jadwal latihan dimulai.\n\nHarap pastikan nomor WhatsApp yang terdaftar selalu aktif.`,
      isPinned: true,
    },
    {
      id: 'news-3',
      title: 'Selamat! Tim Putra U-18 Raih Juara 1 Turnamen Invitasi Antar Klub',
      category: 'PRESTASI',
      date: '2026-09-28',
      author: 'Manajemen',
      summary: 'Perjuangan sengit di babak final berhasil ditutup dengan skor 3-1.',
      content: `Alhamdulillah, selamat atas prestasi membanggakan yang diraih tim Putra U-18 Garuda Muda di Turnamen Invitasi Bandung Raya. Kerja keras latihan jump serve dan pertahanan blok terbukti membuahkan hasil emas! Terus tingkatkan prestasi!`,
      isPinned: false,
    }
  ],
  reminderLogs: []
};

// Helper: Seed schedules around today & upcoming days
function seedDynamicDates(data: AppData) {
  const now = new Date();
  const formatYMD = (d: Date) => d.toISOString().split('T')[0];

  // Schedule 1: Today, training in 4 hours from now (to test 4-hour reminder immediately!)
  const today = new Date(now);
  const trainingLater = new Date(now.getTime() + 4 * 60 * 60 * 1000); // exactly 4 hours ahead
  const startHourStr = String(trainingLater.getHours()).padStart(2, '0');
  const startMinStr = String(trainingLater.getMinutes()).padStart(2, '0');
  const endHour = (trainingLater.getHours() + 2) % 24;
  const endHourStr = String(endHour).padStart(2, '0');

  // Schedule 2: Tomorrow morning
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  // Schedule 3: 3 days later
  const nextSession = new Date(now);
  nextSession.setDate(now.getDate() + 3);

  // Past session for attendance demonstration
  const pastSession = new Date(now);
  pastSession.setDate(now.getDate() - 3);

  if (data.schedules.length === 0) {
    data.schedules = [
      {
        id: 'sch-selasa',
        day: 'Selasa',
        title: 'Latihan Rutin Hari Selasa',
        category: 'Semua Kategori',
        date: '2026-10-13',
        startTime: '20:00',
        endTime: '22:00',
        location: 'Lapangan Smart 09 Taman Pondok Legi',
        coachName: 'Pelatih Smart 09',
        focusMaterial: 'Latihan Rutin',
        reminderSent: false,
        reminderHoursBefore: 4,
      },
      {
        id: 'sch-kamis',
        day: 'Kamis',
        title: 'Latihan Rutin Hari Kamis',
        category: 'Semua Kategori',
        date: '2026-10-15',
        startTime: '20:00',
        endTime: '22:00',
        location: 'Lapangan Smart 09 Taman Pondok Legi',
        coachName: 'Pelatih Smart 09',
        focusMaterial: 'Latihan Rutin',
        reminderSent: false,
        reminderHoursBefore: 4,
      },
      {
        id: 'sch-sabtu',
        day: 'Sabtu',
        title: 'Latihan Rutin Hari Sabtu',
        category: 'Semua Kategori',
        date: '2026-10-17',
        startTime: '15:30',
        endTime: '20:00',
        location: 'Lapangan Smart 09 Taman Pondok Legi',
        coachName: 'Pelatih Smart 09',
        focusMaterial: 'Latihan Rutin',
        reminderSent: false,
        reminderHoursBefore: 4,
      },
    ];

    // Past attendances
    data.attendances = [];
  }

  // Seed monthly dues if empty (for year 2026)
  if (data.dues.length === 0) {
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    data.members.forEach((member, idx) => {
      // For months 1..currentMonth
      for (let m = 1; m <= 12; m++) {
        // Members 1 to 7 have paid past months
        const isPastMonth = m <= currentMonth;
        const isPaid = isPastMonth && (idx < 7 || m < currentMonth);

        const dueId = `due-${member.id}-${currentYear}-${m}`;
        data.dues.push({
          id: dueId,
          memberId: member.id,
          month: m,
          year: currentYear,
          amount: data.monthlyDueAmount,
          isPaid: isPaid,
          paidAt: isPaid ? `${currentYear}-${String(m).padStart(2, '0')}-05T10:00:00Z` : undefined,
          paymentMethod: isPaid ? (idx % 2 === 0 ? 'Transfer Bank' : 'Tunai') : undefined,
          receiptNumber: isPaid ? `KWT-${currentYear}${String(m).padStart(2, '0')}-${member.registrationNumber.slice(-3)}` : undefined,
          note: isPaid ? 'Lunas tepat waktu' : undefined,
        });

        // Add corresponding cash income transaction for paid past dues
        if (isPaid && m <= 2) {
          const txId = `tx-due-${dueId}`;
          if (!data.transactions.some(t => t.id === txId)) {
            data.transactions.push({
              id: txId,
              type: 'INCOME',
              category: 'Iuran Kas',
              amount: data.monthlyDueAmount,
              description: `Iuran Kas Bulan ${m}/${currentYear} - ${member.name} (${member.registrationNumber})`,
              date: `${currentYear}-${String(m).padStart(2, '0')}-05`,
              relatedDueId: dueId,
              receiptNumber: `KWT-${currentYear}${String(m).padStart(2, '0')}-${member.registrationNumber.slice(-3)}`,
              recordedBy: 'Bendahara Kas',
            });
          }
        }
      }
    });
  }
}

let memoryCache: AppData | null = null;

function getDatabaseLocal(): AppData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch {}
    }

    if (!fs.existsSync(DATA_FILE)) {
      const clone = JSON.parse(JSON.stringify(INITIAL_DATA));
      seedDynamicDates(clone);
      memoryCache = clone;
      try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(clone, null, 2), 'utf-8');
      } catch {}
      return clone;
    }

    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed: AppData = JSON.parse(content);
    let changed = false;
    if (!parsed.schedules || parsed.schedules.length === 0) {
      seedDynamicDates(parsed);
      changed = true;
    }
    if (changed) {
      try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
      } catch {}
    }
    memoryCache = parsed;
    return parsed;
  } catch (error) {
    console.warn('Local database read/reset error:', error);
    const clone = JSON.parse(JSON.stringify(INITIAL_DATA));
    seedDynamicDates(clone);
    memoryCache = clone;
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(clone, null, 2), 'utf-8');
    } catch {}
    return clone;
  }
}

function saveDatabaseLocal(data: AppData): void {
  memoryCache = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Vercel serverless has a read-only filesystem; memoryCache preserves data in memory
  }
}

export function getDatabase(): AppData {
  return getDatabaseLocal();
}

export async function getDatabaseAsync(): Promise<AppData> {
  try {
    const neonPromise = getNeonDatabase();
    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error('Neon query timeout')), 2000)
    );
    const neonData = await Promise.race([neonPromise, timeoutPromise]);
    if (neonData && neonData.members && neonData.members.length > 0) {
      saveDatabaseLocal(neonData);
      return neonData;
    }
  } catch (err) {
    // Neon query skipped or timed out, seamlessly using local storage
  }
  return getDatabaseLocal();
}

export function saveDatabase(data: AppData): void {
  saveDatabaseLocal(data);
  // Async background sync to Neon
  saveNeonDatabase(data).catch(() => {});
}

export async function saveDatabaseAsync(data: AppData): Promise<void> {
  saveDatabaseLocal(data);
  // Non-blocking background sync so UI operations complete instantly
  saveNeonDatabase(data).catch(() => {});
}
