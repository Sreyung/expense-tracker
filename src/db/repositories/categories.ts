import { getDb } from '@/db/database';
import { Category, CategoryType } from '@/types';
import { generateId } from '@/utils/uuid';

export async function listCategories(): Promise<Category[]> {
  const db = await getDb();
  return db.getAllAsync<Category>('SELECT * FROM categories ORDER BY type, name');
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const db = await getDb();
  return db.getFirstAsync<Category>('SELECT * FROM categories WHERE id = ?', [id]);
}

export async function insertCategory(data: {
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  parent_id?: string | null;
}): Promise<Category> {
  const db = await getDb();
  const id = generateId();
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO categories (id, name, type, color, icon, parent_id, is_system, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
    [id, data.name, data.type, data.color, data.icon, data.parent_id ?? null, now]
  );
  return (await getCategoryById(id))!;
}

export async function updateCategory(
  id: string,
  data: Partial<Pick<Category, 'name' | 'color' | 'icon' | 'type'>>
): Promise<Category> {
  const db = await getDb();
  const sets: string[] = [];
  const values: (string | null)[] = [];
  if (data.name !== undefined)  { sets.push('name = ?');  values.push(data.name); }
  if (data.color !== undefined) { sets.push('color = ?'); values.push(data.color); }
  if (data.icon !== undefined)  { sets.push('icon = ?');  values.push(data.icon); }
  if (data.type !== undefined)  { sets.push('type = ?');  values.push(data.type); }
  await db.runAsync(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
  return (await getCategoryById(id))!;
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM categories WHERE id = ? AND is_system = 0', [id]);
}

export async function countTransactionsForCategory(id: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) as n FROM transactions WHERE category_id = ?',
    [id]
  );
  return row?.n ?? 0;
}
