import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../src/components/Button';
import { ClothingCard } from '../../../src/components/ClothingCard';
import { deleteOutfit, getOutfit } from '../../../src/db/outfits';
import type { OutfitDetail } from '../../../src/db/types';
import { colors, spacing, typography } from '../../../src/theme';

export default function OutfitDetailScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const outfitId = Number(id);
  const [outfit, setOutfit] = useState<OutfitDetail | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getOutfit(db, outfitId).then((found) => {
        if (active) setOutfit(found);
      });
      return () => {
        active = false;
      };
    }, [db, outfitId])
  );

  const confirmDelete = () => {
    if (!outfit) return;
    Alert.alert('Delete this outfit?', `${outfit.name} will be removed. The clothes stay.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteOutfit(db, outfitId);
          router.back();
        },
      },
    ]);
  };

  if (!outfit) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: outfit.name }} />

      {outfit.items.length === 0 ? (
        <Text style={styles.empty}>This outfit has no items yet.</Text>
      ) : (
        <View style={styles.grid}>
          {outfit.items.map((item) => (
            <View key={item.id} style={styles.cell}>
              <ClothingCard item={item} onPress={() => router.push(`/clothes/${item.id}`)} />
            </View>
          ))}
        </View>
      )}

      <Button
        label="Edit outfit"
        variant="secondary"
        onPress={() => router.push(`/outfits/${outfitId}/edit`)}
      />
      <Button label="Delete outfit" variant="danger" onPress={confirmDelete} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  cell: {
    // Two per row, matching the Clothes grid.
    width: '48%',
  },
  empty: {
    ...typography.body,
    color: colors.muted,
    paddingVertical: spacing.xl,
    textAlign: 'center',
  },
});
