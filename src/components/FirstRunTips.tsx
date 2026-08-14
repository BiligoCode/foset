import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing, typography, type ThemeColors } from '../theme';
import { Button } from './Button';

const TIPS = [
  {
    title: 'Photograph on contrast',
    body: 'Use a plain surface that is a different colour from the garment. A dark shirt on a light table works. A white shirt on a white bed does not.',
  },
  {
    title: 'First photo may download a model',
    body: 'On Android the first cutout may download Google ML Kit Subject Segmentation, which is a small on-device model, about 10MB. After that, processing stays on the phone.',
  },
  {
    title: 'Everything stays here',
    body: 'Foset has no account and no server. If you get a new phone, export a backup from Settings first.',
  },
];

type Props = {
  onContinue: () => void;
};

export function FirstRunTips({ onContinue }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Before you start</Text>
        <Text style={styles.lead}>A few things that make Foset work the way you expect.</Text>
        {TIPS.map((tip) => (
          <View key={tip.title} style={styles.card}>
            <Text style={styles.title}>{tip.title}</Text>
            <Text style={styles.body}>{tip.body}</Text>
          </View>
        ))}
        <Button label="Continue" onPress={onContinue} />
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.lg,
      gap: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    heading: {
      ...typography.title,
      color: colors.text,
    },
    lead: {
      ...typography.body,
      color: colors.muted,
    },
    card: {
      padding: spacing.lg,
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      ...typography.heading,
      color: colors.text,
    },
    body: {
      ...typography.body,
      color: colors.muted,
    },
  });
}
