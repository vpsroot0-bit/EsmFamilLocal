import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, BackHandler,
} from 'react-native';
import Button from '../components/Button';
import AppModal from '../components/Modal';
import { Colors, Font, Spacing, Radius } from '../theme';
import HostService from '../services/HostService';
import ClientService from '../services/ClientService';
import { CATEGORIES } from '../utils/constants';
import { play } from '../utils/sounds';

type Mode = 'host' | 'client';

export default function GameScreen({ route, navigation }: any) {
  const mode: Mode = route.params?.mode || 'client';
  const myName: string = route.params?.hostName || route.params?.playerName || 'بازیکن';

  const [letter, setLetter] = useState<string>('');
  const [roundIdx, setRoundIdx] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [stopping, setStopping] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const lastTickRef = useRef(0);

  useEffect(() => {
    const svc: any = mode === 'host' ? HostService : ClientService;

    // sync if mid-round
    const cur = svc.getCurrentRound?.();
    if (cur) applyRoundStart(cur.letter, cur.endsAt, cur.index, cur.total);

    const off = svc.on((ev: any) => {
      if (ev.type === 'ROUND_START') {
        applyRoundStart(ev.letter, ev.endsAt, ev.index, ev.total);
      } else if (ev.type === 'STOP_TRIGGERED') {
        setStopping(true);
        play('stop');
        submitMine();
      } else if (ev.type === 'ROUND_END') {
        navigation.replace('Score', {
          mode,
          results: ev.results,
          letter: ev.letter,
          index: ev.index,
          total: ev.total,
          isLast: ev.isLast,
          standings: ev.standings,
        });
      }
    });

    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      setExitOpen(true);
      return true;
    });

    return () => {
      off();
      back.remove();
    };
  }, []);

  const applyRoundStart = (l: string, endsAt: number, idx: number, total: number) => {
    setLetter(l);
    setRoundIdx(idx);
    setTotalRounds(total);
    setAnswers({});
    setStopping(false);
    tickLoop(endsAt);
  };

  const tickLoop = (endsAt: number) => {
    const update = () => {
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRemaining(left);
      if (left > 0 && left <= 5 && left !== lastTickRef.current) {
        lastTickRef.current = left;
        play('tick');
      }
    };
    update();
    const id = setInterval(() => {
      update();
      if (Date.now() >= endsAt) clearInterval(id);
    }, 250);
  };

  const setField = (cat: string, val: string) => {
    setAnswers((a) => ({ ...a, [cat]: val }));
  };

  const submitMine = () => {
    if (mode === 'host') HostService.submitHostAnswers(answers);
    else ClientService.submitAnswers(answers);
  };

  const onStop = () => {
    submitMine();
    if (mode === 'host') HostService.requestStop();
    else ClientService.sendStop();
  };

  const confirmExit = () => {
    if (mode === 'host') HostService.stop();
    else ClientService.disconnect();
    navigation.popToTop();
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View style={styles.letterBox}>
          <Text style={styles.letterLbl}>حرف</Text>
          <Text style={styles.letter}>{letter || '…'}</Text>
        </View>
        <View style={styles.metaCol}>
          <Text style={styles.metaLbl}>دور</Text>
          <Text style={styles.metaVal}>{roundIdx}/{totalRounds}</Text>
        </View>
        <View style={styles.metaCol}>
          <Text style={styles.metaLbl}>زمان</Text>
          <Text style={[styles.metaVal, remaining <= 10 && { color: Colors.danger }]}>
            {remaining}
          </Text>
        </View>
      </View>

      <View style={styles.formCard}>
        {CATEGORIES.map((cat) => (
          <View key={cat} style={styles.field}>
            <Text style={styles.fieldLabel}>{cat}</Text>
            <TextInput
              style={styles.input}
              value={answers[cat] || ''}
              onChangeText={(t) => setField(cat, t)}
              placeholder={`با حرف ${letter}…`}
              placeholderTextColor={Colors.textDim}
              editable={!stopping && remaining > 0}
              maxLength={30}
            />
          </View>
        ))}
      </View>

      <Button
        label={stopping ? '… در حال پایان' : '🛑 استوپ!'}
        variant="danger"
        onPress={onStop}
        disabled={stopping || remaining <= 0}
      />
      <Button label="خروج از بازی" variant="ghost" onPress={() => setExitOpen(true)} />

      <AppModal
        visible={exitOpen}
        title="خروج از بازی"
        message="مطمئنی می‌خواهی از این بازی خارج شوی؟ اتصال قطع می‌شود."
        buttons={[
          { text: 'خروج', variant: 'danger', onPress: confirmExit },
          { text: 'ادامه', variant: 'secondary' },
        ]}
        onClose={() => setExitOpen(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.bg, padding: Spacing.lg, gap: Spacing.md },
  header: {
    flexDirection: 'row-reverse',
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.md,
  },
  letterBox: {
    width: 90,
    height: 90,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterLbl: { color: 'rgba(255,255,255,0.8)', fontFamily: Font.regular, fontSize: 12 },
  letter: { color: '#fff', fontFamily: Font.bold, fontSize: 44, lineHeight: 50 },
  metaCol: { flex: 1, alignItems: 'center' },
  metaLbl: { color: Colors.textMuted, fontFamily: Font.regular, fontSize: 12 },
  metaVal: { color: Colors.text, fontFamily: Font.bold, fontSize: 28 },
  formCard: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  field: { gap: 4 },
  fieldLabel: { color: Colors.textMuted, fontFamily: Font.bold, fontSize: 13 },
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
});
