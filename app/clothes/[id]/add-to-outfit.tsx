import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../src/components/Button';
import {
  addClothingToOutfit,
  listOutfitIdsForClothing,
  listOutfits,
  removeClothingFromOutfit,
} from '../../../src/db/outfits';
import type { OutfitSummary } from '../../../src/db/types';
import { radius, spacing, typography, type ThemeColors } from '../../../src/theme';
import { useTheme } from '../../../src/theme/ThemeProvider';

/**
 * Puts one item into outfits without leaving the Clothes section. Tapping a row
 * toggles membership straight away, so there is nothing to confirm.
 */
export default function AddToOutfitScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const db = useSQLiteContext();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = Number(id);
  const [outfits, setOutfits] = useState<OutfitSummary[]>([]);
  const [memberOf, setMemberOf] = useState<number[]>([]);

  const load = useCallback(async () => {
    const [allOutfits, ids] = await Promise.all([
      listOutfits(db),
      listOutfitIdsForClothing(db, itemId),
    ]);
    setOutfits(allOutfits);
    setMemberOf(ids);
  }, [db, itemId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggle = async (outfitId: number) => {
    if (memberOf.includes(outfitId)) {
      await removeClothingFromOutfit(db, outfitId, itemId);
    } else {
      await addClothingToOutfit(db, outfitId, itemId);
    }
    await load();
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={outfits}
        keyExtractor={(outfit) => String(outfit.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            You have no outfits yet. Create one and this item goes straight in.
          </Text>
        }
        renderItem={({ item: outfit }) => {
          const included = memberOf.includes(outfit.id);
          return (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: included }}
              onPress={() => toggle(outfit.id)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <View style={styles.rowText}>
                <Text style={styles.name}>{outfit.name}</Text>
                <Text style={styles.meta}>
                  {outfit.itemCount} {outfit.itemCount === 1 ? 'item' : 'items'}
                </Text>
              </View>
              <View style={[styles.box, included && styles.boxChecked]}>
                {included ? <Text style={styles.tick}>✓</Text> : null}
              </View>
            </Pressable>
          );
        }}
      />

      <View style={styles.footer}>
        <Button
          label="Create a new outfit with this item"
          onPress={() =>
            router.replace({ pathname: '/outfits/new', params: { preselect: String(itemId) } })
          }
        />
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  empty: {
    ...typography.body,
    color: colors.muted,
    paddingVertical: spacing.xl,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  rowText: {
    flex: 1,
  },
  name: {
    ...typography.heading,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  box: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  boxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  tick: {
    ...typography.label,
    color: colors.accentText,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  });
}
