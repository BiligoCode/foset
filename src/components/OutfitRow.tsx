import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { OutfitSummary } from '../db/types';
import { imageUri } from '../imaging/photos';
import { colors, radius, spacing, typography } from '../theme';

type Props = {
  outfit: OutfitSummary;
  onPress: () => void;
};

export function OutfitRow({ outfit, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.previews}>
        {outfit.previewImages.length === 0 ? (
          <View style={[styles.preview, styles.previewEmpty]} />
        ) : (
          outfit.previewImages.map((path) => (
            <Image
              key={path}
              source={{ uri: imageUri(path) }}
              style={styles.preview}
              contentFit="contain"
              transition={120}
            />
          ))
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {outfit.name}
        </Text>
        <Text style={styles.meta}>
          {outfit.itemCount} {outfit.itemCount === 1 ? 'item' : 'items'}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.75,
  },
  previews: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  preview: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewEmpty: {
    backgroundColor: colors.background,
  },
  body: {
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
  chevron: {
    fontSize: 22,
    color: colors.muted,
  },
});
