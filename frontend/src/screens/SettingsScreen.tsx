import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../components/Button';
import { Colors, Font, Radius, Shadow, Spacing } from '../theme';
import { loadSettings, saveSettings } from '../utils/settings';
import { MIN_ROUND_SECONDS, MAX_ROUND_SECONDS } from '../utils/constants';

export default function SettingsScreen({ navigation }: any) {
  const [roundSeconds, setRoundSeconds] = useState('90');
  const [playerName, setPlayerName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings().then(s => {
      setRoundSeconds(String(s.roundSeconds));
      setPlayerName(s.playerName);
    });
  }, []);

  const onSave = async () => {
    const secs = parseInt(roundSeconds, 10);
    if (!Number.isFinite(secs) || secs < MIN_ROUND_SECONDS || secs > MAX_ROUND_SECONDS) {
      Alert.alert(
        'مقدار نامعتبر',
        `مدت دور باید بین ${MIN_ROUND_SECONDS} تا ${MAX_ROUND_SECONDS} ثانیه باشد.`
      );
      return;
    }
    setSaving(true);
    try {
      await saveSettings({ roundSeconds: secs, playerName: playerName.trim() });
      Alert.alert('ذخیره شد', 'تنظیمات با موفقیت ذخیره شد.');
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.label}>نام پیش‌فرض شما</Text>
          <Text style={styles.hint}>برای صرفه‌جویی در زمان، نام شما در دفعات بعد به‌صورت خودکار پر می‌شود.</Text>
          <TextInput
            style={styles.input}
            value={playerName}
            onChangeText={setPlayerName}
            placeholder="مثلاً علی"
            placeholderTextColor={Colors.textDim}
            maxLength={20}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>مدت هر دور (ثانیه)</Text>
          <Text style={styles.hint}>
            بین {MIN_ROUND_SECONDS} تا {MAX_ROUND_SECONDS} ثانیه. مقدار پیش‌فرض ۹۰ ثانیه است.
          </Text>
          <TextInput
            style={styles.input}
            value={roundSeconds}
            onChangeText={setRoundSeconds}
            placeholder="90"
            placeholderTextColor={Colors.textDim}
            keyboardType="numeric"
            maxLength={3}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>درباره</Text>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutKey}>نسخه</Text>
            <Text style={styles.aboutVal}>2.0.0</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutKey}>نوع شبکه</Text>
            <Text style={styles.aboutVal}>Local Wi-Fi (LAN)</Text>
          </View>
        </View>

        <Button title="ذخیره" loading={saving} onPress={onSave} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: Spacing.lg, gap: Spacing.md },

  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.soft,
    gap: Spacing.sm,
  },
  label: { fontFamily: Font.bold, fontSize: 15, color: Colors.text, textAlign: 'right' },
  hint: { fontFamily: Font.regular, fontSize: 12, color: Colors.textMuted, textAlign: 'right' },
  input: {
    backgroundColor: Colors.bgElevated,
    color: Colors.text,
    fontFamily: Font.regular,
    fontSize: 16,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.border,
    textAlign: 'right',
  },

  aboutRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  aboutKey: { fontFamily: Font.regular, fontSize: 13, color: Colors.textMuted },
  aboutVal: { fontFamily: Font.bold, fontSize: 13, color: Colors.text },
});
