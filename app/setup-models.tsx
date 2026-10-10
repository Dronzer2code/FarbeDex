// Model setup — docs/UI_DESIGN.md → Model setup; docs/PROCESS_FLOW.md → Model download.
import { Paths } from 'expo-file-system';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MODEL_FILES, TOTAL_MODEL_BYTES, type ModelId } from '../src/models/manifest';
import { useModelDownloads, type ModelDlState } from '../src/models/useModelDownloads';
import { useGate } from '../src/store/gate';
import { Button } from '../src/ui/controls';
import { DevModelSource } from '../src/ui/DevModelSource';
import { color, fontFamily, radius, shadow, space, type } from '../src/ui/tokens';

const INFO: Record<ModelId, { name: string; purpose: string }> = {
  referee: { name: 'Referee', purpose: 'Checks that a photo is a real outdoor scene and what it shows.' },
  namer: { name: 'Namer', purpose: 'Gemma 3 270M names new colours and writes design notes.' },
};

const mb = (b: number) => `${Math.round(b / 1_000_000)} MB`;

function stateLabel(s: ModelDlState): string {
  switch (s.kind) {
    case 'idle':
      return 'Waiting';
    case 'downloading':
      return `Downloading ${s.pct}%`;
    case 'verifying':
      return 'Verifying';
    case 'ready':
      return 'Ready';
    case 'failed':
      return 'Failed';
  }
}

export default function SetupModels() {
  const dl = useModelDownloads();
  const refreshModels = useGate((s) => s.refreshModels);
  const skipModelsDev = useGate((s) => s.skipModelsDev);
  const [spaceError, setSpaceError] = useState<string | null>(null);
  const failed = MODEL_FILES.find((m) => dl.states[m.id].kind === 'failed');

  useEffect(() => {
    if (dl.allReady) refreshModels();
  }, [dl.allReady, refreshModels]);

  const start = () => {
    setSpaceError(null);
    try {
      const free = Paths.availableDiskSpace;
      if (free > 0 && free < TOTAL_MODEL_BYTES + 50_000_000) {
        setSpaceError(`Not enough free space. FarbeDex needs about ${mb(TOTAL_MODEL_BYTES + 50_000_000)}; ${mb(free)} free.`);
        return;
      }
    } catch {
      // unknown free space → try anyway
    }
    dl.downloadAll();
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          Set up the AI
        </Text>
        <Text style={styles.body}>
          FarbeDex downloads two small open models once ({mb(TOTAL_MODEL_BYTES)} total). After that it works fully offline. Wi-Fi
          recommended.
        </Text>

        {MODEL_FILES.map((m) => {
          const s = dl.states[m.id];
          const pct = s.kind === 'downloading' ? s.pct : s.kind === 'ready' || s.kind === 'verifying' ? 100 : 0;
          return (
            <View key={m.id} style={styles.card} accessible accessibilityLabel={`${INFO[m.id].name}, ${mb(m.bytes)}, ${stateLabel(s)}`}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>{INFO[m.id].name}</Text>
                <Text style={styles.size}>{mb(m.bytes)}</Text>
              </View>
              <Text style={styles.purpose}>{INFO[m.id].purpose}</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${pct}%`, backgroundColor: s.kind === 'failed' ? color.danger : s.kind === 'ready' ? color.success : color.ink }]} />
              </View>
              <Text style={[styles.state, s.kind === 'failed' && { color: color.danger }]}>{stateLabel(s)}</Text>
            </View>
          );
        })}

        {failed ? (
          <Text style={styles.error}>
            The download stopped. Check your connection and tap Retry — it continues where it left off.
            {__DEV__ && failed ? `\n(${(dl.states[failed.id] as { message: string }).message})` : ''}
          </Text>
        ) : null}
        {spaceError ? <Text style={styles.error}>{spaceError}</Text> : null}

        {__DEV__ ? <DevModelSource /> : null}
      </ScrollView>

      <View style={styles.footer}>
        {dl.allReady ? (
          <Button label="Let's go outside" onPress={() => router.replace('/')} />
        ) : (
          <Button label={dl.running ? 'Downloading…' : failed ? 'Retry' : 'Download'} onPress={start} disabled={dl.running} />
        )}
        {__DEV__ && !dl.allReady ? (
          <Button
            label="Skip for now (dev)"
            variant="secondary"
            onPress={() => {
              skipModelsDev();
              router.replace('/');
            }}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  content: { padding: space[5], gap: space[4] },
  title: { ...type.display, color: color.ink },
  body: { ...type.body, color: color.inkSoft },
  card: { backgroundColor: color.surface, borderRadius: radius.lg, padding: space[4], gap: space[2], ...shadow.card },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  cardTitle: { ...type.title, color: color.ink },
  size: { fontFamily: fontFamily.mono500, fontSize: 14, color: color.inkSoft },
  purpose: { ...type.body, color: color.inkSoft },
  track: { height: 8, borderRadius: 4, backgroundColor: color.surfaceSunken, overflow: 'hidden', marginTop: space[2] },
  fill: { height: 8 },
  state: { fontFamily: fontFamily.ui500, fontSize: 13, color: color.ink },
  error: { ...type.body, color: color.danger },
  footer: { padding: space[5], gap: space[3] },
});
