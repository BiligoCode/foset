# Foset

Foset is a digital wardrobe that lives on your phone. Photograph a piece of clothing, and Foset
turns the snapshot into a clean product shot on a white background, files it with a brand and a
colour, and lets you group pieces into outfits.

It is built for one person: no account, no server, no sync. Everything sits in a SQLite database
and an images folder inside the app's own storage.

<p>
  <img src="assets/icon.png" alt="Foset app icon" width="96">
</p>

## Features in v1

- **Photograph or pick** a clothing item, from the camera or your photo library.
- **Automatic studio shot**: the background is removed, the garment is placed on pure white,
  cropped square with padding and given a mild brightening pass. No drop shadow.
- **Generated titles.** You never type a name. A title is built from the type and colour, so you
  get `hoodie black`, `denim blue`, `one-piece red`.
- **A fixed taxonomy** of category and type: top, bottom, outerwear, one-piece, accessory and
  footwear, each with its own list of types.
- **Brand and colour** on every item, with colours picked from a palette that shows the name and a
  swatch.
- **Optional notes** per item.
- **Two-column grid** of clothes with filters on category, type, brand and colour, all clearable
  in one tap.
- **Outfits**: name an outfit, tick the clothes that belong to it, save. One outfit per row.
- **Add to an outfit from either side.** From an outfit you pick clothes. From a clothing item you
  can drop it into any existing outfit or start a new outfit around it.
- **Edit and delete** for both clothes and outfits.
- **Backup export and import** as a single zip holding your photos and a JSON file.

## Not included

Deliberately out of scope, so expectations are honest:

- No accounts, no sync between phones, no cloud storage, no push notifications.
- No search bar. Filters cover it.
- No size field.
- No drag-and-drop outfit collage. Outfits are a name plus a list of items.
- No AI styling suggestions, virtual try-on, weather, calendars or wishlists.
- No social features or sharing beyond exporting your own backup.
- No web build. Foset needs the camera, SQLite and the local filesystem, so it targets iOS and
  Android only.
- No dark theme yet.

## Privacy

Foset has no backend. There is nothing to sign up for and no telemetry.

- Photos are processed on the device. No image is ever uploaded to a background-removal API.
  On Android, Google Play Services may download the ML Kit subject model once (~10MB). That is a
  model download, not your photos.
- Processed images are written to the app's private directory, not to your camera roll.
- Clothing and outfit records live in a local SQLite file.
- The only way data leaves the phone is when you tap **Export backup** and choose where to send
  the zip yourself.

## Tech stack

| Piece | Choice |
| --- | --- |
| Framework | Expo SDK 54, React Native 0.81, TypeScript |
| Navigation | Expo Router (file based, in `app/`) |
| Database | `expo-sqlite` |
| Files | `expo-file-system` |
| Camera and library | `expo-image-picker` |
| Image decode and resize | `expo-image-manipulator`, `jpeg-js`, `upng-js` |
| Background removal | native ML via `rn-remove-image-bg` (Vision / U2Netp / ML Kit Subject Segmentation), with a JavaScript flood-fill fallback |
| Backup archive | `jszip` |

The ML cutout needs a **development build**. Expo Go does not include the native module.

## Requirements

