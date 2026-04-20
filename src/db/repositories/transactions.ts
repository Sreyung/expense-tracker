import { getDb } from '@/db/database';
import { Transaction, TransactionInput, MonthlySummary } from '@/types';
import { generateId } from '@/utils/uuid';
import { monthRange } from '@/utils/dateHelpers';
import { getCategoryById } from './categories';
import { getPersonById } from './people';

async function attachRelations(
  db: Awaited<ReturnType<typeof getDb>>,
  rows: Transaction[]
): Promise<Transaction[]> {
  return Promise.all(
    rows.map(async (tx) => {
      const category = tx.category_id ? (await getCategoryById(tx.category_id)) ?? undefined : undefined;
      const peopleRows = await db.getAllAsync<{ person_id: string }>(
        'SELECT person_id FROM transaction_people WHERE transaction_id = ?',
        [tx.id]
      );
      const people = await Promise.all(
        peopleRows.map((r) => getPersonById(r.person_id))
      );
      return {
        ...tx,
        category,
        people: people.filter(Boolean) as Transaction['people'],
      };
    })
  );
}

export async function listByMonth(year: number, month: number): Promise<Transaction[]> {
  const db = await getDb();
  const { start, end } = monthRange(year, month);
  const rows = await db.getAllAsync<Transaction>(
    'SELECT * FROM transactions WHERE date >= ? AND date <= ? AND is_planned = 0 ORDER BY date DESC',
    [start, end]
  );
  return attachRelations(db, rows);
}

export async function getById(id: string): Promise<Transaction | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Transaction>('SELECT * FROM transactions WHERE id = ?', [id]);
  if (!row) return null;
  const [hydrated] = await attachRelations(db, [row]);
  return hydrated;
}

export async function insertTransaction(data: TransactionInput): Promise<Transaction> {
  const db = await getDb();
  const id = generateId();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO transactions
      (id, type, amount, date, description, category_id, event_id, is_planned,
       planned_due_date, recurrence_type, recurrence_end, source, raw_description,
       created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL, 0, NULL, 'none', NULL, ?, ?, ?, ?)`,
    [
      id, data.type, data.amount, data.date,
      data.description ?? null,
      data.category_id ?? null,
      data.source ?? 'manual',
      data.raw_description ?? null,
      now, now,
    ]
  );
  if (data.peopleIds?.length) {
    for (const pid of data.peopleIds) {
      await db.runAsync(
        'INSERT OR IGNORE INTO transaction_people (transaction_id, person_id) VALUES (?, ?)',
        [id, pid]
      );
    }
  }
  return (await getById(id))!;
}

export async function updateTransaction(
  id: string,
  data: Partial<TransactionInput>
): Promise<Transaction> {
  const db = await getDb();
  const now = Date.now();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.type !== undefined)        { fields.push('type = ?');        values.push(data.type); }
  if (data.amount !== undefined)      { fields.push('amount = ?');      values.push(data.amount); }
  if (data.date !== undefined)        { fields.push('date = ?');        values.push(data.date); }
  if ('description' in data)          { fields.push('description = ?'); values.push(data.description ?? null); }
  if ('category_id' in data)          { fields.push('category_id = ?'); values.push(data.category_id ?? null); }

  fields.push('updated_at = ?');
  values.push(now);
  values.push(id);

  await db.runAsync(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`, values);

  if (data.peopleIds !== undefined) {
    await db.runAsync('DELETE FROM transaction_people WHERE transaction_id = ?', [id]);
    for (const pid of data.peopleIds) {
      await db.runAsync(
        'INSERT OR IGNORE INTO transaction_people (transaction_id, person_id) VALUES (?, ?)',
        [id, pid]
      );
    }
  }
  return (await getById(id))!;
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

export async function sumByMonth(year: number, month: number): Promise<MonthlySummary> {
  const db = await getDb();
  const { start, end } = monthRange(year, month);
  const rows = await db.getAllAsync<{ type: string; total: number }>(
    `SELECT type, SUM(amount) as total FROM transactions
     WHERE date >= ? AND date <= ? AND is_planned = 0
     GROUP BY type`,
    [start, end]
  );
  const income = rows.find((r) => r.type === 'income')?.total ?? 0;
  const expense = rows.find((r) => r.type === 'expense')?.total ?? 0;
  return { income, expense, net: income - expense };
}

export async function bulkInsert(items: TransactionInput[]): Promise<void> {
  const db = await getDb();
  const now = Date.now();
  for (const data of items) {
    const id = generateId();
    await db.runAsync(
      `INSERT INTO transactions
        (id, type, amount, date, description, category_id, event_id, is_planned,
         planned_due_date, recurrence_type, recurrence_end, source, raw_description,
         created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL, 0, NULL, 'none', NULL, ?, ?, ?, ?)`,
      [
        id, data.type, data.amount, data.date,
        data.description ?? null,
        data.category_id ?? null,
        data.source ?? 'pdf_import',
        data.raw_description ?? null,
        now, now,
      ]
    );
  }
}
