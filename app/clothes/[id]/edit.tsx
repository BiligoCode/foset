import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ClothingForm } from '../../../src/components/ClothingForm';
import { getClothingItem, updateClothingItem } from '../../../src/db/clothes';
import type { ClothingItem } from '../../../src/db/types';
import { type ThemeColors } from '../../../src/theme';
import { useTheme } from '../../../src/theme/ThemeProvider';

export default function EditClothingScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const db = useSQLiteContext();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = Number(id);
  const [item, setItem] = useState<ClothingItem | null>(null);

  useEffect(() => {
    getClothingItem(db, itemId).then(setItem);
  }, [db, itemId]);

  if (!item) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return (
    <ClothingForm
      item={item}
      submitLabel="Save changes"
      onSubmit={async (input) => {
        await updateClothingItem(db, itemId, input);
        router.back();
      }}
    />
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  });
}
