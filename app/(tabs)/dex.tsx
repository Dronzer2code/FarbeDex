import { StyleSheet, Text } from 'react-native';

import { Screen } from '../../src/ui/Screen';
import { color, type } from '../../src/ui/tokens';

export default function Dex() {
  return (
    <Screen title="FarbeDex">
      <Text style={styles.body}>The 151-entry grid is built in T8.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({ body: { ...type.body, color: color.inkSoft } });
