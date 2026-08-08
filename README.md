# Foset

A digital wardrobe on your phone. Photograph a piece of clothing, get a clean product shot on white, file it by brand and colour, and group pieces into outfits.

No accounts, no server, no sync. Everything stays in SQLite and an images folder inside the app sandbox.

## Features

- Photograph or pick a clothing item
- On-device background removal, white studio finish, square crop
- Titles generated from type and colour (`hoodie black`, `denim blue`)
- Fixed taxonomy: top, bottom, outerwear, one-piece, accessory, footwear
- Brand, colour palette, optional notes
- Filterable clothes grid
- Outfits as a named list of items (add from either side)
- Zip backup export and import

Out of scope: accounts, cloud sync, search, sizes, AI styling, social features, web build.

## Privacy

No backend and no telemetry. Photos are processed on the device. Nothing is uploaded to a background-removal API.

On Android, Google Play Services may download the ML Kit subject model once (~10MB). That is a model download, not your photos. Processed images stay in the app private directory. The only way data leaves the phone is when you export a backup and choose where to send it.

## Tech stack


| Piece              | Choice                                                                  |
| ------------------ | ----------------------------------------------------------------------- |
| Framework          | Expo SDK 54, React Native 0.81, TypeScript                              |
| Navigation         | Expo Router (`app/`)                                                    |
| Database           | `expo-sqlite`                                                           |
| Files              | `expo-file-system`                                                      |
| Camera / library   | `expo-image-picker`                                                     |
| Imaging            | `expo-image-manipulator`, `jpeg-js`, `upng-js`                          |
| Background removal | `rn-remove-image-bg` (Vision / U2Netp / ML Kit), JS flood-fill fallback |
| Backup             | `jszip`                                                                 |


Native ML needs a **development build**. Expo Go only gets the weaker JavaScript fallback.

## Requirements

- Node.js 20+ and npm
- A phone or emulator (no web build)
- For local native builds: Xcode (macOS) and/or Android Studio
- For cloud builds: an [Expo](https://expo.dev) account
- iPhone device installs need an Apple Developer account
- Android native cutout needs Google Play Services



## Install

```sh
git clone https://github.com/BiligoCode/foset.git
cd foset
npm install
```

The repo includes an `.npmrc` with `legacy-peer-deps=true` so install survives a known peer mismatch around Expo Router's web deps.

## Run

Foset needs a custom binary for native background removal. Build once, then start Metro against that build.

### Development build with EAS

```sh
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --profile development --platform android
# or: --platform ios
```

When the build finishes, install from the EAS link / QR code, then:

```sh
npx expo start --dev-client
```

Open the Foset development build on the phone (not Expo Go) on the same network.

Other useful profiles:

```sh
# Produces APK (no Metro / not a dev client)
npx eas-cli build --profile preview --platform android

# Play Store build
npx eas-cli build --profile production --platform android
```

You can also install `eas-cli` globally (`npm install -g eas-cli`) and drop the `npx eas-cli` prefix.

### Local build

```sh
npx expo prebuild
npm run android    # Android SDK / emulator or USB debugging
npm run ios        # macOS + Xcode only
```



### Expo Go (limited)

```sh
npx expo start
```

Native ML is unavailable. Foset falls back to JavaScript flood fill. Stay on SDK 54 if you care about Expo Go on iPhone App Store builds.

### Platform notes

**Android**

- The `development` and `preview` profiles produce an APK (`eas.json`).
- First native cutout may download ~10MB once via Play Services. After that it is offline.
- Prefer an emulator image with Google Play.

**iOS**

- Physical device installs need an Apple Developer account.
- iOS 17+ uses Vision. iOS 16 uses a bundled U2Netp CoreML model (~4.5MB). No per-image network call.
- Simulator has no camera. Drag a photo into Photos and use *Choose photo*.



## Data and backup

Images live under `<app documents>/clothes/` as square JPEGs. The database is `foset.db`. Only file names are stored, never absolute paths (iOS sandbox paths change across updates).

Export produces `foset-backup-YYYY-MM-DD.zip` with `foset.json` and an `images/` folder. Import replaces the local wardrobe. It does not merge.

## Studio pipeline

Cutout runs in `src/imaging/nativeMatte.ts` via `[rn-remove-image-bg](https://www.npmjs.com/package/rn-remove-image-bg)`, then the white studio finish in `src/imaging/studio.ts` (composite, 900px square crop with padding, mild brightening). If native ML is missing or fails, a JavaScript border flood fill is used as a fallback.


| Platform | Model                                     |
| -------- | ----------------------------------------- |
| iOS 17+  | Apple Vision foreground mask              |
| iOS 16   | Bundled CoreML U2Netp                     |
| Android  | ML Kit Subject Segmentation (~10MB, once) |




## Project layout

```
app/                     screens (Expo Router)
  (tabs)/                Clothes and Outfits
  clothes/               add, view, edit, add-to-outfit
  outfits/               add, view, edit
  backup.tsx
src/
  components/            shared UI
  constants/             taxonomy and colour palette
  db/                    schema, migrations, queries
  imaging/               matte, studio finish, codecs, storage
  backup/                zip export and import
  theme.ts
eas.json                 EAS Build profiles
```



## Contributing

Issues and pull requests are welcome, especially around background removal.

```sh
npm run typecheck
npm run lint
```

Keep changes focused. No accounts, servers, or paid APIs. That constraint is the point of the project.

## License

[MIT](LICENSE).