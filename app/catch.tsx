// Camera screen — full pipeline built in T5.
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CloseIcon } from '../src/ui/icons';
import { fontFamily } from '../src/ui/tokens';

export default function CatchScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <Pressable accessibilityLabel="Close" onPress={() => router.back()} style={styles.close}>
        <CloseIcon />
      </Pressable>
      <View style={styles.center}>
        <Text style={styles.hint}>Point at something real</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', margin: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hint: { color: '#FFFFFF', fontSize: 15, fontFamily: fontFamily.ui500 },
});
