import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Button from '../components/Button';
import AppModal from '../components/Modal';
import { Colors, Font, Spacing, Radius } from '../theme';
import HostService from '../services/HostService';
import { loadSettings } from '../utils/settings';
import { play } from '../utils/sounds';

export default function HostScreen({ navigation }: any) {
  const [players, setPlayers] = useState<{ id: string; name: string }[]>([]);
  const [hostName, setHostName] = useState('میزبان');
  const [roundSec, setRoundSec] = useState(90);
  const [totalRounds, setTotalRounds] = useState(5);
  const [ready, setReady] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; title: string; msg: string }>({
    open: false, title: '', msg: '',
  });

  useEffect(() => {
    (async () => {
      const s = await loadSettings();
      const name = s.playerName || 'میزبان';
      setHostName(name);
      setRoundSec(s.roundSeconds);
      setTotalRounds(s.totalRounds);
      try {
        await HostService.start(name, s.totalRounds);
        setReady(true);
      } catch (e: any) {
        setModal({ open: true, title: 'خطا در راه‌اندازی', msg: String(e?.message || e) });
      }
    })();

    const off = HostService.on((ev) => {
      if (ev.type === 'LOBBY') {
        const prevCount = players.length;
        setPlayers(ev.players);
        if (ev.players.length > prevCount + 1) {
          // someone joined
          play('join');
        }
      }
    });

    return () => {
      off();
      HostService.stop();
    };
  }, []);

  const startGame = () => {
    play('start');
    const started = HostService.startRound(roundSec);
    if (!started) {
      setModal({ open: true, title: 'مسابقه تمام شده', msg: 'برای شروع دوباره از صفحه‌ی اصلی وارد شو.' });
      return;
    }
    navigation.navigate('Game', { mode: 'host', hostName });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>میزبانی بازی</Text>

      <View style={styles.card}>
        <Text style={styles.label}>نام میزبان</Text>
        <Text style={styles.val}>{hostName}</Text>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>زمان هر دور</Text>
            <Text style={styles.val}>{roundSec} ثانیه</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>تعداد دور</Text>
            <Text style={styles.val}>{totalRounds} دور</Text>
          </View>
        </View>

        <Text style={styles.hint}>برای تغییر این مقادیر به «تنظیمات» برو.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>بازیکنان وصل‌شده ({players.length})</Text>
        {players.length === 0 ? (
          <Text style={styles.empty}>هنوز کسی وصل نشده. منتظر…</Text>
        ) : (
          players.map((p) => (
            <View key={p.id} style={styles.playerRow}>
              <Text style={styles.playerName}>{p.name}</Text>
              <Text style={styles.playerBadge}>وصل</Text>
            </View>
          ))
        )}
      </View>

      <Button
        label={ready ? '▶️ شروع مسابقه' : '… در حال آماده‌سازی'}
        onPress={startGame}
        disabled={!ready || players.length < 1}
      />
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
  row: { flexDirection: 'row-reverse', gap: Spacing.md },
  col: { flex: 1 },
  label: { color: Colors.textMuted, fontFamily: Font.regular, fontSize: 13 },
  val: { color: Colors.text, fontFamily: Font.bold, fontSize: 18 },
  hint: { color: Colors.textDim, fontFamily: Font.regular, fontSize: 12, marginTop: 4 },
  empty: { color: Colors.textDim, fontFamily: Font.regular, fontSize: 14, textAlign: 'center', paddingVertical: 12 },
  playerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
  },
  playerName: { color: Colors.text, fontFamily: Font.bold, fontSize: 15 },
  playerBadge: {
    color: Colors.success,
    fontFamily: Font.bold,
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
});
