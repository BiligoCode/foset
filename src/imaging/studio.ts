/**
 * Turns an ordinary garment photo into a store-like product shot.
 *
 * The whole pipeline is plain TypeScript over an RGBA pixel buffer, so it runs
 * anywhere JavaScript runs: Expo Go, a dev build, a simulator or the browser.
 * Nothing here touches the filesystem or any native module.
 *
 * Steps: estimate the background from the photo border, flood fill it away,
 * soften the resulting matte, composite what is left onto pure white, then
 * crop square around the garment and apply a mild studio tone curve.
 */

export type RgbaImage = {
  data: Uint8Array;
  width: number;
  height: number;
};

export type StudioOptions = {
  /** Width and height of the square result, in pixels. */
  outputSize: number;
  /** Empty margin around the garment, as a fraction of the output size. */
  padding: number;
  /** How far a colour may drift from the background before it counts as garment. */
  tolerance: number;
  /** Midtone lift. Below 1 brightens. */
  gamma: number;
  /** Contrast multiplier around mid grey. */
  contrast: number;
  /** Saturation multiplier. */
  saturation: number;
};

export type StudioResult = {
  image: RgbaImage;
  /**
   * False when the background could not be told apart from the garment, in
   * which case the photo is only cropped, padded and toned.
   */
  backgroundRemoved: boolean;
};

export const DEFAULT_STUDIO_OPTIONS: StudioOptions = {
  outputSize: 900,
  padding: 0.08,
  tolerance: 34,
  gamma: 0.93,
  contrast: 1.07,
  saturation: 1.06,
};

/** Number of colours used to describe the background. */
const BACKGROUND_COLOURS = 4;
/** Border ring sampled to learn the background, as a fraction of the short side. */
const BORDER_RATIO = 0.035;
/** A matte covering less or more of the frame than this is treated as a failure. */
const MIN_SUBJECT_AREA = 0.015;
const MAX_SUBJECT_AREA = 0.97;
/**
 * Share of the matte that must belong to one connected shape. A garment is one
 * object, so a matte scattered into pieces means the flood fill could not tell
 * the two apart and ate into the garment.
 */
const MIN_LARGEST_SHARE = 0.6;

export function createStudioShot(
  source: RgbaImage,
  overrides: Partial<StudioOptions> = {}
): StudioResult {
  const options = { ...DEFAULT_STUDIO_OPTIONS, ...overrides };
  const { width, height } = source;

  let { alpha, backgroundRemoved } = buildSubjectMatte(source, options.tolerance);
  if (!backgroundRemoved) {
    alpha = new Uint8Array(width * height).fill(255);
  }

  const flattened = compositeOnWhite(source, alpha);
  const bounds = subjectBounds(alpha, width, height);
  const image = renderSquare(flattened, width, height, bounds, options);
  applyStudioTone(image, options);

  return { image, backgroundRemoved };
}

/* -------------------------------------------------------------------------- */
/* Matte                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Returns per-pixel subject opacity, 0 for background and 255 for garment.
 *
 * The background is described by a handful of colours sampled from the photo
 * border, then grown inwards with a flood fill. Growing from the border rather
 * than matching colours globally means a garment that happens to share a shade
 * with the wall behind it keeps its interior.
 */
