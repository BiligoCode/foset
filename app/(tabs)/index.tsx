import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { ClothingCard } from '../../src/components/ClothingCard';
import { EmptyState } from '../../src/components/EmptyState';
import { FilterBar } from '../../src/components/FilterBar';
import {
  countClothes,
  listClothes,
  listFilterOptions,
  type FilterOptions,
} from '../../src/db/clothes';
import type { ClothingFilters, ClothingItem } from '../../src/db/types';
import { colors, spacing } from '../../src/theme';

const NO_OPTIONS: FilterOptions = { categories: [], subcategories: [], brands: [], colors: [] };

export default function ClothesScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [options, setOptions] = useState<FilterOptions>(NO_OPTIONS);
  const [filters, setFilters] = useState<ClothingFilters>({});
  const [total, setTotal] = useState(0);

  // Reload on focus so edits, deletions and imports show up on the way back.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([listClothes(db, filters), listFilterOptions(db), countClothes(db)]).then(
        ([filtered, filterOptions, wardrobeSize]) => {
          if (!active) return;
          setItems(filtered);
          setOptions(filterOptions);
          setTotal(wardrobeSize);
        }
      );
      return () => {
        active = false;
      };
    }, [db, filters])
  );

  if (total === 0) {
    return (
      <EmptyState
        title="Your wardrobe is empty"
        message="Photograph a piece of clothing and Foset turns it into a clean studio shot."
        actionLabel="Add your first item"
        onAction={() => router.push('/clothes/new')}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <FilterBar filters={filters} options={options} onChange={setFilters} />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.column}
        ListEmptyComponent={
          <EmptyState
            title="Nothing matches"
            message="No items fit these filters."
            actionLabel="Clear filters"
            onAction={() => setFilters({})}
          />
        }
        renderItem={({ item }) => (
          <ClothingCard item={item} onPress={() => router.push(`/clothes/${item.id}`)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  grid: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  column: {
    gap: spacing.md,
  },
});
