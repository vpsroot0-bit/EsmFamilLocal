import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Button from '../components/Button';
import AppModal from '../components/Modal';
import { Colors, Font, Spacing, Radius } from '../theme';
import ClientService, { Discovered } from '../services/ClientService';
import { loadSettings } from '../utils/settings';

export default function JoinScreen({ navigation }: any) {
  const [name, setName] = useState('بازیکن');
  const [found, setFound] = useState<Discovered[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; title: string; msg: string }>({
    open: false, title: '', msg: '',
  });

  useEffect(() => {
    (async () => {
      const s = await loadSettings();
      if (s.playerName) setName(s.playerName);
    })();

    const seen = new Set<string>();
    ClientService.startDiscovery((svc) => {
      const key = svc.host + ':' + svc.port;
      if (seen.has(key)) return;
      seen.add(key);
      setFound((f) => [...f, svc]);
    });

    const off = ClientService.on((ev) => {
      if (ev.type === 'CONNECTED') {
        setConnecting(null);
        navigation.replace('Game', { mode: 'client', playerName: name });
      } else if (ev.type === 'ERROR') {
        setConnecting(null);
        setModal({ open: true, title: 'خطا در اتصال', msg: String(ev.message || 'نامشخص') });
      }
    });

    return () => {
      off();
      ClientService.stopDiscovery();
    };
  }, [name]);

  const connectTo = (svc: Discovered) => {
    setConnecting(svc.host);
    ClientService.connect(svc.host, svc.port, name);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>پیوستن به بازی</Text>

      <View style={styles.card}>
        <Text style={styles.label}>نام شما</Text>
        <Text style={styles.val}>{name}</Text>
        <Text style={styles.hint}>برای تغییر نام به «تنظیمات» برو.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>میزبان‌های پیداشده ({found.length})</Text>
        {found.length === 0 ? (
          <Text style={styles.empty}>در حال جست‌وجو… مطمئن شو روی همان Wi-Fi هستی.</Text>
        ) : (
          found.map((svc) => (
            <TouchableOpacity
              key={svc.host + ':' + svc.port}
              style={styles.hostRow}
              onPress={() => connectTo(svc)}
              disabled={!!connecting}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.hostName}>{svc.name.replace('EsmFamil_', '')}</Text>
                <Text style={styles.hostAddr}>{svc.host}:{svc.port}</Text>
              </View>
              <Text style={styles.connectTxt}>
                {connecting === svc.host ? '… وصل…' : 'اتصال ←'}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

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
  label: { color: Colors.textMuted, fontFamily: Font.regular, fontSize: 13 },
  val: { color: Colors.text, fontFamily: Font.bold, fontSize: 18 },
  hint: { color: Colors.textDim, fontFamily: Font.regular, fontSize: 12 },
  empty: { color: Colors.textDim, fontFamily: Font.regular, fontSize: 14, textAlign: 'center', paddingVertical: 12 },
  hostRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
  },
  hostName: { color: Colors.text, fontFamily: Font.bold, fontSize: 15, textAlign: 'right' },
  hostAddr: { color: Colors.textDim, fontFamily: Font.regular, fontSize: 12, textAlign: 'right', marginTop: 2 },
  connectTxt: { color: Colors.accent, fontFamily: Font.bold, fontSize: 14 },
});
