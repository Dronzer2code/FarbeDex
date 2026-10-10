// Camera (docs/UI_DESIGN.md → Camera; docs/PROCESS_FLOW.md → J2). The only image source in the app.
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { runCapture, type CaptureOutcome } from '../src/capture/capture';
import { MOTION_MIN, REJECT_COPY, type RejectReason } from '../src/capture/liveChecks';
import { MotionBuffer } from '../src/capture/motion';
import { motionStd } from '../src/capture/motionMath';
import { warmReferee } from '../src/referee/referee';
import { Button, Sheet } from '../src/ui/controls';
import { CloseIcon } from '../src/ui/icons';
import { color, fontFamily, radius, space, type } from '../src/ui/tokens';

type Phase = { kind: 'framing' } | { kind: 'processing'; step: 'scene' | 'colours' } | { kind: 'rejected'; reason: RejectReason };

export default function CatchScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const motion = useRef(new MotionBuffer());
  const cancelled = useRef(false);
  const [phase, setPhase] = useState<Phase>({ kind: 'framing' });
  const [ready, setReady] = useState(false);
  const [liveStd, setLiveStd] = useState<number | null>(null);
  const [lastDev, setLastDev] = useState<string | null>(null);

  useEffect(() => {
    const m = motion.current;
    cancelled.current = false;
    m.start();
    warmReferee().catch(() => {});
    const t = __DEV__ ? setInterval(() => setLiveStd(motionStd(m.snapshot(800))), 250) : undefined;
    return () => {
      cancelled.current = true;
      if (t) clearInterval(t);
      m.stop();
    };
  }, []);

  if (!permission) return <View style={styles.root} />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.root, styles.permission]}>
        <Text style={styles.permTitle}>FarbeDex needs the camera</Text>
        <Text style={styles.permBody}>
          Every colour in your FarbeDex is caught live with the in-app camera. Photos stay on your phone.
        </Text>
        {permission.canAskAgain ? (
          <Button label="Allow camera" onPress={requestPermission} />
        ) : (
          <Button label="Open app settings" onPress={() => Linking.openSettings()} />
        )}
        <Button label="Not now" variant="secondary" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const shutter = async () => {
    if (phase.kind !== 'framing' || !ready || !cameraRef.current) return;
    Haptics.selectionAsync().catch(() => {});
    // Motion window = the 800 ms before the shutter press.
    const snapshot = motion.current.snapshot(800);
    const sensorAvailable = motion.current.available === true;
    const captureAt = Date.now();
    setPhase({ kind: 'processing', step: 'scene' });
    let outcome: CaptureOutcome;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, exif: false, shutterSound: false });
      outcome = await runCapture({
        photoUri: photo.uri,
        width: photo.width,
        height: photo.height,
        captureAt,
        motion: snapshot,
        sensorAvailable,
        isCancelled: () => cancelled.current,
        onStep: (step) => !cancelled.current && setPhase({ kind: 'processing', step }),
      });
    } catch (e) {
      console.warn('[catch] takePicture failed', e);
      outcome = { kind: 'rejected', reason: 'ERROR', live: null, timings: {} };
    }
    if (cancelled.current || outcome.kind === 'cancelled') return;
    if (__DEV__) {
      const live = outcome.live;
      setLastDev(
        `last: ${outcome.kind}${outcome.kind === 'rejected' ? ` ${outcome.reason}` : ''} · std ${live?.motionStd?.toFixed(2) ?? 'n/a'} · ` +
          JSON.stringify(outcome.timings),
      );
    }
    if (outcome.kind === 'accepted') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace(`/catch-result/${outcome.id}`);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setPhase({ kind: 'rejected', reason: outcome.reason });
    }
  };

  const processing = phase.kind === 'processing';

  return (
    <View style={styles.root}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" mode="picture" onCameraReady={() => setReady(true)} animateShutter />

      {/* corner frame guides */}
      <View style={styles.guides} pointerEvents="none">
        <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }]} />
        <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }]} />
        <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
        <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }]} />
      </View>

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.top}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close camera" onPress={() => router.back()} style={styles.close}>
            <CloseIcon />
          </Pressable>
          <View style={styles.chip}>
            <Text style={styles.chipText}>Outdoors only</Text>
          </View>
          <View style={{ width: 48 }} />
        </View>

        {__DEV__ ? (
          <Text style={styles.dev}>
            motion std {liveStd?.toFixed(2) ?? 'n/a'} deg/s (min {MOTION_MIN}){lastDev ? `\n${lastDev}` : ''}
          </Text>
        ) : null}

        <View style={styles.bottom}>
          <Text style={styles.hint}>{processing ? '' : 'Point at something real'}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Take photo"
            disabled={processing || !ready}
            onPress={shutter}
            style={({ pressed }) => [styles.shutter, pressed && { transform: [{ scale: 0.95 }] }, (!ready || processing) && { opacity: 0.5 }]}
          >
            <View style={styles.shutterInner} />
          </Pressable>
        </View>
      </SafeAreaView>

      {processing ? (
        <View style={styles.processing}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.processingText}>{phase.step === 'scene' ? 'Checking the scene…' : 'Reading colours…'}</Text>
        </View>
      ) : null}

      <Sheet visible={phase.kind === 'rejected'} onClose={() => setPhase({ kind: 'framing' })}>
        <Text style={styles.rejectText}>{phase.kind === 'rejected' ? REJECT_COPY[phase.reason] : ''}</Text>
        <Button label="Try again" onPress={() => setPhase({ kind: 'framing' })} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFill, justifyContent: 'space-between' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[2] },
  close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  chip: { backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 6 },
  chipText: { color: '#FFFFFF', fontFamily: fontFamily.ui500, fontSize: 13 },
  dev: { color: '#9FF29F', fontFamily: fontFamily.mono500, fontSize: 11, paddingHorizontal: space[3], backgroundColor: 'rgba(0,0,0,0.4)' },
  guides: { position: 'absolute', top: '22%', bottom: '28%', left: '10%', right: '10%' },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: 'rgba(255,255,255,0.85)' },
  bottom: { alignItems: 'center', paddingBottom: space[6], gap: space[4] },
  hint: { color: '#FFFFFF', fontFamily: fontFamily.ui500, fontSize: 15, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4 },
  shutter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFFFFF' },
  processing: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', gap: space[4] },
  processingText: { color: '#FFFFFF', fontFamily: fontFamily.ui500, fontSize: 17 },
  rejectText: { ...type.title, color: color.ink },
  permission: { padding: space[5], justifyContent: 'center', gap: space[4], backgroundColor: color.bg },
  permTitle: { ...type.title, color: color.ink },
  permBody: { ...type.body, color: color.inkSoft },
});