function buildSubjectMatte(
  source: RgbaImage,
  tolerance: number
): { alpha: Uint8Array; backgroundRemoved: boolean } {
  const { data, width, height } = source;
  const palette = sampleBackgroundPalette(source);

  // A pixel joins the background either because it looks like one of the
  // sampled colours, or because it is a near-seamless continuation of the
  // neighbour it spread from. The second rule follows gradients and soft
  // shadows that drift away from the sampled colours.
  const globalLimit = tolerance * tolerance;
  const driftLimit = globalLimit * 4;
  const stepLimit = (tolerance * 0.4) ** 2;

  const isBackground = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const seed = (index: number) => {
    if (isBackground[index]) return;
    if (paletteDistance(data, index, palette) > globalLimit) return;
    isBackground[index] = 1;
    queue[tail++] = index;
  };

  for (let x = 0; x < width; x++) {
    seed(x);
    seed((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    seed(y * width);
    seed(y * width + width - 1);
  }

  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    const y = (index / width) | 0;

    const visit = (neighbour: number) => {
      if (isBackground[neighbour]) return;
      const global = paletteDistance(data, neighbour, palette);
      if (global > globalLimit) {
        if (global > driftLimit) return;
        if (pixelDistance(data, index, neighbour) > stepLimit) return;
      }
      isBackground[neighbour] = 1;
      queue[tail++] = neighbour;
    };

    if (x > 0) visit(index - 1);
    if (x < width - 1) visit(index + 1);
    if (y > 0) visit(index - width);
    if (y < height - 1) visit(index + width);
  }

  const subject = new Uint8Array(width * height);
  for (let i = 0; i < subject.length; i++) {
    subject[i] = isBackground[i] ? 0 : 255;
  }

  despeckle(subject, width, height);
  // Bridge the small nicks left where fabric shading happened to match the
  // backdrop, so a garment stays a single shape.
  close(subject, width, height, Math.max(2, Math.round(Math.min(width, height) * 0.008)));

  const share = keepLargestShape(subject, width, height);
  const coverage = averageCoverage(subject);
  if (share < MIN_LARGEST_SHARE || coverage < MIN_SUBJECT_AREA || coverage > MAX_SUBJECT_AREA) {
    return { alpha: subject, backgroundRemoved: false };
  }

  // Pulling the matte in by a pixel drops the ring of half-background colour
  // along the cut, which would otherwise show as a halo against the white.
  erode(subject, width, height);
  return { alpha: blur(subject, width, height, 1), backgroundRemoved: true };
}

/** Picks the dominant colours of the border ring using a few k-means passes. */
function sampleBackgroundPalette(source: RgbaImage): Int32Array {
  const { data, width, height } = source;
  const border = Math.max(2, Math.round(Math.min(width, height) * BORDER_RATIO));
  const samples: number[] = [];

  for (let y = 0; y < height; y++) {
    const vertical = y < border || y >= height - border;
    for (let x = 0; x < width; x++) {
      if (!vertical && x >= border && x < width - border) {
        x = width - border - 1;
        continue;
      }
      const offset = (y * width + x) * 4;
      samples.push(data[offset], data[offset + 1], data[offset + 2]);
    }
  }

  const count = samples.length / 3;
  const centres = new Int32Array(BACKGROUND_COLOURS * 3);
  for (let k = 0; k < BACKGROUND_COLOURS; k++) {
    const pick = Math.floor((count * (k + 0.5)) / BACKGROUND_COLOURS) * 3;
    centres[k * 3] = samples[pick];
    centres[k * 3 + 1] = samples[pick + 1];
    centres[k * 3 + 2] = samples[pick + 2];
  }

  const sums = new Float64Array(BACKGROUND_COLOURS * 3);
  const totals = new Int32Array(BACKGROUND_COLOURS);

  for (let pass = 0; pass < 6; pass++) {
    sums.fill(0);
    totals.fill(0);

    for (let i = 0; i < count; i++) {
      const r = samples[i * 3];
      const g = samples[i * 3 + 1];
      const b = samples[i * 3 + 2];
      let best = 0;
      let bestDistance = Infinity;
      for (let k = 0; k < BACKGROUND_COLOURS; k++) {
        const distance = weightedDistance(
          r - centres[k * 3],
          g - centres[k * 3 + 1],
          b - centres[k * 3 + 2]
        );
        if (distance < bestDistance) {
          bestDistance = distance;
          best = k;
        }
      }
      sums[best * 3] += r;
      sums[best * 3 + 1] += g;
      sums[best * 3 + 2] += b;
      totals[best]++;
    }

    for (let k = 0; k < BACKGROUND_COLOURS; k++) {
      if (totals[k] === 0) continue;
      centres[k * 3] = Math.round(sums[k * 3] / totals[k]);
      centres[k * 3 + 1] = Math.round(sums[k * 3 + 1] / totals[k]);
      centres[k * 3 + 2] = Math.round(sums[k * 3 + 2] / totals[k]);
    }
  }

  return centres;
}

function paletteDistance(data: Uint8Array, index: number, palette: Int32Array): number {
  const offset = index * 4;
  const r = data[offset];
  const g = data[offset + 1];
  const b = data[offset + 2];
  let best = Infinity;
  for (let k = 0; k < BACKGROUND_COLOURS; k++) {
    const distance = weightedDistance(
      r - palette[k * 3],
      g - palette[k * 3 + 1],
      b - palette[k * 3 + 2]
    );
    if (distance < best) best = distance;
  }
  return best;
}

function pixelDistance(data: Uint8Array, a: number, b: number): number {
  const oa = a * 4;
  const ob = b * 4;
  return weightedDistance(
    data[oa] - data[ob],
    data[oa + 1] - data[ob + 1],
    data[oa + 2] - data[ob + 2]
  );
}

/** Squared RGB distance, weighted to roughly match how the eye judges colour. */
function weightedDistance(dr: number, dg: number, db: number): number {
  return (dr * dr * 3 + dg * dg * 4 + db * db * 2) / 3;
}

/* -------------------------------------------------------------------------- */
/* Matte cleanup                                                              */
/* -------------------------------------------------------------------------- */

/** Two majority passes, which clears stray specks without eating thin details. */
function despeckle(mask: Uint8Array, width: number, height: number): void {
  const copy = new Uint8Array(mask.length);
  for (let pass = 0; pass < 2; pass++) {
    copy.set(mask);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const index = y * width + x;
        let neighbours = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            if (copy[index + dy * width + dx]) neighbours++;
          }
        }
        if (neighbours <= 2) mask[index] = 0;
        else if (neighbours >= 6) mask[index] = 255;
      }
    }
  }
}

