import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { spacing, typography, type ThemeColors } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  /** When set, the icon replaces the text and the label becomes the a11y name. */
  icon?: keyof typeof Ionicons.glyphMap;
};

export function HeaderButton({ label, onPress, icon }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      {icon ? (
        <Ionicons name={icon} size={22} color={colors.text} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    button: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    pressed: {
      opacity: 0.5,
    },
    label: {
      ...typography.heading,
      color: colors.text,
    },
  });
}
