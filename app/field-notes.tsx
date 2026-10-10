// Field Notes — docs/PRD.md F12; docs/DEX_SPEC.md → FIELD NOTES SEED. Only verified cards are shown.
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { verifiedFieldNotes } from '../src/dex/fieldNotes';
import { familyColor } from '../src/ui/colorUtils';
import { ChevronIcon } from '../src/ui/icons';
import { Screen } from '../src/ui/Screen';
import { color, fontFamily, radius, shadow, space, type } from '../src/ui/tokens';

export default function FieldNotes() {
  const notes = verifiedFieldNotes();
  return (
    <Screen>
      <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
        <ChevronIcon direction="left" />
      </Pressable>
      <Text style={styles.title} accessibilityRole="header">
        Field Notes
      </Text>
      {notes.length === 0 ? <Text style={styles.body}>Field notes are on their way. Go catch some colours meanwhile.</Text> : null}
      {notes.map((n) => (
        <View key={n.id} style={styles.card}>
          <Text style={styles.cardTitle}>{n.title}</Text>
          <Text style={styles.body}>{n.body}</Text>
          <View style={styles.footer}>
            <View style={styles.dots}>
              {n.families.map((f) => (
                <View key={f} style={[styles.dot, { backgroundColor: familyColor(f) }]} accessibilityLabel={f} />
              ))}
            </View>
            <Text style={styles.link} onPress={() => Linking.openURL(n.sourceUrl)} accessibilityRole="link">
              Source
            </Text>
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { width: 48, height: 48, borderRadius: 24, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  title: { ...type.display, color: color.ink },
  body: { ...type.body, color: color.inkSoft },
  card: { backgroundColor: color.surface, borderRadius: radius.md, padding: space[4], gap: space[2], ...shadow.card },
  cardTitle: { fontSize: 17, fontFamily: fontFamily.ui600, color: color.ink },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  link: { ...type.body, color: color.ink, textDecorationLine: 'underline', padding: space[2] },
});
