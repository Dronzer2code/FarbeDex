// Catch result — placeholder for T5; full screen built in T7.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { getCatch } from '../../src/db/catchRepo';
import { getDb } from '../../src/db/db';
import type { SwatchRow } from '../../src/db/types';
import { Button } from '../../src/ui/controls';
import { Screen } from '../../src/ui/Screen';
import { color, type } from '../../src/ui/tokens';

export default function CatchResult() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [swatches, setSwatches] = useState<SwatchRow[]>([]);
  useEffect(() => {
    getDb().then((db) => getCatch(db, id)).then((c) => setSwatches(c?.swatches ?? []));
  }, [id]);
  const newCount = swatches.filter((s) => s.is_new).length;
  return (
    <Screen title={`${swatches.length} colours caught`}>
      {newCount > 0 ? <Text style={styles.new}>{newCount} new!</Text> : null}
      {swatches.map((s) => (
        <Text key={s.entry_no} style={type.body}>
          #{String(s.entry_no).padStart(3, '0')} {s.hex} {s.pct.toFixed(1)}%
        </Text>
      ))}
      <Button label="Catch again" onPress={() => router.replace('/catch')} />
    </Screen>
  );
}

const styles = StyleSheet.create({ new: { ...type.title, color: color.success } });
