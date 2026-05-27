import React from 'react';
import { Text, Pressable, StyleSheet, ViewStyle } from 'react-native';

type Props = { title: string; onPress: () => void; variant?: 'primary'|'ghost'|'danger'; style?: ViewStyle; disabled?: boolean };

export default function Button({ title, onPress, variant='primary', style, disabled }: Props) {
  const bg = disabled ? '#475569' : variant === 'danger' ? '#dc2626' : variant === 'ghost' ? 'transparent' : '#10b981';
  const border = variant === 'ghost' ? '#10b981' : 'transparent';
  return (
    <Pressable onPress={disabled?undefined:onPress}
      style={[styles.btn, { backgroundColor: bg, borderColor: border, borderWidth: variant==='ghost'?2:0 }, style]}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 14, paddingHorizontal: 22, borderRadius: 14, alignItems:'center', marginVertical: 8 },
  text: { color: '#fff', fontSize: 18, fontFamily: 'Vazir' },
});
