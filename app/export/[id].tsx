// Export palette — docs/UI_DESIGN.md → Export; docs/PROCESS_FLOW.md → J5.
import * as Clipboard from 'expo-clipboard';
import { File, Paths } from 'expo-file-system';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCatch } from '../../src/db/catchRepo';
import { getAllEntries } from '../../src/db/entryRepo';
import { contrastPairs, toContrastText, toCss, toTailwind, toTokens, type ExportSwatch } from '../../src/export/formats';
import { useDbQuery } from '../../src/store/data';
import { Chip } from '../../src/ui/Chip';
import { Button } from '../../src/ui/controls';
import { displayName } from '../../src/ui/format';
import { CloseIcon } from '../../src/ui/icons';
import { showToast } from '../../src/ui/toast';
import { color, fontFamily, radius, space, type } from '../../src/ui/tokens';

type Tab = 'CSS' | 'Tailwind' | 'Tokens' | 'Contrast';
const TABS: Tab[] = ['CSS', 'Tailwind', 'Tokens', 'Contrast'];
const EXT: Record<Tab, string> = { CSS: 'css', Tailwind: 'js', Tokens: 'json', Contrast: 'txt' };
const GRADE_COLOR = { AA: color.success, 'AA-large': color.warning, Fail: color.danger } as const;

export default function ExportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('CSS');
  const { data } = useDbQuery(
    async (db) => {
      const c = await getCatch(db, id);
      const names = new Map((await getAllEntries(db)).map((e) => [e.no, e.name]));
      const sw: ExportSwatch[] = (c?.swatches ?? []).map((s) => ({ no: s.entry_no, name: displayName(s.entry_no, names.get(s.entry_no)), hex: s.hex, pct: s.pct }));
      return sw;
    },
    [id],
  );
  const sw = data ?? [];
  const text = tab === 'CSS' ? toCss(sw) : tab === 'Tailwind' ? toTailwind(sw) : tab === 'Tokens' ? toTokens(sw) : toContrastText(sw);

  const copy = async () => {
    await Clipboard.setStringAsync(text);
    showToast('Copied');
  };
  const share = async () => {
    const f = new File(Paths.cache, `farbedex-palette.${EXT[tab]}`);
    if (f.exists) f.delete();
    f.create();
    f.write(text);
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(f.uri, { mimeType: 'text/plain', dialogTitle: 'Export palette' });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Export palette
        </Text>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close" style={styles.close}>
          <CloseIcon color={color.ink} />
        </Pressable>
      </View>
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Chip key={t} label={t} selected={tab === t} onPress={() => setTab(t)} />
        ))}
      </View>

      {tab === 'Contrast' ? (
        <ScrollView contentContainerStyle={styles.pairs}>
          {contrastPairs(sw).map((p) => (
            <View key={`${p.a.no}-${p.b.no}`} style={styles.pair} accessible accessibilityLabel={`${p.a.name} on ${p.b.name}, ${p.ratio.toFixed(2)} to 1, ${p.grade}`}>
              <View style={[styles.sample, { backgroundColor: p.b.hex }]}>
                <Text style={[styles.sampleText, { color: p.a.hex }]}>Aa</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pairHex}>
                  {p.a.hex} on {p.b.hex}
                </Text>
                <Text style={styles.ratio}>{p.ratio.toFixed(2)}:1</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: GRADE_COLOR[p.grade] }]}>
                <Text style={styles.badgeText}>{p.grade}</Text>
              </View>
            </View>
          ))}
          {sw.length < 2 ? <Text style={type.body}>Contrast needs at least two colours.</Text> : null}
        </ScrollView>
      ) : (
        <ScrollView style={styles.codeWrap} contentContainerStyle={{ padding: space[4] }}>
          <ScrollView horizontal>
            <Text style={styles.code} selectable>
              {text}
            </Text>
          </ScrollView>
        </ScrollView>
      )}

      <View style={styles.actions}>
        <View style={{ flex: 1 }}>
          <Button label="Share" variant="secondary" onPress={share} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Copy" onPress={copy} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[4], paddingTop: space[2] },
  title: { ...type.title, color: color.ink },
  close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', gap: space[2], paddingHorizontal: space[4], paddingVertical: space[3], flexWrap: 'wrap' },
  codeWrap: { flex: 1, marginHorizontal: space[4], backgroundColor: color.ink, borderRadius: radius.md },
  code: { fontFamily: fontFamily.mono500, fontSize: 13, lineHeight: 20, color: '#F6F6F8' },
  pairs: { paddingHorizontal: space[4], gap: space[2] },
  pair: { flexDirection: 'row', alignItems: 'center', gap: space[3], paddingVertical: space[2], borderBottomWidth: 1, borderBottomColor: color.line },
  sample: { width: 56, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: color.line },
  sampleText: { fontFamily: fontFamily.ui600, fontSize: 18 },
  pairHex: { fontFamily: fontFamily.mono500, fontSize: 13, color: color.ink },
  ratio: { fontFamily: fontFamily.mono500, fontSize: 15, color: color.inkSoft },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: '#FFFFFF', fontFamily: fontFamily.ui600, fontSize: 12 },
  actions: { flexDirection: 'row', gap: space[3], padding: space[4] },
});
