import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable } from 'react-native';

import { opcionesCabecera } from '@/constants/navegacion';
import { Colors, Fonts, Spacing } from '@/constants/theme';

export default function PestanasLayout() {
  return (
    <Tabs
      screenOptions={{
        ...opcionesCabecera,
        headerTitleStyle: { ...opcionesCabecera.headerTitleStyle, fontSize: 30 },
        headerTitleAlign: 'left',
        sceneStyle: { backgroundColor: Colors.background },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: { fontFamily: Fonts.medium, fontSize: 12 },
        tabBarStyle: { backgroundColor: Colors.backgroundElement, borderTopColor: Colors.border },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mi neceser',
          tabBarLabel: 'Neceser',
          tabBarIcon: ({ focused, size }) => (
            <MaterialCommunityIcons name="lipstick" size={size} color={focused ? Colors.primary : Colors.textSecondary} />
          ),
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/avisos')}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Avisos"
              style={{ marginRight: Spacing.three }}>
              <MaterialCommunityIcons name="bell-outline" size={24} color={Colors.primary} />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="compra"
        options={{
          title: 'Para comprar',
          tabBarLabel: 'Compra',
          tabBarIcon: ({ focused, size }) => (
            <MaterialCommunityIcons name="cart-outline" size={size} color={focused ? Colors.primary : Colors.textSecondary} />
          ),
        }}
      />
    </Tabs>
  );
}
