// Onboarding — docs/UI_DESIGN.md → Onboarding; docs/PROCESS_FLOW.md → J1.
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGate } from '../src/store/gate';
import { Button } from '../src/ui/controls';
import { Specimen } from '../src/ui/Specimen';
import { color, space, type } from '../src/ui/tokens';

const CARDS = [
  { title: 'Colour lives outside.', body: 'Catch real colours from real places.', colors: ['#7FA05A', '#78AAE6', '#5A4632'] },
  { title: 'Camera only.', body: 'No uploads. Every colour in your FarbeDex was seen by you.', colors: ['#D9774E', '#F2C48D', '#3E5C7E'] },
  {
    title: 'AI on your phone.',
    body: 'Two small open models check scenes and name colours. No account, no cloud.',
    colors: ['#B3546E', '#E6D23C', '#3C5428'],
  },
];

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const scroller = useRef<ScrollView>(null);
  const finish = useGate((s) => s.finishOnboarding);

  const next = async () => {
    if (page < CARDS.length - 1) {
      scroller.current?.scrollTo({ x: (page + 1) * width, animated: true });
      setPage(page + 1);
      return;
    }
    await finish();
    router.replace('/setup-models');
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        {CARDS.map((c, i) => (
          <View key={c.title} style={[styles.card, { width }]}>
            <View style={styles.art} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <View style={{ marginLeft: 40 }}>
                <Specimen no={i} hex={c.colors[0]} size={200} />
              </View>
              <View style={{ position: 'absolute', left: 0, bottom: 10 }}>
                <Specimen no={i + 1} hex={c.colors[1]} size={120} />
              </View>
              <View style={{ position: 'absolute', right: 0, top: 0 }}>
                <Specimen no={i + 2} hex={c.colors[2]} size={56} />
              </View>
            </View>
            <Text style={styles.title} accessibilityRole="header">
              {c.title}
            </Text>
            <Text style={styles.body}>{c.body}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.dots} accessibilityLabel={`Page ${page + 1} of ${CARDS.length}`}>
          {CARDS.map((c, i) => (
            <View key={c.title} style={[styles.dot, i === page && styles.dotActive]} />
          ))}
        </View>
        <Button label={page < CARDS.length - 1 ? 'Next' : 'Start'} onPress={next} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  card: { flex: 1, padding: space[5], justifyContent: 'center', gap: space[4] },
  art: { height: 260, width: 280, alignSelf: 'center', marginBottom: space[5] },
  title: { ...type.display, color: color.ink },
  body: { ...type.body, fontSize: 17, lineHeight: 26, color: color.inkSoft },
  footer: { padding: space[5], gap: space[4] },
  dots: { flexDirection: 'row', gap: space[2], alignSelf: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.silhouette },
  dotActive: { width: 24, backgroundColor: color.ink },
});
