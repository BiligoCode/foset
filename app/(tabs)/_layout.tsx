import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, useRouter } from 'expo-router';

import { HeaderButton } from '../../src/components/HeaderButton';
import { colors, typography } from '../../src/theme';

export default function TabsLayout() {
  const router = useRouter();

  const backupButton = () => (
    <HeaderButton
      label="Backup"
      icon="ellipsis-horizontal-circle-outline"
      onPress={() => router.push('/backup')}
    />
  );

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: typography.heading,
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        sceneStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Clothes',
          tabBarIcon: ({ color, size }) => <Ionicons name="shirt-outline" size={size} color={color} />,
          headerLeft: backupButton,
          headerRight: () => (
            <HeaderButton label="Add item" icon="add" onPress={() => router.push('/clothes/new')} />
          ),
        }}
      />
      <Tabs.Screen
        name="outfits"
        options={{
          title: 'Outfits',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="albums-outline" size={size} color={color} />
          ),
          headerLeft: backupButton,
          headerRight: () => (
            <HeaderButton
              label="New outfit"
              icon="add"
              onPress={() => router.push('/outfits/new')}
            />
          ),
        }}
      />
    </Tabs>
  );
}
