import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ClothingItem } from '../db/types';
import { imageUri } from '../imaging/photos';
import { colors, radius, spacing, typography } from '../theme';

type Props = {
  item: ClothingItem;
  onPress: () => void;
  /** Draws a selection tick, used when picking items for an outfit. */
  selected?: boolean;
};

export function ClothingCard({ item, onPress, selected }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
        selected && styles.selected,
      ]}>
      <Image
        source={{ uri: imageUri(item.image_path) }}
        style={styles.image}
        contentFit="contain"
        transition={120}
        recyclingKey={String(item.id)}
      />
      {selected ? (
        <View style={styles.tick}>
          <Text style={styles.tickMark}>✓</Text>
        </View>
      ) : null}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {item.brand}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.75,
  },
  selected: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
  },
  tick: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  tickMark: {
    ...typography.label,
    color: colors.accentText,
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  title: {
    ...typography.label,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
});
