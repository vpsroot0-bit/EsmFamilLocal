import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../components/Button';
import ClientService, { Discovered } from '../services/ClientService';
import { Colors, Font, Radius, Shadow, Spacing } from '../theme';
import { PORT } from '../utils/constants';
import { loadSettings, saveSettings } from '../utils/settings';

export default function JoinScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [manualHost, setManualHost] = useState('');
  const [discovered, setDiscovered] = useState<Discovered[]>([]);
  const [connecting, setConnecting] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadSettings().then(s => {
      if (isMounted.current && s.playerName) setName(s.playerName);
    });

    ClientService.startDiscovery((s) => {
      if (!isMounted.current) return;
      setDiscovered(prev => {
        if (prev.find(x => x.host === s.host && x.port === s.port)) return prev;
        return [...prev, s];
      });
    });

    const off = ClientService.on((ev: any) => {
      if (!isMounted.current) return;
      if (ev.type === 'CONNECTED') {
        setConnecting(false);
        // Persist name for next time.
        saveSettings({ playerName: name.trim() }).catch(() => {});
        navigation.replace('Game', { role: 'client' });
      } else if (ev.type === 'ERROR') {
        setConnecting(false);
        Alert.alert('خطا در اتصال', ev.message || '');
      } else if (ev.type === 'DISCONNECTED' && connecting) {
        setConnecting(false);
        Alert.alert('قطع اتصال', 'اتصال به میزبان برقرار نشد.');
      }
    });

    return () => {
      isMounted.current = false;
      ClientService.stopDiscovery();
      off();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectTo = (host: string, port: number) => {
    if (!name.trim()) {
      Alert.alert('خطا', 'لطفاً نام خود را وارد کنید.');
      return;
    }
    setConnecting(true);
    ClientService.connect(host, port, name.trim());
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.label}>نام شما</Text>
          <TextInput
            style={styles.input}
            placeholder="مثلاً سارا"
            placeholderTextColor={Colors.textDim}
            value={name}
            onChangeText={setName}
            maxLength={20}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>بازی‌های پیدا شده در شبکه</Text>
          {discovered.length === 0 ? (
            <Text style={styles.muted}>در حال جستجو…</Text>
          ) : (
            discovered.map((s) => (
              <Pressable
                key={s.host + s.port}
                style={styles.discoverRow}
                onPress={() => connectTo(s.host, s.port)}
              >
                <View>
                  <Text style={styles.gameName}>{s.name.replace('EsmFamil_', '')}</Text>
                  <Text style={styles.gameAddr}>{s.host}:{s.port}</Text>
                </View>
                <Text style={styles.joinTag}>پیوستن →</Text>
              </Pressable>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>اتصال دستی با IP</Text>
          <TextInput
            style={styles.input}
            placeholder="192.168.1.10"
            placeholderTextColor={Colors.textDim}
            value={manualHost}
            onChangeText={setManualHost}
            keyboardType="numeric"
            autoCapitalize="none"
          />
          <Button
            title={connecting ? 'در حال اتصال…' : 'اتصال'}
            loading={connecting}
            onPress={() => manualHost && connectTo(manualHost.trim(), PORT)}
          />
        </View>
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
  title: { fontFamily: Font.bold, fontSize: 16, color: Colors.text, textAlign: 'right' },
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
  muted: { fontFamily: Font.regular, fontSize: 14, color: Colors.textMuted, textAlign: 'right' },

  discoverRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  gameName: { fontFamily: Font.bold, fontSize: 16, color: Colors.text, textAlign: 'right' },
  gameAddr: { fontFamily: Font.regular, fontSize: 12, color: Colors.textDim, textAlign: 'right', marginTop: 2 },
  joinTag: { fontFamily: Font.bold, fontSize: 14, color: Colors.accent },
});
