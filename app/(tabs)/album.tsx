import { StyleSheet, Text } from 'react-native';

import { Screen } from '../../src/ui/Screen';
import { color, type } from '../../src/ui/tokens';

export default function Album() {
  return (
    <Screen title="Album">
      <Text style={styles.body}>No catches yet. Step outside and catch your first colour.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({ body: { ...type.body, color: color.inkSoft } });
