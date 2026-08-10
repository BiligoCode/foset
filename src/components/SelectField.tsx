import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing, typography, type ThemeColors } from '../theme';
import { ColorSwatch } from './ColorSwatch';
import { OptionModal, type Option } from './OptionModal';

type SharedProps = {
  label: string;
  placeholder: string;
  options: Option[];
  disabled?: boolean;
  error?: string;
};

type SingleProps = SharedProps & {
  multiple?: false;
  value: string | null;
  onChange: (value: string | null) => void;
  /** Shows the chosen colour next to the value. */
  swatch?: string | null;
};

type MultiProps = SharedProps & {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
};

type Props = SingleProps | MultiProps;

export function SelectField(props: Props) {
  const { label, placeholder, options, disabled = false, error } = props;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [open, setOpen] = useState(false);

  const display = props.multiple
    ? props.value.length > 0
      ? props.value.join(', ')
      : null
    : props.value;

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${display ?? placeholder}`}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.control,
          pressed && styles.pressed,
          disabled && styles.disabled,
          !!error && styles.invalid,
        ]}>
        {!props.multiple && props.swatch ? (
          <ColorSwatch name={props.value ?? undefined} hex={props.swatch} />
        ) : null}
        {props.multiple && props.value.length > 0 ? (
          <View style={styles.swatchRow}>
            {props.value.slice(0, 4).map((name) => {
              const hex = options.find((option) => option.value === name)?.swatch;
              return hex ? <ColorSwatch key={name} name={name} hex={hex} /> : null;
            })}
          </View>
        ) : null}
        <Text style={[styles.value, !display && styles.placeholder]} numberOfLines={1}>
          {display ?? placeholder}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {props.multiple ? (
        <OptionModal
          visible={open}
          title={label}
          options={options}
          multiple
          selected={props.value}
          onChange={props.onChange}
          onClose={() => setOpen(false)}
        />
      ) : (
        <OptionModal
          visible={open}
          title={label}
          options={options}
          selected={props.value}
          onSelect={props.onChange}
          onClose={() => setOpen(false)}
        />
      )}
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
    swatchRow: {
      flexDirection: 'row',
      gap: 4,
    },
    error: {
      ...typography.caption,
      color: colors.danger,
      marginTop: spacing.xs,
    },
  });
}
