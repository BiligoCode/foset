import type { Category } from '../constants/taxonomy';

/** A row of the `clothes` table. */
export type ClothingItem = {
  id: number;
  title: string;
  category: Category;
  /** Null only for one-piece items, which have no subcategory. */
  subcategory: string | null;
  brand: string;
  color_name: string;
  color_hex: string;
  notes: string | null;
  /**
   * File name inside the app's images directory, not a full path. iOS changes
   * the sandbox path between installs, so absolute URIs would go stale.
   */
  image_path: string;
  created_at: string;
  updated_at: string;
};

/** Everything needed to create or update a clothing item, minus generated fields. */
export type ClothingInput = {
  category: Category;
  subcategory: string | null;
  brand: string;
  color_name: string;
  color_hex: string;
  notes: string | null;
  image_path: string;
};

export type ClothingFilters = {
  category?: Category;
  subcategory?: string;
  brand?: string;
  colorName?: string;
};

export type Outfit = {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

/** An outfit plus the bits the list screen needs to render a row. */
export type OutfitSummary = Outfit & {
  itemCount: number;
  previewImages: string[];
};

export type OutfitDetail = Outfit & {
  items: ClothingItem[];
};
