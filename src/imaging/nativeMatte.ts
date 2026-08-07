/**
 * On-device background removal via native ML.
 *
 * - iOS 17+: Vision `VNGenerateForegroundInstanceMaskRequest` (general subject)
 * - iOS 16: bundled CoreML U2Netp
 * - Android: ML Kit Subject Segmentation
 *
 * Needs a development build (`expo-dev-client`). Expo Go has no native module,
 * so this returns null and the JavaScript matte takes over.
 */

import { File } from 'expo-file-system';

import { decodePng } from './codec';
import type { RgbaImage } from './studio';

const NATIVE_MAX_DIMENSION = 1024;

/**
 * Runs the native model and returns an RGBA cutout (transparent background).
 * Returns null when the native path is unavailable or fails, so the caller can
 * fall back to the JavaScript flood-fill matte.
 */
export async function tryNativeCutout(imageUri: string): Promise<RgbaImage | null> {
  try {
    // Dynamic import so Expo Go does not crash at startup when Nitro is missing.
    const { removeBgImage } = await import('rn-remove-image-bg');
    const resultUri = await removeBgImage(imageUri, {
      maxDimension: NATIVE_MAX_DIMENSION,
      format: 'PNG',
      useCache: false,
    });

    const file = new File(resultUri);
    if (!file.exists) return null;

    const cutout = decodePng(await file.bytes());
    try {
      file.delete();
    } catch {
      // Ignore cleanup failures.
    }

    if (!looksLikeACutout(cutout)) return null;
    return cutout;
  } catch {
    return null;
  }
}

/**
 * Rejects results that are basically opaque (model did nothing) or nearly
 * empty (model ate the garment).
 */
function looksLikeACutout(image: RgbaImage): boolean {
  const { data } = image;
  let transparent = 0;
  let opaque = 0;
  const pixels = data.length / 4;
  for (let i = 3; i < data.length; i += 16) {
    if (data[i] < 32) transparent++;
    else if (data[i] > 220) opaque++;
  }
  const sampled = Math.max(1, Math.ceil(pixels / 4));
  const clearShare = transparent / sampled;
  const solidShare = opaque / sampled;
  return clearShare > 0.04 && clearShare < 0.98 && solidShare > 0.02;
}
