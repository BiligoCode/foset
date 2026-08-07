import type { SQLiteDatabase } from 'expo-sqlite';

import { colorsFromStored } from '../constants/palette';
import { timestamp } from './database';
import type { ClothingFilters, ClothingInput, ClothingItem } from './types';

export async function listClothes(
  db: SQLiteDatabase,
  filters: ClothingFilters = {}
): Promise<ClothingItem[]> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters.category) {
    conditions.push('category = ?');
    params.push(filters.category);
  }
  if (filters.subcategory) {
    conditions.push('subcategory = ?');
    params.push(filters.subcategory);
  }
  if (filters.brand) {
    conditions.push('brand = ?');
    params.push(filters.brand);
  }
  if (filters.colorName) {
    // Colour names are `|`-joined. Match a single name inside the list.
    conditions.push(`('|' || color_name || '|') LIKE ?`);
    params.push(`%|${filters.colorName}|%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return db.getAllAsync<ClothingItem>(
    `SELECT * FROM clothes ${where} ORDER BY created_at DESC, id DESC`,
    params
  );
}

/** Total wardrobe size, used to tell "nothing added yet" from "nothing matches". */
export async function countClothes(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>('SELECT COUNT(*) AS total FROM clothes');
  return row?.total ?? 0;
}

export async function getClothingItem(
  db: SQLiteDatabase,
  id: number
): Promise<ClothingItem | null> {
  return db.getFirstAsync<ClothingItem>('SELECT * FROM clothes WHERE id = ?', id);
}

export async function createClothingItem(
  db: SQLiteDatabase,
  input: ClothingInput
): Promise<number> {
  const now = timestamp();
  const result = await db.runAsync(
    `INSERT INTO clothes
       (title, category, subcategory, brand, color_name, color_hex, notes, image_path, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.title,
      input.category,
      input.subcategory,
      input.brand,
      input.color_name,
      input.color_hex,
      input.notes,
      input.image_path,
      now,
      now,
    ]
  );
  return result.lastInsertRowId;
}

export async function updateClothingItem(
  db: SQLiteDatabase,
  id: number,
  input: ClothingInput
): Promise<void> {
  await db.runAsync(
    `UPDATE clothes
        SET title = ?, category = ?, subcategory = ?, brand = ?, color_name = ?,
            color_hex = ?, notes = ?, image_path = ?, updated_at = ?
      WHERE id = ?`,
    [
      input.title,
      input.category,
      input.subcategory,
      input.brand,
      input.color_name,
      input.color_hex,
      input.notes,
      input.image_path,
      timestamp(),
      id,
    ]
  );
}

/** Removes the item and, thanks to the cascade, its place in any outfit. */
export async function deleteClothingItem(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM clothes WHERE id = ?', id);
}

export type FilterOptions = {
  categories: string[];
  subcategories: string[];
  brands: string[];
  colors: { name: string; hex: string }[];
};

/** Only the values actually present in the wardrobe, so filters never dead-end. */
export async function listFilterOptions(db: SQLiteDatabase): Promise<FilterOptions> {
  const [categories, subcategories, brands, colorRows] = await Promise.all([
    db.getAllAsync<{ category: string }>(
      'SELECT DISTINCT category FROM clothes ORDER BY category'
    ),
    db.getAllAsync<{ subcategory: string }>(
      'SELECT DISTINCT subcategory FROM clothes WHERE subcategory IS NOT NULL ORDER BY subcategory'
    ),
    db.getAllAsync<{ brand: string }>(
      `SELECT DISTINCT brand FROM clothes WHERE brand != '' ORDER BY brand`
    ),
    db.getAllAsync<{ color_name: string; color_hex: string }>(
      'SELECT color_name, color_hex FROM clothes'
    ),
  ]);

  const colorMap = new Map<string, string>();
  for (const row of colorRows) {
    for (const color of colorsFromStored(row.color_name, row.color_hex)) {
      colorMap.set(color.name, color.hex);
    }
  }
  const colors = [...colorMap.entries()]
    .map(([name, hex]) => ({ name, hex }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    categories: categories.map((row) => row.category),
    subcategories: subcategories.map((row) => row.subcategory),
    brands: brands.map((row) => row.brand),
    colors,
  };
}
