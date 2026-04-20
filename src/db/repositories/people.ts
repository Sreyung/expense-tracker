import { getDb } from '@/db/database';
import { Person } from '@/types';
import { generateId } from '@/utils/uuid';

export async function listPeople(): Promise<Person[]> {
  const db = await getDb();
  return db.getAllAsync<Person>('SELECT * FROM people ORDER BY name');
}

export async function getPersonById(id: string): Promise<Person | null> {
  const db = await getDb();
  return db.getFirstAsync<Person>('SELECT * FROM people WHERE id = ?', [id]);
}

export async function insertPerson(data: {
  name: string;
  phone?: string | null;
  email?: string | null;
}): Promise<Person> {
  const db = await getDb();
  const id = generateId();
  const now = Date.now();
  await db.runAsync(
    'INSERT INTO people (id, name, phone, email, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, data.name, data.phone ?? null, data.email ?? null, now]
  );
  return (await getPersonById(id))!;
}

export async function updatePerson(
  id: string,
  data: Partial<Pick<Person, 'name' | 'phone' | 'email'>>
): Promise<Person> {
  const db = await getDb();
  const sets: string[] = [];
  const values: (string | null)[] = [];
  if (data.name !== undefined)  { sets.push('name = ?');  values.push(data.name); }
  if (data.phone !== undefined) { sets.push('phone = ?'); values.push(data.phone); }
  if (data.email !== undefined) { sets.push('email = ?'); values.push(data.email); }
  await db.runAsync(`UPDATE people SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
  return (await getPersonById(id))!;
}

export async function deletePerson(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM people WHERE id = ?', [id]);
}

export async function countTransactionsForPerson(id: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) as n FROM transaction_people WHERE person_id = ?',
    [id]
  );
  return row?.n ?? 0;
}
