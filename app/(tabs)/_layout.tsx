import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/tabs';

import { gateTarget, useGate } from '../../src/store/gate';
import { TabBar } from '../../src/ui/TabBar';

export default function TabsLayout() {
  const target = useGate(gateTarget);
  if (target) return <Redirect href={target} />;
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="dex" options={{ title: 'FarbeDex' }} />
      <Tabs.Screen name="album" options={{ title: 'Album' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
