import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { exportBackup, importBackup } from '../src/backup/backup';
import { Button } from '../src/components/Button';
import { useTheme } from '../src/theme/ThemeProvider';
import { radius, spacing, typography, type ThemeColors, type ThemePreference } from '../src/theme';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { colors, preference, setPreference } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  const runExport = async () => {
    setBusy('export');
    try {
      await exportBackup(db);
    } catch (error) {
      Alert.alert('Export failed', messageOf(error));
    } finally {
      setBusy(null);
    }
  };

  const runImport = () => {
    Alert.alert(
      'Replace everything?',
      'Importing wipes the clothes and outfits on this phone and restores what is in the backup file.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Choose a file', style: 'destructive', onPress: pickAndImport },
      ]
    );
  };

  const pickAndImport = async () => {
    setBusy('import');
    try {
      const result = await importBackup(db);
      if (result) {
        const missing =
          result.missingImages > 0 ? ` ${result.missingImages} photos were missing.` : '';
        Alert.alert(
          'Backup restored',
          `${result.itemCount} items and ${result.outfitCount} outfits are back.${missing}`
        );
      }
    } catch (error) {
      Alert.alert('Import failed', messageOf(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.title}>Appearance</Text>
        <Text style={styles.body}>Choose light, dark, or match the phone setting.</Text>
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map((option) => {
            const active = preference === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setPreference(option.value)}
                style={[styles.themeChip, active && styles.themeChipActive]}>
                <Text style={[styles.themeChipLabel, active && styles.themeChipLabelActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Export</Text>
        <Text style={styles.body}>
          Saves a zip holding every processed photo plus a JSON file with your clothes and
          outfits. Share it to Files, a cloud drive or your computer.
        </Text>
        <Button label="Export backup" onPress={runExport} busy={busy === 'export'} />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Import</Text>
        <Text style={styles.body}>
          Restores a backup zip. This replaces what is on the phone. You end up with exactly what
          the file holds.
        </Text>
        <Button
          label="Import backup"
          variant="danger"
          onPress={runImport}
          busy={busy === 'import'}
        />
      </View>

      <Text style={styles.footnote}>
        Everything stays on this device. Foset is running locally and talks to no server.
      </Text>
    </ScrollView>
  );
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.lg,
      gap: spacing.lg,
    },
    card: {
      padding: spacing.lg,
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      ...typography.heading,
      color: colors.text,
    },
    body: {
      ...typography.body,
      color: colors.muted,
    },
    themeRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    themeChip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    themeChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    themeChipLabel: {
      ...typography.label,
      color: colors.text,
    },
    themeChipLabelActive: {
      color: colors.accentText,
    },
    footnote: {
      ...typography.caption,
      color: colors.muted,
      textAlign: 'center',
    },
  });
}
