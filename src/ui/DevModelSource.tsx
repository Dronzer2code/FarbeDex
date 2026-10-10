// Dev-only LAN model source field (docs/TRD.md → MODEL DELIVERY). Render only when __DEV__.
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { SettingKey, deleteSetting, getSetting, setSetting } from '../db/settingsRepo';
import { MODEL_FILES } from '../models/manifest';
import { normalizeDevBaseUrl, resolveModelUrl } from '../models/resolveUrl';
import { color, fontFamily, radius, space, type } from './tokens';

export function DevModelSource({ onChange }: { onChange?: (base: string | null) => void }) {
  const [input, setInput] = useState('');
  const [saved, setSaved] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    getSetting(SettingKey.devModelBaseUrl).then((v) => {
      setSaved(v);
      setInput(v ?? '');
      onChange?.(v);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!__DEV__) return null;

  const save = async () => {
    const base = normalizeDevBaseUrl(input);
    if (!input.trim()) {
      await deleteSetting(SettingKey.devModelBaseUrl);
      setSaved(null);
      onChange?.(null);
      setStatus('Cleared — release URLs will be used.');
      return;
    }
    if (!base) {
      setStatus('Not a valid URL. Example: http://192.168.1.23:8099');
      return;
    }
    await setSetting(SettingKey.devModelBaseUrl, base);
    setSaved(base);
    setInput(base);
    onChange?.(base);
    setStatus('Saved.');
  };

  const test = async () => {
    const base = saved ?? normalizeDevBaseUrl(input);
    if (!base) return setStatus('Save a URL first.');
    setStatus('Testing…');
    const results: string[] = [];
    for (const m of MODEL_FILES) {
      const url = resolveModelUrl(m, true, base);
      try {
        const res = await fetch(url, { method: 'HEAD' });
        const len = res.headers.get('content-length');
        const ok = res.ok && Number(len) === m.bytes;
        results.push(`${m.fileName}: HTTP ${res.status}, ${len ?? '?'} B ${ok ? '✓' : '✗ (expected ' + m.bytes + ')'}`);
      } catch (e) {
        results.push(`${m.fileName}: unreachable (${String(e)})`);
      }
    }
    setStatus(results.join('\n'));
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Dev model source</Text>
      <Text style={styles.help}>
        Laptop: npx serve .models -l 8099 · enter http://&lt;laptop-ip&gt;:8099. Empty = release URLs.
      </Text>
      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="http://192.168.1.23:8099"
        placeholderTextColor={color.inkSoft}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        style={styles.input}
      />
      <View style={styles.row}>
        <Pressable onPress={save} style={styles.button}>
          <Text style={styles.buttonText}>Save</Text>
        </Pressable>
        <Pressable onPress={test} style={[styles.button, styles.secondary]}>
          <Text style={[styles.buttonText, { color: color.ink }]}>Test connection</Text>
        </Pressable>
      </View>
      <Text style={styles.help}>Active: {saved ?? 'release URLs'}</Text>
      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.surface, borderRadius: radius.md, padding: space[4], gap: space[2] },
  label: { ...type.label, color: color.inkSoft },
  help: { fontSize: 12, fontFamily: fontFamily.ui400, color: color.inkSoft },
  input: {
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: radius.sm,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    fontFamily: fontFamily.mono500,
    color: color.ink,
  },
  row: { flexDirection: 'row', gap: space[2] },
  button: { backgroundColor: color.ink, borderRadius: radius.pill, paddingHorizontal: space[4], minHeight: 44, justifyContent: 'center' },
  secondary: { backgroundColor: color.surfaceSunken },
  buttonText: { color: '#FFFFFF', fontFamily: fontFamily.ui500, fontSize: 14 },
  status: { fontSize: 12, fontFamily: fontFamily.mono500, color: color.ink },
});
