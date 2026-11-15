import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { colors, typography } from '@/constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(name: IconName, focusedName: IconName) {
  return ({
    color,
    focused,
  }: {
    color: ColorValue;
    focused: boolean;
    size: number;
  }) => (
    <Ionicons
      name={focused ? focusedName : name}
      size={22}
      color={(typeof color === 'string' ? color : undefined) ?? colors.muted}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.canvas,
          borderTopColor: colors.hairline,
          height: 64,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          ...typography.tabLabel,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: tabIcon('home-outline', 'home'),
        }}
      />
      <Tabs.Screen
        name="outlook"
        options={{
          title: 'Outlook',
          tabBarIcon: tabIcon('pulse-outline', 'pulse'),
        }}
      />
      <Tabs.Screen
        name="prevention"
        options={{
          title: 'Prevention',
          tabBarIcon: tabIcon('shield-checkmark-outline', 'shield-checkmark'),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: 'Assistant',
          tabBarIcon: tabIcon('chatbubble-ellipses-outline', 'chatbubble-ellipses'),
        }}
      />
      <Tabs.Screen
        name="updates"
        options={{
          title: 'Updates',
          tabBarIcon: tabIcon('newspaper-outline', 'newspaper'),
        }}
      />
    </Tabs>
  );
}
