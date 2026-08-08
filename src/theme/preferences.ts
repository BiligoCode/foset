import { File, Paths } from 'expo-file-system';

import type { ThemePreference } from '../theme';

const FILE_NAME = 'preferences.json';

type StoredPreferences = {
  theme?: ThemePreference;
};

function preferencesFile(): File {
  return new File(Paths.document, FILE_NAME);
}

export async function loadThemePreference(): Promise<ThemePreference> {
  const file = preferencesFile();
  if (!file.exists) return 'system';

  try {
    const raw = await file.text();
    const parsed = JSON.parse(raw) as StoredPreferences;
    if (parsed.theme === 'system' || parsed.theme === 'light' || parsed.theme === 'dark') {
      return parsed.theme;
    }
  } catch {
    // Corrupt or unreadable file. Fall back to system.
  }

  return 'system';
}

export async function saveThemePreference(theme: ThemePreference): Promise<void> {
  const file = preferencesFile();
  const payload: StoredPreferences = { theme };
  if (file.exists) file.delete();
  file.write(JSON.stringify(payload));
}
