// Photo Overview — docs/UI_DESIGN.md → Photo Overview; docs/PROCESS_FLOW.md → J4.
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { getCatch, parseMinority } from '../../src/db/catchRepo';
import { getAllEntries } from '../../src/db/entryRepo';
import { deleteCatchEverywhere, useDbQuery } from '../../src/store/data';
import { Chip } from '../../src/ui/Chip';
import { Button, ConfirmDialog, SectionHeader, Sheet } from '../../src/ui/controls';
import { MinorityColours, SegmentBar, SwatchRow } from '../../src/ui/data';
import { displayName, formatDateTime } from '../../src/ui/format';
import { ChevronIcon } from '../../src/ui/icons';
import { showToast } from '../../src/ui/toast';
import { color, fontFamily, radius, shadow, space, type } from '../../src/ui/tokens';

function MenuIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill={color.ink}>
      <Circle cx={12} cy={5} r={2} />
      <Circle cx={12} cy={12} r={2} />
      <Circle cx={12} cy={19} r={2} />
    </Svg>
  );
}

export default function PhotoOverview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const { data } = useDbQuery(
    async (db) => {
      const c = await getCatch(db, id);
      const entries = await getAllEntries(db);
      return { c, names: new Map(entries.map((e) => [e.no, e.name])) };
    },
    [id],
  );

  if (!data) return <View style={styles.root} />;
  if (!data.c) {
    return (
      <View style={[styles.root, { padding: space[4], paddingTop: insets.top + space[4] }]}>
        <Text style={type.body}>This catch no longer exists.</Text>
        <Button label="Back" onPress={() => router.back()} />
      </View>
    );
  }
  const { catch: c, swatches } = data.c;
  const aspect = c.width / c.height;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space[6] }}>
        <View style={styles.photoWrap}>
          <Image source={{ uri: c.photo_path }} style={{ width: '100%', aspectRatio: Math.max(0.6, Math.min(aspect, 1.6)) }} contentFit="cover" accessibilityLabel="Catch photo" />
          <View style={[styles.topBar, { top: insets.top + space[2] }]}>
            <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" style={styles.roundBtn}>
              <ChevronIcon direction="left" />
            </Pressable>
            <Pressable onPress={() => setMenu(true)} accessibilityRole="button" accessibilityLabel="More options" style={styles.roundBtn}>
              <MenuIcon />
            </Pressable>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.metaRow}>
            {c.subject_label ? <Chip label={c.subject_label} /> : null}
            <Text style={styles.date}>{formatDateTime(c.created_at)}</Text>
          </View>

          <SectionHeader>Distribution</SectionHeader>
          <SegmentBar
            legend={false}
            segments={[
              ...swatches.map((s) => ({ key: String(s.entry_no), label: displayName(s.entry_no, data.names.get(s.entry_no)), pct: s.pct, color: s.hex })),
              { key: 'other', label: 'Minority', pct: c.other_pct, color: color.silhouette },
            ]}
          />
          <View>
            {[...swatches]
              .sort((p, q) => q.pct - p.pct)
              .map((s) => (
                <SwatchRow
                  key={s.entry_no}
                  hex={s.hex}
                  name={displayName(s.entry_no, data.names.get(s.entry_no))}
                  no={s.entry_no}
                  pct={s.pct}
                  isNew={s.is_new === 1}
                  onPress={() => router.push(`/entry/${s.entry_no}`)}
                />
              ))}
            <MinorityColours minority={parseMinority(c.minority)} otherPct={c.other_pct} onPressEntry={(no) => router.push(`/entry/${no}`)} />
          </View>

          {c.note ? (
            <View style={styles.note}>
              <Text style={styles.noteLabel}>Note · Gemma on your phone</Text>
              <Text style={styles.noteText}>{c.note}</Text>
            </View>
          ) : null}

          <Button label="Export palette" onPress={() => router.push(`/export/${c.id}`)} />
        </View>
      </ScrollView>

      <Sheet visible={menu} onClose={() => setMenu(false)}>
        <Button
          label="Delete catch"
          variant="danger"
          onPress={() => {
            setMenu(false);
            setConfirm(true);
          }}
        />
      </Sheet>
      <ConfirmDialog
        visible={confirm}
        title="Delete this catch?"
        message="Its colours are removed from your FarbeDex counts. Names you have already earned are kept."
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          setConfirm(false);
          await deleteCatchEverywhere(c.id);
          showToast('Catch deleted');
          router.back();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  photoWrap: { borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl, overflow: 'hidden', backgroundColor: color.surfaceSunken },
  topBar: { position: 'absolute', left: space[4], right: space[4], flexDirection: 'row', justifyContent: 'space-between' },
  roundBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center', ...shadow.button },
  body: { padding: space[4], gap: space[3] },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: space[3], flexWrap: 'wrap' },
  date: { fontSize: 13, fontFamily: fontFamily.ui400, color: color.inkSoft },
  note: { backgroundColor: color.surface, borderRadius: radius.md, padding: space[4], gap: space[2], ...shadow.card },
  noteLabel: { ...type.label, color: color.inkSoft },
  noteText: { ...type.body, color: color.ink },
});
