import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import Button from '../components/Button';
import HostService from '../services/HostService';
import ClientService from '../services/ClientService';

type Props = NativeStackScreenProps<RootStackParamList, 'Score'>;

export default function ScoreScreen({ navigation, route }: Props) {
  const { results, role } = route.params;
  const sorted = [...results].sort((a, b) => b.score - a.score);

  const nextRound = () => {
    if (role === 'host') {
      HostService.startRound();
      navigation.replace('Game', { role, name: route.params.name });
    }
  };
  const leave = () => {
    if (role === 'host') HostService.stop(); else ClientService.disconnect();
    navigation.popToTop();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>نتیجه دور</Text>
      {sorted.map((r, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.name}>#{i+1}  {r.name}</Text>
            <Text style={styles.score}>{r.score} امتیاز</Text>
          </View>
          {Object.entries(r.answers || {}).map(([k,v]) => (
            <Text key={k} style={styles.ans}>{k}: {String(v) || '—'}</Text>
          ))}
        </View>
      ))}
      {role === 'host' ? (
        <Button title="دور بعدی" onPress={nextRound} />
      ) : (
        <Text style={styles.wait}>در انتظار میزبان برای شروع دور بعدی…</Text>
      )}
      <Button title="خروج از بازی" onPress={leave} variant="danger" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding:20 },
  title: { color:'#fff', fontSize:26, textAlign:'center', marginVertical:14, fontFamily:'Vazir' },
  card: { backgroundColor:'#1e293b', padding:14, borderRadius:14, marginBottom:10 },
  row: { flexDirection:'row-reverse', justifyContent:'space-between', marginBottom:6 },
  name: { color:'#10b981', fontSize:18, fontFamily:'Vazir' },
  score: { color:'#fff', fontSize:18, fontFamily:'Vazir' },
  ans: { color:'#cbd5e1', fontSize:15, fontFamily:'Vazir', paddingVertical:2 },
  wait: { color:'#94a3b8', textAlign:'center', fontFamily:'Vazir', marginVertical:14 },
});
