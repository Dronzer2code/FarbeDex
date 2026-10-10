// Settings — docs/UI_DESIGN.md → Settings; docs/PRD.md F14.
import Constants from 'expo-constants';
import { Directory, Paths } from 'expo-file-system';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getDb } from '../../src/db/db';
import { resetAllData } from '../../src/db/entryRepo';
import { deleteModel } from '../../src/models/download';
import { MODEL_FILES, type ModelId } from '../../src/models/manifest';
import { modelState } from '../../src/models/status';
import { useNamerStatus } from '../../src/namer/namer';
import { bumpData, useDbQuery } from '../../src/store/data';
import { useGate } from '../../src/store/gate';
import { ConfirmDialog, SectionHeader } from '../../src/ui/controls';
import { DevModelSource } from '../../src/ui/DevModelSource';
import { DevNamerToggle } from '../../src/ui/DevNamerToggle';
import { ChevronIcon } from '../../src/ui/icons';
import { Screen } from '../../src/ui/Screen';
import { showToast } from '../../src/ui/toast';
import { color, fontFamily, radius, shadow, space, type } from '../../src/ui/tokens';

const NAMES: Record<ModelId, string> = { referee: 'Referee', namer: 'Namer · Gemma 3 270M' };
const mb = (b: number) => `${(b / 1_000_000).toFixed(b < 10_000_000 ? 1 : 0)} MB`;

function dirSize(name: string): number {
  try {
    const d = new Directory(Paths.document, name);
    return d.exists ? d.size ?? 0 : 0;
  } catch {
    return 0;
  }
}

function Row({ label, value, onPress, danger }: { label: string; value?: string; onPress?: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : 'text'} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
      <Text style={[styles.rowLabel, danger && { color: color.danger }]}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {onPress && !danger ? <ChevronIcon size={18} color={color.inkSoft} /> : null}
    </Pressable>
  );
}

export default function Settings() {
  const [confirm, setConfirm] = useState<null | 'data1' | 'data2' | 'models'>(null);
  const namerError = useNamerStatus((s) => s.lastError);
  const refreshModels = useGate((s) => s.refreshModels);
  const { data: storage, reload } = useDbQuery(async () => ({ catches: dirSize('catches') + dirSize('thumbs'), models: dirSize('models') }), []);

  const deleteAll = async () => {
    const db = await getDb();
    await resetAllData(db);
    for (const name of ['catches', 'thumbs']) {
      const d = new Directory(Paths.document, name);
      if (d.exists) d.delete();
    }
    bumpData();
    reload();
    showToast('All data deleted');
  };

  const deleteModels = () => {
    MODEL_FILES.forEach(deleteModel);
    refreshModels(); // gate sends the app to /setup-models
    router.replace('/setup-models');
  };

  return (
    <Screen title="Settings">
      <SectionHeader>Models</SectionHeader>
      <View style={styles.card}>
        {MODEL_FILES.map((m) => (
          <Row key={m.id} label={NAMES[m.id]} value={`${mb(m.bytes)} · ${modelState(m) === 'ready' ? 'Ready' : 'Missing'}`} />
        ))}
        {namerError ? <Text style={styles.warn}>Namer offline last time — template names were used.</Text> : null}
        <Row label="Re-download models" onPress={() => setConfirm('models')} />
      </View>

      <SectionHeader>Storage</SectionHeader>
      <View style={styles.card}>
        <Row label="Catches (photos)" value={storage ? mb(storage.catches) : '…'} />
        <Row label="Models" value={storage ? mb(storage.models) : '…'} />
        <Row label="Delete all data" danger onPress={() => setConfirm('data1')} />
      </View>

      <SectionHeader>About</SectionHeader>
      <View style={styles.card}>
        <Row label="Version" value={Constants.expoConfig?.version ?? '1.0.0'} />
        <Row label="How FarbeDex works · Licenses" onPress={() => router.push('/licenses')} />
        <Row label="Rarity Guide" onPress={() => router.push('/rarity')} />
      </View>

      {__DEV__ ? (
        <>
          <SectionHeader>Developer</SectionHeader>
          <DevModelSource />
          <DevNamerToggle />
          <Link href="/dev/ai-spike" style={styles.link}>
            Open AI spike (dev)
          </Link>
          <Link href="/dev/ui" style={styles.link}>
            Open UI kit (dev)
          </Link>
        </>
      ) : null}

      <ConfirmDialog
        visible={confirm === 'data1'}
        title="Delete all data?"
        message="All catches, photos and earned names are removed. The models stay."
        confirmLabel="Continue"
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={() => setConfirm('data2')}
      />
      <ConfirmDialog
        visible={confirm === 'data2'}
        title="Are you sure?"
        message="This cannot be undone. Your FarbeDex goes back to 0 / 151."
        confirmLabel="Delete everything"
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          setConfirm(null);
          await deleteAll();
        }}
      />
      <ConfirmDialog
        visible={confirm === 'models'}
        title="Re-download models?"
        message="Both model files are deleted and downloaded again (about 265 MB). Wi-Fi recommended."
        confirmLabel="Re-download"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          deleteModels();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.surface, borderRadius: radius.md, paddingHorizontal: space[4], paddingVertical: space[1], ...shadow.card },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: space[3] },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: fontFamily.ui500, color: color.ink },
  rowValue: { fontSize: 13, fontFamily: fontFamily.mono500, color: color.inkSoft },
  warn: { fontSize: 13, fontFamily: fontFamily.ui400, color: color.warning, paddingBottom: space[2] },
  link: { ...type.body, color: color.ink, textDecorationLine: 'underline', paddingVertical: 8 },
});
