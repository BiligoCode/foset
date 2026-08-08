import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { DATABASE_NAME, migrateDatabase } from '../src/db/database';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { typography, type ThemeColors } from '../src/theme';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Suspense fallback={<Starting />}>
        {/* Suspense holds the UI until the schema is in place, so no screen can
            query a database that does not exist yet. */}
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDatabase} useSuspense>
          <RootNavigation />
        </SQLiteProvider>
      </Suspense>
    </ThemeProvider>
  );
}

function RootNavigation() {
  const { colors, scheme } = useTheme();

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: typography.heading,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="clothes/new" options={{ title: 'Add item' }} />
        <Stack.Screen name="clothes/[id]/edit" options={{ title: 'Edit item' }} />
        <Stack.Screen name="clothes/[id]/add-to-outfit" options={{ title: 'Add to outfit' }} />
        <Stack.Screen name="outfits/new" options={{ title: 'New outfit' }} />
        <Stack.Screen name="outfits/[id]/edit" options={{ title: 'Edit outfit' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </>
  );
}

function Starting() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStartingStyles(colors), [colors]);

  return (
    <View style={styles.starting}>
      <ActivityIndicator color={colors.text} />
    </View>
  );
}

function createStartingStyles(colors: ThemeColors) {
  return StyleSheet.create({
    starting: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
  });
}
