import { SQLiteDatabase } from 'expo-sqlite';
import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { generateId } from '@/utils/uuid';

export async function v1_initial(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      type        TEXT NOT NULL CHECK(type IN ('income','expense','both')),
      color       TEXT NOT NULL DEFAULT '#9E9E9E',
      icon        TEXT NOT NULL DEFAULT 'circle',
      parent_id   TEXT REFERENCES categories(id) ON DELETE SET NULL,
      is_system   INTEGER NOT NULL DEFAULT 0,
      created_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS people (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      phone       TEXT,
      email       TEXT,
      created_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id               TEXT PRIMARY KEY,
      type             TEXT NOT NULL CHECK(type IN ('income','expense')),
      amount           REAL NOT NULL CHECK(amount > 0),
      date             INTEGER NOT NULL,
      description      TEXT,
      category_id      TEXT REFERENCES categories(id) ON DELETE SET NULL,
      event_id         TEXT,
      is_planned       INTEGER NOT NULL DEFAULT 0,
      planned_due_date INTEGER,
      recurrence_type  TEXT NOT NULL DEFAULT 'none'
                         CHECK(recurrence_type IN ('none','daily','weekly','monthly','yearly')),
      recurrence_end   INTEGER,
      source           TEXT NOT NULL DEFAULT 'manual'
                         CHECK(source IN ('manual','pdf_import','recurring')),
      raw_description  TEXT,
      created_at       INTEGER NOT NULL,
      updated_at       INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transaction_people (
      transaction_id  TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
      person_id       TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
      PRIMARY KEY (transaction_id, person_id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      type         TEXT NOT NULL,
      start_date   INTEGER,
      end_date     INTEGER,
      budget       REAL,
      description  TEXT,
      created_at   INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS allocations (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      amount       REAL NOT NULL,
      period       TEXT NOT NULL CHECK(period IN ('monthly','yearly')),
      category_id  TEXT REFERENCES categories(id) ON DELETE SET NULL,
      created_at   INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS savings_goals (
      id             TEXT PRIMARY KEY,
      name           TEXT NOT NULL,
      target_amount  REAL NOT NULL,
      current_amount REAL NOT NULL DEFAULT 0,
      target_date    INTEGER,
      created_at     INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date     ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_type     ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
  `);

  const now = Date.now();
  for (const cat of DEFAULT_CATEGORIES) {
    await db.runAsync(
      `INSERT OR IGNORE INTO categories (id, name, type, color, icon, parent_id, is_system, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [generateId(), cat.name, cat.type, cat.color, cat.icon, cat.parent_id, cat.is_system, now]
    );
  }
}
