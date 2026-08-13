import { useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { isMulticolour } from '../constants/palette';
import { useTheme } from '../theme/ThemeProvider';
import { radius, type ThemeColors } from '../theme';

/** Rainbow wedges painted from the centre of the multicolour swatch. */
const ARC_COLORS = [
  '#C0392B',
  '#E1701A',
  '#F4C542',
  '#2E7D46',
  '#1F7A72',
  '#2F6FBA',
  '#6B4E9B',
  '#F4A7C0',
] as const;

type Props = {
  /** Palette colour name. Used to detect the multicolour option. */
  name?: string;
  /** Solid fill for ordinary colours. */
  hex?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function ColorSwatch({ name, hex, size = 22, style }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const showArcs = isMulticolour(name);

  return (
    <View
      style={[
        styles.swatch,
        {
          width: size,
          height: size,
          backgroundColor: showArcs ? undefined : hex,
        },
        style,
      ]}>
      {showArcs ? <MulticolourArcs size={size} /> : null}
    </View>
  );
}

function MulticolourArcs({ size }: { size: number }) {
  const count = ARC_COLORS.length;
  // Reach the square corners (not just the mid-edge), then clip.
  const reach = (size / 2) * Math.SQRT2 * 1.02;
  const halfBase = reach * Math.tan(Math.PI / count) * 1.05;

  return (
    <>
      {ARC_COLORS.map((color, index) => (
        <View
          key={color}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            transform: [{ rotate: `${(360 / count) * index}deg` }],
          }}>
          <View
            style={{
              position: 'absolute',
              left: size / 2 - halfBase,
              top: size / 2 - reach,
              width: 0,
              height: 0,
              borderStyle: 'solid',
              borderLeftWidth: halfBase,
              borderRightWidth: halfBase,
              borderTopWidth: reach,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: color,
            }}
          />
        </View>
      ))}
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    swatch: {
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
  });
}
