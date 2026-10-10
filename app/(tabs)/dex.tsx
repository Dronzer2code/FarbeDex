// FarbeDex grid — docs/UI_DESIGN.md → FarbeDex grid; docs/PROCESS_FLOW.md → J3.
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAllEntries } from '../../src/db/entryRepo';
import { ENTRIES } from '../../src/dex/entries.generated';
import { NO_FILTER, filterEntries, type EntryFilter, type EntryState, type StatusFilter } from '../../src/dex/filter';
import { HUE_FAMILIES, type Rarity } from '../../src/dex/rules';
import { useDbQuery } from '../../src/store/data';
import { RARITY_LABEL, RarityIcon } from '../../src/ui/brand';
import { Chip } from '../../src/ui/Chip';
import { familyColor } from '../../src/ui/colorUtils';
import { Sheet } from '../../src/ui/controls';
import { EntryCard } from '../../src/ui/EntryCard';
import { color, fontFamily, radius, space, type } from '../../src/ui/tokens';

const RARITIES: Rarity[] = ['COMMON', 'UNCOMMON', 'RARE', 'LEGENDARY', 'MYTHICAL'];
const FAMILIES = ['Neutral', ...HUE_FAMILIES];

export default function Dex() {
  const { data: rows } = useDbQuery((db) => getAllEntries(db), []);
  const [filter, setFilter] = useState<EntryFilter>(NO_FILTER);
  const [picker, setPicker] = useState<'rarity' | 'family' | null>(null);

  const states = useMemo(() => {
    const m = new Map<number, EntryState & { bestHex: string | null; shiny: boolean }>();
    for (const r of rows ?? []) m.set(r.no, { timesCaught: r.times_caught, name: r.name, bestHex: r.best_hex, shiny: (r.shiny_count ?? 0) > 0 });
    return m;
  }, [rows]);
  const caught = useMemo(() => (rows ?? []).filter((r) => r.times_caught > 0).length, [rows]);
  const visible = useMemo(() => filterEntries(ENTRIES, states, filter), [states, filter]);

  const setStatus = (status: StatusFilter) => setFilter((f) => ({ ...f, status }));

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title} accessibilityRole="header">
            FarbeDex
          </Text>
          <View style={styles.progressPill} accessibilityLabel={`${caught} of 151 caught`}>
            <Text style={styles.progressText}>{caught} / 151</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(caught / 151) * 100}%` }]} />
        </View>
        <TextInput
          value={filter.query}
          onChangeText={(query) => setFilter((f) => ({ ...f, query }))}
          placeholder="Search name or number"
          placeholderTextColor={color.inkSoft}
          style={styles.search}
          accessibilityLabel="Search entries"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="All" selected={filter.status === 'ALL'} onPress={() => setStatus('ALL')} />
          <Chip label="Caught" selected={filter.status === 'CAUGHT'} onPress={() => setStatus('CAUGHT')} />
          <Chip label="Missing" selected={filter.status === 'MISSING'} onPress={() => setStatus('MISSING')} />
          <Chip
            label={filter.rarity ? RARITY_LABEL[filter.rarity] : 'Rarity ▾'}
            selected={!!filter.rarity}
            onPress={() => setPicker('rarity')}
          />
          <Chip label={filter.family ?? 'Family ▾'} selected={!!filter.family} onPress={() => setPicker('family')} />
        </ScrollView>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(e) => String(e.no)}
        numColumns={2}
        columnWrapperStyle={{ gap: space[3] }}
        contentContainerStyle={styles.grid}
        initialNumToRender={12}
        windowSize={7}
        ListEmptyComponent={<Text style={styles.empty}>No entries match.</Text>}
        renderItem={({ item }) => {
          const s = states.get(item.no);
          const isCaught = (s?.timesCaught ?? 0) > 0;
          return (
            <EntryCard
              entry={item}
              caught={isCaught}
              name={s?.name ?? null}
              hex={s?.bestHex ?? null}
              timesCaught={s?.timesCaught}
              shiny={s?.shiny}
              onPress={() => router.push(`/entry/${item.no}`)}
            />
          );
        }}
      />

      <Sheet visible={picker !== null} onClose={() => setPicker(null)} title={picker === 'rarity' ? 'Rarity' : 'Hue Family'}>
        <ScrollView contentContainerStyle={styles.pickerWrap}>
          <Chip
            label="Any"
            selected={picker === 'rarity' ? !filter.rarity : !filter.family}
            onPress={() => {
              setFilter((f) => (picker === 'rarity' ? { ...f, rarity: null } : { ...f, family: null }));
              setPicker(null);
            }}
          />
          {picker === 'rarity'
            ? RARITIES.map((r) => (
                <Chip
                  key={r}
                  label={RARITY_LABEL[r]}
                  icon={<RarityIcon rarity={r} size={14} />}
                  selected={filter.rarity === r}
                  onPress={() => {
                    setFilter((f) => ({ ...f, rarity: r }));
                    setPicker(null);
                  }}
                />
              ))
            : FAMILIES.map((fam) => (
                <Chip
                  key={fam}
                  label={fam}
                  icon={<View style={[styles.dot, { backgroundColor: familyColor(fam) }]} />}
                  selected={filter.family === fam}
                  onPress={() => {
                    setFilter((f) => ({ ...f, family: fam }));
                    setPicker(null);
                  }}
                />
              ))}
        </ScrollView>
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  header: { paddingHorizontal: space[4], paddingTop: space[2], gap: space[3] },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...type.display, color: color.ink },
  progressPill: { backgroundColor: color.ink, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 4 },
  progressText: { color: '#FFFFFF', fontFamily: fontFamily.mono500, fontSize: 14 },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: color.line, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: color.ink },
  search: {
    backgroundColor: color.surfaceSunken,
    borderRadius: radius.pill,
    paddingHorizontal: space[4],
    minHeight: 48,
    fontFamily: fontFamily.ui400,
    fontSize: 15,
    color: color.ink,
  },
  chips: { gap: space[2], paddingVertical: space[1], paddingRight: space[4] },
  grid: { padding: space[4], gap: space[3], paddingBottom: 120 },
  empty: { ...type.body, color: color.inkSoft, textAlign: 'center', marginTop: space[6] },
  pickerWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], paddingBottom: space[4] },
  dot: { width: 14, height: 14, borderRadius: 7 },
});
