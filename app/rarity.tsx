// Rarity Guide — docs/UI_DESIGN.md → Rarity Guide; docs/DEX_SPEC.md → RARITY.
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getAllEntries } from '../src/db/entryRepo';
import { ENTRIES } from '../src/dex/entries.generated';
import type { Rarity } from '../src/dex/rules';
import { useDbQuery } from '../src/store/data';
import { RARITY_LABEL, RarityIcon } from '../src/ui/brand';
import { ChevronIcon } from '../src/ui/icons';
import { Screen } from '../src/ui/Screen';
import { color, fontFamily, radius, rarityColor, shadow, space, type } from '../src/ui/tokens';

const TIERS: { r: Rarity; meaning: string }[] = [
  { r: 'COMMON', meaning: 'Greys, browns and everyday greens — everywhere outside.' },
  { r: 'UNCOMMON', meaning: 'Clearer hues you meet on most walks.' },
  { r: 'RARE', meaning: 'Strong colour that takes some looking for.' },
  { r: 'LEGENDARY', meaning: 'Vivid hues nature rarely shows.' },
  { r: 'MYTHICAL', meaning: 'Vivid blues, indigos and violets — the hardest to find.' },
];

export default function RarityGuide() {
  const { data } = useDbQuery((db) => getAllEntries(db), []);
  const caughtNos = new Set((data ?? []).filter((e) => e.times_caught > 0).map((e) => e.no));
  return (
    <Screen>
      <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
        <ChevronIcon direction="left" />
      </Pressable>
      <Text style={styles.title} accessibilityRole="header">
        Rarity Guide
      </Text>
      <Text style={styles.body}>
        Rarity shows how often nature tends to show this colour. Greens and greys are everywhere; vivid blues and violets are hard to find.
      </Text>
      {TIERS.map(({ r, meaning }) => {
        const total = ENTRIES.filter((e) => e.rarity === r);
        const got = total.filter((e) => caughtNos.has(e.no)).length;
        return (
          <View key={r} style={styles.row} accessible accessibilityLabel={`${RARITY_LABEL[r]}: ${meaning} ${got} of ${total.length} caught`}>
            <View style={[styles.icon, { backgroundColor: color.bg }]}>
              <RarityIcon rarity={r} size={24} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.tier, { color: rarityColor[r] }]}>{RARITY_LABEL[r]}</Text>
              <Text style={styles.meaning}>{meaning}</Text>
            </View>
            <Text style={styles.count}>
              {got} / {total.length}
            </Text>
          </View>
        );
      })}
      <Text style={styles.footnote}>A designed heuristic for a collection, not a scientific measurement.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { width: 48, height: 48, borderRadius: 24, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  title: { ...type.display, color: color.ink },
  body: { ...type.body, color: color.inkSoft },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3], backgroundColor: color.surface, borderRadius: radius.md, padding: space[4], ...shadow.card },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  tier: { fontSize: 16, fontFamily: fontFamily.ui600 },
  meaning: { fontSize: 13, fontFamily: fontFamily.ui400, color: color.inkSoft },
  count: { fontSize: 15, fontFamily: fontFamily.mono500, color: color.ink },
  footnote: { fontSize: 12, fontFamily: fontFamily.ui400, color: color.inkSoft },
});
