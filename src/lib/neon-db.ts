import { sql } from './neon';
import {
  Member,
  TrainingSchedule,
  AttendanceRecord,
  MonthlyDue,
  CashTransaction,
  NewsAgenda,
  WhatsAppConfig,
  ReminderLog,
  UserRole
} from './types';
import { AppData } from './storage';
import bcrypt from 'bcryptjs';

export interface DbUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  memberId?: string | null;
  createdAt: string;
}

// 1. User authentication operations
export async function authenticateUser(username: string, passwordPlain: string): Promise<DbUser | null> {
  const cleanUsername = username.trim().toLowerCase();
  
  // Find user by exact username or matched registration number
  const rows = await sql`
    SELECT id, username, password_hash, name, role, member_id, created_at
    FROM users
    WHERE LOWER(username) = ${cleanUsername}
    LIMIT 1;
  `;

  if (!rows || rows.length === 0) {
    // If not found by username, check if it matches a member's registration number
    const memberRows = await sql`
      SELECT id, registration_number, name FROM members
      WHERE LOWER(registration_number) = ${cleanUsername}
      LIMIT 1;
    `;
    if (memberRows && memberRows.length > 0) {
      const m = memberRows[0];
      // Check user for this member
      const userRows = await sql`
        SELECT id, username, password_hash, name, role, member_id, created_at
        FROM users
        WHERE member_id = ${m.id}
        LIMIT 1;
      `;
      if (userRows && userRows.length > 0) {
        const u = userRows[0];
        const match = await bcrypt.compare(passwordPlain, u.password_hash);
        if (match) {
          return {
            id: u.id,
            username: u.username,
            name: u.name,
            role: u.role as UserRole,
            memberId: u.member_id,
            createdAt: u.created_at,
          };
        }
      }
    }
    return null;
  }

  const user = rows[0];
  const isValid = await bcrypt.compare(passwordPlain, user.password_hash);
  if (!isValid) return null;

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role as UserRole,
    memberId: user.member_id,
    createdAt: user.created_at,
  };
}

export async function getUserById(id: string): Promise<DbUser | null> {
  const rows = await sql`
    SELECT id, username, name, role, member_id, created_at
    FROM users
    WHERE id = ${id}
    LIMIT 1;
  `;
  if (!rows || rows.length === 0) return null;
  const u = rows[0];
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role as UserRole,
    memberId: u.member_id,
    createdAt: u.created_at,
  };
}

export async function getAllUsers(): Promise<DbUser[]> {
  const rows = await sql`
    SELECT id, username, name, role, member_id, created_at
    FROM users
    ORDER BY created_at DESC;
  `;
  return rows.map((u: any) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role as UserRole,
    memberId: u.member_id,
    createdAt: u.created_at,
  }));
}

