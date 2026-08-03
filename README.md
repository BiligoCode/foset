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

- Photos are processed on the device. No image is ever uploaded, and no paid background-removal
  service is involved.
- Processed images are written to the app's private directory, not to your camera roll.
- Clothing and outfit records live in a local SQLite file.
- The only way data leaves the phone is when you tap **Export backup** and choose where to send
  the zip yourself.

## Tech stack

| Piece | Choice |
| --- | --- |
| Framework | Expo SDK 57, React Native 0.86, TypeScript |
| Navigation | Expo Router (file based, in `app/`) |
| Database | `expo-sqlite` |
| Files | `expo-file-system` |
| Camera and library | `expo-image-picker` |
| Image decode and resize | `expo-image-manipulator` plus `jpeg-js` |
| Background removal | custom, in `src/imaging/studio.ts` |
| Backup archive | `jszip` |

There is no custom native module, which is what keeps Expo Go usable.

## Requirements

- **Node.js 20 or newer** and npm.
- **A phone or an emulator.** Foset does not run in a browser.
- For a simulator or emulator: **Xcode** (macOS only) or **Android Studio**.
- For running on your own phone, nothing beyond the **Expo Go** app.

## Install

```sh
git clone https://github.com/BiligoCode/foset.git
cd foset
npm install
```

The repo ships an `.npmrc` with `legacy-peer-deps=true`. Expo SDK 57 pins a `react` version that
is slightly older than the peer range `expo-router`'s web dependencies ask for. The mismatch does
not affect the app, and the flag keeps a clean `npm install` working.

## Run it

```sh
npm start
```

Metro starts and prints a QR code.

### On your own phone

Install **Expo Go** from the App Store or Play Store, then scan the QR code (Camera app on iOS,
the Expo Go app on Android). Expo Go is enough: every native module Foset uses ships inside it,
and the image processing is plain JavaScript.

If you would rather install Foset as a standalone app, build a development build with
[EAS](https://docs.expo.dev/develop/development-builds/introduction/):

```sh
npx eas-cli build --profile development --platform ios     # or android
```

You will need to add an EAS project first, and if you are forking this repo, change the app
identifier in `app.json` (`ios.bundleIdentifier` and `android.package`) to a namespace you own.

### On a simulator or emulator

```sh
npm run ios       # iOS Simulator, macOS only
npm run android   # Android emulator
```

Honest limits on simulators:

- The **iOS Simulator has no camera**. Use *Choose photo* instead, after dragging an image into the
  simulator's Photos app.
- The **Android emulator** offers a fake camera scene, which is fine for smoke testing but useless
  for real garments.
- Background removal behaves identically everywhere, because it runs in JavaScript rather than in
  a platform framework.

## Using Foset

**Add an item.** Tap `+` on the Clothes tab. Take or choose a photo and wait a couple of seconds
for the studio shot. Pick a category, a type, a brand and a colour. Notes are optional. The title
is generated for you and previewed at the bottom of the form.

**Filter.** The chips above the grid filter by category, type, brand and colour. They only offer
values you actually own. *Clear all* appears as soon as a filter is on.

**Create an outfit.** Go to the Outfits tab and tap `+`. Name it, tap the clothes you want, save.

**Add a clothing item to an outfit.** Open the item and tap *Add to an outfit*. Every outfit is
listed with a checkbox, and tapping one adds or removes the item straight away. The same screen
has a button to start a brand new outfit with that item already selected.

**Back up.** The circle button in the top left of either tab opens the backup screen.

### Photo tips

Background removal reads the edges of the photo to learn what the background looks like, so:

- Shoot the garment flat on a plain surface that contrasts with it.
- Keep the whole item inside the frame with a little space around it.
- Even lighting helps. Hard shadows on a busy background are the worst case.

If the garment and the surface are too close in colour, Foset says so and keeps the photo
uncropped rather than cutting the garment to pieces.

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

All of it is in `src/imaging/studio.ts`, roughly 400 lines of plain TypeScript over a pixel
buffer. No native module, no paid API, no model download. That is why it runs the same in Expo Go,
on a simulator and on a real phone.

1. `expo-image-manipulator` decodes the photo, fixes its orientation and scales the long side down
   to 720px. This is the one step that uses native code, and it is what keeps the rest fast.
2. `jpeg-js` turns the JPEG into an RGBA buffer.
3. A ring around the photo border is sampled, and k-means reduces it to four representative
   background colours.
4. A flood fill starts from the border and spreads inwards while pixels either resemble one of
   those colours or continue smoothly from the neighbour they spread from. The second rule is what
   follows lighting gradients and soft shadows. Starting from the border rather than matching
   colours globally means a garment that happens to share a shade with the wall keeps its
   interior.
5. The matte is cleaned up: a majority filter removes speckles, a small morphological closing
   bridges nicks where fabric shading matched the backdrop, and only the largest connected shape
   survives, since a garment is one object.
6. If the matte ends up scattered, nearly empty or nearly full, removal is treated as failed. The
   photo is then only cropped and toned, and the form tells you why.
7. The matte is eroded by a pixel to avoid a halo of half-background colour, then blurred to give
   a soft edge, and the garment is composited onto white.
8. The result is cropped to the garment, centred on a 900px square canvas with 8% padding and
   sampled bilinearly.
9. A mild tone curve finishes it: a gamma lift, a little contrast and a little saturation. Pure
   white maps to pure white, so the backdrop stays clean.

Tuning lives in `DEFAULT_STUDIO_OPTIONS` at the top of the file.

The trade-off is honest: this is a classical algorithm, not a segmentation model. It is excellent
on a plain, contrasting backdrop and it gives up gracefully when it cannot tell garment from
background. In exchange, you get no native module, no download and no cloud call.

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
  imaging/               the studio pipeline, the JPEG codec and photo storage
  backup/                zip export and import
  theme.ts
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
