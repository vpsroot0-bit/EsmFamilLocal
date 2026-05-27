import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NetworkInfo } from 'react-native-network-info';

import Button from '../components/Button';
import HostService from '../services/HostService';
import { Colors, Font, Radius, Shadow, Spacing } from '../theme';
import { loadSettings } from '../utils/settings';

export default function HostScreen({ navigation }: any) {
  const [started, setStarted] = useState(false);
  const [hostName, setHostName] = useState('');
  const [players, setPlayers] = useState<{ id: string; name: string }[]>([]);
  const [ip, setIp] = useState<string | null>(null);
  const [roundSeconds, setRoundSeconds] = useState(90);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadSettings().then(s => {
      if (!isMounted.current) return;
      setRoundSeconds(s.roundSeconds);
      if (s.playerName) setHostName(s.playerName);
    });
    NetworkInfo.getIPV4Address().then(addr => {
      if (isMounted.current) setIp(addr || null);
    });
    return () => { isMounted.current = false; };
  }, []);

  // Subscribe to host events. CRITICAL: we DO NOT navigate away on ROUND_START here.
  // GameScreen pulls round state directly from HostService.getCurrentRound() on mount.
  useEffect(() => {
    const off = HostService.on((ev: any) => {
      if (ev.type === 'LOBBY') setPlayers(ev.players || []);
    });
    return () => { off(); };
  }, []);

  // Cleanup host server only if user leaves AND we haven't transitioned to Game.
  // We rely on explicit navigation; HostService persists across the navigation stack.
  // Server is fully torn down only when user explicitly taps "پایان میزبانی".

  const start = async () => {
    if (!hostName.trim()) {
      Alert.alert('خطا', 'لطفاً نام میزبان را وارد کنید.');
      return;
    }
    try {
      await HostService.start(hostName.trim());
      setStarted(true);
    } catch (e: any) {
      Alert.alert('خطا در راه‌اندازی', String(e?.message || e));
    }
  };

  const stopHosting = () => {
    HostService.stop();
    setStarted(false);
    setPlayers([]);
    navigation.goBack();
  };

  const startRound = () => {
    if (players.length < 1) {
      Alert.alert('بازیکنی نیست', 'حداقل یک بازیکن لازم است.');
      return;
    }
    // 1) Navigate FIRST so GameScreen mounts and subscribes.
    navigation.navigate('Game', { role: 'host' });
    // 2) Start the round on next tick so the GameScreen listener is ready
    //    to receive STOP_TRIGGERED/ROUND_END, and so getCurrentRound() returns the snapshot.
    setTimeout(() => HostService.startRound(roundSeconds), 50);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        {!started ? (
          <View style={styles.card}>
            <Text style={styles.label}>نام شما (میزبان)</Text>
            <TextInput
              style={styles.input}
              placeholder="مثلاً علی"
              placeholderTextColor={Colors.textDim}
              value={hostName}
              onChangeText={setHostName}
              maxLength={20}
            />
            <Button title="شروع میزبانی" onPress={start} />
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.title}>منتظر بازیکن‌ها…</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>آدرس IP این دستگاه</Text>
                <Text style={styles.infoValue}>{ip || '—'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>مدت هر دور</Text>
                <Text style={styles.infoValue}>{roundSeconds} ثانیه</Text>
              </View>
              <Text style={styles.hint}>
                بازیکن‌ها از بخش «پیوستن به بازی» می‌توانند بازی شما را پیدا کنند.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>بازیکنان متصل ({players.length})</Text>
              {players.length === 0 ? (
                <Text style={styles.muted}>هنوز کسی وصل نشده است…</Text>
              ) : (
                players.map(p => (
                  <View key={p.id} style={styles.playerRow}>
                    <Text style={styles.playerName}>{p.name}</Text>
                    <Text style={styles.playerTag}>{p.id === 'host' ? 'میزبان' : 'متصل'}</Text>
                  </View>
                ))
              )}
            </View>

            <View style={{ gap: 12 }}>
              <Button title="🎲 شروع دور جدید" onPress={startRound} />
              <Button title="پایان میزبانی" variant="danger" onPress={stopHosting} />
            </View>
          </>
        )}
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
  title: { fontFamily: Font.bold, fontSize: 18, color: Colors.text, textAlign: 'right' },
  label: { fontFamily: Font.bold, fontSize: 14, color: Colors.textMuted, textAlign: 'right' },
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
    marginBottom: Spacing.sm,
  },
  hint: { fontFamily: Font.regular, fontSize: 12, color: Colors.textDim, textAlign: 'right', marginTop: 6 },
  muted: { fontFamily: Font.regular, fontSize: 14, color: Colors.textMuted, textAlign: 'right' },

  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: { fontFamily: Font.regular, fontSize: 13, color: Colors.textMuted },
  infoValue: { fontFamily: Font.bold, fontSize: 15, color: Colors.accent },

  playerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  playerName: { fontFamily: Font.bold, fontSize: 15, color: Colors.text },
  playerTag: { fontFamily: Font.regular, fontSize: 12, color: Colors.success },
});
