import { TrainingSchedule, Member } from './types';

// Format phone number to Indonesian international format without plus (e.g. 628123456789)
export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

// Generate direct WhatsApp click-to-chat link
export function generateDirectWhatsAppUrl(phone: string, text: string): string {
  const normPhone = normalizePhoneNumber(phone);
  return `https://api.whatsapp.com/send?phone=${normPhone}&text=${encodeURIComponent(text)}`;
}

// Replace template placeholders with real schedule & member data
export function renderReminderMessage(
  template: string,
  member: Member,
  schedule: TrainingSchedule,
  academyName: string
): string {
  const dateObj = new Date(`${schedule.date}T${schedule.startTime}`);
  const formattedDate = dateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return template
    .replace(/{nama}/g, member.name)
    .replace(/{kategori}/g, member.category || 'Reguler')
    .replace(/{posisi}/g, member.position || 'Pemain')
    .replace(/{tanggal}/g, formattedDate)
    .replace(/{jam}/g, `${schedule.startTime} - ${schedule.endTime}`)
    .replace(/{lokasi}/g, schedule.location)
    .replace(/{pelatih}/g, schedule.coachName)
    .replace(/{materi}/g, schedule.focusMaterial || 'Latihan Taktik & Fisik Reguler')
    .replace(/{akademi}/g, academyName);
}
