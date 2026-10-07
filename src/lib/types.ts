export type PlayerPosition = 
  | 'Setter' 
  | 'Outside Hitter' 
  | 'Opposite Hitter' 
  | 'Middle Blocker' 
  | 'Libero'
  | 'All-Round';

export type AgeCategory = 'U-12' | 'U-15' | 'U-18' | 'Senior';

export type MemberStatus = 'Aktif' | 'Non-Aktif' | 'Cedera';

export type Gender = 'Putra' | 'Putri';

export interface Member {
  id: string;
  registrationNumber: string; // e.g. SMART-2026-001
  name: string;
  age?: number; // Umur anggota (tahun)
  gender?: Gender;
  birthDate?: string; // YYYY-MM-DD
  phone: string; // WhatsApp number
  parentPhone?: string; // WhatsApp number wali
  position?: PlayerPosition;
  category?: AgeCategory;
  jerseyNumber?: number;
  heightCm?: number;
  weightKg?: number;
  status: MemberStatus;
  joinDate?: string;
  address?: string;
  notes?: string;
}

export function calculateMemberAge(member: { birthDate?: string; age?: number }): number {
  if (member.age !== undefined && member.age !== null && !isNaN(Number(member.age)) && Number(member.age) > 0) {
    return Number(member.age);
  }
  if (!member.birthDate) return 0;
  const birth = new Date(member.birthDate);
  if (isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age > 0 ? age : 0;
}

export interface TrainingSchedule {
  id: string;
  title: string;
  category: AgeCategory | 'Semua Kategori';
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location: string;
  coachName: string;
  focusMaterial: string; // Materi latihan, e.g. "Servis Atas & Passing Bawah"
  description?: string;
  reminderSent: boolean;
  reminderSentAt?: string;
  reminderHoursBefore: number; // default: 4
}

export type AttendanceStatus = 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA';

export interface AttendanceRecord {
  id: string;
  scheduleId: string;
  memberId: string;
  status: AttendanceStatus;
  notes?: string;
  recordedAt: string;
}

export interface MonthlyDue {
  id: string;
  memberId: string;
  month: number; // 1 to 12
  year: number; // e.g. 2026
  amount: number; // e.g. 50000
  isPaid: boolean;
  paidAt?: string;
  paymentMethod?: 'Tunai' | 'Transfer Bank' | 'QRIS';
  receiptNumber?: string;
  note?: string;
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface CashTransaction {
  id: string;
  type: TransactionType;
  category: string; // 'Iuran Kas', 'Pendaftaran', 'Sponsorship', 'Sewa Lapangan', 'Peralatan/Bola', 'Honor Pelatih', 'Konsumsi', 'P3K'
  amount: number;
  description: string;
  date: string; // YYYY-MM-DD
  relatedDueId?: string;
  receiptNumber?: string;
  recordedBy: string;
}

export type NewsCategory = 'BERITA' | 'AGENDA' | 'PENGUMUMAN' | 'PRESTASI';

export interface NewsAgenda {
  id: string;
  title: string;
  category: NewsCategory;
  date: string; // Event or published date
  author: string;
  content: string;
  summary: string;
  location?: string; // For agenda/events
  isPinned: boolean;
}

export interface WhatsAppConfig {
  provider: 'SIMULATOR' | 'FONNTE' | 'WAHA' | 'CUSTOM_WEBHOOK';
  apiKey: string;
  senderNumber: string;
  webhookUrl?: string;
  autoReminderEnabled: boolean;
  reminderHoursBefore: number; // default: 4
  messageTemplate: string;
}

export interface ReminderLog {
  id: string;
  scheduleId: string;
  scheduleTitle: string;
  memberId?: string;
  recipientName: string;
  recipientPhone: string;
  targetType: 'ATLET' | 'WALI';
  message: string;
  status: 'SUCCESS' | 'FAILED' | 'SIMULATED';
  timestamp: string;
  errorDetail?: string;
}

export type UserRole = 'ADMIN' | 'COACH' | 'MEMBER';
