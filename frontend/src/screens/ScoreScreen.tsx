import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Button from '../components/Button';
import { Colors, Font, Spacing, Radius } from '../theme';
import HostService from '../services/HostService';
import { play } from '../utils/sounds';

type Result = {
  id: string;
  name: string;
  score: number;
  breakdown: Record<string, { value: string; points: number; reason: string }>;
};

type Standing = { id: string; name: string; total: number };

export default function ScoreScreen({ route, navigation }: any) {
  const mode: 'host' | 'client' = route.params?.mode || 'client';
  const results: Result[] = route.params?.results || [];
  const letter: string = route.params?.letter || '';
  const index: number = route.params?.index || 1;
  const total: number = route.params?.total || 1;
  const isLast: boolean = !!route.params?.isLast;
  const standings: Standing[] = route.params?.standings || [];

  useEffect(() => {
    if (isLast) play('win');
  }, [isLast]);

  const nextRound = () => {
    const ok = HostService.startRound(90); // duration is taken from settings on Host; keep simple here
    if (ok) navigation.replace('Game', { mode: 'host' });
  };

  const finishToHome = () => {
    HostService.stop();
    navigation.popToTop();
  };

  const trophy = (i: number) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.h1}>
          {isLast ? '🏆 پایان مسابقه' : `پایان دور ${index} از ${total}`}
        </Text>
        <Text style={styles.sub}>حرف این دور: {letter}</Text>
      </View>

      <Text style={styles.sectionTitle}>نتیجه‌ی این دور</Text>
      {results.map((r, i) => (
        <View key={r.id} style={styles.playerCard}>
          <View style={styles.playerHead}>
            <Text style={styles.playerName}>{trophy(i)} {r.name}</Text>
            <Text style={styles.playerScore}>{r.score}</Text>
          </View>
          <View style={styles.breakdown}>
            {Object.entries(r.breakdown).map(([cat, b]) => (
              <View key={cat} style={styles.brRow}>
                <Text style={styles.brCat}>{cat}</Text>
                <Text style={styles.brVal}>{b.value || '—'}</Text>
                <Text style={[
                  styles.brPts,
                  b.points === 10 && { color: Colors.success },
                  b.points === 5 && { color: Colors.warning },
                  b.points === 0 && { color: Colors.textDim },
                ]}>
                  {b.points}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      {standings.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>
            {isLast ? '🏆 رتبه‌بندی نهایی' : '📊 رتبه‌بندی کل تا اینجا'}
          </Text>
          <View style={styles.standCard}>
            {standings.map((s, i) => (
              <View
                key={s.id}
                style={[styles.standRow, i === 0 && isLast && styles.standWinner]}
              >
                <Text style={styles.standRank}>{trophy(i)}</Text>
                <Text style={styles.standName}>{s.name}</Text>
                <Text style={styles.standTotal}>{s.total}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {mode === 'host' ? (
        isLast ? (
          <Button label="🏠 بازگشت به صفحه‌ی اصلی" onPress={finishToHome} />
        ) : (
          <>
            <Button label={`▶️ شروع دور ${index + 1}`} onPress={nextRound} />
            <Button label="پایان مسابقه" variant="ghost" onPress={finishToHome} />
          </>
        )
      ) : (
        <Text style={styles.waitMsg}>
          {isLast
            ? 'منتظر بازگشت میزبان به صفحه‌ی اصلی…'
            : 'منتظر شروع دور بعدی توسط میزبان…'}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.bg, padding: Spacing.lg, gap: Spacing.md },
  headerCard: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  h1: { color: Colors.text, fontFamily: Font.bold, fontSize: 22, marginBottom: 4 },
  sub: { color: Colors.textMuted, fontFamily: Font.regular, fontSize: 14 },
  sectionTitle: {
    color: Colors.text,
    fontFamily: Font.bold,
    fontSize: 17,
    marginTop: Spacing.sm,
    textAlign: 'right',
  },
  playerCard: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  playerHead: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerName: { color: Colors.text, fontFamily: Font.bold, fontSize: 16 },
  playerScore: {
    color: Colors.accent,
    fontFamily: Font.bold,
    fontSize: 22,
    minWidth: 50,
    textAlign: 'left',
  },
  breakdown: { gap: 4 },
  brRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  brCat: { color: Colors.textMuted, fontFamily: Font.regular, fontSize: 13, width: 70 },
  brVal: { flex: 1, color: Colors.text, fontFamily: Font.regular, fontSize: 14, textAlign: 'right' },
  brPts: { fontFamily: Font.bold, fontSize: 14, width: 30, textAlign: 'left' },
  standCard: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    gap: 4,
  },
  standRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 10,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    gap: Spacing.sm,
  },
  standWinner: { backgroundColor: 'rgba(245,158,11,0.18)', borderWidth: 1, borderColor: Colors.warning },
  standRank: { color: Colors.text, fontFamily: Font.bold, fontSize: 18, width: 32 },
  standName: { flex: 1, color: Colors.text, fontFamily: Font.bold, fontSize: 15 },
  standTotal: { color: Colors.accent, fontFamily: Font.bold, fontSize: 18 },
  waitMsg: {
    color: Colors.textMuted,
    fontFamily: Font.regular,
    fontSize: 14,
    textAlign: 'center',
    padding: Spacing.md,
  },
});
