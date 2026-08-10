import { useMemo } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing, typography, type ThemeColors } from '../theme';
import { ColorSwatch } from './ColorSwatch';

export type Option = {
  value: string;
  label: string;
  /** Draws a colour swatch next to the label. Used by the colour picker. */
  swatch?: string;
};

type SharedProps = {
  visible: boolean;
  title: string;
  options: Option[];
  onClose: () => void;
};

type SingleProps = SharedProps & {
  multiple?: false;
  selected: string | null;
  /** Adds a row that clears the current choice. */
  clearLabel?: string;
  onSelect: (value: string | null) => void;
};

type MultiProps = SharedProps & {
  multiple: true;
  selected: string[];
  onChange: (values: string[]) => void;
};

type Props = SingleProps | MultiProps;

export function OptionModal(props: Props) {
  const { visible, title, options, onClose } = props;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (props.multiple) {
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
            data={options}
            keyExtractor={(option) => option.value}
            style={styles.list}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => {
              const active = props.selected.includes(item.value);
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  onPress={() => {
                    if (active) {
                      props.onChange(props.selected.filter((value) => value !== item.value));
                    } else {
                      // Append so "first selected" stays first for default titles.
                      props.onChange([...props.selected, item.value]);
                    }
                  }}>
                  {item.swatch ? <ColorSwatch name={item.value} hex={item.swatch} /> : null}
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

  const rows: Option[] = props.clearLabel
    ? [{ value: '', label: props.clearLabel }, ...options]
    : options;

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
            const active = (item.value || null) === props.selected;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => {
                  props.onSelect(item.value || null);
                  onClose();
                }}>
                {item.swatch ? <ColorSwatch name={item.value} hex={item.swatch} /> : null}
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
  });
}
