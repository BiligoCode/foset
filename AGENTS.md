# Notes for coding agents

Expo moves fast. Check the versioned docs at https://docs.expo.dev/versions/v54.0.0/ before
writing code against an Expo module, rather than relying on remembered APIs.

Project rules that are easy to break by accident:

- **Stay on SDK 54.** Expo Go on the iOS App Store has not shipped past 54. A newer SDK bundles
  fine but will not open on an iPhone.
- **No backend, no accounts, no paid APIs.** Everything runs on the device. This is the point of
  the project, not an oversight.
- **Native ML for background removal is intentional.** `rn-remove-image-bg` +
  `react-native-nitro-modules` need a **development build** (not Expo Go). The JavaScript flood
  fill in `src/imaging/studio.ts` remains as a fallback only. Do not remove the native path to
  “simplify” Expo Go support.
- **Store image file names, never absolute paths.** The app sandbox path changes between installs
  on iOS.
- The clothing taxonomy in `src/constants/taxonomy.ts` also drives generated titles.

Before committing:

```sh
npm run typecheck
npm run lint
```
