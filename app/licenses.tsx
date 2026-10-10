// About + licenses — docs/PRD.md F14; docs/TRD.md VERIFY-2 / VERIFY-7 notice requirements.
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getModelFile } from '../src/models/manifest';
import { SectionHeader } from '../src/ui/controls';
import { ChevronIcon } from '../src/ui/icons';
import { Screen } from '../src/ui/Screen';
import { color, fontFamily, radius, shadow, space, type } from '../src/ui/tokens';

const LIBS: [string, string][] = [
  ['Expo, expo-router and Expo modules', 'MIT'],
  ['React Native, React', 'MIT'],
  ['llama.cpp / llama.rn', 'MIT'],
  ['ONNX Runtime (onnxruntime-react-native)', 'MIT'],
  ['culori', 'MIT'],
  ['jpeg-js', 'BSD-3-Clause'],
  ['zustand', 'MIT'],
  ['react-native-svg, Reanimated, Gesture Handler', 'MIT'],
  ['Poppins, JetBrains Mono fonts', 'SIL Open Font License 1.1'],
];

function LinkText({ url, children }: { url: string; children: string }) {
  return (
    <Text style={styles.link} onPress={() => Linking.openURL(url)} accessibilityRole="link">
      {children}
    </Text>
  );
}

export default function Licenses() {
  const refereeLicense = getModelFile('referee').license;
  return (
    <Screen>
      <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
        <ChevronIcon direction="left" />
      </Pressable>
      <Text style={styles.title} accessibilityRole="header">
        About FarbeDex
      </Text>
      <Text style={styles.body}>
        FarbeDex turns real outdoor scenes into palettes. Colours are extracted with deterministic OKLab maths. Two small open models run on your
        phone: the Referee checks that a photo is a real outdoor scene, and the Namer (Gemma 3 270M) names new colours and writes a design note.
        Nothing is uploaded; there is no account.
      </Text>

      <SectionHeader>Model licenses</SectionHeader>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Gemma 3 270M (Namer)</Text>
        <Text style={styles.body}>Gemma is provided under and subject to the Gemma Terms of Use found at ai.google.dev/gemma/terms.</Text>
        <Text style={styles.body}>
          Use of Gemma in FarbeDex is subject to the Gemma Prohibited Use Policy; you agree not to use it for the restricted uses listed there.
        </Text>
        <LinkText url="https://ai.google.dev/gemma/terms">Gemma Terms of Use</LinkText>
        <LinkText url="https://ai.google.dev/gemma/prohibited_use_policy">Gemma Prohibited Use Policy</LinkText>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Referee</Text>
        <Text style={styles.body}>{refereeLicense}</Text>
        {refereeLicense.includes('Apple') ? (
          <>
            <Text style={styles.body}>
              Apple Machine Learning Research Model is licensed under the Apple Machine Learning Research Model License Agreement.
            </Text>
            <LinkText url="https://github.com/apple/ml-mobileclip/blob/main/LICENSE_MODELS">License agreement</LinkText>
          </>
        ) : null}
      </View>

      <SectionHeader>Open-source libraries</SectionHeader>
      <View style={styles.card}>
        {LIBS.map(([name, lic]) => (
          <View key={name} style={styles.libRow}>
            <Text style={styles.libName}>{name}</Text>
            <Text style={styles.libLic}>{lic}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { width: 48, height: 48, borderRadius: 24, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  title: { ...type.display, color: color.ink },
  body: { ...type.body, color: color.inkSoft },
  card: { backgroundColor: color.surface, borderRadius: radius.md, padding: space[4], gap: space[2], ...shadow.card },
  cardTitle: { fontSize: 16, fontFamily: fontFamily.ui600, color: color.ink },
  link: { ...type.body, color: color.ink, textDecorationLine: 'underline', paddingVertical: 6 },
  libRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space[3], paddingVertical: 4 },
  libName: { flex: 1, fontSize: 14, fontFamily: fontFamily.ui400, color: color.ink },
  libLic: { fontSize: 13, fontFamily: fontFamily.mono500, color: color.inkSoft },
});
