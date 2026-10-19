import fs from 'fs';
import { neon } from '@neondatabase/serverless';

const env = fs.readFileSync('.env.local', 'utf8');
let dbUrl = '';
for (const line of env.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.slice('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
  }
}

if (!dbUrl) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const sql = neon(dbUrl);

async function main() {
  console.log('🔄 Fetching members from Neon DB...');
  const members = await sql`SELECT id, registration_number, name FROM members ORDER BY id`;

  console.log(`Found ${members.length} members. Updating usernames to format: smart<nama>09...`);

  for (const m of members) {
    const cleanName = m.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const newUsername = `smart${cleanName}09`;
    
    // Update user record associated with this member
    await sql`
      UPDATE users 
      SET username = ${newUsername}
      WHERE id = ${'u-' + m.id} OR (member_id = ${m.id} AND id != 'u-atlet');
    `;
    console.log(`✅ Member: "${m.name}" (${m.id}) -> Username: "${newUsername}"`);
  }

  console.log('\n📋 Verifying updated users in Neon:');
  const allUsers = await sql`
    SELECT id, username, name, role, member_id 
    FROM users 
    WHERE role = 'MEMBER' 
    ORDER BY id;
  `;
  console.table(allUsers);
}

main().catch((err) => {
  console.error('❌ Error updating usernames:', err);
  process.exit(1);
});
