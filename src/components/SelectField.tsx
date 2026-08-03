import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';
import { OptionModal, type Option } from './OptionModal';

type Props = {
  label: string;
  placeholder: string;
  value: string | null;
  options: Option[];
  onChange: (value: string | null) => void;
  /** Shows the chosen colour next to the value. */
  swatch?: string | null;
  disabled?: boolean;
  error?: string;
};

export function SelectField({
  label,
  placeholder,
  value,
  options,
  onChange,
  swatch,
  disabled = false,
  error,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ?? placeholder}`}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.control,
          pressed && styles.pressed,
          disabled && styles.disabled,
          !!error && styles.invalid,
        ]}>
        {swatch ? <View style={[styles.swatch, { backgroundColor: swatch }]} /> : null}
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
          {value ?? placeholder}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <OptionModal
        visible={open}
        title={label}
        options={options}
        selected={value}
        onSelect={onChange}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.label,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
  invalid: {
    borderColor: colors.danger,
  },
  value: {
    ...typography.body,
    flex: 1,
    color: colors.text,
  },
  placeholder: {
    color: colors.muted,
  },
  chevron: {
    fontSize: 22,
    color: colors.muted,
  },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
