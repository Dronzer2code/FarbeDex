// Dev-only native AI spike (T1): download models via the LAN model source, run MobileCLIP-S0 (ONNX)
// on a bundled test image and Gemma 3 270M (llama.rn) with JSON-constrained output; log timings.
import { Asset } from 'expo-asset';
import * as Clipboard from 'expo-clipboard';
import { File } from 'expo-file-system';
import { Redirect } from 'expo-router';
import { decode as decodeJpeg } from 'jpeg-js';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { MODEL_FILES } from '../../src/models/manifest';
import { useModelDownloads, type ModelDlState } from '../../src/models/useModelDownloads';
import { getNamerContext } from '../../src/namer/llama';
import { ACTIVE_REFEREE } from '../../src/referee/config';
import { useRefereeLog } from '../../src/referee/referee';
import labels from '../../assets/labels/label-embeddings.json';
import { scoreReferee, type LabelEmbeddings } from '../../src/referee/scoring';
import { preprocessToChw } from '../../src/referee/preprocess';
import { embedImage, getRefereeSession, refereeProvider } from '../../src/referee/session';
import { DevModelSource } from '../../src/ui/DevModelSource';
import { Screen } from '../../src/ui/Screen';
import { color, fontFamily, radius, space, type } from '../../src/ui/tokens';

type Report = Record<string, unknown>;

function describe(s: ModelDlState): string {
  switch (s.kind) {
    case 'idle':
      return 'Waiting';
    case 'downloading':
      return `Downloading ${s.pct}%`;
    case 'verifying':
      return 'Verifying…';
    case 'ready':
      return 'Ready';
    case 'failed':
      return `Failed: ${s.message}`;
  }
}

async function runReferee(): Promise<Report> {
  const asset = Asset.fromModule(require('../../assets/dev/spike-test.jpg'));
  await asset.downloadAsync();
  const bytes = await new File(asset.localUri ?? asset.uri).bytes();
  const img = decodeJpeg(bytes, { useTArray: true, formatAsRGBA: true });

  const t0 = Date.now();
  const chw = preprocessToChw(img, ACTIVE_REFEREE.inputSize, ACTIVE_REFEREE.mean, ACTIVE_REFEREE.std);
  const preprocessMs = Date.now() - t0;

  const t1 = Date.now();
  await getRefereeSession();
  const loadMs = Date.now() - t1;

  const t2 = Date.now();
  const emb = await embedImage(chw);
  const coldRunMs = Date.now() - t2;

  const warm: number[] = [];
  for (let i = 0; i < 3; i++) {
    const t = Date.now();
    await embedImage(chw);
    warm.push(Date.now() - t);
  }
  const score = scoreReferee(emb, labels as LabelEmbeddings);
  return {
    ok: true,
    model: ACTIVE_REFEREE.id,
    provider: refereeProvider,
    sceneProbs: Object.fromEntries(Object.entries(score.sceneProbs).map(([k, v]) => [k, Number(v.toFixed(3))])),
    subject: score.subject,
    image: `${img.width}x${img.height}`,
    preprocessMs,
    loadMs,
    coldRunMs,
    warmRunMs: warm,
    embeddingLength: emb.length,
    first4: Array.from(emb.slice(0, 4)).map((v) => Number(v.toFixed(4))),
  };
}

async function runNamer(): Promise<Report> {
  const t0 = Date.now();
  const ctx = await getNamerContext();
  const loadMs = Date.now() - t0;

  const t1 = Date.now();
  const res = await ctx.completion({
    messages: [
      { role: 'system', content: 'You name colours for a designer\'s colour collection. Reply with JSON only.' },
      { role: 'user', content: 'Give a 2-word evocative name for the colour #5F7A3A seen in moss. Title Case.' },
    ],
    jinja: true,
    response_format: {
      type: 'json_schema',
      json_schema: {
        strict: true,
        schema: {
          type: 'object',
          properties: { name: { type: 'string', minLength: 3, maxLength: 28 } },
          required: ['name'],
        },
      },
    },
    temperature: 0.7,
    top_p: 0.9,
    n_predict: 40,
    stop: ['<end_of_turn>'],
  });
  const genMs = Date.now() - t1;
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(res.text);
  } catch {
    parsed = 'NOT JSON';
  }
  return {
    ok: true,
    loadMs,
    genMs,
    text: res.text,
    parsed,
    tokensPredicted: res.tokens_predicted,
    promptMs: Math.round(res.timings.prompt_ms),
    predictedPerSecond: Number(res.timings.predicted_per_second.toFixed(1)),
    systemInfo: ctx.model?.desc ?? null,
  };
}

