import { File, Paths } from 'expo-file-system';

import type { ThemePreference } from '../theme';

const FILE_NAME = 'preferences.json';

type StoredPreferences = {
  theme?: ThemePreference;
  tipsSeen?: boolean;
};

function preferencesFile(): File {
  return new File(Paths.document, FILE_NAME);
}

async function readPreferences(): Promise<StoredPreferences> {
  const file = preferencesFile();
  if (!file.exists) return {};

  try {
    return JSON.parse(await file.text()) as StoredPreferences;
  } catch {
    // Corrupt or unreadable file. Start from an empty object.
    return {};
  }
}

function writePreferences(prefs: StoredPreferences): void {
  const file = preferencesFile();
  if (file.exists) file.delete();
  file.write(JSON.stringify(prefs));
}

export async function loadThemePreference(): Promise<ThemePreference> {
  const parsed = await readPreferences();
  if (parsed.theme === 'system' || parsed.theme === 'light' || parsed.theme === 'dark') {
    return parsed.theme;
  }
  return 'system';
}

export async function saveThemePreference(theme: ThemePreference): Promise<void> {
  const current = await readPreferences();
  writePreferences({ ...current, theme });
}

export async function loadTipsSeen(): Promise<boolean> {
  const parsed = await readPreferences();
  return parsed.tipsSeen === true;
}

export async function saveTipsSeen(): Promise<void> {
  const current = await readPreferences();
  writePreferences({ ...current, tipsSeen: true });
}
