// Root layout: fonts, DB init, start gate (docs/PROCESS_FLOW.md → App start gate). docs/TRD.md → REPOSITORY LAYOUT.
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { getDb } from '../src/db/db';
import { releaseNamer } from '../src/namer/llama';
import { isNamerBusy } from '../src/namer/namer';
import { useGate } from '../src/store/gate';
import { ToastHost } from '../src/ui/toast';
import { color, fontFamily } from '../src/ui/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    JetBrainsMono_500Medium,
  });
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    getDb()
      .then(() => useGate.getState().load())
      .then(() => setDbReady(true))
      .catch((e: unknown) => setDbError(String(e)));
  }, []);

  // Free the Namer model in the background unless it is mid-job (docs/TRD.md → NAMER).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background' && !isNamerBusy()) releaseNamer().catch(() => {});
    });
    return () => sub.remove();
  }, []);

  const ready = (fontsLoaded || fontError) && (dbReady || dbError);
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  if (dbError) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>Something went wrong. Try again.</Text>
        <Text style={styles.errorDetail}>{dbError}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          <Stack.Screen name="setup-models" options={{ gestureEnabled: false }} />
          <Stack.Screen name="catch" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="catch-result/[id]" options={{ animation: 'fade' }} />
          <Stack.Screen name="photo/[id]" />
          <Stack.Screen name="entry/[no]" />
          <Stack.Screen name="rarity" />
          <Stack.Screen name="field-notes" />
          <Stack.Screen name="licenses" />
          <Stack.Screen name="export/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="dev/ai-spike" options={{ headerShown: true, title: 'AI spike (dev)' }} />
          <Stack.Screen name="dev/ui" options={{ headerShown: true, title: 'UI kit (dev)' }} />
        </Stack>
        <ToastHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: color.bg },
  errorText: { fontSize: 17, fontFamily: fontFamily.ui600, color: color.ink },
  errorDetail: { marginTop: 8, fontSize: 12, color: color.inkSoft },
});