// 2. Neon full database state fetcher
export async function getNeonDatabase(): Promise<AppData> {
  const [
    settingsRows,
    configRows,
    membersRows,
    schedulesRows,
    attendancesRows,
    duesRows,
    transactionsRows,
    newsRows,
    logsRows
  ] = await Promise.all([
    sql`SELECT academy_name, monthly_due_amount FROM app_settings WHERE id = 1 LIMIT 1`,
    sql`SELECT provider, api_key, sender_number, webhook_url, auto_reminder_enabled, reminder_hours_before, message_template FROM whatsapp_config WHERE id = 1 LIMIT 1`,
    sql`SELECT id, registration_number, name, gender, birth_date, phone, parent_phone, position, category, jersey_number, height_cm, weight_kg, status, join_date, address, notes FROM members ORDER BY id ASC`,
    sql`SELECT id, title, category, date, start_time, end_time, location, coach_name, focus_material, description, reminder_sent, reminder_sent_at, reminder_hours_before FROM schedules ORDER BY date DESC, start_time DESC`,
    sql`SELECT id, schedule_id, member_id, status, notes, recorded_at FROM attendances ORDER BY recorded_at DESC`,
    sql`SELECT id, member_id, month, year, amount, is_paid, paid_at, payment_method, receipt_number, note FROM monthly_dues ORDER BY year DESC, month ASC`,
    sql`SELECT id, type, category, amount, description, date, related_due_id, receipt_number, recorded_by FROM transactions ORDER BY date DESC`,
    sql`SELECT id, title, category, date, author, content, summary, location, is_pinned FROM news ORDER BY is_pinned DESC, date DESC`,
    sql`SELECT id, schedule_id, schedule_title, member_id, recipient_name, recipient_phone, target_type, message, status, timestamp, error_detail FROM reminder_logs ORDER BY timestamp DESC LIMIT 100`
  ]);

  const settings = settingsRows[0] || { academy_name: 'Akademi Smart', monthly_due_amount: 75000 };
  const wc = configRows[0] || {
    provider: 'SIMULATOR',
    api_key: '',
    sender_number: '081234567890',
    webhook_url: '',
    auto_reminder_enabled: true,
    reminder_hours_before: 4,
    message_template: ''
  };

  const currentYear = new Date().getFullYear();
  const members: Member[] = membersRows.map((m: any) => {
    let age: number | undefined = undefined;
    if (m.birth_date) {
      const birth = new Date(m.birth_date);
      if (!isNaN(birth.getTime())) {
        age = currentYear - birth.getFullYear();
      }
    }
    return {
      id: m.id,
      registrationNumber: m.registration_number,
      name: m.name,
      age: age,
      gender: m.gender,
      birthDate: m.birth_date,
      phone: m.phone,
      parentPhone: m.parent_phone,
      position: m.position,
      category: m.category,
      jerseyNumber: m.jersey_number ?? undefined,
      heightCm: m.height_cm ?? undefined,
      weightKg: m.weight_kg ?? undefined,
      status: m.status,
      joinDate: m.join_date,
      address: m.address ?? undefined,
      notes: m.notes ?? undefined,
    };
  });

  const schedules: TrainingSchedule[] = schedulesRows.map((s: any) => ({
    id: s.id,
    title: s.title,
    category: s.category,
    date: s.date,
    startTime: s.start_time,
    endTime: s.end_time,
    location: s.location,
    coachName: s.coach_name,
    focusMaterial: s.focus_material,
    description: s.description ?? undefined,
    reminderSent: Boolean(s.reminder_sent),
    reminderSentAt: s.reminder_sent_at ?? undefined,
    reminderHoursBefore: s.reminder_hours_before || 4,
  }));

  const seenAttKeys = new Set<string>();
  const attendances: AttendanceRecord[] = [];
  for (const a of attendancesRows) {
    const key = `${a.schedule_id}-${a.member_id}`;
    if (!seenAttKeys.has(key)) {
      seenAttKeys.add(key);
      attendances.push({
        id: a.id,
        scheduleId: a.schedule_id,
        memberId: a.member_id,
        status: a.status,
        notes: a.notes ?? undefined,
        recordedAt: a.recorded_at,
      });
    }
  }

  const dues: MonthlyDue[] = duesRows.map((d: any) => ({
    id: d.id,
    memberId: d.member_id,
    month: d.month,
    year: d.year,
    amount: d.amount,
    isPaid: Boolean(d.is_paid),
    paidAt: d.paid_at ?? undefined,
    paymentMethod: d.payment_method ?? undefined,
    receiptNumber: d.receipt_number ?? undefined,
    note: d.note ?? undefined,
  }));

  const transactions: CashTransaction[] = transactionsRows.map((t: any) => ({
    id: t.id,
    type: t.type,
    category: t.category,
    amount: t.amount,
    description: t.description,
    date: t.date,
    relatedDueId: t.related_due_id ?? undefined,
    receiptNumber: t.receipt_number ?? undefined,
    recordedBy: t.recorded_by,
  }));

  const news: NewsAgenda[] = newsRows.map((n: any) => ({
    id: n.id,
    title: n.title,
    category: n.category,
    date: n.date,
    author: n.author,
    content: n.content,
    summary: n.summary,
    location: n.location ?? undefined,
    isPinned: Boolean(n.is_pinned),
  }));

  const whatsappConfig: WhatsAppConfig = {
    provider: wc.provider,
    apiKey: wc.api_key || '',
    senderNumber: wc.sender_number || '',
    webhookUrl: wc.webhook_url || '',
    autoReminderEnabled: Boolean(wc.auto_reminder_enabled),
    reminderHoursBefore: wc.reminder_hours_before || 4,
    messageTemplate: wc.message_template || '',
  };

  const reminderLogs: ReminderLog[] = logsRows.map((l: any) => ({
    id: l.id,
    scheduleId: l.schedule_id,
    scheduleTitle: l.schedule_title,
    memberId: l.member_id ?? undefined,
    recipientName: l.recipient_name,
    recipientPhone: l.recipient_phone,
    targetType: l.target_type,
    message: l.message,
    status: l.status,
    timestamp: l.timestamp,
    errorDetail: l.error_detail ?? undefined,
  }));

  return {
    academyName: settings.academy_name,
    monthlyDueAmount: settings.monthly_due_amount,
    members,
    schedules,
    attendances,
    dues,
    transactions,
    news,
    whatsappConfig,
    reminderLogs,
  };
}

