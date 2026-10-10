import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { color, space, type } from './tokens';

/** Plain scrolling screen with a title — placeholder chrome until T4 components land. */
export function Screen({ title, children }: { title?: string; children?: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        <View style={styles.body}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  content: { padding: space[4], paddingBottom: space[7] * 2 },
  title: { ...type.display, color: color.ink, marginBottom: space[4] },
  body: { gap: space[3] },
});
