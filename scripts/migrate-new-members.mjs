import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Read .env.local for DATABASE_URL
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

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Raw input from user:
// 1.Acin/P/15th/087860033144
// 2.SYAFIQ/L/10th/ 085648800377
// 3.Dzaki/L/14th/089616071684
// 4.Cllara/P/13/087721246555
// 5.Nindy/p/12th/082326937211
// 6.Shefty/P/12th/085850877879
// 7.Bram/L/13th/085607855184
// 8.Galih/L/10th/085645482731
// 9.Hana/P/12th/085743093968
// 10.zahra/P/13th/085604905523
// 11.Keke/P/11th/085715860922
// 12.Fajar/L/16th/081515437135
// 13.Alben/L/16th/081228235746
// 14.Toscano/L/16th/089519375696
// 15.Taufiq/L/16th/083131333873

const rawList = [
  { no: 1, name: 'Acin', rawGender: 'P', rawAge: '15th', rawPhone: '087860033144' },
  { no: 2, name: 'Syafiq', rawGender: 'L', rawAge: '10th', rawPhone: '085648800377' },
  { no: 3, name: 'Dzaki', rawGender: 'L', rawAge: '14th', rawPhone: '089616071684' },
  { no: 4, name: 'Cllara', rawGender: 'P', rawAge: '13', rawPhone: '087721246555' },
  { no: 5, name: 'Nindy', rawGender: 'p', rawAge: '12th', rawPhone: '082326937211' },
  { no: 6, name: 'Shefty', rawGender: 'P', rawAge: '12th', rawPhone: '085850877879' },
  { no: 7, name: 'Bram', rawGender: 'L', rawAge: '13th', rawPhone: '085607855184' },
  { no: 8, name: 'Galih', rawGender: 'L', rawAge: '10th', rawPhone: '085645482731' },
  { no: 9, name: 'Hana', rawGender: 'P', rawAge: '12th', rawPhone: '085743093968' },
  { no: 10, name: 'Zahra', rawGender: 'P', rawAge: '13th', rawPhone: '085604905523' },
  { no: 11, name: 'Keke', rawGender: 'P', rawAge: '11th', rawPhone: '085715860922' },
  { no: 12, name: 'Fajar', rawGender: 'L', rawAge: '16th', rawPhone: '081515437135' },
  { no: 13, name: 'Alben', rawGender: 'L', rawAge: '16th', rawPhone: '081228235746' },
  { no: 14, name: 'Toscano', rawGender: 'L', rawAge: '16th', rawPhone: '089519375696' },
  { no: 15, name: 'Taufiq', rawGender: 'L', rawAge: '16th', rawPhone: '083131333873' },
];

const currentYear = 2026;

function parseCategory(age) {
  if (age <= 12) return 'U-12';
  if (age <= 15) return 'U-15';
  if (age <= 18) return 'U-18';
  return 'Senior';
}

const newMembers = rawList.map((item) => {
  const age = parseInt(item.rawAge.replace(/\D/g, ''), 10);
  const gender = item.rawGender.toUpperCase() === 'L' ? 'Putra' : 'Putri';
  const birthYear = currentYear - age;
  const birthDate = `${birthYear}-01-01`;
  const category = parseCategory(age);
  const regNumber = `SMART-${currentYear}-${String(item.no).padStart(3, '0')}`;
  const phone = item.rawPhone.trim();

  return {
    id: `m-${item.no}`,
    registrationNumber: regNumber,
    name: item.name,
    age: age,
    gender: gender,
    birthDate: birthDate,
    phone: phone,
    parentPhone: phone,
    position: 'All-Round',
    category: category,
    status: 'Aktif',
    joinDate: `${currentYear}-01-10`,
    address: 'Sidoarjo',
    notes: 'Anggota Baru',
  };
});

console.log('Parsed Members:', JSON.stringify(newMembers, null, 2));

