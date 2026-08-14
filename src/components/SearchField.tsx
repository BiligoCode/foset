import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing, typography, type ThemeColors } from '../theme';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
};

export function SearchField({ value, onChangeText, placeholder }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <Ionicons name="search-outline" size={18} color={colors.muted} />
      <TextInput
        accessibilityLabel={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={styles.input}
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          onPress={() => onChangeText('')}>
          <Ionicons name="close-circle" size={18} color={colors.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      minHeight: 48,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
    },
    input: {
      ...typography.body,
      flex: 1,
      paddingVertical: spacing.md,
      color: colors.text,
    },
  });
}
