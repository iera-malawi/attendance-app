import { useCallback, useRef, useState } from 'react';
import { Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getToday } from '../api/attendance';
import type { FieldAction, TodayResponse } from '../api/types';
import ErrorBanner from '../components/ErrorBanner';
import FieldNoteModal from '../components/FieldNoteModal';
import LiveClock from '../components/LiveClock';
import PrimaryButton from '../components/PrimaryButton';
import StatusCard from '../components/StatusCard';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme';
import { getErrorMessage } from '../utils/errors';
import { firstName } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const FIELD_FORMS: Record<FieldAction, { title: string; confirmLabel: string }> = {
  field_check_in: { title: 'Field Check-In', confirmLabel: 'Check In' },
  leave_for_field: { title: 'Leave for Field', confirmLabel: 'Leave' },
};

export default function HomeScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldForm, setFieldForm] = useState<FieldAction | null>(null);
  // Blocks double taps from opening two Scan/Result screens; released when Home regains focus.
  const busy = useRef(false);

  const load = useCallback(async () => {
    try {
      setToday(await getToday());
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Runs on mount and whenever we come back from Scan/Result, so the status is always fresh.
  useFocusEffect(
    useCallback(() => {
      busy.current = false;
      void load();
    }, [load]),
  );

  function open(screen: 'Scan' | 'Result', params: RootStackParamList['Result'] = { method: 'button' }) {
    if (busy.current) return;
    busy.current = true;
    if (screen === 'Scan') navigation.navigate('Scan');
    else navigation.navigate('Result', params);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  function confirmLogout() {
    Alert.alert('Log out?', 'You will need your email and password to log back in.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => void signOut() },
    ]);
  }

  const status = today?.status;
  const doneForToday = status === 'checked_out';
  // In the field (or checked in from the field): check-out skips the geofence, so no QR.
  const fieldDay = status === 'in_field' || (status === 'checked_in' && today?.type === 'field');
  const isFieldStaff = !!user?.is_field_staff;
  const fieldAction: FieldAction | null = !isFieldStaff
    ? null
    : status === 'not_checked_in'
      ? 'field_check_in'
      : status === 'checked_in' && today?.type === 'office'
        ? 'leave_for_field'
        : null;
  const actionLabel = doneForToday
    ? 'Done for today'
    : fieldDay
      ? 'End Field Day'
      : status === 'checked_in'
        ? 'Check Out'
        : 'Check In';
  const actionIcon = doneForToday
    ? 'checkmark-done'
    : status === 'checked_in' || fieldDay
      ? 'exit-outline'
      : 'enter-outline';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.hello} numberOfLines={1}>
          Hello, {user ? firstName(user.name) : ''}
        </Text>
        <Pressable
          onPress={confirmLogout}
          style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed]}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          hitSlop={8}
        >
          <Ionicons name="log-out-outline" size={26} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
      >
        <View style={styles.logoWrap}>
          <Image
            source={require('../../assets/ierawhite.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="iERA logo"
          />
        </View>

        <LiveClock />

        {error && <ErrorBanner message={error} />}

        <StatusCard today={today} loading={loading} />

        <View style={styles.actions}>
          {!fieldDay && (
            <PrimaryButton
              title="Scan QR"
              icon="qr-code-outline"
              size="large"
              disabled={doneForToday}
              onPress={() => open('Scan')}
            />
          )}
          <PrimaryButton
            title={actionLabel}
            icon={actionIcon}
            size="large"
            variant={fieldDay ? 'solid' : 'outline'}
            disabled={doneForToday}
            onPress={() => open('Result', fieldDay ? { method: 'button', action: 'check_out' } : undefined)}
          />
          {fieldAction && (
            <PrimaryButton
              title={FIELD_FORMS[fieldAction].title}
              icon={fieldAction === 'field_check_in' ? 'location-outline' : 'briefcase-outline'}
              size="large"
              variant="outline"
              onPress={() => setFieldForm(fieldAction)}
            />
          )}
          {doneForToday && <Text style={styles.note}>See you tomorrow.</Text>}
        </View>
      </ScrollView>

      <FieldNoteModal
        visible={fieldForm !== null}
        title={fieldForm ? FIELD_FORMS[fieldForm].title : ''}
        confirmLabel={fieldForm ? FIELD_FORMS[fieldForm].confirmLabel : ''}
        onCancel={() => setFieldForm(null)}
        onSubmit={(note) => {
          const action = fieldForm;
          setFieldForm(null);
          if (action) open('Result', { method: 'button', action, note });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 12,
  },
  hello: { flex: 1, fontSize: 22, fontWeight: '700', color: colors.text },
  logout: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  logoutPressed: { backgroundColor: colors.border },
  content: { padding: 20, gap: 16, flexGrow: 1 },
  logoWrap: {
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    borderRadius: 16,
    paddingVertical: 20,
  },
  // Source image is 2480x1208.
  logo: { width: 180, height: 180 * (1208 / 2480) },
  actions: { gap: 12, marginTop: 8 },
  note: { textAlign: 'center', color: colors.muted, fontSize: 14 },
});
