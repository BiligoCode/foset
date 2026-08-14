import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { decodeJpeg, encodeJpeg } from './codec';
import { tryNativeCutout } from './nativeMatte';
import { createStudioShot } from './studio';

/** Processed photos live here, inside the app sandbox and outside the gallery. */
const IMAGES_DIRECTORY = 'clothes';

/**
 * Longest side before matte work. Native ML also downsamples (to ~1024), so this
 * mainly caps the JavaScript fallback path.
 */
const WORKING_SIZE = 720;

const OUTPUT_QUALITY = 88;

export type PickedPhoto = {
  uri: string;
  width: number;
  height: number;
};

export type ProcessedPhoto = {
  /** File name inside the images directory. */
  fileName: string;
  /** False when the background could not be removed cleanly. */
  backgroundRemoved: boolean;
  /** Which matte path produced the result. */
  method: 'native' | 'javascript' | 'none';
};

/** Thrown when the user has denied camera or photo library access. */
export class PermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}

let cachedDirectory: Directory | null = null;

/**
 * The images directory, created on first use. Cached because `imageUri` runs
 * for every card on screen and should not touch the filesystem each time.
 */
function imagesDirectory(): Directory {
  if (!cachedDirectory) {
    const directory = new Directory(Paths.document, IMAGES_DIRECTORY);
    directory.create({ intermediates: true, idempotent: true });
    cachedDirectory = directory;
  }
  return cachedDirectory;
}

/** Turns a stored file name into a URI an `<Image>` can load. */
export function imageUri(fileName: string): string {
  return new File(imagesDirectory(), fileName).uri;
}

export async function capturePhoto(): Promise<PickedPhoto | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new PermissionDeniedError(
      'Foset needs camera access to photograph an item. You can turn the camera on in Settings.'
    );
  }
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 1,
    exif: false,
  });
  return firstAsset(result);
}

export async function pickPhoto(): Promise<PickedPhoto | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new PermissionDeniedError(
      'Foset needs photo library access to pick an item. You can turn photos on in Settings.'
    );
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
    exif: false,
  });
  return firstAsset(result);
}

/**
 * Runs a picked photo through the studio pipeline and stores the result.
 *
 * Preferred path: native ML cutout, then white composite / crop / tone in JS.
 * Fallback: JavaScript flood-fill matte when the native module is missing
 * (Expo Go) or fails.
 */
export async function processAndStorePhoto(photo: PickedPhoto): Promise<ProcessedPhoto> {
  const context = ImageManipulator.manipulate(photo.uri);
  const longest = Math.max(photo.width, photo.height);
  if (longest > WORKING_SIZE) {
    const scale = WORKING_SIZE / longest;
    context.resize({
      width: Math.round(photo.width * scale),
      height: Math.round(photo.height * scale),
    });
  }

  const rendered = await context.renderAsync();
  const normalised = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 1 });

  // Native model first. It may download its Android weights once on first use.
  const nativeCutout = await tryNativeCutout(normalised.uri);
  const source = decodeJpeg(await new File(normalised.uri).bytes());
  const { image, backgroundRemoved, method } = createStudioShot(source, {}, nativeCutout);

  const fileName = `${Date.now()}-${randomSuffix()}.jpg`;
  writeImage(fileName, encodeJpeg(image, OUTPUT_QUALITY));

  new File(normalised.uri).delete();
  return { fileName, backgroundRemoved, method };
}

/** Six random characters, so two photos taken in the same millisecond differ. */
function randomSuffix(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return suffix;
}

/** Writes raw image bytes into the images directory, replacing any namesake. */
export function writeImage(fileName: string, bytes: Uint8Array): void {
  const file = new File(imagesDirectory(), fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(bytes);
}

export function readImage(fileName: string): Uint8Array | null {
  const file = new File(imagesDirectory(), fileName);
  return file.exists ? file.bytesSync() : null;
}

export function deleteImage(fileName: string): void {
  const file = new File(imagesDirectory(), fileName);
  if (file.exists) file.delete();
}

/** Removes every stored image. Used before a replacing backup import. */
export function deleteAllImages(): void {
  const directory = imagesDirectory();
  for (const entry of directory.list()) {
    if (entry instanceof File) entry.delete();
  }
}

function firstAsset(result: ImagePicker.ImagePickerResult): PickedPhoto | null {
  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, width: asset.width, height: asset.height };
}
