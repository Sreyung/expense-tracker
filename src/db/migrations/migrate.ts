import { getDb } from '@/db/database';
import { v1_initial } from './v1_initial';

const MIGRATIONS = [
  { version: 1, up: v1_initial },
];

export async function runMigrations(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL
    );
  `);
  for (const m of MIGRATIONS) {
    const row = await db.getFirstAsync<{ version: number }>(
      'SELECT version FROM schema_migrations WHERE version = ?',
      [m.version]
    );
    if (!row) {
      await m.up(db);
      await db.runAsync(
        'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
        [m.version, Date.now()]
      );
    }
  }
}
