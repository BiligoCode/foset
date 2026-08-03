/** The fixed clothing taxonomy. Titles are generated from it, so it is the one
 *  place to change if you want different categories. */

export const CATEGORIES = [
  'top',
  'bottom',
  'outerwear',
  'one-piece',
  'accessory',
  'footwear',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const SUBCATEGORIES: Record<Category, readonly string[]> = {
  top: ['tshirt', 'hoodie', 'sweater', 'pullover', 'cardigan', 'tank', 'blouse', 'short-sleeve'],
  bottom: [
    'denim',
    'sweatpants',
    'shorts',
    'bermuda',
    'pants',
    'maxi skirt',
    'mini skirt',
    'leggings',
  ],
  outerwear: ['puffer', 'jacket'],
  'one-piece': [],
  accessory: ['belt', 'scarf', 'hat'],
  footwear: ['running', 'sneakers', 'heels', 'open-toe', 'boots'],
};

export function hasSubcategories(category: Category): boolean {
  return SUBCATEGORIES[category].length > 0;
}

/**
 * Builds the display title. One-piece items have no subcategory, so they fall
 * back to the category name: "one-piece red", "hoodie black", "denim blue".
 */
export function buildTitle(
  category: Category,
  subcategory: string | null,
  colorName: string
): string {
  const noun = hasSubcategories(category) ? (subcategory ?? category) : category;
  return `${noun} ${colorName}`;
}
