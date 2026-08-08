import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { OutfitForm } from '../../../src/components/OutfitForm';
import { getOutfit, updateOutfit } from '../../../src/db/outfits';
import type { OutfitDetail } from '../../../src/db/types';
import { type ThemeColors } from '../../../src/theme';
import { useTheme } from '../../../src/theme/ThemeProvider';

export default function EditOutfitScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const db = useSQLiteContext();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const outfitId = Number(id);
  const [outfit, setOutfit] = useState<OutfitDetail | null>(null);

  useEffect(() => {
    getOutfit(db, outfitId).then(setOutfit);
  }, [db, outfitId]);

  if (!outfit) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return (
    <OutfitForm
      name={outfit.name}
      selection={outfit.items.map((item) => item.id)}
      submitLabel="Save changes"
      onSubmit={async (name, clothingIds) => {
        await updateOutfit(db, outfitId, name, clothingIds);
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
