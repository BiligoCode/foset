import { useMemo } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing, typography, type ThemeColors } from '../theme';

type Props = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  error?: string;
  onFocus?: TextInputProps['onFocus'];
};

export function TextField({
  label,
  placeholder,
  value,
  onChangeText,
  multiline = false,
  autoCapitalize = 'sentences',
  error,
  onFocus,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        onFocus={onFocus}
        style={[styles.input, multiline && styles.multiline, !!error && styles.invalid]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    label: {
      ...typography.label,
      color: colors.muted,
      marginBottom: spacing.sm,
    },
    input: {
      ...typography.body,
      minHeight: 48,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      color: colors.text,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
    },
    multiline: {
      minHeight: 96,
      textAlignVertical: 'top',
    },
    invalid: {
      borderColor: colors.danger,
    },
    error: {
      ...typography.caption,
      color: colors.danger,
      marginTop: spacing.xs,
    },
  });
}
