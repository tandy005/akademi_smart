import { getDatabase, saveDatabase } from './storage';
import { TrainingSchedule, ReminderLog, WhatsAppConfig } from './types';
import {
  normalizePhoneNumber,
  renderReminderMessage,
  generateDirectWhatsAppUrl,
} from './whatsapp-utils';

export { normalizePhoneNumber, renderReminderMessage, generateDirectWhatsAppUrl };

// Send WhatsApp message to single phone
export async function sendWhatsAppMessage(
  config: WhatsAppConfig,
  phone: string,
  message: string
): Promise<{ success: boolean; status: 'SUCCESS' | 'FAILED' | 'SIMULATED'; error?: string }> {
  const normPhone = normalizePhoneNumber(phone);

  if (config.provider === 'SIMULATOR' || !config.apiKey) {
    // Simulator Mode (Safe, immediate, zero setup required)
    return {
      success: true,
      status: 'SIMULATED',
    };
  }

  try {
    if (config.provider === 'FONNTE') {
      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: normPhone,
          message: message,
        }),
      });
      const data = await response.json();
      if (response.ok && data.status) {
        return { success: true, status: 'SUCCESS' };
      } else {
        return { success: false, status: 'FAILED', error: data.reason || 'Fonnte error' };
      }
    }

    if (config.provider === 'WAHA' && config.webhookUrl) {
      const response = await fetch(`${config.webhookUrl.replace(/\/$/, '')}/api/sendText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey ? { 'X-Api-Key': config.apiKey } : {}),
        },
        body: JSON.stringify({
          chatId: `${normPhone}@c.us`,
          text: message,
        }),
      });
      if (response.ok) {
        return { success: true, status: 'SUCCESS' };
      } else {
        return { success: false, status: 'FAILED', error: `WAHA HTTP status ${response.status}` };
      }
    }

    if (config.provider === 'CUSTOM_WEBHOOK' && config.webhookUrl) {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normPhone, message }),
      });
      if (response.ok) {
        return { success: true, status: 'SUCCESS' };
      } else {
        return { success: false, status: 'FAILED', error: `Webhook HTTP status ${response.status}` };
      }
    }

    return { success: true, status: 'SIMULATED' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, status: 'FAILED', error: errorMsg };
  }
}

// Broadcast reminders for a specific schedule
export async function broadcastScheduleReminder(
  scheduleId: string,
  targetType: 'ATLET' | 'WALI' | 'KEDUANYA' = 'ATLET',
  force: boolean = false
): Promise<{ count: number; logs: ReminderLog[] }> {
  const db = getDatabase();
  const schedule = db.schedules.find((s) => s.id === scheduleId);
  if (!schedule) {
    throw new Error('Jadwal latihan tidak ditemukan');
  }

  // Filter members by category
  let targetMembers = db.members.filter((m) => m.status === 'Aktif');
  if (schedule.category !== 'Semua Kategori') {
    targetMembers = targetMembers.filter((m) => m.category === schedule.category);
  }

  const generatedLogs: ReminderLog[] = [];

  for (const member of targetMembers) {
    const message = renderReminderMessage(
      db.whatsappConfig.messageTemplate,
      member,
      schedule,
      db.academyName
    );

    // Send to Atlet
    if (targetType === 'ATLET' || targetType === 'KEDUANYA') {
      if (member.phone) {
        const res = await sendWhatsAppMessage(db.whatsappConfig, member.phone, message);
        const log: ReminderLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          scheduleId: schedule.id,
          scheduleTitle: schedule.title,
          memberId: member.id,
          recipientName: member.name,
          recipientPhone: member.phone,
          targetType: 'ATLET',
          message: message,
          status: res.status,
          timestamp: new Date().toISOString(),
          errorDetail: res.error,
        };
        generatedLogs.push(log);
      }
    }

    // Send to Wali Murid
    if (targetType === 'WALI' || targetType === 'KEDUANYA') {
      if (member.parentPhone) {
        const parentMsg = `[Info Wali Murid] ${message}`;
        const res = await sendWhatsAppMessage(db.whatsappConfig, member.parentPhone, parentMsg);
        const log: ReminderLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          scheduleId: schedule.id,
          scheduleTitle: schedule.title,
          memberId: member.id,
          recipientName: `Wali ${member.name}`,
          recipientPhone: member.parentPhone,
          targetType: 'WALI',
          message: parentMsg,
          status: res.status,
          timestamp: new Date().toISOString(),
          errorDetail: res.error,
        };
        generatedLogs.push(log);
      }
    }
  }

  // Update schedule status
  schedule.reminderSent = true;
  schedule.reminderSentAt = new Date().toISOString();

  // Prepend logs
  db.reminderLogs = [...generatedLogs, ...db.reminderLogs].slice(0, 200);
  saveDatabase(db);

  return { count: generatedLogs.length, logs: generatedLogs };
}

// Background auto-reminder checker (Checks schedules starting within 4 hours)
export async function checkAndSendAutoReminders(): Promise<{
  checkedSchedules: number;
  remindedSchedules: string[];
  totalSent: number;
}> {
  const db = getDatabase();
  if (!db.whatsappConfig.autoReminderEnabled) {
    return { checkedSchedules: 0, remindedSchedules: [], totalSent: 0 };
  }

  const now = new Date();
  const remindedSchedules: string[] = [];
  let totalSent = 0;

  for (const schedule of db.schedules) {
    if (schedule.reminderSent) continue;

    const scheduleDateTime = new Date(`${schedule.date}T${schedule.startTime}:00`);
    const diffMs = scheduleDateTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    const targetHours = schedule.reminderHoursBefore || db.whatsappConfig.reminderHoursBefore || 4;

    // Trigger reminder if training is within targetHours (e.g. <= 4.1 hours) and not past (diffHours >= -0.5)
    if (diffHours <= targetHours && diffHours >= -0.5) {
      const res = await broadcastScheduleReminder(schedule.id, 'ATLET');
      remindedSchedules.push(schedule.title);
      totalSent += res.count;
    }
  }

  return {
    checkedSchedules: db.schedules.length,
    remindedSchedules,
    totalSent,
  };
}
