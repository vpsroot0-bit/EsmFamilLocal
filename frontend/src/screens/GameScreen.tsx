import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, BackHandler } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import Button from '../components/Button';
import HostService from '../services/HostService';
import ClientService from '../services/ClientService';
import { CATEGORIES, ROUND_DURATION_MS } from '../utils/constants';

type Props = NativeStackScreenProps<RootStackParamList, 'Game'>;

export default function GameScreen({ navigation, route }: Props) {
  const { role, name } = route.params;
  const [letter, setLetter] = useState<string>('');
  const [endsAt, setEndsAt] = useState<number>(0);
  const [now, setNow] = useState(Date.now());
  const [answers, setAnswers] = useState<Record<string,string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [waiting, setWaiting] = useState(true);

  const handler = (ev: any) => {
    if (ev.type === 'ROUND_START') {
      setLetter(ev.letter);
      setEndsAt(ev.endsAt || Date.now() + (ev.durationMs || ROUND_DURATION_MS));
      setAnswers({});
      setSubmitted(false);
      setWaiting(false);
    } else if (ev.type === 'ROUND_END') {
      navigation.replace('Score', { results: ev.results, role, name });
    }
  };

  useEffect(() => {
    const off = role === 'host' ? HostService.on(handler) : ClientService.on(handler);
    const i = setInterval(() => setNow(Date.now()), 500);
    const back = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => { off(); clearInterval(i); back.remove(); };
  }, []);

  const secondsLeft = useMemo(() => Math.max(0, Math.ceil((endsAt - now) / 1000)), [endsAt, now]);

  useEffect(() => {
    if (!submitted && endsAt && now >= endsAt) doSubmit();
  }, [now, endsAt]);

  const setField = (cat: string, v: string) => setAnswers(prev => ({ ...prev, [cat]: v }));

  const doSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    if (role === 'host') {
      HostService.submitHostAnswers(answers);
      HostService.endRound();
    } else {
      ClientService.submitAnswers(answers);
    }
  };

  if (waiting) {
    return (
      <View style={styles.center}>
        <Text style={styles.waiting}>در انتظار شروع دور توسط میزبان…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.letter}>{letter}</Text>
        <Text style={styles.timer}>{secondsLeft} ثانیه</Text>
      </View>

      {CATEGORIES.map(cat => (
        <View key={cat} style={styles.row}>
          <Text style={styles.cat}>{cat}</Text>
          <TextInput
            style={styles.input}
            value={answers[cat] || ''}
            onChangeText={(v) => setField(cat, v)}
            editable={!submitted}
            placeholder={`با حرف ${letter}`}
            placeholderTextColor="#475569"
          />
        </View>
      ))}

      <Button title={submitted ? 'ارسال شد ✓' : (role==='host' ? 'پایان دور (ارسال همه)' : 'ارسال جواب‌ها')} onPress={doSubmit} disabled={submitted}/>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding:20 },
  center: { flex:1, alignItems:'center', justifyContent:'center', padding:20 },
  waiting: { color:'#94a3b8', fontSize:18, fontFamily:'Vazir' },
  header: { flexDirection:'row-reverse', justifyContent:'space-between', alignItems:'center', marginBottom:16, backgroundColor:'#1e293b', padding:14, borderRadius:14 },
  letter: { color:'#10b981', fontSize:50, fontFamily:'Vazir' },
  timer: { color:'#fff', fontSize:22, fontFamily:'Vazir' },
  row: { marginBottom:10 },
  cat: { color:'#cbd5e1', fontSize:16, marginBottom:4, fontFamily:'Vazir' },
  input: { backgroundColor:'#1e293b', color:'#fff', padding:12, borderRadius:10, fontSize:18, fontFamily:'Vazir', textAlign:'right' },
});