/** Morphological closing: grow the shape, then shrink it back by the same amount. */
function close(mask: Uint8Array, width: number, height: number, radius: number): void {
  spread(mask, width, height, radius, true);
  spread(mask, width, height, radius, false);
}

/** Separable max (dilate) or min (erode) filter over a square window. */
function spread(
  mask: Uint8Array,
  width: number,
  height: number,
  radius: number,
  grow: boolean
): void {
  const hit = grow ? 255 : 0;
  const miss = grow ? 0 : 255;
  const pass = new Uint8Array(mask.length);

  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      let found = false;
      for (let d = -radius; d <= radius && !found; d++) {
        const sx = x + d;
        if (sx >= 0 && sx < width && mask[row + sx] === hit) found = true;
      }
      pass[row + x] = found ? hit : miss;
    }
  }

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let found = false;
      for (let d = -radius; d <= radius && !found; d++) {
        const sy = y + d;
        if (sy >= 0 && sy < height && pass[sy * width + x] === hit) found = true;
      }
      mask[y * width + x] = found ? hit : miss;
    }
  }
}

/**
 * Drops everything except the biggest connected shape and reports how much of
 * the original matte that shape held.
 */
function keepLargestShape(mask: Uint8Array, width: number, height: number): number {
  const labels = new Int32Array(mask.length).fill(-1);
  const queue = new Int32Array(mask.length);
  const sizes: number[] = [];
  let total = 0;

  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || labels[start] >= 0) continue;
    const label = sizes.length;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    labels[start] = label;
    let size = 0;

    while (head < tail) {
      const index = queue[head++];
      size++;
      const x = index % width;
      const y = (index / width) | 0;

      const visit = (neighbour: number) => {
        if (!mask[neighbour] || labels[neighbour] >= 0) return;
        labels[neighbour] = label;
        queue[tail++] = neighbour;
      };

      if (x > 0) visit(index - 1);
      if (x < width - 1) visit(index + 1);
      if (y > 0) visit(index - width);
      if (y < height - 1) visit(index + width);
    }

    sizes.push(size);
    total += size;
  }

  if (total === 0) return 0;

  let best = 0;
  for (let label = 1; label < sizes.length; label++) {
    if (sizes[label] > sizes[best]) best = label;
  }

  for (let i = 0; i < mask.length; i++) {
    if (mask[i] && labels[i] !== best) mask[i] = 0;
  }

  return sizes[best] / total;
}

function erode(mask: Uint8Array, width: number, height: number): void {
  const copy = new Uint8Array(mask);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      if (!copy[index]) continue;
      const edge =
        x === 0 ||
        y === 0 ||
        x === width - 1 ||
        y === height - 1 ||
        !copy[index - 1] ||
        !copy[index + 1] ||
        !copy[index - width] ||
        !copy[index + width];
      if (edge) mask[index] = 0;
    }
  }
}

/** Separable box blur, used to feather the hard matte into a soft alpha ramp. */
function blur(mask: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  const window = radius * 2 + 1;
  const horizontal = new Uint8Array(mask.length);
  const result = new Uint8Array(mask.length);

  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      let total = 0;
      for (let d = -radius; d <= radius; d++) {
        total += mask[row + clamp(x + d, 0, width - 1)];
      }
      horizontal[row + x] = (total / window) | 0;
    }
  }

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let total = 0;
      for (let d = -radius; d <= radius; d++) {
        total += horizontal[clamp(y + d, 0, height - 1) * width + x];
      }
      result[y * width + x] = (total / window) | 0;
    }
  }

  return result;
}

function averageCoverage(alpha: Uint8Array): number {
  let total = 0;
  for (let i = 0; i < alpha.length; i++) total += alpha[i];
  return total / (alpha.length * 255);
}

