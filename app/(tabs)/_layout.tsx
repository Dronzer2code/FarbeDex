import { Tabs } from 'expo-router/tabs';

import { TabBar } from '../../src/ui/TabBar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="dex" options={{ title: 'FarbeDex' }} />
      <Tabs.Screen name="album" options={{ title: 'Album' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
