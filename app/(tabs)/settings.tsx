import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { DevModelSource } from '../../src/ui/DevModelSource';
import { Screen } from '../../src/ui/Screen';
import { color, type } from '../../src/ui/tokens';

export default function Settings() {
  return (
    <Screen title="Settings">
      <Text style={styles.body}>Models, storage and licenses are built in T11.</Text>
      {__DEV__ ? (
        <>
          <DevModelSource />
          <Link href="/dev/ai-spike" style={styles.link}>
            Open AI spike (dev)
          </Link>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { ...type.body, color: color.inkSoft },
  link: { ...type.body, color: color.ink, textDecorationLine: 'underline', paddingVertical: 12 },
});
