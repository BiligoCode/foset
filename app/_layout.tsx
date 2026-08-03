import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { DATABASE_NAME, migrateDatabase } from '../src/db/database';
import { colors, typography } from '../src/theme';

export default function RootLayout() {
  return (
    <Suspense fallback={<Starting />}>
      {/* Suspense holds the UI until the schema is in place, so no screen can
          query a database that does not exist yet. */}
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDatabase} useSuspense>
        <StatusBar style="dark" />
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
          <Stack.Screen name="backup" options={{ title: 'Backup' }} />
        </Stack>
      </SQLiteProvider>
    </Suspense>
  );
}

function Starting() {
  return (
    <View style={styles.starting}>
      <ActivityIndicator color={colors.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  starting: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
