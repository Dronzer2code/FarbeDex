import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Screen } from '../../src/ui/Screen';
import { color, type } from '../../src/ui/tokens';

export default function Home() {
  return (
    <Screen title={'What colour are you\nhunting today?'}>
      <Text style={styles.body}>Home is built in T11.</Text>
      {__DEV__ ? (
        <Link href="/dev/ai-spike" style={styles.link}>
          Open AI spike (dev)
        </Link>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { ...type.body, color: color.inkSoft },
  link: { ...type.body, color: color.ink, textDecorationLine: 'underline', paddingVertical: 12 },
});
