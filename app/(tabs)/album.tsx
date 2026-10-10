// Album — docs/UI_DESIGN.md → Album; docs/PROCESS_FLOW.md → J4.
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { listCatches, type CatchSummary } from '../../src/db/catchRepo';
import { deleteCatchEverywhere, useDbQuery } from '../../src/store/data';
import { CatchButton } from '../../src/ui/TabBar';
import { ConfirmDialog } from '../../src/ui/controls';
import { DistributionStrip } from '../../src/ui/data';
import { dayGroupLabel, formatDay } from '../../src/ui/format';
import { Specimen } from '../../src/ui/Specimen';
import { showToast } from '../../src/ui/toast';
import { color, radius, space, type } from '../../src/ui/tokens';

const GAP = space[2];

function groupByDay(catches: CatchSummary[]) {
  const groups: { label: string; items: CatchSummary[] }[] = [];
  for (const c of catches) {
    const label = dayGroupLabel(c.created_at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(c);
    else groups.push({ label, items: [c] });
  }
  return groups;
}

export default function Album() {
  const { data } = useDbQuery((db) => listCatches(db), []);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const tile = Math.floor((width - space[4] * 2 - GAP * 2) / 3);

  if (data && data.length === 0) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Text style={styles.title}>Album</Text>
        <View style={styles.empty}>
          <Specimen no={1} hex="#7FA05A" size={120} />
          <Text style={styles.emptyText}>No catches yet. Step outside and catch your first colour.</Text>
          <CatchButton />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Album</Text>
        {groupByDay(data ?? []).map((g) => (
          <View key={g.label} style={{ gap: space[2] }}>
            <Text style={styles.group}>{g.label}</Text>
            <View style={styles.grid}>
              {g.items.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => router.push(`/photo/${c.id}`)}
                  onLongPress={() => setToDelete(c.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Catch from ${formatDay(c.created_at)}${c.subject_label ? `, ${c.subject_label}` : ''}, ${c.strip.length} colours`}
                  accessibilityHint="Long press to delete"
                  style={({ pressed }) => [{ width: tile }, pressed && { transform: [{ scale: 0.97 }] }]}
                >
                  <Image source={{ uri: c.thumb_path }} style={[styles.thumb, { width: tile, height: tile }]} contentFit="cover" />
                  <View style={{ marginTop: 4 }}>
                    <DistributionStrip strip={c.strip} otherPct={c.other_pct} height={6} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      <ConfirmDialog
        visible={toDelete !== null}
        title="Delete this catch?"
        message="Its colours are removed from your FarbeDex counts. Names you have already earned are kept."
        confirmLabel="Delete"
        danger
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          const id = toDelete;
          setToDelete(null);
          if (id) {
            await deleteCatchEverywhere(id);
            showToast('Catch deleted');
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  content: { padding: space[4], gap: space[4], paddingBottom: 120 },
  title: { ...type.display, color: color.ink, paddingHorizontal: 0 },
  group: { ...type.label, color: color.inkSoft },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  thumb: { borderRadius: radius.md, backgroundColor: color.surfaceSunken },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[5], padding: space[5] },
  emptyText: { ...type.body, color: color.inkSoft, textAlign: 'center' },
});
