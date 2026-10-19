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

async function main() {
  if (!databaseUrl) {
    console.log('No database URL');
    return;
  }
  const sql = neon(databaseUrl);
  await sql`DELETE FROM users WHERE role = 'COACH' OR username = 'coach' OR id = 'u-coach';`;
  console.log('✅ Removed coach from Neon users');
  const users = await sql`SELECT id, username, name, role FROM users ORDER BY role ASC, id ASC;`;
  console.log('Remaining users count:', users.length);
  console.table(users);
}

main().catch(console.error);
