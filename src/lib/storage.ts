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
  monthlyDueAmount: 75000,
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
      registrationNumber: 'GMV-2025-001',
      name: 'Rivan Nurmulya',
      gender: 'Putra',
      birthDate: '2008-04-12',
      phone: '081234560001',
      parentPhone: '081234569001',
      position: 'Opposite Hitter',
      category: 'U-18',
      jerseyNumber: 10,
      heightCm: 188,
      weightKg: 78,
      status: 'Aktif',
      joinDate: '2025-01-10',
      address: 'Jl. Olahraga No. 12, Bandung',
      notes: 'Lompatan vertikal kuat, potensi spike tajam',
    },
    {
      id: 'm-2',
      registrationNumber: 'GMV-2025-002',
      name: 'Farhan Halimi Pratama',
      gender: 'Putra',
      birthDate: '2009-02-18',
      phone: '081234560002',
      parentPhone: '081234569002',
      position: 'Outside Hitter',
      category: 'U-18',
      jerseyNumber: 7,
      heightCm: 185,
      weightKg: 73,
      status: 'Aktif',
      joinDate: '2025-01-12',
      address: 'Jl. Melati No. 45, Bandung',
      notes: 'Spesialis jump serve dan receive akurat',
    },
    {
      id: 'm-3',
      registrationNumber: 'GMV-2025-003',
      name: 'Dio Zulfikri Putra',
      gender: 'Putra',
      birthDate: '2008-11-05',
      phone: '081234560003',
      parentPhone: '081234569003',
      position: 'Setter',
      category: 'U-18',
      jerseyNumber: 3,
      heightCm: 180,
      weightKg: 70,
      status: 'Aktif',
      joinDate: '2025-01-15',
      address: 'Jl. Anggrek No. 8, Bandung',
      notes: 'Playmaker utama, toss cepat dan variatif',
    },
    {
      id: 'm-4',
      registrationNumber: 'GMV-2025-004',
      name: 'Hendra Kurniawan',
      gender: 'Putra',
      birthDate: '2009-07-22',
      phone: '081234560004',
      parentPhone: '081234569004',
      position: 'Middle Blocker',
      category: 'U-18',
      jerseyNumber: 4,
      heightCm: 192,
      weightKg: 80,
      status: 'Aktif',
      joinDate: '2025-01-20',
      address: 'Jl. Terusan Buah Batu No. 19',
      notes: 'Blok monster & quick attack tengah',
    },
    {
      id: 'm-5',
      registrationNumber: 'GMV-2025-005',
      name: 'Fahreza Rakha',
      gender: 'Putra',
      birthDate: '2009-09-14',
      phone: '081234560005',
      parentPhone: '081234569005',
      position: 'Libero',
      category: 'U-18',
      jerseyNumber: 1,
      heightCm: 174,
      weightKg: 66,
      status: 'Aktif',
      joinDate: '2025-02-01',
      address: 'Jl. Cihampelas No. 50, Bandung',
      notes: 'Agility luar biasa saat diving save',
    },
    {
      id: 'm-6',
      registrationNumber: 'GMV-2025-006',
      name: 'Megawati Hangestri Pertiwi',
      gender: 'Putri',
      birthDate: '2010-03-20',
      phone: '081234560006',
      parentPhone: '081234569006',
      position: 'Opposite Hitter',
      category: 'U-15',
      jerseyNumber: 8,
      heightCm: 182,
      weightKg: 70,
      status: 'Aktif',
      joinDate: '2025-02-05',
      address: 'Jl. Riau No. 101, Bandung',
      notes: 'Back-attack sangat bertenaga (Megatron)',
    },
    {
      id: 'm-7',
      registrationNumber: 'GMV-2025-007',
      name: 'Wilda Siti Nurfadhilah',
      gender: 'Putri',
      birthDate: '2010-05-18',
      phone: '081234560007',
      parentPhone: '081234569007',
      position: 'Middle Blocker',
      category: 'U-15',
      jerseyNumber: 17,
      heightCm: 178,
      weightKg: 65,
      status: 'Aktif',
      joinDate: '2025-02-10',
      address: 'Jl. Dago No. 88, Bandung',
      notes: 'Kapten tim putri U-15, mental tanding kokoh',
    },
    {
      id: 'm-8',
      registrationNumber: 'GMV-2025-008',
      name: 'Yolla Yuliana',
      gender: 'Putri',
      birthDate: '2011-08-30',
      phone: '081234560008',
      parentPhone: '081234569008',
      position: 'Outside Hitter',
      category: 'U-15',
      jerseyNumber: 15,
      heightCm: 179,
      weightKg: 64,
      status: 'Aktif',
      joinDate: '2025-02-14',
      address: 'Jl. Setiabudhi No. 23, Bandung',
      notes: 'Servis tajam dan penempatan bola taktis',
    },
    {
      id: 'm-9',
      registrationNumber: 'GMV-2025-009',
      name: 'Arneta Putri',
      gender: 'Putri',
      birthDate: '2011-06-11',
      phone: '081234560009',
      parentPhone: '081234569009',
      position: 'Setter',
      category: 'U-15',
      jerseyNumber: 2,
      heightCm: 172,
      weightKg: 60,
      status: 'Aktif',
      joinDate: '2025-02-18',
      address: 'Jl. Gatot Subroto No. 34, Bandung',
      notes: 'Umpan bola tinggi dan semi akurat',
    },
    {
      id: 'm-10',
      registrationNumber: 'GMV-2025-010',
      name: 'Dimas Saputra',
      gender: 'Putra',
      birthDate: '2012-04-05',
      phone: '081234560010',
      parentPhone: '081234569010',
      position: 'Outside Hitter',
      category: 'U-15',
      jerseyNumber: 9,
      heightCm: 175,
      weightKg: 62,
      status: 'Aktif',
      joinDate: '2025-03-01',
      address: 'Jl. Kopo No. 77, Bandung',
      notes: 'Dalam pemulihan cedera ankle ringan',
    }
  ],
  schedules: [],
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
        id: 'sch-today',
        title: 'Latihan Taktik & Receive Servis (Sesi Sore)',
        category: 'Semua Kategori',
        date: formatYMD(today),
        startTime: `${startHourStr}:${startMinStr}`,
        endTime: `${endHourStr}:${startMinStr}`,
        location: 'GOR Siliwangi Lapangan A',
        coachName: 'Bambang Supriyanto',
        focusMaterial: 'Passing bawah cepat, transisi pertahanan, dan quick spike',
        description: 'Sesi latihan penting menjelang pertandingan persahabatan akhir pekan.',
        reminderSent: false,
        reminderHoursBefore: 4,
      },
      {
        id: 'sch-tomorrow',
        title: 'Latihan Fisik & Jump Serve U-18',
        category: 'U-18',
        date: formatYMD(tomorrow),
        startTime: '15:30',
        endTime: '18:00',
        location: 'GOR Pajajaran Lapangan 2',
        coachName: 'Sugeng Wardoyo',
        focusMaterial: 'Drill ketahanan fisik, vertikal jump, akurasi jump serve',
        reminderSent: false,
        reminderHoursBefore: 4,
      },
      {
        id: 'sch-weekend',
        title: 'Simulasi Pertandingan Game Internal & Evaluasi Rotasi',
        category: 'Semua Kategori',
        date: formatYMD(nextSession),
        startTime: '08:00',
        endTime: '11:00',
        location: 'GOR Siliwangi Utama',
        coachName: 'Bambang & Sugeng',
        focusMaterial: 'Simulasi sistem 5-1 dan 6-2 rotasi pemain',
        reminderSent: false,
        reminderHoursBefore: 4,
      },
      {
        id: 'sch-past',
        title: 'Latihan Dasar Passing & Setting Junior U-15',
        category: 'U-15',
        date: formatYMD(pastSession),
        startTime: '16:00',
        endTime: '18:30',
        location: 'GOR Lapangan Arcamanik',
        coachName: 'Coach Bambang',
        focusMaterial: 'Passing atas, ketepatan toss setter',
        reminderSent: true,
        reminderSentAt: new Date(pastSession.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        reminderHoursBefore: 4,
      }
    ];

    // Seed past attendances
    data.attendances = [
      { id: 'att-1', scheduleId: 'sch-past', memberId: 'm-6', status: 'HADIR', notes: 'Passing sangat stabil', recordedAt: pastSession.toISOString() },
      { id: 'att-2', scheduleId: 'sch-past', memberId: 'm-7', status: 'HADIR', notes: 'Hadir tepat waktu', recordedAt: pastSession.toISOString() },
      { id: 'att-3', scheduleId: 'sch-past', memberId: 'm-8', status: 'HADIR', notes: 'Spike makin tajam', recordedAt: pastSession.toISOString() },
      { id: 'att-4', scheduleId: 'sch-past', memberId: 'm-9', status: 'HADIR', notes: 'Toss bagus', recordedAt: pastSession.toISOString() },
      { id: 'att-5', scheduleId: 'sch-past', memberId: 'm-10', status: 'SAKIT', notes: 'Izin sakit flu', recordedAt: pastSession.toISOString() },
    ];
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
  if (memoryCache) {
    return memoryCache;
  }

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
    const neonData = await getNeonDatabase();
    if (neonData && neonData.members && neonData.members.length > 0) {
      saveDatabaseLocal(neonData);
      return neonData;
    }
  } catch (err) {
    console.warn('Neon query failed, using local storage:', err);
  }
  return getDatabaseLocal();
}

export function saveDatabase(data: AppData): void {
  saveDatabaseLocal(data);
  // Async background sync to Neon
  saveNeonDatabase(data).catch((err) => {
    console.warn('Background sync to Neon failed:', err);
  });
}

export async function saveDatabaseAsync(data: AppData): Promise<void> {
  saveDatabaseLocal(data);
  try {
    await saveNeonDatabase(data);
  } catch (err) {
    console.warn('Neon save failed, saved locally:', err);
  }
}
