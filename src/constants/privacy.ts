/** Public privacy policy copy. Keep PRIVACY.md in sync when you change this. */

export const PRIVACY_UPDATED = '14 August 2026';

export const PRIVACY_INTRO =
  'Foset is a digital wardrobe that runs on your phone. It does not create an account and it does not talk to a Foset server.';

export const PRIVACY_SECTIONS: { title: string; body: string }[] = [
  {
    title: 'What Foset uses',
    body: 'The camera, so you can photograph a piece of clothing. Your photo library, so you can pick a photo you already took. A file you choose, so you can import a backup zip.',
  },
  {
    title: 'What stays on the phone',
    body: 'Photos, clothes, outfits, and settings are stored in the app private storage. Processed images are not saved to your gallery.',
  },
  {
    title: 'Background removal',
    body: 'Cutouts run on the device. Foset does not upload your photos to a background-removal service. On Android, Google Play Services may download the Google ML Kit Subject Segmentation model once, about 10MB.',
  },
  {
    title: 'Backups',
    body: 'The only way your wardrobe leaves the phone is when you export a backup and choose where to send it. Import replaces what is on the phone with the file you pick.',
  },
  {
    title: 'What Foset does not collect',
    body: 'Foset does not collect analytics, crash reports, or advertising identifiers. There is no account and no cloud sync.',
  },
  {
    title: 'Contact',
    body: 'Questions about this project can go to https://github.com/BiligoCode/foset. The source code is open source on that page.',
  },
];
