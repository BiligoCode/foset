# Notes for coding agents

Expo moves fast. Check the versioned docs at https://docs.expo.dev/versions/v54.0.0/ before
writing code against an Expo module, rather than relying on remembered APIs.

Project rules that are easy to break by accident:

- **Stay on SDK 54.** Expo Go on the iOS App Store has not shipped past 54. A newer SDK bundles
  fine but will not open on an iPhone. Upgrading means giving up iOS Expo Go.
- **No backend, no accounts, no paid APIs.** Everything runs on the device. This is the point of
  the project, not an oversight.
- **No custom native modules.** They would cost Expo Go support. If you think you need one, look
  for a JavaScript path first.
- **Store image file names, never absolute paths.** The app sandbox path changes between installs
  on iOS.
- The clothing taxonomy in `src/constants/taxonomy.ts` also drives generated titles.

Before committing:

```sh
npm run typecheck
npm run lint
```
