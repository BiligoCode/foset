import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SUBCATEGORIES, type Category } from '../constants/taxonomy';
import type { FilterOptions } from '../db/clothes';
import type { ClothingFilters } from '../db/types';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing, typography, type ThemeColors } from '../theme';
import { OptionModal, type Option } from './OptionModal';

type Field = keyof ClothingFilters;

type Props = {
  filters: ClothingFilters;
  options: FilterOptions;
  onChange: (filters: ClothingFilters) => void;
};

const FIELD_LABELS: Record<Field, string> = {
  category: 'Category',
  subcategory: 'Type',
  brand: 'Brand',
  colorName: 'Colour',
};

export function FilterBar({ filters, options, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [openField, setOpenField] = useState<Field | null>(null);
  const active = Object.values(filters).filter(Boolean).length > 0;

  // Once a category is chosen, only offer the types that belong to it.
  const subcategoryOptions = filters.category
    ? options.subcategories.filter((name) =>
        SUBCATEGORIES[filters.category as Category].includes(name)
      )
    : options.subcategories;

  const fieldOptions: Record<Field, Option[]> = {
    category: options.categories.map((value) => ({ value, label: value })),
    subcategory: subcategoryOptions.map((value) => ({ value, label: value })),
    brand: options.brands.map((value) => ({ value, label: value })),
    colorName: options.colors.map((color) => ({
      value: color.name,
      label: color.name,
      swatch: color.hex,
    })),
  };

  const select = (field: Field, value: string | null) => {
    const next: ClothingFilters = { ...filters, [field]: value ?? undefined };
    // A type only makes sense under its own category.
    if (field === 'category') next.subcategory = undefined;
    onChange(next);
  };

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}>
        {(Object.keys(FIELD_LABELS) as Field[]).map((field) => {
          const value = filters[field];
          const disabled = fieldOptions[field].length === 0;
          return (
            <Pressable
              key={field}
              accessibilityRole="button"
              disabled={disabled}
              onPress={() => setOpenField(field)}
              style={({ pressed }) => [
                styles.chip,
                value && styles.chipActive,
                pressed && styles.pressed,
                disabled && styles.chipDisabled,
              ]}>
              <Text style={[styles.chipLabel, value && styles.chipLabelActive]}>
                {value ?? FIELD_LABELS[field]}
              </Text>
            </Pressable>
          );
        })}

        {active ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onChange({})}
            style={({ pressed }) => [styles.clear, pressed && styles.pressed]}>
            <Text style={styles.clearLabel}>Clear all</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {openField ? (
        <OptionModal
          visible
          title={FIELD_LABELS[openField]}
          options={fieldOptions[openField]}
          selected={filters[openField] ?? null}
          clearLabel={`Any ${FIELD_LABELS[openField].toLowerCase()}`}
          onSelect={(value) => select(openField, value)}
          onClose={() => setOpenField(null)}
        />
      ) : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    strip: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    chip: {
      justifyContent: 'center',
      minHeight: 36,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    chipDisabled: {
      opacity: 0.4,
    },
    pressed: {
      opacity: 0.7,
    },
    chipLabel: {
      ...typography.label,
      color: colors.text,
    },
    chipLabelActive: {
      color: colors.accentText,
    },
    clear: {
      justifyContent: 'center',
      minHeight: 36,
      paddingHorizontal: spacing.md,
    },
    clearLabel: {
      ...typography.label,
      color: colors.muted,
      textDecorationLine: 'underline',
    },
  });
}
