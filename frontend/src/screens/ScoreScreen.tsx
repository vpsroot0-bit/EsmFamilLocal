import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../components/Button';
import HostService from '../services/HostService';
import ClientService from '../services/ClientService';
import { Colors, Font, Radius, Shadow, Spacing } from '../theme';
import { CATEGORIES } from '../utils/constants';

type Breakdown = Record<string, { value: string; points: number; reason: string }>;
type Result = { name: string; score: number; breakdown: Breakdown };

export default function ScoreScreen({ navigation, route }: any) {
  const letter: string = route.params?.letter || '';
  const results: Result[] = route.params?.results || [];
  const role: 'host' | 'client' = route.params?.role || 'client';

  const goLobby = () => {
    if (role === 'host') {
      navigation.replace('Host');
    } else {
      navigation.replace('Game', { role: 'client' });
    }
  };

  const goHome = () => {
    if (role === 'host') HostService.stop();
    else ClientService.disconnect();
    navigation.replace('Home');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.letterBadge}>
            <Text style={styles.letterText}>{letter}</Text>
          </View>
          <View>
            <Text style={styles.heading}>نتایج این دور</Text>
            <Text style={styles.subheading}>حرف انتخاب‌شده</Text>
          </View>
        </View>

        {results.map((r, idx) => {
          const rank = idx + 1;
          const isFirst = rank === 1;
          return (
            <View key={r.name + idx} style={[styles.card, isFirst && styles.cardFirst]}>
              <View style={styles.cardHeader}>
                <View style={styles.rankRow}>
                  <Text style={[styles.rank, isFirst && styles.rankGold]}>
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                  </Text>
                  <Text style={styles.playerName}>{r.name}</Text>
                </View>
                <Text style={[styles.scoreBig, isFirst && styles.scoreGold]}>
                  {r.score}
                </Text>
              </View>

              <View style={styles.divider} />

              {CATEGORIES.map(cat => {
                const b = r.breakdown[cat] || { value: '', points: 0, reason: 'خالی' };
                const color =
                  b.points === 10 ? Colors.success :
                  b.points === 5 ? Colors.warning :
                  Colors.textDim;
                return (
                  <View key={cat} style={styles.bdRow}>
                    <Text style={styles.bdCat}>{cat}</Text>
                    <Text style={styles.bdValue} numberOfLines={1}>
                      {b.value || '—'}
                    </Text>
                    <Text style={[styles.bdPoints, { color }]}>
                      {b.points > 0 ? `+${b.points}` : b.reason}
                    </Text>
                  </View>
                );
              })}
            </View>
          );
        })}

        <View style={styles.actions}>
          {role === 'host' ? (
            <Button title="🎲 شروع دور بعدی" onPress={goLobby} />
          ) : (
            <Button title="در انتظار دور بعدی…" disabled onPress={() => {}} />
          )}
          <Button title="بازگشت به خانه" variant="secondary" onPress={goHome} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: Spacing.lg, gap: Spacing.md },

  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  letterBadge: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.soft,
  },
  letterText: { fontFamily: Font.bold, fontSize: 36, color: '#fff', marginTop: -4 },
  heading: { fontFamily: Font.bold, fontSize: 22, color: Colors.text, textAlign: 'right' },
  subheading: { fontFamily: Font.regular, fontSize: 12, color: Colors.textMuted, textAlign: 'right' },

  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.soft,
  },
  cardFirst: {
    borderColor: Colors.warning,
    backgroundColor: '#1c2440',
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  rank: { fontFamily: Font.bold, fontSize: 22, color: Colors.textMuted },
  rankGold: { color: Colors.warning },
  playerName: { fontFamily: Font.bold, fontSize: 17, color: Colors.text },
  scoreBig: { fontFamily: Font.bold, fontSize: 28, color: Colors.accent },
  scoreGold: { color: Colors.warning },

  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },

  bdRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: 6,
  },
  bdCat: { fontFamily: Font.bold, fontSize: 13, color: Colors.textMuted, width: 60, textAlign: 'right' },
  bdValue: { flex: 1, fontFamily: Font.regular, fontSize: 14, color: Colors.text, textAlign: 'right', paddingHorizontal: 8 },
  bdPoints: { fontFamily: Font.bold, fontSize: 13, width: 70, textAlign: 'left' },

  actions: { gap: 10, marginTop: Spacing.md },
});
