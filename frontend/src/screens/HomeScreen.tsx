import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Button from '../components/Button';
import AppModal from '../components/Modal';
import { Colors, Font, Spacing, Radius } from '../theme';

export default function HomeScreen({ navigation }: any) {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>اسم فامیل</Text>
        <Text style={styles.subtitle}>بازی محلی روی Wi-Fi خانگی</Text>
      </View>

      <View style={styles.actions}>
        <Button label="🎮 میزبانی بازی" onPress={() => navigation.navigate('Host')} />
        <Button label="🔗 پیوستن به بازی" variant="secondary" onPress={() => navigation.navigate('Join')} />
        <Button label="⚙️ تنظیمات" variant="ghost" onPress={() => navigation.navigate('Settings')} />
        <Button label="❓ راهنمای بازی" variant="ghost" onPress={() => navigation.navigate('HowToPlay')} />
        <Button label="ℹ️ درباره" variant="ghost" onPress={() => setAboutOpen(true)} />
      </View>

      <AppModal
        visible={aboutOpen}
        onClose={() => setAboutOpen(false)}
        title="اسم فامیل لوکال"
        message={
          'نسخه ۲.۱\n\n' +
          'بازی اسم‌فامیل کاملاً آفلاین روی شبکه‌ی Wi-Fi محلی.\n' +
          'بدون اینترنت، بدون سرور، بدون ثبت‌نام.\n\n' +
          'ساخته‌شده با ❤️ برای دورهمی‌های خانوادگی.'
        }
        buttons={[{ text: 'بستن', variant: 'primary' }]}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.bg,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing.xl * 1.5,
    padding: Spacing.lg,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    color: Colors.text,
    fontFamily: Font.bold,
    fontSize: 36,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.textMuted,
    fontFamily: Font.regular,
    fontSize: 15,
  },
  actions: {
    gap: Spacing.md,
  },
});
