import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Colors } from '../constants/theme';
import { NeotixLogo } from '../components/ui/neotix-logo';

export default function SplashScreen() {
  useEffect(() => {
    // 2.2 second auto transition to Home
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={1}
      onPress={() => router.replace('/(tabs)')}
    >
      <StatusBar style="light" />
      <NeotixLogo size="xl" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2228', // Exact Figma charcoal dark background
    justifyContent: 'center',
    alignItems: 'center',
  },
});
