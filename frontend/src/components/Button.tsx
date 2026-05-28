import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, Font, Radius, Shadow } from '../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

type Props = {
  label?: string;
  title?: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export default function Button({
  label, title, onPress, variant = 'primary', disabled, loading, style, textStyle,
}: Props) {
  const text = label ?? title ?? '';

  const bg = {
    primary: Colors.primary,
    secondary: Colors.card,
    ghost: 'transparent',
    danger: Colors.danger,
    success: Colors.success,
  }[variant];

  const border = variant === 'ghost' ? Colors.border : 'transparent';
  const textColor = variant === 'secondary' ? Colors.text : '#fff';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor: border },
        variant !== 'ghost' && Shadow.soft,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && { transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }, textStyle]}>{text}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 52,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontFamily: Font.bold, fontSize: 16 },
  disabled: { opacity: 0.5 },
});
