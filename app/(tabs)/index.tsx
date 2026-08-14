import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';

import { ClothingCard } from '../../src/components/ClothingCard';
import { EmptyState } from '../../src/components/EmptyState';
import { FilterBar } from '../../src/components/FilterBar';
import { SearchField } from '../../src/components/SearchField';
import {
  countClothes,
  listClothes,
  listFilterOptions,
  type FilterOptions,
} from '../../src/db/clothes';
import type { ClothingFilters, ClothingItem } from '../../src/db/types';
import { twoColumnCardWidth } from '../../src/layout/grid';
import { spacing, type ThemeColors } from '../../src/theme';
import { useTheme } from '../../src/theme/ThemeProvider';

const NO_OPTIONS: FilterOptions = { categories: [], subcategories: [], brands: [], colors: [] };

export default function ClothesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const db = useSQLiteContext();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = twoColumnCardWidth(screenWidth);
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [options, setOptions] = useState<FilterOptions>(NO_OPTIONS);
  const [filters, setFilters] = useState<ClothingFilters>({});
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  // Reload on focus so edits, deletions and imports show up on the way back.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([listClothes(db, filters, search), listFilterOptions(db), countClothes(db)]).then(
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
    }, [db, filters, search])
  );

  const clearMatching = () => {
    setFilters({});
    setSearch('');
  };

  if (total === 0) {
    return (
      <EmptyState
        title="Your wardrobe is empty"
        message="Nothing to show yet. Add a shirt, a pair of jeans, whatever you wear."
        actionLabel="Add your first item"
        onAction={() => router.push('/clothes/new')}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <SearchField value={search} onChangeText={setSearch} placeholder="Search by title" />
      <FilterBar filters={filters} options={options} onChange={setFilters} />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.column}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            title="Nothing matches"
            message="No items fit this search or these filters."
            actionLabel="Clear"
            onAction={clearMatching}
          />
        }
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>
            <ClothingCard item={item} onPress={() => router.push(`/clothes/${item.id}`)} />
          </View>
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
    grid: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    column: {
      gap: spacing.md,
    },
  });
}
