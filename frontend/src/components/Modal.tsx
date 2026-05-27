import React from 'react';
import { Modal as RNModal, View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Font, Radius, Shadow, Spacing } from '../theme';
import Button from './Button';

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  variant?: 'info' | 'danger' | 'warning';
  children?: React.ReactNode;
};

export default function Modal({
  visible, title, message, children,
  confirmText = 'تأیید', cancelText = 'انصراف',
  onConfirm, onCancel, variant = 'info',
}: Props) {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={[styles.card, Shadow.card]} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {children}
          <View style={styles.row}>
            {onCancel ? (
              <Button title={cancelText} variant="secondary" onPress={onCancel} style={{ flex: 1 }} />
            ) : null}
            {onConfirm ? (
              <Button
                title={confirmText}
                variant={variant === 'danger' ? 'danger' : 'primary'}
                onPress={onConfirm}
                style={{ flex: 1 }}
              />
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontFamily: Font.bold,
    fontSize: 19,
    color: Colors.text,
    textAlign: 'right',
    marginBottom: Spacing.sm,
  },
  message: {
    fontFamily: Font.regular,
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'right',
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginTop: Spacing.md,
  },
});
