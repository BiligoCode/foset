import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { exportBackup, importBackup } from '../src/backup/backup';
import { Button } from '../src/components/Button';
import { colors, radius, spacing, typography } from '../src/theme';

export default function BackupScreen() {
  const db = useSQLiteContext();
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  const runExport = async () => {
    setBusy('export');
    try {
      const result = await exportBackup(db);
      if (result) {
        Alert.alert(
          'Backup ready',
          `${result.itemCount} items and ${result.outfitCount} outfits saved as ${result.fileName}.`
        );
      }
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
          Restores a backup zip. This replaces what is on the phone rather than merging, so you
          end up with exactly what the file holds.
        </Text>
        <Button
          label="Import backup"
          variant="danger"
          onPress={runImport}
          busy={busy === 'import'}
        />
      </View>

      <Text style={styles.footnote}>
        Everything stays on this device. Foset has no account and talks to no server.
      </Text>
    </ScrollView>
  );
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

const styles = StyleSheet.create({
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
  footnote: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
  },
});
