import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Switch } from 'react-native';
import Button from '../components/Button';
import AppModal from '../components/Modal';
import { Colors, Font, Spacing, Radius } from '../theme';
import { loadSettings, saveSettings } from '../utils/settings';
import {
  MIN_ROUND_SECONDS, MAX_ROUND_SECONDS,
  MIN_ROUNDS, MAX_ROUNDS,
} from '../utils/constants';
import { setSoundEnabled, play } from '../utils/sounds';

export default function SettingsScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [secStr, setSecStr] = useState('90');
  const [roundsStr, setRoundsStr] = useState('5');
  const [sound, setSound] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; title: string; msg: string }>({
    open: false, title: '', msg: '',
  });

  useEffect(() => {
    (async () => {
      const s = await loadSettings();
      setName(s.playerName);
      setSecStr(String(s.roundSeconds));
      setRoundsStr(String(s.totalRounds));
      setSound(s.soundEnabled);
    })();
  }, []);

  const save = async () => {
    const sec = parseInt(secStr, 10);
    const rounds = parseInt(roundsStr, 10);

    if (!Number.isFinite(sec) || sec < MIN_ROUND_SECONDS || sec > MAX_ROUND_SECONDS) {
      setModal({
        open: true,
        title: 'مقدار نامعتبر',
        msg: `زمان هر دور باید بین ${MIN_ROUND_SECONDS} تا ${MAX_ROUND_SECONDS} ثانیه باشد.`,
      });
      return;
    }
    if (!Number.isFinite(rounds) || rounds < MIN_ROUNDS || rounds > MAX_ROUNDS) {
      setModal({
        open: true,
        title: 'مقدار نامعتبر',
        msg: `تعداد دور باید بین ${MIN_ROUNDS} تا ${MAX_ROUNDS} باشد.`,
      });
      return;
    }

    await saveSettings({
      playerName: name.trim(),
      roundSeconds: sec,
      totalRounds: rounds,
      soundEnabled: sound,
    });
    setSoundEnabled(sound);

    setModal({ open: true, title: '✅ ذخیره شد', msg: 'تنظیمات با موفقیت ذخیره شدند.' });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>تنظیمات</Text>

      <View style={styles.card}>
        <Text style={styles.label}>نام نمایشی</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="مثلاً علی"
          placeholderTextColor={Colors.textDim}
          maxLength={20}
        />

        <Text style={styles.label}>زمان هر دور (ثانیه)</Text>
        <TextInput
          style={styles.input}
          value={secStr}
          onChangeText={setSecStr}
          keyboardType="number-pad"
          placeholder="90"
          placeholderTextColor={Colors.textDim}
          maxLength={3}
        />
        <Text style={styles.hint}>
          مقدار بین {MIN_ROUND_SECONDS} تا {MAX_ROUND_SECONDS} ثانیه.
        </Text>

        <Text style={styles.label}>تعداد دور مسابقه</Text>
        <TextInput
          style={styles.input}
          value={roundsStr}
          onChangeText={setRoundsStr}
          keyboardType="number-pad"
          placeholder="5"
          placeholderTextColor={Colors.textDim}
          maxLength={2}
        />
        <Text style={styles.hint}>
          مقدار بین {MIN_ROUNDS} تا {MAX_ROUNDS} دور. در پایان آخرین دور رتبه‌بندی نهایی نمایش داده می‌شود.
        </Text>

        <View style={styles.switchRow}>
          <Text style={styles.label}>🔊 افکت‌های صوتی</Text>
          <Switch
            value={sound}
            onValueChange={(v) => {
              setSound(v);
              setSoundEnabled(v);
              if (v) play('tick');
            }}
            thumbColor={sound ? Colors.primary : Colors.textDim}
            trackColor={{ false: Colors.card, true: Colors.primaryDark }}
          />
        </View>
      </View>

      <Button label="💾 ذخیره" onPress={save} />
      <Button label="بازگشت" variant="ghost" onPress={() => navigation.goBack()} />

      <AppModal
        visible={modal.open}
        title={modal.title}
        message={modal.msg}
        onClose={() => setModal({ ...modal, open: false })}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.bg, padding: Spacing.lg, gap: Spacing.md },
  h1: { color: Colors.text, fontFamily: Font.bold, fontSize: 24, textAlign: 'center' },
  card: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  label: { color: Colors.textMuted, fontFamily: Font.bold, fontSize: 13, marginTop: 4 },
  input: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text,
    fontFamily: Font.regular,
    fontSize: 16,
    textAlign: 'right',
  },
  hint: { color: Colors.textDim, fontFamily: Font.regular, fontSize: 12 },
  switchRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
});
