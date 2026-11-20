import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { AppIcon } from '../../components/ui/app-icon';
import { Colors } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: Colors.bottomBarBg,
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingTop: 10,
        },
        tabBarActiveTintColor: Colors.bottomBarActive,
        tabBarInactiveTintColor: Colors.bottomBarInactive,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon name={focused ? 'home' : 'home-outline'} size={24} color={color ? String(color) : Colors.bottomBarActive} />
          ),
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Tickets',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon name={focused ? 'bookmark' : 'bookmark-outline'} size={24} color={color ? String(color) : Colors.bottomBarActive} />
          ),
        }}
      />
      <Tabs.Screen
        name="cinemas"
        options={{
          title: 'Cinemas',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon name={focused ? 'grid' : 'grid-outline'} size={24} color={color ? String(color) : Colors.bottomBarActive} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <AppIcon name={focused ? 'person' : 'person-outline'} size={24} color={color ? String(color) : Colors.bottomBarActive} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          href: null, // Hide legacy favorites tab from tab bar
        }}
      />
    </Tabs>
  );
}
