import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'foset.db';

const SCHEMA_VERSION = 1;

/**
 * Creates the schema on first launch and steps it forward on later ones.
 * Runs from `SQLiteProvider`'s `onInit`, before any screen queries the database.
 */
export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  if (version >= SCHEMA_VERSION) return;

  if (version === 0) {
    await db.execAsync(`
      CREATE TABLE clothes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        subcategory TEXT,
        brand TEXT NOT NULL,
        color_name TEXT NOT NULL,
        color_hex TEXT NOT NULL,
        notes TEXT,
        image_path TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE outfits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE outfit_items (
        outfit_id INTEGER NOT NULL REFERENCES outfits (id) ON DELETE CASCADE,
        clothing_id INTEGER NOT NULL REFERENCES clothes (id) ON DELETE CASCADE,
        sort_order INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (outfit_id, clothing_id)
      );

      CREATE INDEX idx_clothes_category ON clothes (category);
      CREATE INDEX idx_outfit_items_clothing ON outfit_items (clothing_id);
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

/** Wipes every row. Used by a replacing backup import. */
export async function clearDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    DELETE FROM outfit_items;
    DELETE FROM outfits;
    DELETE FROM clothes;
  `);
}

export function timestamp(): string {
  return new Date().toISOString();
}

/** LIKE pattern for a substring match. Null when the query is empty. */
export function containsPattern(query: string): string | null {
  const trimmed = query.trim();
  if (!trimmed) return null;
  return `%${trimmed.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
}
