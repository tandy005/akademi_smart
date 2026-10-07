import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Read .env.local
const envLocalPath = path.join(rootDir, '.env.local');
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATABASE_URL=')) {
      databaseUrl = trimmed.slice('DATABASE_URL='.length).replace(/^["']|["']$/g, '');
      break;
    }
  }
}

if (!databaseUrl) {
  console.error('DATABASE_URL not found in environment or .env.local');
  process.exit(1);
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const sql = neon(databaseUrl);

async function main() {
  console.log('🚀 Connecting to Neon PostgreSQL...');
  const timeRes = await sql`SELECT NOW() as current_time`;
  console.log('✅ Connected successfully! Server time:', timeRes[0].current_time);

  console.log('📦 Creating database tables on Neon...');

  // 1. Users table (for role-based login)
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(50) PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL, -- 'ADMIN', 'COACH', 'MEMBER'
      member_id VARCHAR(50),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // 2. Members table
  await sql`
    CREATE TABLE IF NOT EXISTS members (
      id VARCHAR(50) PRIMARY KEY,
      registration_number VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      gender VARCHAR(20) NOT NULL,
      birth_date VARCHAR(20) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      parent_phone VARCHAR(50) NOT NULL,
      position VARCHAR(50) NOT NULL,
      category VARCHAR(50) NOT NULL,
      jersey_number INT,
      height_cm INT,
      weight_kg INT,
      status VARCHAR(20) NOT NULL,
      join_date VARCHAR(20) NOT NULL,
      address TEXT,
      notes TEXT
    );
  `;

  // 3. Training schedules
  await sql`
    CREATE TABLE IF NOT EXISTS schedules (
      id VARCHAR(50) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(50) NOT NULL,
      date VARCHAR(20) NOT NULL,
      start_time VARCHAR(10) NOT NULL,
      end_time VARCHAR(10) NOT NULL,
      location VARCHAR(255) NOT NULL,
      coach_name VARCHAR(255) NOT NULL,
      focus_material TEXT NOT NULL,
      description TEXT,
      reminder_sent BOOLEAN DEFAULT FALSE,
      reminder_sent_at VARCHAR(50),
      reminder_hours_before INT DEFAULT 4
    );
  `;

  // 4. Attendances
  await sql`
    CREATE TABLE IF NOT EXISTS attendances (
      id VARCHAR(50) PRIMARY KEY,
      schedule_id VARCHAR(50) NOT NULL,
      member_id VARCHAR(50) NOT NULL,
      status VARCHAR(20) NOT NULL,
      notes TEXT,
      recorded_at VARCHAR(50) NOT NULL
    );
  `;

  // 5. Monthly dues
  await sql`
    CREATE TABLE IF NOT EXISTS monthly_dues (
      id VARCHAR(100) PRIMARY KEY,
      member_id VARCHAR(50) NOT NULL,
      month INT NOT NULL,
      year INT NOT NULL,
      amount INT NOT NULL,
      is_paid BOOLEAN DEFAULT FALSE,
      paid_at VARCHAR(50),
      payment_method VARCHAR(50),
      receipt_number VARCHAR(50),
      note TEXT
    );
  `;

  // 6. Cash transactions
  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(100) PRIMARY KEY,
      type VARCHAR(20) NOT NULL,
      category VARCHAR(100) NOT NULL,
      amount INT NOT NULL,
      description TEXT NOT NULL,
      date VARCHAR(20) NOT NULL,
      related_due_id VARCHAR(100),
      receipt_number VARCHAR(50),
      recorded_by VARCHAR(100) NOT NULL
    );
  `;

  // 7. News & Agendas
  await sql`
    CREATE TABLE IF NOT EXISTS news (
      id VARCHAR(50) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(50) NOT NULL,
      date VARCHAR(20) NOT NULL,
      author VARCHAR(100) NOT NULL,
      content TEXT NOT NULL,
      summary TEXT NOT NULL,
      location VARCHAR(255),
      is_pinned BOOLEAN DEFAULT FALSE
    );
  `;

  // 8. WhatsApp Config
  await sql`
    CREATE TABLE IF NOT EXISTS whatsapp_config (
      id INT PRIMARY KEY DEFAULT 1,
      provider VARCHAR(50) NOT NULL,
      api_key TEXT,
      sender_number VARCHAR(50),
      webhook_url TEXT,
      auto_reminder_enabled BOOLEAN DEFAULT TRUE,
      reminder_hours_before INT DEFAULT 4,
      message_template TEXT NOT NULL
    );
  `;

  // 9. Reminder Logs
  await sql`
    CREATE TABLE IF NOT EXISTS reminder_logs (
      id VARCHAR(50) PRIMARY KEY,
      schedule_id VARCHAR(50) NOT NULL,
      schedule_title VARCHAR(255) NOT NULL,
      member_id VARCHAR(50),
      recipient_name VARCHAR(255) NOT NULL,
      recipient_phone VARCHAR(50) NOT NULL,
      target_type VARCHAR(20) NOT NULL,
      message TEXT NOT NULL,
      status VARCHAR(20) NOT NULL,
      timestamp VARCHAR(50) NOT NULL,
      error_detail TEXT
    );
  `;

  // 10. App Settings
  await sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      id INT PRIMARY KEY DEFAULT 1,
      academy_name VARCHAR(255) NOT NULL,
      monthly_due_amount INT NOT NULL
    );
  `;

  console.log('✅ Tables created successfully!');

  // Migrate existing data from volleyball_db.json
  const jsonPath = path.join(rootDir, 'data', 'volleyball_db.json');
  if (fs.existsSync(jsonPath)) {
    console.log('🔄 Migrating data from data/volleyball_db.json to Neon...');
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(raw);

    // App settings
    await sql`
      INSERT INTO app_settings (id, academy_name, monthly_due_amount)
      VALUES (1, ${data.academyName || 'Akademi Smart'}, ${data.monthlyDueAmount || 75000})
      ON CONFLICT (id) DO UPDATE SET
        academy_name = EXCLUDED.academy_name,
        monthly_due_amount = EXCLUDED.monthly_due_amount;
    `;

    // WhatsApp config
    if (data.whatsappConfig) {
      const wc = data.whatsappConfig;
      await sql`
        INSERT INTO whatsapp_config (id, provider, api_key, sender_number, webhook_url, auto_reminder_enabled, reminder_hours_before, message_template)
        VALUES (1, ${wc.provider || 'SIMULATOR'}, ${wc.apiKey || ''}, ${wc.senderNumber || ''}, ${wc.webhookUrl || ''}, ${wc.autoReminderEnabled ?? true}, ${wc.reminderHoursBefore || 4}, ${wc.messageTemplate || ''})
        ON CONFLICT (id) DO UPDATE SET
          provider = EXCLUDED.provider,
          api_key = EXCLUDED.api_key,
          sender_number = EXCLUDED.sender_number,
          webhook_url = EXCLUDED.webhook_url,
          auto_reminder_enabled = EXCLUDED.auto_reminder_enabled,
          reminder_hours_before = EXCLUDED.reminder_hours_before,
          message_template = EXCLUDED.message_template;
      `;
    }

    // Members
    if (Array.isArray(data.members)) {
      for (const m of data.members) {
        await sql`
          INSERT INTO members (id, registration_number, name, gender, birth_date, phone, parent_phone, position, category, jersey_number, height_cm, weight_kg, status, join_date, address, notes)
          VALUES (${m.id}, ${m.registrationNumber}, ${m.name}, ${m.gender}, ${m.birthDate}, ${m.phone}, ${m.parentPhone}, ${m.position}, ${m.category}, ${m.jerseyNumber || null}, ${m.heightCm || null}, ${m.weightKg || null}, ${m.status}, ${m.joinDate}, ${m.address || null}, ${m.notes || null})
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
      console.log(`✅ Migrated ${data.members.length} members`);
    }

    // Schedules
    if (Array.isArray(data.schedules)) {
      for (const s of data.schedules) {
        await sql`
          INSERT INTO schedules (id, title, category, date, start_time, end_time, location, coach_name, focus_material, description, reminder_sent, reminder_sent_at, reminder_hours_before)
          VALUES (${s.id}, ${s.title}, ${s.category}, ${s.date}, ${s.startTime}, ${s.endTime}, ${s.location}, ${s.coachName}, ${s.focusMaterial}, ${s.description || null}, ${s.reminderSent ?? false}, ${s.reminderSentAt || null}, ${s.reminderHoursBefore || 4})
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
      console.log(`✅ Migrated ${data.schedules.length} schedules`);
    }

    // Attendances
    if (Array.isArray(data.attendances)) {
      for (const a of data.attendances) {
        await sql`
          INSERT INTO attendances (id, schedule_id, member_id, status, notes, recorded_at)
          VALUES (${a.id}, ${a.scheduleId}, ${a.memberId}, ${a.status}, ${a.notes || null}, ${a.recordedAt})
          ON CONFLICT (id) DO UPDATE SET
            schedule_id = EXCLUDED.schedule_id,
            member_id = EXCLUDED.member_id,
            status = EXCLUDED.status,
            notes = EXCLUDED.notes,
            recorded_at = EXCLUDED.recorded_at;
        `;
      }
      console.log(`✅ Migrated ${data.attendances.length} attendances`);
    }

    // Monthly dues
    if (Array.isArray(data.dues)) {
      for (const d of data.dues) {
        await sql`
          INSERT INTO monthly_dues (id, member_id, month, year, amount, is_paid, paid_at, payment_method, receipt_number, note)
          VALUES (${d.id}, ${d.memberId}, ${d.month}, ${d.year}, ${d.amount}, ${d.isPaid ?? false}, ${d.paidAt || null}, ${d.paymentMethod || null}, ${d.receiptNumber || null}, ${d.note || null})
          ON CONFLICT (id) DO UPDATE SET
            member_id = EXCLUDED.member_id,
            month = EXCLUDED.month,
            year = EXCLUDED.year,
            amount = EXCLUDED.amount,
            is_paid = EXCLUDED.is_paid,
            paid_at = EXCLUDED.paid_at,
            payment_method = EXCLUDED.payment_method,
            receipt_number = EXCLUDED.receipt_number,
            note = EXCLUDED.note;
        `;
      }
      console.log(`✅ Migrated ${data.dues.length} monthly dues`);
    }

    // Transactions
    if (Array.isArray(data.transactions)) {
      for (const t of data.transactions) {
        await sql`
          INSERT INTO transactions (id, type, category, amount, description, date, related_due_id, receipt_number, recorded_by)
          VALUES (${t.id}, ${t.type}, ${t.category}, ${t.amount}, ${t.description}, ${t.date}, ${t.relatedDueId || null}, ${t.receiptNumber || null}, ${t.recordedBy})
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
      console.log(`✅ Migrated ${data.transactions.length} transactions`);
    }

    // News
    if (Array.isArray(data.news)) {
      for (const n of data.news) {
        await sql`
          INSERT INTO news (id, title, category, date, author, content, summary, location, is_pinned)
          VALUES (${n.id}, ${n.title}, ${n.category}, ${n.date}, ${n.author}, ${n.content}, ${n.summary}, ${n.location || null}, ${n.isPinned ?? false})
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
      console.log(`✅ Migrated ${data.news.length} news items`);
    }

    // Reminder logs
    if (Array.isArray(data.reminderLogs)) {
      for (const r of data.reminderLogs) {
        await sql`
          INSERT INTO reminder_logs (id, schedule_id, schedule_title, member_id, recipient_name, recipient_phone, target_type, message, status, timestamp, error_detail)
          VALUES (${r.id}, ${r.scheduleId}, ${r.scheduleTitle}, ${r.memberId || null}, ${r.recipientName}, ${r.recipientPhone}, ${r.targetType}, ${r.message}, ${r.status}, ${r.timestamp}, ${r.errorDetail || null})
          ON CONFLICT (id) DO NOTHING;
        `;
      }
    }
  }

  // Seed default Users for role-based login
  console.log('👤 Seeding default users for roles...');
  const salt = await bcrypt.genSalt(10);
  
  const adminPassHash = await bcrypt.hash('admin123', salt);
  const coachPassHash = await bcrypt.hash('coach123', salt);
  const athletePassHash = await bcrypt.hash('atlet123', salt);

  // 1. Admin
  await sql`
    INSERT INTO users (id, username, password_hash, name, role, member_id)
    VALUES ('u-admin', 'admin', ${adminPassHash}, 'Administrator Garuda Muda', 'ADMIN', NULL)
    ON CONFLICT (username) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      name = EXCLUDED.name,
      role = EXCLUDED.role;
  `;

  // 2. Coach
  await sql`
    INSERT INTO users (id, username, password_hash, name, role, member_id)
    VALUES ('u-coach', 'coach', ${coachPassHash}, 'Coach Bambang Supriyanto', 'COACH', NULL)
    ON CONFLICT (username) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      name = EXCLUDED.name,
      role = EXCLUDED.role;
  `;

  // 3. Demo Athlete: atlet / atlet123 (m-1)
  await sql`
    INSERT INTO users (id, username, password_hash, name, role, member_id)
    VALUES ('u-atlet', 'atlet', ${athletePassHash}, 'Rivan Nurmulya (Atlet)', 'MEMBER', 'm-1')
    ON CONFLICT (username) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      member_id = EXCLUDED.member_id;
  `;

  // Also create member login for members using registration number
  const members = await sql`SELECT id, registration_number, name FROM members`;
  for (const m of members) {
    const username = m.registration_number.toLowerCase().replace(/[^a-z0-9]/g, '');
    const userHash = await bcrypt.hash('atlet123', salt);
    await sql`
      INSERT INTO users (id, username, password_hash, name, role, member_id)
      VALUES (${'u-' + m.id}, ${username}, ${userHash}, ${m.name}, 'MEMBER', ${m.id})
      ON CONFLICT (username) DO NOTHING;
    `;
  }

  console.log('✅ Users successfully seeded:');
  console.log('   - ADMIN  : username="admin", password="admin123"');
  console.log('   - COACH  : username="coach", password="coach123"');
  console.log('   - MEMBER : username="atlet" (atau no registrasi), password="atlet123"');
  console.log('🎉 Neon database initialization completed!');
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
