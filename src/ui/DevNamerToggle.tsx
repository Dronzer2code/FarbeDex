// Dev-only: disable Gemma so new Entries get template names (AC-F10.1).
import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { SettingKey, getSetting, setSetting } from '../db/settingsRepo';
import { color, fontFamily, radius, space, type } from './tokens';

export function DevNamerToggle() {
  const [disabled, setDisabled] = useState(false);
  useEffect(() => {
    getSetting(SettingKey.namerDisabled).then((v) => setDisabled(v === '1'));
  }, []);
  if (!__DEV__) return null;
  return (
    <View style={styles.card}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>Disable Gemma (dev)</Text>
        <Text style={styles.help}>New Entries get template names; no design note.</Text>
      </View>
      <Switch
        value={disabled}
        onValueChange={async (v) => {
          setDisabled(v);
          await setSetting(SettingKey.namerDisabled, v ? '1' : '0');
        }}
        accessibilityLabel="Disable Gemma"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: space[3], backgroundColor: color.surface, borderRadius: radius.md, padding: space[4] },
  label: { ...type.label, color: color.inkSoft },
  help: { fontSize: 12, fontFamily: fontFamily.ui400, color: color.inkSoft },
});
