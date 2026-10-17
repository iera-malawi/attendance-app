import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import PrimaryButton from '../components/PrimaryButton';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Scan'>;

const QR_PREFIX = 'ATTEND:';

export default function ScanScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [invalid, setInvalid] = useState(false);
  // A ref (not state) so the lock applies before the next frame's scan event fires.
  const locked = useRef(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) void requestPermission();
  }, [permission, requestPermission]);

  function onScanned({ data }: BarcodeScanningResult) {
    if (locked.current) return;
    locked.current = true;

    if (!data.startsWith(QR_PREFIX)) {
      setInvalid(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    navigation.replace('Result', { method: 'qr', qrToken: data.slice(QR_PREFIX.length) });
  }

  function rescan() {
    setInvalid(false);
    locked.current = false;
  }

  const closeButton = (
    <Pressable
      onPress={() => navigation.goBack()}
      style={styles.iconButton}
      accessibilityRole="button"
      accessibilityLabel="Close scanner"
      hitSlop={8}
    >
      <Ionicons name="close" size={28} color="#FFFFFF" />
    </Pressable>
  );

  if (!permission) {
    return (
      <View style={[styles.dark, styles.center]}>
        <ActivityIndicator color="#FFFFFF" size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Ionicons name="camera-outline" size={64} color={colors.primary} />
        <Text style={styles.permTitle}>Camera access needed</Text>
        <Text style={styles.permText}>
          The camera is needed to scan the office QR code.
          {permission.canAskAgain ? '' : ' Allow camera access for this app in your phone settings.'}
        </Text>
        <View style={styles.permButtons}>
          {permission.canAskAgain ? (
            <PrimaryButton title="Allow Camera" size="large" onPress={() => void requestPermission()} />
          ) : (
            <PrimaryButton
              title="Open Settings"
              icon="settings-outline"
              size="large"
              onPress={() => void Linking.openSettings()}
            />
          )}
          <PrimaryButton title="Back" size="large" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.dark}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={invalid ? undefined : onScanned}
      />

      <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
        <View style={styles.viewfinder} />
        <Text style={styles.hint}>Point at the QR code at the office gate</Text>
      </View>

      <SafeAreaView style={styles.topBar} edges={['top', 'left', 'right']}>
        {closeButton}
        <Pressable
          onPress={() => setTorch((t) => !t)}
          style={[styles.iconButton, torch && styles.iconButtonOn]}
          accessibilityRole="switch"
          accessibilityState={{ checked: torch }}
          accessibilityLabel="Flashlight"
          hitSlop={8}
        >
          <Ionicons name={torch ? 'flash' : 'flash-outline'} size={26} color={torch ? colors.text : '#FFFFFF'} />
        </Pressable>
      </SafeAreaView>

      {invalid && (
        <SafeAreaView style={styles.bottomSheet} edges={['bottom', 'left', 'right']}>
          <View style={styles.invalidRow} accessibilityRole="alert">
            <Ionicons name="alert-circle" size={26} color={colors.danger} />
            <Text style={styles.invalidText}>This is not the office QR code</Text>
          </View>
          <PrimaryButton title="Scan Again" icon="scan-outline" size="large" onPress={rescan} />
        </SafeAreaView>
      )}
    </View>
  );
}

const VIEWFINDER = 250;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  dark: { flex: 1, backgroundColor: '#000000' },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  viewfinder: {
    width: VIEWFINDER,
    height: VIEWFINDER,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    borderRadius: 20,
  },
  hint: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonOn: { backgroundColor: '#FFFFFF' },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 16,
  },
  invalidRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  invalidText: { flex: 1, fontSize: 17, fontWeight: '600', color: colors.danger },
  permTitle: { fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center' },
  permText: { fontSize: 16, lineHeight: 23, color: colors.muted, textAlign: 'center' },
  permButtons: { alignSelf: 'stretch', gap: 12, marginTop: 8 },
});