async function runMigration() {
  console.log('🏁 Starting migration for 15 members...');

  // 1. Update data/volleyball_db.json
  const jsonPath = path.join(rootDir, 'data', 'volleyball_db.json');
  let currentDb = {};
  if (fs.existsSync(jsonPath)) {
    currentDb = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }

  const monthlyDueAmount = currentDb.monthlyDueAmount || 75000;

  // Generate new dues for 15 members (months 1..12 for 2026)
  const newDues = [];
  for (const m of newMembers) {
    for (let month = 1; month <= 12; month++) {
      newDues.push({
        id: `due-${m.id}-${currentYear}-${month}`,
        memberId: m.id,
        month: month,
        year: currentYear,
        amount: monthlyDueAmount,
        isPaid: false,
      });
    }
  }

  // Remove transactions linked to old dues
  const cleanedTransactions = (currentDb.transactions || []).filter(
    (t) => !t.relatedDueId || t.relatedDueId.startsWith('due-m-')
  ).filter((t) => {
    // Keep general expenses or sponsorships, remove old mock due transactions
    if (t.category === 'Iuran Kas') {
      return false; // reset old due payments
    }
    return true;
  });

  const updatedDb = {
    ...currentDb,
    members: newMembers,
    dues: newDues,
    attendances: [], // reset old demo attendances
    transactions: cleanedTransactions,
    reminderLogs: [], // reset old reminder logs
  };

  fs.writeFileSync(jsonPath, JSON.stringify(updatedDb, null, 2), 'utf8');
  console.log('✅ Updated data/volleyball_db.json with 15 new members and reset old data!');

  // 2. If Neon database is available, migrate to Neon Postgres
  if (databaseUrl) {
    console.log('🚀 Connecting to Neon Postgres...');
    const sql = neon(databaseUrl);

    // Delete old data from member-dependent tables
    console.log('🗑️ Deleting old members and dependent records from Neon...');
    await sql`DELETE FROM reminder_logs;`;
    await sql`DELETE FROM attendances;`;
    await sql`DELETE FROM monthly_dues;`;
    await sql`DELETE FROM users WHERE role = 'MEMBER';`;
    await sql`DELETE FROM members;`;
    console.log('✅ Old members, attendances, dues, and athlete logins successfully deleted from Neon!');

    // Insert 15 new members
    console.log('📥 Inserting 15 new members into Neon...');
    for (const m of newMembers) {
      await sql`
        INSERT INTO members (
          id, registration_number, name, gender, birth_date,
          phone, parent_phone, position, category,
          status, join_date, address, notes
        ) VALUES (
          ${m.id}, ${m.registrationNumber}, ${m.name}, ${m.gender}, ${m.birthDate},
          ${m.phone}, ${m.parentPhone}, ${m.position}, ${m.category},
          ${m.status}, ${m.joinDate}, ${m.address}, ${m.notes}
        );
      `;
    }
    console.log('✅ 15 members successfully inserted into Neon!');

    // Insert new monthly dues
    console.log('💳 Inserting monthly dues for new members into Neon...');
    for (const d of newDues) {
      await sql`
        INSERT INTO monthly_dues (
          id, member_id, month, year, amount, is_paid
        ) VALUES (
          ${d.id}, ${d.memberId}, ${d.month}, ${d.year}, ${d.amount}, false
        );
      `;
    }
    console.log(`✅ ${newDues.length} monthly dues inserted into Neon!`);

    // Clean up old transactions of type 'Iuran Kas' in Neon
    await sql`DELETE FROM transactions WHERE category = 'Iuran Kas';`;

    // Seed Member logins in users table
    console.log('👤 Seeding user logins for new members...');
    const salt = await bcrypt.genSalt(10);
    const athletePassHash = await bcrypt.hash('atlet123', salt);

    // Demo athlete account linked to m-1 (Acin)
    await sql`
      INSERT INTO users (id, username, password_hash, name, role, member_id)
      VALUES ('u-atlet', 'atlet', ${athletePassHash}, ${newMembers[0].name + ' (Atlet)'}, 'MEMBER', ${newMembers[0].id})
      ON CONFLICT (username) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        member_id = EXCLUDED.member_id;
    `;

    for (const m of newMembers) {
      const username = m.registrationNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
      const userHash = await bcrypt.hash('atlet123', salt);
      await sql`
        INSERT INTO users (id, username, password_hash, name, role, member_id)
        VALUES (${'u-' + m.id}, ${username}, ${userHash}, ${m.name}, 'MEMBER', ${m.id})
        ON CONFLICT (username) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          name = EXCLUDED.name,
          member_id = EXCLUDED.member_id;
      `;
    }
    console.log('✅ User logins created for all 15 members (username=nomor registrasi, password="atlet123")!');
  }

  console.log('🎉 All 15 members successfully migrated and old data deleted!');
}

runMigration().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
