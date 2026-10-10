// Entry detail — docs/UI_DESIGN.md → Entry detail (caught + missing); docs/DEX_SPEC.md → NEIGHBORS, FOUND-IN BAR.
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { hexToOklab, hexToSrgb8, oklabToOklch } from '../../src/color/oklab';
import { countCatches } from '../../src/db/catchRepo';
import { catchesForEntry, getAllEntries } from '../../src/db/entryRepo';
import { ENTRIES } from '../../src/dex/entries.generated';
import { fieldNotesForFamily } from '../../src/dex/fieldNotes';
import { foundIn } from '../../src/dex/foundIn';
import { FAMILY_HINTS } from '../../src/dex/hints';
import { neighborsOf, stepEntry } from '../../src/dex/neighbors';
import { useDbQuery } from '../../src/store/data';
import { FarbeMark, RARITY_LABEL, RarityIcon } from '../../src/ui/brand';
import { FamilyChip, RarityChip } from '../../src/ui/Chip';
import { tint } from '../../src/ui/colorUtils';
import { NavArrow, SectionHeader } from '../../src/ui/controls';
import { SegmentBar, StatColumn, ValueRow } from '../../src/ui/data';
import { EntryCard } from '../../src/ui/EntryCard';
import { displayName, entryCode, formatDay } from '../../src/ui/format';
import { ChevronIcon } from '../../src/ui/icons';
import { Specimen } from '../../src/ui/Specimen';
import { color, radius, rarityColor, shadow, space, type } from '../../src/ui/tokens';

const FOUND_IN_COLORS = ['#3F5A2E', '#7FA05A', '#B9C99A'];

