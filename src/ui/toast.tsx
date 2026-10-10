// Global toast (zustand). Mount <ToastHost /> once in the root layout.
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { color, fontFamily, radius } from './tokens';

interface ToastState {
  message: string | null;
  seq: number;
  show: (message: string) => void;
  clear: () => void;
}

const useToast = create<ToastState>((set) => ({
  message: null,
  seq: 0,
  show: (message) => set((s) => ({ message, seq: s.seq + 1 })),
  clear: () => set({ message: null }),
}));

export function showToast(message: string) {
  useToast.getState().show(message);
}

export function ToastHost() {
  const { message, seq, clear } = useToast();
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(clear, 1800);
    return () => clearTimeout(t);
  }, [message, seq, clear]);
  if (!message) return null;
  return (
    <Animated.View
      key={seq}
      entering={FadeInDown.duration(160)}
      exiting={FadeOutDown.duration(160)}
      style={[styles.toast, { bottom: insets.bottom + 96 }]}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: color.ink,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  text: { color: '#FFFFFF', fontFamily: fontFamily.ui500, fontSize: 14 },
});