export default function AiSpike() {
  const dl = useModelDownloads();
  const [referee, setReferee] = useState<Report | null>(null);
  const [namer, setNamer] = useState<Report | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const refLog = useRefereeLog((st) => st.entries);

  if (!__DEV__) return <Redirect href="/" />;

  const run = async (which: 'referee' | 'namer') => {
    setBusy(which);
    try {
      const r = which === 'referee' ? await runReferee() : await runNamer();
      (which === 'referee' ? setReferee : setNamer)(r);
    } catch (e) {
      (which === 'referee' ? setReferee : setNamer)({ ok: false, error: String(e) });
    } finally {
      setBusy(null);
    }
  };

  const report = {
    androidApi: Platform.Version,
    models: Object.fromEntries(MODEL_FILES.map((m) => [m.id, describe(dl.states[m.id])])),
    referee,
    namer,
    refereeLog: refLog.map((e) => ({
      label: e.scene.label,
      accepted: e.scene.accepted,
      score: Number(e.scene.score.toFixed(3)),
      probs: Object.fromEntries(Object.entries(e.sceneProbs).map(([k, v]) => [k, Number(v.toFixed(3))])),
      subject: e.subject?.label,
      ms: e.ms,
    })),
  };

  const copy = async () => {
    await Clipboard.setStringAsync(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Screen>
      <DevModelSource onChange={() => dl.refresh()} />

      <View style={styles.card}>
        <Text style={styles.label}>Models</Text>
        {MODEL_FILES.map((m) => (
          <Text key={m.id} style={styles.mono}>
            {m.id}: {describe(dl.states[m.id])}
          </Text>
        ))}
        <Button
          label={dl.running ? 'Downloading…' : dl.allReady ? 'Both ready' : 'Download / resume'}
          onPress={dl.downloadAll}
          disabled={dl.running || dl.allReady}
        />
        {dl.running ? <Button label="Cancel" onPress={dl.cancel} secondary /> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Referee · MobileCLIP-S0 (ONNX)</Text>
        <Button
          label={busy === 'referee' ? 'Running…' : 'Run Referee'}
          onPress={() => run('referee')}
          disabled={!!busy || dl.states.referee.kind !== 'ready'}
        />
        {referee ? <Text style={styles.mono}>{JSON.stringify(referee, null, 2)}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Namer · Gemma 3 270M (llama.rn)</Text>
        <Button
          label={busy === 'namer' ? 'Running…' : 'Run Namer'}
          onPress={() => run('namer')}
          disabled={!!busy || dl.states.namer.kind !== 'ready'}
        />
        {namer ? <Text style={styles.mono}>{JSON.stringify(namer, null, 2)}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Referee calibration log (camera captures, newest first)</Text>
        {refLog.length === 0 ? <Text style={styles.mono}>No captures yet.</Text> : null}
        {refLog.slice(0, 20).map((e) => (
          <Text key={e.at} style={styles.mono}>
            {e.scene.accepted ? 'ACCEPT' : 'REJECT'} {e.scene.label} {e.scene.score.toFixed(2)} · {e.subject?.label ?? '-'} · {e.ms} ms
          </Text>
        ))}
        {refLog.length ? <Button label="Clear log" secondary onPress={() => useRefereeLog.setState({ entries: [] })} /> : null}
      </View>

      <Button label={copied ? 'Copied' : 'Copy report'} onPress={copy} />
    </Screen>
  );
}

function Button({ label, onPress, disabled, secondary }: { label: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, secondary && styles.secondary, disabled && { opacity: 0.4 }]}
    >
      <Text style={[styles.buttonText, secondary && { color: color.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.surface, borderRadius: radius.md, padding: space[4], gap: space[2] },
  label: { ...type.label, color: color.inkSoft },
  mono: { fontSize: 12, fontFamily: fontFamily.mono500, color: color.ink },
  button: { backgroundColor: color.ink, borderRadius: radius.pill, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: color.surfaceSunken },
  buttonText: { color: '#FFFFFF', fontFamily: fontFamily.ui500, fontSize: 15 },
});
