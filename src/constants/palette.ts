/** Colours you can tag an item with. Names go straight into item titles, so
 *  keep them short and lowercase. */

export type PaletteColor = {
  name: string;
  hex: string;
};

export const PALETTE: readonly PaletteColor[] = [
  { name: 'black', hex: '#111111' },
  { name: 'charcoal', hex: '#3C4043' },
  { name: 'grey', hex: '#9AA0A6' },
  { name: 'silver', hex: '#C9CDD1' },
  { name: 'white', hex: '#FFFFFF' },
  { name: 'cream', hex: '#F3E9D2' },
  { name: 'beige', hex: '#D8C3A5' },
  { name: 'tan', hex: '#C89F7B' },
  { name: 'brown', hex: '#6F4E37' },
  { name: 'burgundy', hex: '#6D2029' },
  { name: 'red', hex: '#C0392B' },
  { name: 'coral', hex: '#F08080' },
  { name: 'pink', hex: '#F4A7C0' },
  { name: 'orange', hex: '#E1701A' },
  { name: 'mustard', hex: '#C9A227' },
  { name: 'yellow', hex: '#F4C542' },
  { name: 'olive', hex: '#6B7A3A' },
  { name: 'green', hex: '#2E7D46' },
  { name: 'mint', hex: '#A8E6CF' },
  { name: 'teal', hex: '#1F7A72' },
  { name: 'light blue', hex: '#A8CBEA' },
  { name: 'blue', hex: '#2F6FBA' },
  { name: 'navy', hex: '#1F3A63' },
  { name: 'lilac', hex: '#C4B7E8' },
  { name: 'purple', hex: '#6B4E9B' },
  { name: 'gold', hex: '#C9A83C' },
  { name: 'multicolour', hex: '#8E8E93' },
];

export function findColor(name: string): PaletteColor | undefined {
  return PALETTE.find((color) => color.name === name);
}

/** Joins colour names for the `color_name` column. Names never contain `|`. */
export function encodeColorNames(names: string[]): string {
  return names.join('|');
}

export function decodeColorNames(encoded: string): string[] {
  if (!encoded) return [];
  return encoded.split('|');
}

export function encodeColorHexes(hexes: string[]): string {
  return hexes.join('|');
}

export function decodeColorHexes(encoded: string): string[] {
  if (!encoded) return [];
  return encoded.split('|');
}

/** Rebuilds palette entries from the stored name/hex columns. */
export function colorsFromStored(names: string, hexes: string): PaletteColor[] {
  const decodedNames = decodeColorNames(names);
  const decodedHexes = decodeColorHexes(hexes);
  return decodedNames.map((name, index) => ({
    name,
    hex: decodedHexes[index] ?? findColor(name)?.hex ?? '#888888',
  }));
}
