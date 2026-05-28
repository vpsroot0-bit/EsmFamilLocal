import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Colors, Font, Radius, Spacing, Shadow } from '../theme';

type ModalButton = {
  text: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
};

type Props = {
  visible: boolean;
  title?: string;
  message?: string;
  buttons?: ModalButton[];
  onClose: () => void;
  children?: React.ReactNode;
  /** If false, hides the top-right X button. Defaults to true. */
  showClose?: boolean;
  /** If false, tapping the backdrop won't close. Defaults to true. */
  dismissOnBackdrop?: boolean;
};

export default function AppModal({
  visible,
  title,
  message,
  buttons,
  onClose,
  children,
  showClose = true,
  dismissOnBackdrop = true,
}: Props) {
  const finalButtons: ModalButton[] = buttons && buttons.length > 0
    ? buttons
    : [{ text: 'باشه', variant: 'primary' }];

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={styles.backdrop}
        onPress={() => { if (dismissOnBackdrop) onClose(); }}
      >
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {showClose && (
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
          )}

          {!!title && <Text style={styles.title}>{title}</Text>}
          {!!message && <Text style={styles.msg}>{message}</Text>}

          {children}

          <View style={styles.btnRow}>
            {finalButtons.map((b, i) => {
              const styleVariant =
                b.variant === 'danger' ? styles.btnDanger
                : b.variant === 'secondary' ? styles.btnSecondary
                : styles.btnPrimary;
              const txtVariant =
                b.variant === 'secondary' ? styles.btnSecondaryTxt : styles.btnTxt;
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.btn, styleVariant]}
                  onPress={() => {
                    onClose();
                    setTimeout(() => b.onPress?.(), 0);
                  }}
                >
                  <Text style={txtVariant}>{b.text}</Text>
                </TouchableOpacity>
              );
            })}
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    ...Shadow.card,
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  closeTxt: {
    color: Colors.textMuted,
    fontFamily: Font.bold,
    fontSize: 16,
    lineHeight: 18,
  },
  title: {
    color: Colors.text,
    fontFamily: Font.bold,
    fontSize: 19,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  msg: {
    color: Colors.textMuted,
    fontFamily: Font.regular,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  btnRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    flexWrap: 'wrap',
  },
  btn: {
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
  },
  btnDanger: {
    backgroundColor: Colors.danger,
  },
  btnSecondary: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnTxt: {
    color: '#fff',
    fontFamily: Font.bold,
    fontSize: 15,
  },
  btnSecondaryTxt: {
    color: Colors.text,
    fontFamily: Font.bold,
    fontSize: 15,
  },
});
