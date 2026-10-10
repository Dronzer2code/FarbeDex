// Dev-only component gallery (T4): every src/ui component in its states.
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ENTRIES } from '../../src/dex/entries.generated';
import { FarbeMark, RarityIcon } from '../../src/ui/brand';
import { Chip, FamilyChip, RarityChip } from '../../src/ui/Chip';
import { Button, ConfirmDialog, NavArrow, SectionHeader, Sheet } from '../../src/ui/controls';
import { DistributionStrip, NewPill, SegmentBar, StatColumn, SwatchRow, ValueRow } from '../../src/ui/data';
import { EntryCard } from '../../src/ui/EntryCard';
import { ApertureIcon } from '../../src/ui/icons';
import { Screen } from '../../src/ui/Screen';
import { Specimen } from '../../src/ui/Specimen';
import { CatchButton } from '../../src/ui/TabBar';
import { showToast } from '../../src/ui/toast';
import { color, space, type } from '../../src/ui/tokens';

const RARITIES = ['COMMON', 'UNCOMMON', 'RARE', 'LEGENDARY', 'MYTHICAL'] as const;
const moss = ENTRIES[8 + 9 * 6 + 3 - 1]; // Green / Mid / Dusty
const myth = ENTRIES.find((e) => e.rarity === 'MYTHICAL')!;
const legend = ENTRIES.find((e) => e.rarity === 'LEGENDARY')!;

export default function UiKit() {
  const [sheet, setSheet] = useState(false);
  const [dialog, setDialog] = useState(false);
  if (!__DEV__) return <Redirect href="/" />;

  return (
    <Screen>
      <SectionHeader>Brand</SectionHeader>
      <View style={styles.row}>
        <FarbeMark size={56} />
        <FarbeMark size={56} mono={color.ink} opacity={0.35} />
        <View style={styles.aperture}>
          <ApertureIcon />
        </View>
        <CatchButton />
      </View>
      <View style={styles.row}>
        {RARITIES.map((r) => (
          <RarityIcon key={r} rarity={r} size={24} />
        ))}
      </View>

      <SectionHeader>Specimen</SectionHeader>
      <View style={styles.row}>
        <Specimen no={0} hex="#5F7A3A" size={56} />
        <Specimen no={1} hex="#78AAE6" size={120} />
        <Specimen no={2} missing size={56} />
      </View>
      <Specimen no={moss.no} hex={moss.canonical.hex} size={200} />

      <SectionHeader>EntryCard</SectionHeader>
      <View style={styles.row}>
        <EntryCard entry={moss} caught name="Wet Moss Stone" hex="#5F7A3A" timesCaught={3} />
        <EntryCard entry={moss} caught={false} name={null} hex={null} />
      </View>
      <View style={styles.row}>
        <EntryCard entry={myth} caught name="Deep Night Iris" hex={myth.canonical.hex} timesCaught={1} />
        <EntryCard entry={legend} caught name="Sunset Ember" hex={legend.canonical.hex} timesCaught={1} />
      </View>
      <View style={styles.row}>
        <EntryCard entry={moss} caught compact label="Darker" name="Fern Shade" hex="#3C5428" />
        <EntryCard entry={myth} caught={false} compact label="Next hue" name={null} hex={null} />
      </View>

      <SectionHeader>Chips</SectionHeader>
      <View style={styles.wrap}>
        <FamilyChip family="Green" />
        <FamilyChip family="Neutral" />
        {RARITIES.map((r) => (
          <RarityChip key={r} rarity={r} />
        ))}
        <Chip label="Caught" selected onPress={() => {}} />
        <Chip label="Missing" onPress={() => {}} />
      </View>

      <SectionHeader>Stats</SectionHeader>
      <View style={styles.row}>
        <StatColumn label="Times caught" value="3" />
        <StatColumn label="Share of catches" value="14.2%" />
        <StatColumn label="First caught" value="10 Oct" />
      </View>

      <SectionHeader>SegmentBar · strip</SectionHeader>
      <SegmentBar
        segments={[
          { key: 'a', label: 'moss', pct: 60, color: '#5F7A3A' },
          { key: 'b', label: 'tree bark', pct: 30, color: '#5A4632' },
          { key: 'o', label: 'other', pct: 10, color: color.silhouette },
        ]}
      />
      <DistributionStrip strip={[{ hex: '#78AAE6', pct: 40 }, { hex: '#5F7A3A', pct: 35 }, { hex: '#5A4632', pct: 20 }]} otherPct={5} />

      <SectionHeader>SwatchRow · ValueRow</SectionHeader>
      <SwatchRow hex="#5F7A3A" name="Wet Moss Stone" no={67} pct={42} isNew onPress={() => showToast('Tap → Entry')} />
      <SwatchRow hex="#78AAE6" name="Pale Azure" no={104} pct={31.5} />
      <ValueRow label="HEX" value="#5F7A3A" />
      <ValueRow label="OKLCH" value="0.535 0.083 128.4" />
      <View style={styles.row}>
        <NewPill />
        <NavArrow direction="left" label="Previous" onPress={() => {}} />
        <NavArrow direction="right" label="Next" onPress={() => {}} />
      </View>

      <SectionHeader>Buttons · overlays</SectionHeader>
      <Button label="Catch again" onPress={() => showToast('Copied')} />
      <Button label="View photo" variant="secondary" onPress={() => setSheet(true)} />
      <Button label="Delete catch" variant="danger" onPress={() => setDialog(true)} />
      <Sheet visible={sheet} onClose={() => setSheet(false)} title="Export palette">
        <Text style={type.body}>Sheet content</Text>
        <Button label="Close" onPress={() => setSheet(false)} />
      </Sheet>
      <ConfirmDialog
        visible={dialog}
        title="Delete this catch?"
        message="Its colours are removed from your FarbeDex counts."
        confirmLabel="Delete"
        danger
        onConfirm={() => setDialog(false)}
        onCancel={() => setDialog(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  aperture: { width: 56, height: 56, borderRadius: 28, backgroundColor: color.ink, alignItems: 'center', justifyContent: 'center' },
});
