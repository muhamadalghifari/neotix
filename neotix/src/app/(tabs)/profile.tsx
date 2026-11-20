import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colors, BorderRadius, Spacing } from '../../constants/theme';
import { NeotixLogo } from '../../components/ui/neotix-logo';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <NeotixLogo size="md" style={styles.logo} />
      <Text style={styles.title}>User Account</Text>
      <Text style={styles.subtitle}>Manage your bookings, preferences, and tickets.</Text>

      <TouchableOpacity
        style={styles.loginBtn}
        onPress={() => router.push('/login')}
        activeOpacity={0.85}
      >
        <Text style={styles.loginBtnText}>Go to Login / Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  logo: {
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  loginBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