/* -------------------------------------------------------------------------- */
/* Composite, crop and tone                                                   */
/* -------------------------------------------------------------------------- */

/** Flattens the matted photo onto white, producing a plain RGB buffer. */
function compositeOnWhite(source: RgbaImage, alpha: Uint8Array): Uint8Array {
  const flattened = new Uint8Array(alpha.length * 3);
  for (let i = 0; i < alpha.length; i++) {
    const a = alpha[i] / 255;
    const from = i * 4;
    const to = i * 3;
    flattened[to] = source.data[from] * a + 255 * (1 - a);
    flattened[to + 1] = source.data[from + 1] * a + 255 * (1 - a);
    flattened[to + 2] = source.data[from + 2] * a + 255 * (1 - a);
  }
  return flattened;
}

type Bounds = { left: number; top: number; right: number; bottom: number };

function subjectBounds(alpha: Uint8Array, width: number, height: number): Bounds {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (alpha[y * width + x] < 128) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }

  if (right < 0) return { left: 0, top: 0, right: width - 1, bottom: height - 1 };
  return { left, top, right, bottom };
}

/**
 * Draws the garment centred on a square white canvas.
 *
 * The source is sampled bilinearly so the result stays smooth at any scale,
 * and anything outside the photo falls back to white rather than stretching
 * edge pixels.
 */
function renderSquare(
  flattened: Uint8Array,
  width: number,
  height: number,
  bounds: Bounds,
  options: StudioOptions
): RgbaImage {
  const size = options.outputSize;
  const output = new Uint8Array(size * size * 4);

  const subjectWidth = bounds.right - bounds.left + 1;
  const subjectHeight = bounds.bottom - bounds.top + 1;
  const usable = size * (1 - options.padding * 2);
  const scale = usable / Math.max(subjectWidth, subjectHeight);

  const centreX = (bounds.left + bounds.right + 1) / 2;
  const centreY = (bounds.top + bounds.bottom + 1) / 2;
  const originX = centreX - size / (2 * scale);
  const originY = centreY - size / (2 * scale);

  for (let y = 0; y < size; y++) {
    const sourceY = originY + (y + 0.5) / scale - 0.5;
    for (let x = 0; x < size; x++) {
      const sourceX = originX + (x + 0.5) / scale - 0.5;
      const target = (y * size + x) * 4;
      sampleBilinear(flattened, width, height, sourceX, sourceY, output, target);
      output[target + 3] = 255;
    }
  }

  return { data: output, width: size, height: size };
}

function sampleBilinear(
  flattened: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
  target: Uint8Array,
  offset: number
): void {
  if (x <= -1 || y <= -1 || x >= width || y >= height) {
    target[offset] = 255;
    target[offset + 1] = 255;
    target[offset + 2] = 255;
    return;
  }

  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, height - 1);
  const cx0 = clamp(x0, 0, width - 1);
  const cy0 = clamp(y0, 0, height - 1);

  const topLeft = (cy0 * width + cx0) * 3;
  const topRight = (cy0 * width + x1) * 3;
  const bottomLeft = (y1 * width + cx0) * 3;
  const bottomRight = (y1 * width + x1) * 3;

  for (let channel = 0; channel < 3; channel++) {
    const top =
      flattened[topLeft + channel] * (1 - fx) + flattened[topRight + channel] * fx;
    const bottom =
      flattened[bottomLeft + channel] * (1 - fx) + flattened[bottomRight + channel] * fx;
    target[offset + channel] = top * (1 - fy) + bottom * fy;
  }
}

/**
 * Mild studio look: lift the midtones, add a touch of contrast and saturation.
 * Pure white maps to pure white, so the backdrop stays clean.
 */
function applyStudioTone(image: RgbaImage, options: StudioOptions): void {
  const curve = new Uint8Array(256);
  for (let value = 0; value < 256; value++) {
    const lifted = 255 * Math.pow(value / 255, options.gamma);
    curve[value] = clamp(Math.round((lifted - 128) * options.contrast + 128), 0, 255);
  }

  const { data } = image;
  for (let i = 0; i < data.length; i += 4) {
    const r = curve[data[i]];
    const g = curve[data[i + 1]];
    const b = curve[data[i + 2]];
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    data[i] = clamp(Math.round(luma + (r - luma) * options.saturation), 0, 255);
    data[i + 1] = clamp(Math.round(luma + (g - luma) * options.saturation), 0, 255);
    data[i + 2] = clamp(Math.round(luma + (b - luma) * options.saturation), 0, 255);
  }
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
