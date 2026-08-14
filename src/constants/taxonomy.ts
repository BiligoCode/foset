/** The fixed clothing taxonomy. Titles are generated from it, so it is the one
 *  place to change if you want different types. Every category includes `other`
 *  so an item can always be saved. */

export const CATEGORIES = [
  'top',
  'bottom',
  'outerwear',
  'one-piece',
  'accessory',
  'footwear',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const OTHER_TYPE = 'other';

export const SUBCATEGORIES: Record<Category, readonly string[]> = {
  top: [
    'tshirt',
    'hoodie',
    'sweater',
    'pullover',
    'cardigan',
    'tank',
    'blouse',
    'shirt',
    'short-sleeve',
    'long-sleeve',
    OTHER_TYPE,
  ],
  bottom: [
    'denim',
    'sweatpants',
    'shorts',
    'bermuda',
    'pants',
    'maxi skirt',
    'mini skirt',
    'leggings',
    OTHER_TYPE,
  ],
  outerwear: ['puffer', 'jacket', 'coat', 'blazer', 'raincoat', 'vest', OTHER_TYPE],
  'one-piece': ['dress', 'jumpsuit', 'romper', OTHER_TYPE],
  accessory: ['belt', 'scarf', 'hat', 'bag', 'jewelry', 'glasses', OTHER_TYPE],
  footwear: [
    'running',
    'sneakers',
    'heels',
    'open-toe',
    'boots',
    'sandals',
    'loafers',
    'slippers',
    OTHER_TYPE,
  ],
};

export function hasSubcategories(category: Category): boolean {
  return SUBCATEGORIES[category].length > 0;
}

/**
 * Builds the default display title. Colour first, then the type.
 * `other` falls back to the category so you get "black top", not "black other".
 */
export function buildTitle(
  category: Category,
  subcategory: string | null,
  colorName: string
): string {
  const noun =
    subcategory && subcategory !== OTHER_TYPE ? subcategory : category;
  return `${colorName} ${noun}`;
}
