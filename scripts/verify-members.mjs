import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

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

async function verify() {
  console.log('--- 1. Checking data/volleyball_db.json ---');
  const jsonPath = path.join(rootDir, 'data', 'volleyball_db.json');
  const localDb = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`JSON Members Count: ${localDb.members.length}`);
  console.table(localDb.members.map(m => ({
    No: m.id,
    Reg: m.registrationNumber,
    Nama: m.name,
    JK: m.gender,
    Umur: m.age,
    Kategori: m.category,
    NoWA: m.phone
  })));

  if (databaseUrl) {
    console.log('\n--- 2. Checking Neon Database ---');
    const sql = neon(databaseUrl);
    const dbMembers = await sql`
      SELECT id, registration_number, name, gender, birth_date, phone, category, status
      FROM members
      ORDER BY id ASC;
    `;
    console.log(`Neon Members Count: ${dbMembers.length}`);
    console.table(dbMembers.map(m => ({
      ID: m.id,
      Reg: m.registration_number,
      Nama: m.name,
      JK: m.gender,
      Kategori: m.category,
      NoWA: m.phone,
      Status: m.status
    })));

    const users = await sql`SELECT id, username, name, role FROM users ORDER BY role ASC, id ASC;`;
    console.log(`Neon Users Count: ${users.length}`);

    const dues = await sql`SELECT COUNT(*) as count FROM monthly_dues;`;
    console.log(`Neon Monthly Dues Count: ${dues[0].count}`);
  }
}

verify().catch(console.error);
