import type { SQLiteDatabase } from 'expo-sqlite';

import { timestamp } from './database';
import type { ClothingItem, Outfit, OutfitDetail, OutfitSummary } from './types';

/** How many thumbnails a list row shows. */
const PREVIEW_LIMIT = 4;

export async function listOutfits(db: SQLiteDatabase): Promise<OutfitSummary[]> {
  const outfits = await db.getAllAsync<Outfit>(
    'SELECT * FROM outfits ORDER BY created_at DESC, id DESC'
  );
  if (outfits.length === 0) return [];

  const previews = await db.getAllAsync<{ outfit_id: number; image_path: string }>(
    `SELECT oi.outfit_id, c.image_path
       FROM outfit_items oi
       JOIN clothes c ON c.id = oi.clothing_id
      ORDER BY oi.outfit_id, oi.sort_order, oi.clothing_id`
  );

  const grouped = new Map<number, string[]>();
  for (const row of previews) {
    const images = grouped.get(row.outfit_id) ?? [];
    images.push(row.image_path);
    grouped.set(row.outfit_id, images);
  }

  return outfits.map((outfit) => {
    const images = grouped.get(outfit.id) ?? [];
    return {
      ...outfit,
      itemCount: images.length,
      previewImages: images.slice(0, PREVIEW_LIMIT),
    };
  });
}

export async function getOutfit(db: SQLiteDatabase, id: number): Promise<OutfitDetail | null> {
  const outfit = await db.getFirstAsync<Outfit>('SELECT * FROM outfits WHERE id = ?', id);
  if (!outfit) return null;

  const items = await db.getAllAsync<ClothingItem>(
    `SELECT c.*
       FROM outfit_items oi
       JOIN clothes c ON c.id = oi.clothing_id
      WHERE oi.outfit_id = ?
      ORDER BY oi.sort_order, oi.clothing_id`,
    id
  );

  return { ...outfit, items };
}

export async function createOutfit(
  db: SQLiteDatabase,
  name: string,
  clothingIds: number[]
): Promise<number> {
  const now = timestamp();
  const result = await db.runAsync(
    'INSERT INTO outfits (name, created_at, updated_at) VALUES (?, ?, ?)',
    [name, now, now]
  );
  const outfitId = result.lastInsertRowId;
  await replaceOutfitItems(db, outfitId, clothingIds);
  return outfitId;
}

export async function updateOutfit(
  db: SQLiteDatabase,
  id: number,
  name: string,
  clothingIds: number[]
): Promise<void> {
  await db.runAsync('UPDATE outfits SET name = ?, updated_at = ? WHERE id = ?', [
    name,
    timestamp(),
    id,
  ]);
  await replaceOutfitItems(db, id, clothingIds);
}

export async function deleteOutfit(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM outfits WHERE id = ?', id);
}

/** Adds one item to an outfit. Re-adding an item already there is a no-op. */
export async function addClothingToOutfit(
  db: SQLiteDatabase,
  outfitId: number,
  clothingId: number
): Promise<void> {
  const next = await db.getFirstAsync<{ next: number }>(
    'SELECT COALESCE(MAX(sort_order) + 1, 0) AS next FROM outfit_items WHERE outfit_id = ?',
    outfitId
  );
  await db.runAsync(
    `INSERT OR IGNORE INTO outfit_items (outfit_id, clothing_id, sort_order)
     VALUES (?, ?, ?)`,
    [outfitId, clothingId, next?.next ?? 0]
  );
  await db.runAsync('UPDATE outfits SET updated_at = ? WHERE id = ?', [timestamp(), outfitId]);
}

export async function removeClothingFromOutfit(
  db: SQLiteDatabase,
  outfitId: number,
  clothingId: number
): Promise<void> {
  await db.runAsync('DELETE FROM outfit_items WHERE outfit_id = ? AND clothing_id = ?', [
    outfitId,
    clothingId,
  ]);
  await db.runAsync('UPDATE outfits SET updated_at = ? WHERE id = ?', [timestamp(), outfitId]);
}

/** Ids of the outfits a given item already belongs to. */
export async function listOutfitIdsForClothing(
  db: SQLiteDatabase,
  clothingId: number
): Promise<number[]> {
  const rows = await db.getAllAsync<{ outfit_id: number }>(
    'SELECT outfit_id FROM outfit_items WHERE clothing_id = ?',
    clothingId
  );
  return rows.map((row) => row.outfit_id);
}

async function replaceOutfitItems(
  db: SQLiteDatabase,
  outfitId: number,
  clothingIds: number[]
): Promise<void> {
  await db.runAsync('DELETE FROM outfit_items WHERE outfit_id = ?', outfitId);
  for (const [index, clothingId] of clothingIds.entries()) {
    await db.runAsync(
      'INSERT OR IGNORE INTO outfit_items (outfit_id, clothing_id, sort_order) VALUES (?, ?, ?)',
      [outfitId, clothingId, index]
    );
  }
}
