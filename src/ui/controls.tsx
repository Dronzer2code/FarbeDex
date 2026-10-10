// Buttons, NavArrow, Sheet, ConfirmDialog (docs/UI_DESIGN.md → COMPONENTS).
import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronIcon } from './icons';
import { color, fontFamily, radius, shadow, space, type } from './tokens';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  icon?: ReactNode;
}) {
  const bg = variant === 'primary' ? color.ink : variant === 'danger' ? color.danger : color.surface;
  const fg = variant === 'secondary' ? color.ink : '#FFFFFF';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg },
        variant === 'secondary' && styles.secondaryBorder,
        pressed && { transform: [{ scale: 0.97 }] },
        disabled && { opacity: 0.4 },
      ]}
    >
      {icon}
      <Text style={[styles.buttonText, { color: fg }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {label}
      </Text>
    </Pressable>
  );
}

export function NavArrow({ direction, onPress, label }: { direction: 'left' | 'right'; onPress: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [styles.nav, pressed && { transform: [{ scale: 0.97 }] }]}
    >
      <ChevronIcon direction={direction} />
    </Pressable>
  );
}

export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + space[4] }]}>
        <View style={styles.grabber} />
        {title ? <Text style={styles.sheetTitle}>{title}</Text> : null}
        {children}
      </View>
    </Modal>
  );
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  danger,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.dialogWrap}>
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>{title}</Text>
          {message ? <Text style={styles.dialogMessage}>{message}</Text> : null}
          <View style={styles.dialogButtons}>
            <View style={{ flex: 1 }}>
              <Button label="Cancel" variant="secondary" onPress={onCancel} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label={confirmLabel} variant={danger ? 'danger' : 'primary'} onPress={onConfirm} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function SectionHeader({ children }: { children: string }) {
  return <Text style={styles.section}>{children}</Text>;
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.pill,
    paddingHorizontal: space[5],
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: space[2],
  },
  secondaryBorder: { borderWidth: 1, borderColor: color.line },
  buttonText: { fontSize: 15, fontFamily: fontFamily.ui600 },
  nav: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.button,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(23,23,28,0.35)' },
  sheet: {
    backgroundColor: color.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: space[4],
    gap: space[3],
    maxHeight: '85%',
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: color.line },
  sheetTitle: { ...type.title, color: color.ink },
  dialogWrap: { flex: 1, backgroundColor: 'rgba(23,23,28,0.35)', alignItems: 'center', justifyContent: 'center', padding: space[5] },
  dialog: { backgroundColor: color.surface, borderRadius: radius.lg, padding: space[5], gap: space[3], width: '100%' },
  dialogTitle: { ...type.title, color: color.ink },
  dialogMessage: { ...type.body, color: color.inkSoft },
  dialogButtons: { flexDirection: 'row', gap: space[3], marginTop: space[2] },
  section: { ...type.label, color: color.inkSoft, marginTop: space[4] },
});
