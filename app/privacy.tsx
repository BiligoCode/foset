import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PRIVACY_INTRO, PRIVACY_SECTIONS, PRIVACY_UPDATED } from '../src/constants/privacy';
import { useTheme } from '../src/theme/ThemeProvider';
import { radius, spacing, typography, type ThemeColors } from '../src/theme';

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.updated}>Last updated {PRIVACY_UPDATED}</Text>
      <Text style={styles.intro}>{PRIVACY_INTRO}</Text>
      {PRIVACY_SECTIONS.map((section) => (
        <View key={section.title} style={styles.card}>
          <Text style={styles.title}>{section.title}</Text>
          <Text style={styles.body}>{section.body}</Text>
        </View>
      ))}
    </ScrollView>
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
    updated: {
      ...typography.caption,
      color: colors.muted,
    },
    intro: {
      ...typography.body,
      color: colors.text,
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
