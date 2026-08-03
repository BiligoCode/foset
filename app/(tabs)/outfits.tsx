import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { EmptyState } from '../../src/components/EmptyState';
import { OutfitRow } from '../../src/components/OutfitRow';
import { listOutfits } from '../../src/db/outfits';
import type { OutfitSummary } from '../../src/db/types';
import { spacing } from '../../src/theme';

export default function OutfitsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [outfits, setOutfits] = useState<OutfitSummary[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listOutfits(db).then((rows) => {
        if (active) setOutfits(rows);
      });
      return () => {
        active = false;
      };
    }, [db])
  );

  if (outfits.length === 0) {
    return (
      <EmptyState
        title="No outfits yet"
        message="Group the clothes you like wearing together into an outfit."
        actionLabel="Create new outfit"
        onAction={() => router.push('/outfits/new')}
      />
    );
  }

  return (
    <FlatList
      data={outfits}
      keyExtractor={(outfit) => String(outfit.id)}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <OutfitRow outfit={item} onPress={() => router.push(`/outfits/${item.id}`)} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
});
