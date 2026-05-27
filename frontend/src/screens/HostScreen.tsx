import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Alert } from 'react-native';
import { NetworkInfo } from 'react-native-network-info';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import Button from '../components/Button';
import HostService from '../services/HostService';
import { requestNetworkPermissions } from '../utils/permissions';
import { PORT } from '../utils/constants';

type Props = NativeStackScreenProps<RootStackParamList, 'Host'>;

export default function HostScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [started, setStarted] = useState(false);
  const [players, setPlayers] = useState<{id:string;name:string}[]>([]);
  const [ip, setIp] = useState<string | null>(null);

  useEffect(() => {
    NetworkInfo.getIPV4Address().then(setIp).catch(() => {});
    const off = HostService.on((ev) => {
      if (ev.type === 'LOBBY') setPlayers(ev.players);
      if (ev.type === 'ROUND_START') {
        navigation.navigate('Game', { role: 'host', name: name || 'میزبان' });
      }
      if (ev.type === 'ERROR') Alert.alert('خطا', ev.message);
    });
    return () => { off(); };
  }, [name, navigation]);

  const onHost = async () => {
    if (!name.trim()) { Alert.alert('نام لازم است', 'لطفاً نام خود را وارد کنید.'); return; }
    const ok = await requestNetworkPermissions();
    if (!ok) Alert.alert('اجازه لازم است', 'برای کشف خودکار به اجازه‌های شبکه نیاز است. می‌توانید همچنان با وارد کردن IP دستی بازی کنید.');
    await HostService.start(name.trim());
    setStarted(true);
  };

  const onStartRound = () => HostService.startRound();
  const onCancel = () => { HostService.stop(); navigation.goBack(); };

  return (
    <View style={styles.container}>
      {!started ? (
        <>
          <Text style={styles.label}>نام شما</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="مثلاً علی" placeholderTextColor="#64748b"/>
          <Button title="ساخت بازی" onPress={onHost} />
        </>
      ) : (
        <>
          <Text style={styles.title}>اتاق آماده است</Text>
          <Text style={styles.info}>IP میزبان: {ip || '—'}    پورت: {PORT}</Text>
          <Text style={styles.info}>بازیکنان دیگر گزینه «پیوستن به بازی» را در گوشی خود بزنند.</Text>
          <Text style={styles.section}>بازیکنان حاضر ({players.length})</Text>
          <FlatList
            data={players}
            keyExtractor={(p) => p.id}
            renderItem={({item}) => <Text style={styles.player}>• {item.name}</Text>}
            style={{ flexGrow: 0, maxHeight: 220 }}
          />
          <Button title="شروع دور جدید" onPress={onStartRound} disabled={players.length < 1} />
          <Button title="لغو و بازگشت" onPress={onCancel} variant="danger" />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:20 },
  label: { color:'#cbd5e1', fontSize:16, marginBottom:6, fontFamily:'Vazir' },
  input: { backgroundColor:'#1e293b', color:'#fff', padding:12, borderRadius:10, fontSize:18, marginBottom:14, fontFamily:'Vazir', textAlign:'right' },
  title: { color:'#fff', fontSize:24, marginVertical:10, fontFamily:'Vazir' },
  info: { color:'#94a3b8', fontSize:14, marginBottom:6, fontFamily:'Vazir' },
  section: { color:'#10b981', fontSize:16, marginTop:14, marginBottom:6, fontFamily:'Vazir' },
  player: { color:'#fff', fontSize:18, paddingVertical:4, fontFamily:'Vazir' },
});
