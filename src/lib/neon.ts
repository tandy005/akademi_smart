import { neon, neonConfig } from '@neondatabase/serverless';

// Configure fetch for local SSL inspection if needed in development
if (process.env.NODE_ENV !== 'production' && process.env.NODE_TLS_REJECT_UNAUTHORIZED === undefined) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED || '';

export const sql = neon(connectionString);
