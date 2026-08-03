import { Image } from 'expo-image';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '../../../src/components/Button';
import { deleteClothingItem, getClothingItem } from '../../../src/db/clothes';
import { listOutfitIdsForClothing, listOutfits } from '../../../src/db/outfits';
import type { ClothingItem, OutfitSummary } from '../../../src/db/types';
import { deleteImage, imageUri } from '../../../src/imaging/photos';
import { colors, radius, spacing, typography } from '../../../src/theme';

export default function ClothingDetailScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = Number(id);
  const [item, setItem] = useState<ClothingItem | null>(null);
  const [memberships, setMemberships] = useState<OutfitSummary[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([
        getClothingItem(db, itemId),
        listOutfits(db),
        listOutfitIdsForClothing(db, itemId),
      ]).then(([found, outfits, outfitIds]) => {
        if (!active) return;
        const ids = new Set(outfitIds);
        setItem(found);
        setMemberships(outfits.filter((outfit) => ids.has(outfit.id)));
      });
      return () => {
        active = false;
      };
    }, [db, itemId])
  );

  const confirmDelete = () => {
    if (!item) return;
    Alert.alert('Delete this item?', `${item.title} will be removed from every outfit too.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteClothingItem(db, itemId);
          deleteImage(item.image_path);
          router.back();
        },
      },
    ]);
  };

  if (!item) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: item.title }} />

      <Image
        source={{ uri: imageUri(item.image_path) }}
        style={styles.image}
        contentFit="contain"
        transition={150}
      />

      <View style={styles.card}>
        <Detail label="Category" value={item.category} />
        {item.subcategory ? <Detail label="Type" value={item.subcategory} /> : null}
        <Detail label="Brand" value={item.brand} />
        <Detail label="Colour" value={item.color_name} swatch={item.color_hex} />
        {item.notes ? <Detail label="Notes" value={item.notes} /> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>In outfits</Text>
        {memberships.length === 0 ? (
          <Text style={styles.muted}>Not in any outfit yet.</Text>
        ) : (
          memberships.map((outfit) => (
            <Pressable
              key={outfit.id}
              accessibilityRole="link"
              onPress={() => router.push(`/outfits/${outfit.id}`)}>
              <Text style={styles.link}>{outfit.name}</Text>
            </Pressable>
          ))
        )}
      </View>

      <Button
        label="Add to an outfit"
        variant="secondary"
        onPress={() => router.push(`/clothes/${itemId}/add-to-outfit`)}
      />
      <Button
        label="Edit item"
        variant="secondary"
        onPress={() => router.push(`/clothes/${itemId}/edit`)}
      />
      <Button label="Delete item" variant="danger" onPress={confirmDelete} />
    </ScrollView>
  );
}

function Detail({ label, value, swatch }: { label: string; value: string; swatch?: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <View style={styles.detailValueRow}>
        {swatch ? <View style={[styles.swatch, { backgroundColor: swatch }]} /> : null}
        <Text style={styles.detailValue}>{value}</Text>
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
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
  },
  card: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    ...typography.label,
    color: colors.muted,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  detailLabel: {
    ...typography.label,
    color: colors.muted,
  },
  detailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  detailValue: {
    ...typography.body,
    color: colors.text,
    flexShrink: 1,
    textAlign: 'right',
  },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  link: {
    ...typography.body,
    color: colors.text,
    textDecorationLine: 'underline',
  },
  muted: {
    ...typography.body,
    color: colors.muted,
  },
});
