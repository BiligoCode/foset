import { Buffer } from 'buffer';
import * as jpeg from 'jpeg-js';

import type { RgbaImage } from './studio';

// jpeg-js reaches for a global `Buffer` when it encodes, which React Native
// does not provide. Installing the polyfill here keeps it next to the only
// code that needs it.
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer as unknown as typeof globalThis.Buffer;
}

export function decodeJpeg(bytes: Uint8Array): RgbaImage {
  // `useTArray` keeps the decoder off Buffer, which is the slower path here.
  const decoded = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true });
  return {
    data: decoded.data as Uint8Array,
    width: decoded.width,
    height: decoded.height,
  };
}

export function encodeJpeg(image: RgbaImage, quality: number): Uint8Array {
  const encoded = jpeg.encode(
    { data: image.data as unknown as Buffer, width: image.width, height: image.height },
    quality
  );
  return new Uint8Array(encoded.data);
}
