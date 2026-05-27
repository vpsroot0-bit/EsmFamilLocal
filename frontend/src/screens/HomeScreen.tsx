import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../components/Button';
import { Colors, Font, Radius, Shadow, Spacing } from '../theme';
import { requestNetworkPermissions } from '../utils/permissions';

export default function HomeScreen({ navigation }: any) {
  useFocusEffect(useCallback(() => {
    requestNetworkPermissions();
  }, []));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>ف</Text>
          </View>
          <Text style={styles.appTitle}>اسم فامیل</Text>
          <Text style={styles.subtitle}>بازی محلی · بدون اینترنت · با دوستان</Text>
        </View>

        <View style={styles.actions}>
          <Button title="🎮 ساخت بازی (میزبان)" onPress={() => navigation.navigate('Host')} />
          <Button
            title="🔗 پیوستن به بازی"
            variant="secondary"
            onPress={() => navigation.navigate('Join')}
          />
        </View>

        <View style={styles.cardsRow}>
          <Pressable style={styles.smallCard} onPress={() => navigation.navigate('HowToPlay')}>
            <Text style={styles.smallCardIcon}>📖</Text>
            <Text style={styles.smallCardLabel}>راهنمای بازی</Text>
          </Pressable>
          <Pressable style={styles.smallCard} onPress={() => navigation.navigate('Settings')}>
            <Text style={styles.smallCardIcon}>⚙️</Text>
            <Text style={styles.smallCardLabel}>تنظیمات</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>
          همه‌ی دستگاه‌ها باید روی یک شبکه‌ی Wi-Fi باشند.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: {
    flexGrow: 1,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  logoCircle: {
    width: 110, height: 110,
    borderRadius: 55,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.card,
    marginBottom: Spacing.lg,
  },
  logoText: { fontFamily: Font.bold, fontSize: 64, color: '#fff', marginTop: -8 },
  appTitle: { fontFamily: Font.bold, fontSize: 36, color: Colors.text },
  subtitle: {
    fontFamily: Font.regular, fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
  },

  actions: { gap: 14, marginVertical: Spacing.xl },

  cardsRow: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginBottom: Spacing.lg,
  },
  smallCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  smallCardIcon: { fontSize: 26, marginBottom: 6 },
  smallCardLabel: { fontFamily: Font.bold, fontSize: 14, color: Colors.text },

  footer: {
    fontFamily: Font.regular,
    fontSize: 12,
    color: Colors.textDim,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
});