// 3. Save / Sync database back to Neon
export async function saveNeonDatabase(data: AppData): Promise<void> {
  // Update app settings
  await sql`
    INSERT INTO app_settings (id, academy_name, monthly_due_amount)
    VALUES (1, ${data.academyName}, ${data.monthlyDueAmount})
    ON CONFLICT (id) DO UPDATE SET
      academy_name = EXCLUDED.academy_name,
      monthly_due_amount = EXCLUDED.monthly_due_amount;
  `;

  // Update WhatsApp config
  const wc = data.whatsappConfig;
  await sql`
    INSERT INTO whatsapp_config (id, provider, api_key, sender_number, webhook_url, auto_reminder_enabled, reminder_hours_before, message_template)
    VALUES (1, ${wc.provider}, ${wc.apiKey || ''}, ${wc.senderNumber || ''}, ${wc.webhookUrl || ''}, ${wc.autoReminderEnabled}, ${wc.reminderHoursBefore}, ${wc.messageTemplate})
    ON CONFLICT (id) DO UPDATE SET
      provider = EXCLUDED.provider,
      api_key = EXCLUDED.api_key,
      sender_number = EXCLUDED.sender_number,
      webhook_url = EXCLUDED.webhook_url,
      auto_reminder_enabled = EXCLUDED.auto_reminder_enabled,
      reminder_hours_before = EXCLUDED.reminder_hours_before,
      message_template = EXCLUDED.message_template;
  `;

  // Sync members
  for (const m of data.members) {
    const defaultBirthDate = m.birthDate || (m.age ? `${new Date().getFullYear() - m.age}-01-01` : '2010-01-01');
    const defaultCategory = m.category || (m.age ? (m.age <= 12 ? 'U-12' : m.age <= 15 ? 'U-15' : m.age <= 18 ? 'U-18' : 'Senior') : 'U-18');
    const defaultGender = m.gender || 'Putra';
    const defaultPosition = m.position || 'All-Round';
    const defaultRegNum = m.registrationNumber || `SMART-2026-${m.id.replace(/\D/g, '').slice(-3) || '001'}`;
    const defaultJoinDate = m.joinDate || new Date().toISOString().split('T')[0];

    await sql`
      INSERT INTO members (id, registration_number, name, gender, birth_date, phone, parent_phone, position, category, jersey_number, height_cm, weight_kg, status, join_date, address, notes)
      VALUES (${m.id}, ${defaultRegNum}, ${m.name}, ${defaultGender}, ${defaultBirthDate}, ${m.phone || ''}, ${m.parentPhone || ''}, ${defaultPosition}, ${defaultCategory}, ${m.jerseyNumber ?? null}, ${m.heightCm ?? null}, ${m.weightKg ?? null}, ${m.status || 'Aktif'}, ${defaultJoinDate}, ${m.address ?? null}, ${m.notes ?? null})
      ON CONFLICT (id) DO UPDATE SET
        registration_number = EXCLUDED.registration_number,
        name = EXCLUDED.name,
        gender = EXCLUDED.gender,
        birth_date = EXCLUDED.birth_date,
        phone = EXCLUDED.phone,
        parent_phone = EXCLUDED.parent_phone,
        position = EXCLUDED.position,
        category = EXCLUDED.category,
        jersey_number = EXCLUDED.jersey_number,
        height_cm = EXCLUDED.height_cm,
        weight_kg = EXCLUDED.weight_kg,
        status = EXCLUDED.status,
        join_date = EXCLUDED.join_date,
        address = EXCLUDED.address,
        notes = EXCLUDED.notes;
    `;
  }

  // Sync schedules
  for (const s of data.schedules) {
    await sql`
      INSERT INTO schedules (id, title, category, date, start_time, end_time, location, coach_name, focus_material, description, reminder_sent, reminder_sent_at, reminder_hours_before)
      VALUES (${s.id}, ${s.title}, ${s.category}, ${s.date}, ${s.startTime}, ${s.endTime}, ${s.location}, ${s.coachName}, ${s.focusMaterial}, ${s.description ?? null}, ${s.reminderSent}, ${s.reminderSentAt ?? null}, ${s.reminderHoursBefore})
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        date = EXCLUDED.date,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        location = EXCLUDED.location,
        coach_name = EXCLUDED.coach_name,
        focus_material = EXCLUDED.focus_material,
        description = EXCLUDED.description,
        reminder_sent = EXCLUDED.reminder_sent,
        reminder_sent_at = EXCLUDED.reminder_sent_at,
        reminder_hours_before = EXCLUDED.reminder_hours_before;
  `;
  }

  // Sync attendances
  for (const a of data.attendances) {
    await sql`
      INSERT INTO attendances (id, schedule_id, member_id, status, notes, recorded_at)
      VALUES (${a.id}, ${a.scheduleId}, ${a.memberId}, ${a.status}, ${a.notes ?? null}, ${a.recordedAt})
      ON CONFLICT (id) DO UPDATE SET
        schedule_id = EXCLUDED.schedule_id,
        member_id = EXCLUDED.member_id,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        recorded_at = EXCLUDED.recorded_at;
    `;
  }

  // Sync dues
  for (const d of data.dues) {
    await sql`
      INSERT INTO monthly_dues (id, member_id, month, year, amount, is_paid, paid_at, payment_method, receipt_number, note)
      VALUES (${d.id}, ${d.memberId}, ${d.month}, ${d.year}, ${d.amount}, ${d.isPaid}, ${d.paidAt ?? null}, ${d.paymentMethod ?? null}, ${d.receiptNumber ?? null}, ${d.note ?? null})
      ON CONFLICT (id) DO UPDATE SET
        is_paid = EXCLUDED.is_paid,
        paid_at = EXCLUDED.paid_at,
        payment_method = EXCLUDED.payment_method,
        receipt_number = EXCLUDED.receipt_number,
        note = EXCLUDED.note;
    `;
  }

  // Sync transactions
  for (const t of data.transactions) {
    await sql`
      INSERT INTO transactions (id, type, category, amount, description, date, related_due_id, receipt_number, recorded_by)
      VALUES (${t.id}, ${t.type}, ${t.category}, ${t.amount}, ${t.description}, ${t.date}, ${t.relatedDueId ?? null}, ${t.receiptNumber ?? null}, ${t.recordedBy})
      ON CONFLICT (id) DO UPDATE SET
        type = EXCLUDED.type,
        category = EXCLUDED.category,
        amount = EXCLUDED.amount,
        description = EXCLUDED.description,
        date = EXCLUDED.date,
        related_due_id = EXCLUDED.related_due_id,
        receipt_number = EXCLUDED.receipt_number,
        recorded_by = EXCLUDED.recorded_by;
    `;
  }

  // Sync news
  for (const n of data.news) {
    await sql`
      INSERT INTO news (id, title, category, date, author, content, summary, location, is_pinned)
      VALUES (${n.id}, ${n.title}, ${n.category}, ${n.date}, ${n.author}, ${n.content}, ${n.summary}, ${n.location ?? null}, ${n.isPinned})
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        category = EXCLUDED.category,
        date = EXCLUDED.date,
        author = EXCLUDED.author,
        content = EXCLUDED.content,
        summary = EXCLUDED.summary,
        location = EXCLUDED.location,
        is_pinned = EXCLUDED.is_pinned;
    `;
  }
}
