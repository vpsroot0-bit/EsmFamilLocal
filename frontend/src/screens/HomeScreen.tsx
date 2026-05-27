import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import Button from '../components/Button';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>اسم فامیل</Text>
      <Text style={styles.sub}>بازی محلی بدون اینترنت — همه به یک Wi-Fi یا هات‌اسپات وصل باشند</Text>
      <Button title="میزبانی بازی" onPress={() => navigation.navigate('Host')} />
      <Button title="پیوستن به بازی" onPress={() => navigation.navigate('Join')} variant="ghost" />
      <Text style={styles.hint}>راهنما: یک نفر روی گوشی خود هات‌اسپات روشن کند، بقیه به آن وصل شوند، سپس همان نفر «میزبانی بازی» را بزند.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:24, justifyContent:'center' },
  title: { fontSize: 42, color:'#fff', textAlign:'center', marginBottom: 10, fontFamily:'Vazir' },
  sub: { fontSize: 16, color:'#94a3b8', textAlign:'center', marginBottom: 30, fontFamily:'Vazir' },
  hint: { fontSize: 13, color:'#64748b', textAlign:'center', marginTop: 20, fontFamily:'Vazir' },
});
