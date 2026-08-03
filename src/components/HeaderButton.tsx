import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, spacing, typography } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  /** When set, the icon replaces the text and the label becomes the a11y name. */
  icon?: keyof typeof Ionicons.glyphMap;
};

export function HeaderButton({ label, onPress, icon }: Props) {
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

const styles = StyleSheet.create({
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
