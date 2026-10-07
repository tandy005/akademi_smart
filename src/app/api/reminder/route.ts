import { NextResponse } from 'next/server';
import { getDatabaseAsync, saveDatabaseAsync } from '@/lib/storage';
import {
  broadcastScheduleReminder,
  checkAndSendAutoReminders,
  sendWhatsAppMessage,
} from '@/lib/whatsapp';
import { WhatsAppConfig } from '@/lib/types';

export async function GET() {
  const db = await getDatabaseAsync();
  return NextResponse.json({
    config: db.whatsappConfig,
    logs: db.reminderLogs.slice(0, 50),
    academyName: db.academyName,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = await getDatabaseAsync();

    if (body.action === 'UPDATE_CONFIG') {
      const config: Partial<WhatsAppConfig> = body.config;
      db.whatsappConfig = {
        ...db.whatsappConfig,
        ...config,
        reminderHoursBefore: Number(config.reminderHoursBefore) || 4,
      };
      await saveDatabaseAsync(db);
      return NextResponse.json({ success: true, config: db.whatsappConfig });
    }

    if (body.action === 'BROADCAST_SCHEDULE') {
      const { scheduleId, targetType } = body;
      if (!scheduleId) {
        return NextResponse.json({ error: 'scheduleId is required' }, { status: 400 });
      }

      const result = await broadcastScheduleReminder(
        scheduleId,
        targetType || 'ATLET',
        Boolean(body.force)
      );

      return NextResponse.json({
        success: true,
        count: result.count,
        message: `Berhasil memproses reminder ke ${result.count} penerima`,
      });
    }

    if (body.action === 'TEST_MESSAGE') {
      const { phone, message } = body;
      if (!phone || !message) {
        return NextResponse.json({ error: 'phone and message are required' }, { status: 400 });
      }

      const res = await sendWhatsAppMessage(db.whatsappConfig, phone, message);

      // Record in logs
      db.reminderLogs.unshift({
        id: `log-test-${Date.now()}`,
        scheduleId: 'TEST',
        scheduleTitle: 'Uji Coba Pengiriman Pesan WhatsApp',
        recipientName: 'Nomor Uji Coba',
        recipientPhone: phone,
        targetType: 'ATLET',
        message: message,
        status: res.status,
        timestamp: new Date().toISOString(),
        errorDetail: res.error,
      });
      await saveDatabaseAsync(db);

      return NextResponse.json({ success: res.success, status: res.status, error: res.error });
    }

    if (body.action === 'CHECK_AUTO_REMINDER') {
      const res = await checkAndSendAutoReminders();
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: 'Aksi tidak valid' }, { status: 400 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
