import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import Button from '../components/Button';
import ClientService, { Discovered } from '../services/ClientService';
import { requestNetworkPermissions } from '../utils/permissions';
import { PORT } from '../utils/constants';

type Props = NativeStackScreenProps<RootStackParamList, 'Join'>;

export default function JoinScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [manualIp, setManualIp] = useState('');
  const [discovered, setDiscovered] = useState<Discovered[]>([]);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const off = ClientService.on((ev) => {
      if (ev.type === 'CONNECTED') navigation.navigate('Game', { role: 'client', name });
      if (ev.type === 'ERROR') Alert.alert('خطا', ev.message);
    });
    return () => { off(); ClientService.stopDiscovery(); };
  }, [navigation, name]);

  const startScan = async () => {
    if (!name.trim()) { Alert.alert('نام لازم است', 'لطفاً ابتدا نام خود را وارد کنید.'); return; }
    await requestNetworkPermissions();
    setScanning(true);
    setDiscovered([]);
    ClientService.startDiscovery((s) => {
      setDiscovered(prev => (prev.find(x => x.host === s.host) ? prev : [...prev, s]));
    });
    setTimeout(() => setScanning(false), 8000);
  };

  const connect = (host: string, port: number = PORT) => {
    if (!name.trim()) { Alert.alert('نام لازم است'); return; }
    ClientService.connect(host, port, name.trim());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>نام شما</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="مثلاً سارا" placeholderTextColor="#64748b"/>

      <Button title={scanning ? 'در حال جستجو…' : 'جستجوی خودکار بازی'} onPress={startScan} />
      {scanning && <ActivityIndicator color="#10b981" style={{ marginVertical: 6 }} />}

      <Text style={styles.section}>بازی‌های پیدا شده</Text>
      <FlatList
        data={discovered}
        keyExtractor={(d) => d.host + d.port}
        ListEmptyComponent={<Text style={styles.empty}>هیچ بازی پیدا نشد. اگر طول کشید از IP دستی استفاده کنید.</Text>}
        renderItem={({item}) => (
          <View style={styles.row}>
            <Text style={styles.foundName}>{item.name.replace('EsmFamil_','')}  ({item.host})</Text>
            <Button title="اتصال" onPress={() => connect(item.host, item.port)} />
          </View>
        )}
        style={{ flexGrow: 0, maxHeight: 200 }}
      />

      <Text style={styles.section}>اتصال دستی</Text>
      <TextInput style={styles.input} value={manualIp} onChangeText={setManualIp} placeholder="IP میزبان مثلاً 192.168.43.1" placeholderTextColor="#64748b" autoCapitalize="none" keyboardType="numeric"/>
      <Button title="اتصال با IP" onPress={() => manualIp && connect(manualIp.trim(), PORT)} variant="ghost"/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:20 },
  label: { color:'#cbd5e1', fontSize:16, marginBottom:6, fontFamily:'Vazir' },
  input: { backgroundColor:'#1e293b', color:'#fff', padding:12, borderRadius:10, fontSize:18, marginBottom:10, fontFamily:'Vazir', textAlign:'right' },
  section: { color:'#10b981', fontSize:16, marginTop:14, marginBottom:6, fontFamily:'Vazir' },
  row: { flexDirection:'row-reverse', alignItems:'center', justifyContent:'space-between', backgroundColor:'#1e293b', padding:10, borderRadius:10, marginBottom:6 },
  foundName: { color:'#fff', fontSize:16, fontFamily:'Vazir' },
  empty: { color:'#64748b', fontFamily:'Vazir', textAlign:'center', paddingVertical:10 },
});
