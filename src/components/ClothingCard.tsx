import { Image } from 'expo-image';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ClothingItem } from '../db/types';
import { imageUri } from '../imaging/photos';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing, typography, type ThemeColors } from '../theme';

type Props = {
  item: ClothingItem;
  onPress: () => void;
  /** Draws a selection tick, used when picking items for an outfit. */
  selected?: boolean;
};

export function ClothingCard({ item, onPress, selected }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
        recyclingKey={`${item.id}:${item.image_path}`}
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
        {item.brand ? (
          <Text style={styles.meta} numberOfLines={1}>
            {item.brand}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
      alignSelf: 'stretch',
      width: '100%',
      aspectRatio: 1,
      // Studio shots sit on white, so keep the frame white in both themes.
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
}
