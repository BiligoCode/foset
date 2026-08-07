import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { listClothes } from '../db/clothes';
import type { ClothingItem } from '../db/types';
import { twoColumnCardWidth } from '../layout/grid';
import { colors, spacing, typography } from '../theme';
import { Button } from './Button';
import { ClothingCard } from './ClothingCard';
import { TextField } from './TextField';

type Props = {
  name?: string;
  selection?: number[];
  submitLabel: string;
  onSubmit: (name: string, clothingIds: number[]) => Promise<void>;
};

export function OutfitForm({
  name: initialName = '',
  selection: initialSelection = [],
  submitLabel,
  onSubmit,
}: Props) {
  const db = useSQLiteContext();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = twoColumnCardWidth(screenWidth);
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [name, setName] = useState(initialName);
  const [selection, setSelection] = useState<number[]>(initialSelection);
  const [nameError, setNameError] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listClothes(db).then(setClothes);
  }, [db]);

  const toggle = (id: number) => {
    setSelection((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  };

  const submit = async () => {
    if (!name.trim()) {
      setNameError('Give the outfit a name.');
      return;
    }
    setNameError(undefined);
    setSaving(true);
    try {
      await onSubmit(name.trim(), selection);
    } catch (error) {
      setSaving(false);
      Alert.alert(
        'Could not save',
        error instanceof Error ? error.message : 'Something went wrong.'
      );
    }
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={clothes}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        contentContainerStyle={styles.content}
        columnWrapperStyle={styles.column}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            <TextField
              label="Name"
              placeholder="Saturday coffee"
              value={name}
              onChangeText={setName}
              error={nameError}
            />
            <Text style={styles.sectionLabel}>
              Items {selection.length > 0 ? `(${selection.length} selected)` : ''}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            Add some clothes first, then you can put them into an outfit.
          </Text>
        }
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>
            <ClothingCard
              item={item}
              selected={selection.includes(item.id)}
              onPress={() => toggle(item.id)}
            />
          </View>
        )}
      />

      <View style={styles.footer}>
        <Button label={submitLabel} onPress={submit} busy={saving} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  column: {
    gap: spacing.md,
  },
  header: {
    gap: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.muted,
  },
  empty: {
    ...typography.body,
    color: colors.muted,
    paddingVertical: spacing.xl,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
