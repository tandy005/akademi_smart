import { neon, NeonQueryFunction } from '@neondatabase/serverless';

// Configure fetch for local SSL inspection if needed in development
if (process.env.NODE_ENV !== 'production' && process.env.NODE_TLS_REJECT_UNAUTHORIZED === undefined) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export function hasDatabaseUrl(): boolean {
  const url = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
  return typeof url === 'string' && url.trim().length > 0;
}

let cachedSql: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (cachedSql) return cachedSql;
  const connectionString = (process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED || '').trim();
  if (!connectionString) {
    throw new Error(
      'Database connection string is missing. Please configure DATABASE_URL in Vercel project Settings -> Environment Variables.'
    );
  }
  cachedSql = neon(connectionString);
  return cachedSql;
}

// Lazy proxy function to avoid eager neon('') initialization at module evaluation time
export const sql: NeonQueryFunction<false, false> = ((strings: TemplateStringsArray, ...values: any[]) => {
  const runner = getSql();
  return runner(strings, ...values);
}) as unknown as NeonQueryFunction<false, false>;