export default function EntryDetail() {
  const params = useLocalSearchParams<{ no: string }>();
  const no = Math.min(151, Math.max(1, Number(params.no) || 1));
  const entry = ENTRIES[no - 1];
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const { data } = useDbQuery(
    async (db) => {
      const [rows, refs, total] = await Promise.all([getAllEntries(db), catchesForEntry(db, no), countCatches(db)]);
      return { rows: new Map(rows.map((r) => [r.no, r])), refs, total };
    },
    [no],
  );

  const row = data?.rows.get(no);
  const caught = (row?.times_caught ?? 0) > 0;
  const bestHex = caught ? row?.best_hex ?? entry.canonical.hex : null;
  const headerH = Math.round(height * 0.44);
  const go = (delta: 1 | -1) => router.setParams({ no: String(stepEntry(no, delta)) });

  const firstRef = data?.refs.length ? [...data.refs].sort((a, b) => a.created_at - b.created_at)[0] : null;
  const description = caught && row?.first_caught_at
    ? `First caught on ${formatDay(row.first_caught_at)}${firstRef?.subject_label ? ` in ${firstRef.subject_label}` : ''}. Found in ${row.times_caught} ${row.times_caught === 1 ? 'catch' : 'catches'}.`
    : `Not caught yet. Look for: ${FAMILY_HINTS[entry.family].toLowerCase()}.`;

  const share = caught && data?.total ? (row!.sum_pct / data.total).toFixed(1) + '%' : '—';
  const fi = caught ? foundIn(data?.refs ?? []) : [];
  const oklch = bestHex ? oklabToOklch(hexToOklab(bestHex)) : null;
  const rgb = bestHex ? hexToSrgb8(bestHex) : null;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space[7] }}>
        {/* Header with arc */}
        <View style={{ height: headerH, backgroundColor: caught ? tint(bestHex!) : color.silhouetteBg }}>
          <View style={[styles.watermark, { top: headerH * 0.12 }]} pointerEvents="none">
            <FarbeMark size={headerH * 0.62} mono="#FFFFFF" opacity={0.35} />
          </View>
          <View style={[styles.headerBar, { top: insets.top + space[2] }]}>
            <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
              <ChevronIcon direction="left" />
            </Pressable>
            <FarbeMark size={32} />
          </View>
          <Svg width={width} height={60} viewBox={`0 0 ${width} 60`} style={styles.arc} preserveAspectRatio="none">
            <Path d={`M0 60 L0 40 Q${width / 2} -20 ${width} 40 L${width} 60 Z`} fill={color.surface} />
          </Svg>
        </View>

        {/* Specimen on the arc + prev/next */}
        <View style={[styles.heroRow, { marginTop: -150 }]}>
          <NavArrow direction="left" label={`Previous entry, ${entryCode(stepEntry(no, -1))}`} onPress={() => go(-1)} />
          <Specimen no={no} hex={bestHex ?? undefined} missing={!caught} size={200} />
          <NavArrow direction="right" label={`Next entry, ${entryCode(stepEntry(no, 1))}`} onPress={() => go(1)} />
        </View>

        <View style={styles.body}>
          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} accessibilityRole="header">
                {caught ? displayName(no, row?.name) : '???'}
              </Text>
              <Text style={type.number}>{entry.code}</Text>
            </View>
            <View style={styles.tier}>
              <RarityIcon rarity={entry.rarity} size={18} />
              <Text style={[type.label, { color: rarityColor[entry.rarity] }]}>{RARITY_LABEL[entry.rarity]}</Text>
            </View>
          </View>

          <View style={styles.chips}>
            <FamilyChip family={entry.family} />
            <RarityChip rarity={entry.rarity} />
          </View>

          <Text style={styles.description}>{description}</Text>
          <View style={styles.divider} />

          {caught ? (
            <>
              <View style={styles.stats}>
                <StatColumn label="Times caught" value={String(row!.times_caught)} />
                <StatColumn label="Share of catches" value={share} />
                <StatColumn label="First caught" value={row!.first_caught_at ? formatDay(row!.first_caught_at) : '—'} />
              </View>

              {fi.length > 0 ? (
                <>
                  <SectionHeader>Found in</SectionHeader>
                  <SegmentBar
                    segments={fi.map((s, i) => ({ key: s.label, label: s.label, pct: s.pct, color: s.label === 'other' ? color.silhouette : FOUND_IN_COLORS[i % 3] }))}
                  />
                </>
              ) : null}

              <SectionHeader>Values</SectionHeader>
              <View>
                <ValueRow label="HEX" value={bestHex!} />
                <ValueRow label="RGB" value={`${rgb![0]}, ${rgb![1]}, ${rgb![2]}`} />
                <ValueRow label="OKLCH" value={`oklch(${(oklch!.l * 100).toFixed(1)}% ${oklch!.c.toFixed(3)} ${oklch!.h.toFixed(1)})`} />
              </View>
            </>
          ) : (
            <View style={styles.hint}>
              <Text style={type.label}>Where to look</Text>
              <Text style={styles.hintText}>{FAMILY_HINTS[entry.family]}</Text>
            </View>
          )}

          <SectionHeader>Neighbors</SectionHeader>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.neighbors}>
            {neighborsOf(no).map((n) => {
              const r = data?.rows.get(n.no);
              const isCaught = (r?.times_caught ?? 0) > 0;
              return (
                <View key={n.kind} style={{ width: 170 }}>
                  <EntryCard
                    entry={ENTRIES[n.no - 1]}
                    caught={isCaught}
                    name={r?.name ?? null}
                    hex={r?.best_hex ?? null}
                    timesCaught={r?.times_caught}
                    label={n.kind}
                    compact
                    onPress={() => router.setParams({ no: String(n.no) })}
                  />
                </View>
              );
            })}
          </ScrollView>

          {caught && data?.refs.length ? (
            <>
              <SectionHeader>Seen in</SectionHeader>
              <View style={styles.seenGrid}>
                {data.refs.map((r) => (
                  <Pressable
                    key={r.catch_id}
                    onPress={() => router.push(`/photo/${r.catch_id}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`Catch from ${formatDay(r.created_at)}, ${r.pct.toFixed(1)} percent`}
                    style={{ width: (width - space[4] * 2 - space[2] * 2) / 3 }}
                  >
                    <Image source={{ uri: r.thumb_path }} style={styles.seenThumb} contentFit="cover" />
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          {fieldNotesForFamily(entry.family).map((n) => (
            <View key={n.id} style={styles.hint}>
              <Text style={type.label}>Field note</Text>
              <Text style={[styles.hintText, { fontFamily: type.title.fontFamily }]}>{n.title}</Text>
              <Text style={styles.description}>{n.body}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.surface },
  watermark: { position: 'absolute', alignSelf: 'center' },
  headerBar: { position: 'absolute', left: space[4], right: space[4], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
  arc: { position: 'absolute', bottom: -1, left: 0 },
  heroRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[4] },
  body: { paddingHorizontal: space[4], gap: space[3] },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  name: { ...type.display, color: color.ink },
  tier: { alignItems: 'flex-end', gap: 4, paddingTop: 8 },
  chips: { flexDirection: 'row', gap: space[2], flexWrap: 'wrap' },
  description: { ...type.body, color: color.inkSoft },
  divider: { height: 1, backgroundColor: color.line },
  stats: { flexDirection: 'row', gap: space[3] },
  hint: { backgroundColor: color.bg, borderRadius: radius.md, padding: space[4], gap: space[2] },
  hintText: { ...type.body, color: color.ink },
  neighbors: { gap: space[3], paddingVertical: space[1], paddingRight: space[4] },
  seenGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  seenThumb: { width: '100%', aspectRatio: 1, borderRadius: radius.md, backgroundColor: color.surfaceSunken, ...shadow.card },
});
