import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!_db) {
    _db = await SQLite.openDatabaseAsync('expense_tracker.db');
    await _db.execAsync('PRAGMA foreign_keys = ON;');
    await _db.execAsync('PRAGMA journal_mode = WAL;');
  }
  return _db;
}