- **Node.js 20 or newer** and npm.
- **A phone or an emulator.** Foset does not run in a browser.
- For local native builds: **Xcode** (macOS, for iOS) and/or **Android Studio**.
- For cloud builds: an [Expo](https://expo.dev) account and [EAS CLI](https://docs.expo.dev/build/setup/).
- **iPhone installs:** an Apple Developer account for installing on a real device.
- **Android installs:** Google Play Services on the phone (needed for ML Kit). Emulators without Play Store will not get the subject model.

## Install

```sh
git clone https://github.com/BiligoCode/foset.git
cd foset
npm install
```

The repo ships an `.npmrc` with `legacy-peer-deps=true` so a clean install survives a peer
mismatch between Expo's pinned `react` and some of `expo-router`'s web dependencies.

## Run it

Foset needs a **custom binary** for the ML background remover. Expo Go alone falls back to the
weaker JavaScript cutout.

### 1. Create a development build

**Option A: EAS (recommended if you do not want Android Studio / Xcode locally)**

```sh
npm install -g eas-cli
eas login
eas build:configure
eas build --profile development --platform android
eas build --profile development --platform ios
```

When the build finishes, EAS gives you an install link / QR code.

**Option B: local build on your machine**

```sh
npx expo prebuild
npm run android    # needs Android SDK / emulator or a USB phone with USB debugging
npm run ios        # macOS + Xcode only
```

### 2. Start Metro against that build

```sh
npx expo start --dev-client
```

Open the Foset development build on the phone (not Expo Go) and connect to the same network.

### Android notes

- The `development` EAS profile produces an **APK** (`eas.json`), which you can sideload.
- On first background removal, ML Kit may **download ~10MB once** over the network (Google Play
  Services). After that, cutouts are offline. This is not a paid API and no photo leaves the
  phone.
- Devices without Play Services cannot use the native path and fall back to the JavaScript matte.

### iPhone notes

- You need an **Apple Developer** account to install on a physical iPhone.
- Register the device, then install the development build from EAS or Xcode.
- iOS 17+ uses Apple's built-in Vision foreground mask. iOS 16 uses a bundled **U2Netp** CoreML
  model (~4.5MB) inside the app. No per-image network call.
- Without a Mac, use EAS cloud builds. Local `npm run ios` needs Xcode.

### Expo Go (limited)

```sh
npx expo start
```

Scanning with Expo Go still opens the app, but **native ML is unavailable**, so Foset uses the
JavaScript flood-fill fallback and shows a notice after processing. Stay on SDK 54 if you care
about Expo Go at all. Newer SDKs will not open in the App Store Expo Go on iPhone.

### Simulators / emulators

```sh
npm run ios       # iOS Simulator, macOS only (use development-simulator EAS profile if needed)
npm run android   # Android emulator with Google Play image preferred
```

- The **iOS Simulator has no camera**. Use *Choose photo* after dragging an image into Photos.
- Prefer an **Android emulator with Google Play**, or the ML Kit model will not download.

## Using Foset

**Add an item.** Tap `+` on the Clothes tab. Take or choose a photo and wait for the studio shot
(native ML is usually under a couple of seconds after the first Android model download). Pick a
category, a type, a brand and a colour. Notes are optional. The title is generated for you and
previewed at the bottom of the form.

**Filter.** The chips above the grid filter by category, type, brand and colour. They only offer
values you actually own. *Clear all* appears as soon as a filter is on.

**Create an outfit.** Go to the Outfits tab and tap `+`. Name it, tap the clothes you want, save.

**Add a clothing item to an outfit.** Open the item and tap *Add to an outfit*. Every outfit is
listed with a checkbox, and tapping one adds or removes the item straight away. The same screen
has a button to start a brand new outfit with that item already selected.

**Back up.** The circle button in the top left of either tab opens the backup screen.

### Photo tips

- Shoot the garment flat on a plain surface that contrasts with it.
- Keep the whole item inside the frame with a little space around it.
- Even lighting helps. Hard shadows on a busy background are still harder for any model.

If removal fails, Foset says so and keeps the photo cropped rather than mangling the garment.

## Where your data lives

Inside the app's private sandbox:

- **Images**: `<app documents>/clothes/<timestamp>-<random>.jpg`, one square JPEG per item.
- **Database**: `foset.db`, in the standard `expo-sqlite` location.

Only the file name is stored in the database, never a full path. iOS gives an app a different
sandbox path after some updates, so absolute URIs would go stale while file names keep working.

The schema is three tables:

```
clothes      id, title, category, subcategory, brand, color_name, color_hex,
             notes, image_path, created_at, updated_at
outfits      id, name, created_at, updated_at
outfit_items outfit_id, clothing_id, sort_order   (unique on the pair)
```

`outfit_items` cascades on delete, so removing a clothing item or an outfit cleans up the links.

Uninstalling the app deletes all of it. Export a backup first.

## Backup format

**Export** builds a zip named `foset-backup-YYYY-MM-DD.zip` and hands it to the system share
sheet, so you choose where it goes. Inside:

```
foset.json        every row from all three tables, plus a format version
images/           one JPEG per clothing item, stored uncompressed
```

Since the JSON is readable and the images are ordinary JPEGs, a backup is still useful even
without Foset installed.

**Import replaces, it does not merge.** Choosing a backup wipes the clothes, outfits and images on
the phone and restores exactly what the archive holds, ids included. Merging was rejected on
purpose: a single-user wardrobe has no stable identity to match on, so merging would quietly leave
you with two of every shirt. The app asks for confirmation before it touches anything.

If a photo referenced by the JSON is missing from the archive, the item is still restored and the
import reports how many images were missing.

## How the studio look is made

There is **no text prompt** and no chat model. The cutout models take pixels in and return a
subject mask. You cannot tell them “this is clothing.” They are general subject / foreground
segmenters, which is what you want for a hoodie on a bed.

### Preferred path: native ML cutout

Implemented in `src/imaging/nativeMatte.ts` via [`rn-remove-image-bg`](https://www.npmjs.com/package/rn-remove-image-bg):

| Platform | Model |
| --- | --- |
| iOS 17+ | Apple Vision foreground instance mask |
| iOS 16 | Bundled CoreML **U2Netp** (~4.5MB in the app) |
| Android | Google ML Kit **Subject Segmentation** (~10MB, downloaded once) |

Then the same studio finish always runs in `src/imaging/studio.ts`:

1. Composite the cutout onto **pure white** (no drop shadow).
2. Auto-crop / centre on a 900px square with 8% padding.
3. Mild brightening / contrast / saturation. Pure white stays white.

### Fallback path: JavaScript flood fill

If the native module is missing (Expo Go) or fails, Foset estimates the background from the photo
border and flood-fills it away in TypeScript. That path is weaker on messy real-world photos. It
is only a safety net.

### Privacy note on the Android model download

Android's first successful cutout may need network so ML Kit can fetch its subject model through
Google Play Services. Photos are not uploaded. After that download, processing stays on device.
iOS does not need that download for the cutout itself.

## Project layout

```
app/                     screens, one file per route (Expo Router)
  (tabs)/                Clothes and Outfits
  clothes/               add, view, edit, add-to-outfit
  outfits/               add, view, edit
  backup.tsx
src/
  components/            shared UI, including the clothing and outfit forms
  constants/             the clothing taxonomy and the colour palette
  db/                    schema, migrations and queries
  imaging/               native matte, studio finish, codecs, photo storage
  backup/                zip export and import
  theme.ts
eas.json                 EAS Build profiles (development APK, iOS device, simulator)
```

## Contributing

This is a small personal utility, so there is no roadmap and no obligation on anyone. Issues and
pull requests are welcome anyway, especially around the background removal, which has plenty of
room to improve.

Before opening a pull request:

```sh
npm run typecheck
npm run lint
```

Please keep changes focused, and keep the app free of accounts, servers and paid services. That
constraint is the point of the project.

## License

[MIT](LICENSE).
