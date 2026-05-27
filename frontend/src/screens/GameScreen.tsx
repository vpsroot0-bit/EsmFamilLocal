import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../components/Button';
import Modal from '../components/Modal';
import HostService from '../services/HostService';
import ClientService from '../services/ClientService';
import { Colors, Font, Radius, Shadow, Spacing } from '../theme';
import { CATEGORIES } from '../utils/constants';

type Role = 'host' | 'client';

export default function GameScreen({ navigation, route }: any) {
  const role: Role = route.params?.role || 'client';

  const [letter, setLetter] = useState<string>('');
  const [endsAt, setEndsAt] = useState<number>(0);
  const [remaining, setRemaining] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [locked, setLocked] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [waitingForResults, setWaitingForResults] = useState(false);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const submittedRef = useRef(false);

  // ----- Hydrate round state on mount (CRITICAL FIX) -----
  // Previously the host could miss its own ROUND_START because the listener
  // was attached after the broadcast. Now we read the current snapshot directly.
  useEffect(() => {
    const snap = role === 'host'
      ? HostService.getCurrentRound()
      : ClientService.getCurrentRound();

    if (snap) {
      setLetter(snap.letter);
      setEndsAt(snap.endsAt);
      setRemaining(Math.max(0, Math.ceil((snap.endsAt - Date.now()) / 1000)));
    }
  }, [role]);

  // ----- Subscribe to live events -----
  useEffect(() => {
    const handle = (ev: any) => {
      if (ev.type === 'ROUND_START') {
        setLetter(ev.letter);
        setEndsAt(ev.endsAt);
        setRemaining(Math.max(0, Math.ceil((ev.endsAt - Date.now()) / 1000)));
        setAnswers({});
        setLocked(false);
        setWaitingForResults(false);
        submittedRef.current = false;
      } else if (ev.type === 'STOP_TRIGGERED') {
        // Someone stopped. Lock UI, auto-submit current answers, wait for ROUND_END.
        setLocked(true);
        setWaitingForResults(true);
        submitOnce();
      } else if (ev.type === 'ROUND_END') {
        setWaitingForResults(false);
        navigation.replace('Score', { letter: ev.letter, results: ev.results, role });
      } else if (ev.type === 'DISCONNECTED' && role === 'client') {
        navigation.replace('Home');
      }
    };

    const off = role === 'host' ? HostService.on(handle) : ClientService.on(handle);
    return () => { off(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // ----- Countdown ticker -----
  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => {
      const r = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRemaining(r);
      if (r === 0) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [endsAt]);

  // ----- Hardware back button: confirm exit -----
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowExitConfirm(true);
      return true;
    });
    return () => sub.remove();
  }, []);

  const submitOnce = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (role === 'host') {
      HostService.submitHostAnswers(answersRef.current);
    } else {
      ClientService.submitAnswers(answersRef.current);
    }
  };

  const onStopPressed = () => setShowStopConfirm(true);

  const confirmStop = () => {
    setShowStopConfirm(false);
    submitOnce();
    if (role === 'host') {
      HostService.requestStop();
    } else {
      ClientService.sendStop();
    }
  };

  const confirmExit = () => {
    setShowExitConfirm(false);
    if (role === 'host') HostService.stop();
    else ClientService.disconnect();
    navigation.replace('Home');
  };

  const setAnswer = (cat: string, val: string) =>
    setAnswers(prev => ({ ...prev, [cat]: val }));

  const timerColor = useMemo(() => {
    if (remaining <= 10) return Colors.danger;
    if (remaining <= 30) return Colors.warning;
    return Colors.accent;
  }, [remaining]);

  // ----- Loading state: round hasn't started broadcasting to us yet -----
  if (!letter) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.centered}>
          <Text style={styles.bigMuted}>در انتظار شروع دور…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.headerCard}>
        <View style={styles.letterBadge}>
          <Text style={styles.letterText}>{letter}</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <Text style={styles.timerLabel}>زمان باقی‌مانده</Text>
          <Text style={[styles.timerValue, { color: timerColor }]}>{remaining}s</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      >
        {CATEGORIES.map(cat => (
          <View key={cat} style={styles.row}>
            <Text style={styles.rowLabel}>{cat}</Text>
            <TextInput
              style={[styles.rowInput, locked && styles.rowInputLocked]}
              value={answers[cat] || ''}
              onChangeText={(t) => setAnswer(cat, t)}
              editable={!locked}
              placeholder={`با «${letter}» شروع شود`}
              placeholderTextColor={Colors.textDim}
              maxLength={30}
            />
          </View>
        ))}

        <View style={{ height: Spacing.lg }} />

        <Button
          title={waitingForResults ? 'در حال جمع‌آوری پاسخ‌ها…' : '🛑 استاپ! (پایان دور)'}
          variant="danger"
          loading={waitingForResults}
          disabled={locked}
          onPress={onStopPressed}
        />
      </ScrollView>

      <Modal
        visible={showStopConfirm}
        title="پایان دور؟"
        message="با زدن استاپ، دور برای همه‌ی بازیکنان به‌پایان می‌رسد و پاسخ‌ها نمره‌دهی می‌شوند."
        confirmText="بله، استاپ"
        cancelText="ادامه می‌دهم"
        variant="danger"
        onConfirm={confirmStop}
        onCancel={() => setShowStopConfirm(false)}
      />

      <Modal
        visible={showExitConfirm}
        title="خروج از بازی؟"
        message={role === 'host'
          ? 'با خروج، میزبانی پایان می‌یابد و همه‌ی بازیکنان قطع می‌شوند.'
          : 'با خروج از بازی، اتصال شما به میزبان قطع می‌شود.'}
        confirmText="بله، خارج شو"
        cancelText="در بازی می‌مانم"
        variant="danger"
        onConfirm={confirmExit}
        onCancel={() => setShowExitConfirm(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bigMuted: { fontFamily: Font.bold, fontSize: 18, color: Colors.textMuted },

  headerCard: {
    margin: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.card,
  },
  letterBadge: {
    width: 76, height: 76,
    borderRadius: 38,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.soft,
  },
  letterText: { fontFamily: Font.bold, fontSize: 44, color: '#fff', marginTop: -4 },
  timerLabel: { fontFamily: Font.regular, fontSize: 12, color: Colors.textMuted },
  timerValue: { fontFamily: Font.bold, fontSize: 30, marginTop: 2 },

  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, gap: 10 },

  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 54,
  },
  rowLabel: {
    fontFamily: Font.bold,
    fontSize: 14,
    color: Colors.accent,
    width: 64,
    textAlign: 'right',
  },
  rowInput: {
    flex: 1,
    fontFamily: Font.regular,
    fontSize: 16,
    color: Colors.text,
    textAlign: 'right',
    paddingHorizontal: Spacing.sm,
  },
  rowInputLocked: { color: Colors.textMuted },
});
