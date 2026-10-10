// Bottom bar: Home · FarbeDex · [center Catch] · Album · Settings (docs/UI_DESIGN.md).
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AlbumIcon, ApertureIcon, GridIcon, HomeIcon, SettingsIcon } from './icons';
import { color, fontFamily, shadow } from './tokens';

const TABS: Record<string, { label: string; Icon: typeof HomeIcon }> = {
  index: { label: 'Home', Icon: HomeIcon },
  dex: { label: 'FarbeDex', Icon: GridIcon },
  album: { label: 'Album', Icon: AlbumIcon },
  settings: { label: 'Settings', Icon: SettingsIcon },
};

export function CatchButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Catch"
      onPress={() => router.push('/catch')}
      style={({ pressed }) => [styles.catch, pressed && { transform: [{ scale: 0.97 }] }]}
    >
      <ApertureIcon size={30} color={color.catchIcon} />
    </Pressable>
  );
}

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const routes = state.routes.filter((r) => TABS[r.name]);
  const left = routes.slice(0, 2);
  const right = routes.slice(2);

  const renderTab = (route: (typeof routes)[number]) => {
    const { label, Icon } = TABS[route.name];
    const focused = state.routes[state.index]?.key === route.key;
    const tint = focused ? color.ink : color.inkSoft;
    return (
      <Pressable
        key={route.key}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={label}
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        }}
        style={styles.tab}
      >
        <Icon size={24} color={tint} />
        <Text style={[styles.label, { color: tint }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {left.map(renderTab)}
      <View style={styles.center}>
        <CatchButton />
      </View>
      {right.map(renderTab)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: color.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    ...shadow.card,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 52, gap: 2 },
  label: { fontSize: 11, fontFamily: fontFamily.ui500 },
  center: { width: 80, alignItems: 'center' },
  catch: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: color.catchButton,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    ...shadow.button,
  },
});
