import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Rarity } from '../dex/rules';
import { RARITY_LABEL, RarityIcon } from './brand';
import { familyColor } from './colorUtils';
import { color, fontFamily, radius, shadow } from './tokens';

export function Chip({ icon, label, onPress, selected }: { icon?: ReactNode; label: string; onPress?: () => void; selected?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={onPress ? { selected: !!selected } : undefined}
      style={[styles.chip, selected && styles.selected]}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.label, selected && { color: '#FFFFFF' }]}>{label}</Text>
    </Pressable>
  );
}

export function FamilyChip({ family }: { family: string }) {
  return <Chip label={family} icon={<View style={[styles.dot, { backgroundColor: familyColor(family) }]} />} />;
}

export function RarityChip({ rarity }: { rarity: Rarity }) {
  return <Chip label={RARITY_LABEL[rarity]} icon={<RarityIcon rarity={rarity} size={14} />} />;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
    gap: 6,
    ...shadow.card,
  },
  selected: { backgroundColor: color.ink },
  icon: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: color.surfaceSunken },
  dot: { width: 14, height: 14, borderRadius: 7 },
  label: { fontSize: 13, fontFamily: fontFamily.ui500, color: color.ink },
});
