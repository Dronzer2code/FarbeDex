// Export palette — docs/UI_DESIGN.md → Export; docs/PROCESS_FLOW.md → J5. Image tab: shareable palette card.
import * as Clipboard from 'expo-clipboard';
import { File, Paths } from 'expo-file-system';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type Svg from 'react-native-svg';

import { paletteMood } from '../../src/color/mood';
import { getCatch } from '../../src/db/catchRepo';
import { getAllEntries } from '../../src/db/entryRepo';
import { contrastPairs, toContrastText, toCss, toTailwind, toTokens, type ExportSwatch } from '../../src/export/formats';
import { savePngToDevice, sharePng, svgToPngBase64 } from '../../src/export/saveImage';
import { useDbQuery } from '../../src/store/data';
import { Chip } from '../../src/ui/Chip';
import { Button } from '../../src/ui/controls';
import { displayName, formatDay } from '../../src/ui/format';
import { CloseIcon } from '../../src/ui/icons';
import { PaletteCard, type CardColour } from '../../src/ui/PaletteCard';
import { showToast } from '../../src/ui/toast';
import { color, fontFamily, radius, shadow, space, type } from '../../src/ui/tokens';

type Tab = 'Image' | 'CSS' | 'Tailwind' | 'Tokens' | 'Contrast';
const TABS: Tab[] = ['Image', 'CSS', 'Tailwind', 'Tokens', 'Contrast'];
const EXT: Record<Exclude<Tab, 'Image'>, string> = { CSS: 'css', Tailwind: 'js', Tokens: 'json', Contrast: 'txt' };
const GRADE_COLOR = { AA: color.success, 'AA-large': color.warning, Fail: color.danger } as const;

export default function ExportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>('Image');
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<Svg>(null);
  const { data } = useDbQuery(
    async (db) => {
      const c = await getCatch(db, id);
      const names = new Map((await getAllEntries(db)).map((e) => [e.no, e.name]));
      const sw: ExportSwatch[] = (c?.swatches ?? []).map((s) => ({ no: s.entry_no, name: displayName(s.entry_no, names.get(s.entry_no)), hex: s.hex, pct: s.pct }));
      const card: CardColour[] = (c?.swatches ?? []).map((s) => ({ hex: s.hex, l: s.ok_l, no: s.entry_no }));
      const mood = paletteMood((c?.swatches ?? []).map((s) => ({ l: s.ok_l, c: s.ok_c, h: s.ok_h, pct: s.pct })));
      const caption = c ? [c.catch.subject_label, formatDay(c.catch.created_at)].filter(Boolean).join(' · ') : '';
      return { sw, card, title: c?.catch.title ?? mood, caption };
    },
    [id],
  );
  const sw = data?.sw ?? [];
  const text =
    tab === 'CSS' ? toCss(sw) : tab === 'Tailwind' ? toTailwind(sw) : tab === 'Tokens' ? toTokens(sw) : tab === 'Contrast' ? toContrastText(sw) : '';

  const copy = async () => {
    await Clipboard.setStringAsync(text);
    showToast('Copied');
  };
  const shareText = async () => {
    if (tab === 'Image') return;
    const f = new File(Paths.cache, `farbedex-palette.${EXT[tab]}`);
    if (f.exists) f.delete();
    f.create();
    f.write(text);
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(f.uri, { mimeType: 'text/plain', dialogTitle: 'Export palette' });
  };
  const withImage = async (action: (b64: string) => Promise<unknown>, done?: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await action(await svgToPngBase64(cardRef.current));
      if (done) showToast(done);
    } catch (e) {
      const cancelled = /cancel/i.test(String(e));
      if (!cancelled) showToast('Could not create the image. Try again.');
    } finally {
      setBusy(false);
    }
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {TABS.map((t) => (
          <Chip key={t} label={t} selected={tab === t} onPress={() => setTab(t)} />
        ))}
      </ScrollView>

      {tab === 'Image' ? (
        <ScrollView contentContainerStyle={styles.imageWrap}>
          <View style={styles.cardFrame} accessible accessibilityLabel={`Palette image: ${data?.title ?? ''}`}>
            {data ? <PaletteCard ref={cardRef} colours={data.card} title={data.title} caption={data.caption} /> : null}
          </View>
          <Text style={styles.help}>Save asks for a folder the first time (for example Downloads).</Text>
        </ScrollView>
      ) : tab === 'Contrast' ? (
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
        {tab === 'Image' ? (
          <>
            <View style={{ flex: 1 }}>
              <Button label="Save" variant="secondary" disabled={busy || !data} onPress={() => withImage(savePngToDevice, 'Saved')} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Share" disabled={busy || !data} onPress={() => withImage(sharePng)} />
            </View>
          </>
        ) : (
          <>
            <View style={{ flex: 1 }}>
              <Button label="Share" variant="secondary" onPress={shareText} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Copy" onPress={copy} />
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[4], paddingTop: space[2] },
  title: { ...type.title, color: color.ink },
  close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', gap: space[2], paddingHorizontal: space[4], paddingVertical: space[3] },
  imageWrap: { paddingHorizontal: space[4], gap: space[3], alignItems: 'center' },
  cardFrame: { width: '100%', aspectRatio: 360 / 450, borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#FFFFFF', ...shadow.card },
  help: { fontSize: 12, fontFamily: fontFamily.ui400, color: color.inkSoft, textAlign: 'center' },
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
