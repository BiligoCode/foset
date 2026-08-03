/**
 * Backups are a plain zip: one JSON manifest plus the processed images.
 *
 * The format is deliberately boring so a backup stays readable years later
 * without Foset. Unzip it anywhere and you have your photos and a JSON file.
 */

import { File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';
import type { SQLiteDatabase } from 'expo-sqlite';

import { clearDatabase } from '../db/database';
import type { ClothingItem, Outfit } from '../db/types';
import { deleteAllImages, readImage, writeImage } from '../imaging/photos';

const MANIFEST_NAME = 'foset.json';
const IMAGES_FOLDER = 'images';
const FORMAT = 'foset-backup';
const FORMAT_VERSION = 1;

type OutfitItemRow = {
  outfit_id: number;
  clothing_id: number;
  sort_order: number;
};

type Manifest = {
  format: string;
  version: number;
  exportedAt: string;
  clothes: ClothingItem[];
  outfits: Outfit[];
  outfitItems: OutfitItemRow[];
};

export type ExportResult = {
  fileName: string;
  itemCount: number;
  outfitCount: number;
};

export type ImportResult = {
  itemCount: number;
  outfitCount: number;
  /** Items whose image was missing from the archive. */
  missingImages: number;
};

export async function exportBackup(db: SQLiteDatabase): Promise<ExportResult | null> {
  const clothes = await db.getAllAsync<ClothingItem>('SELECT * FROM clothes ORDER BY id');
  const outfits = await db.getAllAsync<Outfit>('SELECT * FROM outfits ORDER BY id');
  const outfitItems = await db.getAllAsync<OutfitItemRow>(
    'SELECT outfit_id, clothing_id, sort_order FROM outfit_items ORDER BY outfit_id, sort_order'
  );

  const manifest: Manifest = {
    format: FORMAT,
    version: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    clothes,
    outfits,
    outfitItems,
  };

  const zip = new JSZip();
  zip.file(MANIFEST_NAME, JSON.stringify(manifest, null, 2));

  const images = zip.folder(IMAGES_FOLDER);
  for (const item of clothes) {
    const bytes = readImage(item.image_path);
    // JPEGs do not shrink further, so storing them uncompressed keeps export fast.
    if (bytes) images?.file(item.image_path, bytes, { compression: 'STORE' });
  }

  const archive = await zip.generateAsync({ type: 'uint8array' });
  const fileName = `foset-backup-${new Date().toISOString().slice(0, 10)}.zip`;
  const target = new File(Paths.cache, fileName);
  if (target.exists) target.delete();
  target.create();
  target.write(archive);

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error(`Sharing is unavailable. The backup is at ${target.uri}`);
  }
  await Sharing.shareAsync(target.uri, {
    mimeType: 'application/zip',
    dialogTitle: 'Save your Foset backup',
  });

  return { fileName, itemCount: clothes.length, outfitCount: outfits.length };
}

/**
 * Restores a backup, replacing everything currently stored.
 *
 * Replace rather than merge: a single-user wardrobe has no stable identity to
 * merge on, and silently ending up with two of every shirt is worse than an
 * import you can predict. Callers are expected to confirm with the user first.
 */
export async function importBackup(db: SQLiteDatabase): Promise<ImportResult | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['application/zip', 'application/octet-stream', '*/*'],
    copyToCacheDirectory: true,
  });
  if (picked.canceled || picked.assets.length === 0) return null;

  const archive = await new File(picked.assets[0].uri).bytes();
  const zip = await JSZip.loadAsync(archive);

  const manifestEntry = zip.file(MANIFEST_NAME);
  if (!manifestEntry) {
    throw new Error('That file is not a Foset backup: no foset.json inside.');
  }

  const manifest = JSON.parse(await manifestEntry.async('string')) as Manifest;
  if (manifest.format !== FORMAT) {
    throw new Error('That file is not a Foset backup.');
  }
  if (manifest.version > FORMAT_VERSION) {
    throw new Error('This backup was made by a newer version of Foset.');
  }

  deleteAllImages();

  let missingImages = 0;
  for (const item of manifest.clothes) {
    const entry = zip.file(`${IMAGES_FOLDER}/${item.image_path}`);
    if (entry) {
      writeImage(item.image_path, await entry.async('uint8array'));
    } else {
      // The row is still worth restoring. The card just shows no picture.
      missingImages++;
    }
  }

  // One transaction, so a failure part way through cannot leave half a wardrobe.
  await db.withExclusiveTransactionAsync(async (transaction) => {
    await clearDatabase(transaction);

    for (const item of manifest.clothes) {
      await transaction.runAsync(
        `INSERT INTO clothes
           (id, title, category, subcategory, brand, color_name, color_hex, notes, image_path, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.title,
          item.category,
          item.subcategory,
          item.brand,
          item.color_name,
          item.color_hex,
          item.notes,
          item.image_path,
          item.created_at,
          item.updated_at,
        ]
      );
    }

    for (const outfit of manifest.outfits) {
      await transaction.runAsync(
        'INSERT INTO outfits (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [outfit.id, outfit.name, outfit.created_at, outfit.updated_at]
      );
    }

    for (const link of manifest.outfitItems) {
      await transaction.runAsync(
        `INSERT OR IGNORE INTO outfit_items (outfit_id, clothing_id, sort_order)
         VALUES (?, ?, ?)`,
        [link.outfit_id, link.clothing_id, link.sort_order]
      );
    }
  });

  return {
    itemCount: manifest.clothes.length,
    outfitCount: manifest.outfits.length,
    missingImages,
  };
}
