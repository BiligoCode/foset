import { spacing } from '../theme';

/**
 * Pixel width for one card in a two-column clothes grid.
 *
 * Percentage/`flex` widths are not enough: on Android, `aspectRatio` images
 * inside those cells often resolve to zero height, so the preview looks blank
 * whenever two cards share a row.
 */
export function twoColumnCardWidth(
  screenWidth: number,
  padding: number = spacing.lg,
  gap: number = spacing.md
): number {
  return Math.floor((screenWidth - padding * 2 - gap) / 2);
}
