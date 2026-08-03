import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

export type Option = {
  value: string;
  label: string;
  /** Draws a colour swatch next to the label. Used by the colour picker. */
  swatch?: string;
};

type Props = {
  visible: boolean;
  title: string;
  options: Option[];
  selected: string | null;
  /** Adds a row that clears the current choice. */
  clearLabel?: string;
  onSelect: (value: string | null) => void;
  onClose: () => void;
};

export function OptionModal({
  visible,
  title,
  options,
  selected,
  clearLabel,
  onSelect,
  onClose,
}: Props) {
  const rows: Option[] = clearLabel ? [{ value: '', label: clearLabel }, ...options] : options;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
            <Text style={styles.close}>Done</Text>
          </Pressable>
        </View>

        <FlatList
          data={rows}
          keyExtractor={(option) => option.value || 'clear'}
          style={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const active = (item.value || null) === selected;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => {
                  onSelect(item.value || null);
                  onClose();
                }}>
                {item.swatch ? (
                  <View style={[styles.swatch, { backgroundColor: item.swatch }]} />
                ) : null}
                <Text style={[styles.rowLabel, active && styles.rowLabelActive]}>
                  {item.label}
                </Text>
                {active ? <Text style={styles.check}>✓</Text> : null}
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  close: {
    ...typography.heading,
    color: colors.muted,
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowLabel: {
    ...typography.body,
    flex: 1,
    color: colors.text,
  },
  rowLabelActive: {
    fontWeight: '600',
  },
  check: {
    ...typography.body,
    color: colors.text,
  },
  swatch: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
