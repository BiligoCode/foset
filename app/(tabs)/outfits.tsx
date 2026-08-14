import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { EmptyState } from '../../src/components/EmptyState';
import { OutfitRow } from '../../src/components/OutfitRow';
import { SearchField } from '../../src/components/SearchField';
import { countOutfits, listOutfits } from '../../src/db/outfits';
import type { OutfitSummary } from '../../src/db/types';
import { spacing, type ThemeColors } from '../../src/theme';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function OutfitsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const db = useSQLiteContext();
  const router = useRouter();
  const [outfits, setOutfits] = useState<OutfitSummary[]>([]);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([listOutfits(db, search), countOutfits(db)]).then(([rows, wardrobeSize]) => {
        if (active) {
          setOutfits(rows);
          setTotal(wardrobeSize);
        }
      });
      return () => {
        active = false;
      };
    }, [db, search])
  );

  if (total === 0) {
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
    <View style={styles.screen}>
      <SearchField value={search} onChangeText={setSearch} placeholder="Search by title" />
      <FlatList
        data={outfits}
        keyExtractor={(outfit) => String(outfit.id)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            title="Nothing matches"
            message="No outfits fit this search."
            actionLabel="Clear search"
            onAction={() => setSearch('')}
          />
        }
        renderItem={({ item }) => (
          <OutfitRow outfit={item} onPress={() => router.push(`/outfits/${item.id}`)} />
        )}
      />
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
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
  });
}
