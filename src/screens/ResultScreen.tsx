import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { isAxiosError } from 'axios';
import * as Haptics from 'expo-haptics';
import { recordAttendance } from '../api/attendance';
import type { ApiErrorBody, AttendanceAction, RecordAttendanceResponse } from '../api/types';
import PrimaryButton from '../components/PrimaryButton';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme';
import { getAttendanceErrorMessage } from '../utils/errors';
import { formatServerTime } from '../utils/format';
import { getBestPosition, LocationError } from '../utils/location';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

const SUCCESS: Record<AttendanceAction, { title: string; time: 'time_in' | 'time_out' | 'left_for_field_at'; message: string }> = {
  check_in: { title: 'Checked in', time: 'time_in', message: 'Have a great day!' },
  field_check_in: { title: 'Field check-in', time: 'time_in', message: 'Have a productive day in the field!' },
  leave_for_field: { title: 'Left for field', time: 'left_for_field_at', message: 'Tap End Field Day when you finish.' },
  check_out: { title: 'Checked out', time: 'time_out', message: 'See you next time!' },
};

type State =
  | { phase: 'locating' }
  | { phase: 'submitting' }
  | { phase: 'success'; result: RecordAttendanceResponse }
  | { phase: 'error'; message: string; needsSettings: boolean; rescan: boolean };

export default function ResultScreen({ navigation, route }: Props) {
  const params = route.params;
  const [state, setState] = useState<State>({ phase: 'locating' });
  const running = useRef(false);

  const run = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    try {
      const pos = await getBestPosition();
      setState({ phase: 'submitting' });
      const result = await recordAttendance({
        method: params.method,
        lat: pos.lat,
        lng: pos.lng,
        is_mock: pos.is_mock,
        platform: 'app',
        ...(params.method === 'qr' ? { qr_token: params.qrToken } : { action: params.action, field_category: params.fieldCategory, note: params.note }),
      });
      setState({ phase: 'success', result });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      const code = isAxiosError<ApiErrorBody>(err) ? err.response?.data?.code : undefined;
      setState({
        phase: 'error',
        message: err instanceof LocationError ? err.message : getAttendanceErrorMessage(err),
        needsSettings: err instanceof LocationError && err.kind === 'permission',
        rescan: code === 'invalid_qr',
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      running.current = false;
    }
  }, [params]);

  useEffect(() => {
    // Async submit on mount; state only changes after awaits, never synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void run();
  }, [run]);

  function retry() {
    setState({ phase: 'locating' });
    void run();
  }

  if (state.phase === 'locating' || state.phase === 'submitting') {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.busy}>
          {state.phase === 'locating' ? 'Getting your location...' : 'Recording attendance...'}
        </Text>
      </SafeAreaView>
    );
  }

  if (state.phase === 'success') {
    const { action, attendance } = state.result;
    const copy = SUCCESS[action];
    const time = formatServerTime(attendance[copy.time]);
    const pendingApproval = attendance.field_status === 'pending' && action !== 'check_out';
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <View style={[styles.badge, { backgroundColor: colors.greenSoft }]}>
          <Ionicons name="checkmark-circle" size={120} color={colors.green} />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          {copy.title} at {time}
        </Text>
        <Text style={styles.message}>{pendingApproval ? 'Waiting for admin approval.' : copy.message}</Text>
        <View style={styles.buttons}>
          <PrimaryButton title="Done" size="large" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, styles.center]}>
      <View style={[styles.badge, { backgroundColor: colors.dangerSoft }]}>
        <Ionicons name="close-circle" size={120} color={colors.danger} />
      </View>
      <Text style={styles.title} accessibilityRole="header">
        Not recorded
      </Text>
      <Text style={styles.message} accessibilityRole="alert">
        {state.message}
      </Text>
      <View style={styles.buttons}>
        {state.needsSettings && (
          <PrimaryButton title="Open Settings" icon="settings-outline" size="large" onPress={() => void Linking.openSettings()} />
        )}
        <PrimaryButton
          title="Try Again"
          icon="refresh"
          size="large"
          variant={state.needsSettings ? 'outline' : 'solid'}
          onPress={() => (state.rescan ? navigation.replace('Scan') : retry())}
        />
        <PrimaryButton title="Back" size="large" variant="outline" onPress={() => navigation.goBack()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  busy: { fontSize: 18, color: colors.text, fontWeight: '600' },
  badge: { width: 180, height: 180, borderRadius: 90, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, textAlign: 'center' },
  message: { fontSize: 17, lineHeight: 24, color: colors.muted, textAlign: 'center' },
  buttons: { alignSelf: 'stretch', gap: 12, marginTop: 16 },
});
