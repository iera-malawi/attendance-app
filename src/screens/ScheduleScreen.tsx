import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { confirmSchedule, getSchedule } from '../api/schedule';
import type { ScheduleResponse } from '../api/types';
import ErrorBanner from '../components/ErrorBanner';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { getErrorMessage } from '../utils/errors';
import { formatHm } from '../utils/format';
import { notificationsAllowed, registerForPush, requestNotificationPermission } from '../utils/push';

// Monday first, Sunday last.
const ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Mandatory before Home: shows the weekly hours, sets up reminders, then "Confirm". */
export default function ScheduleScreen() {
  const { updateUser, signOut } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState(true);
  const [checkOut, setCheckOut] = useState(true);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [asking, setAsking] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await getSchedule();
      setSchedule(s);
      setCheckIn(s.notify_check_in);
      setCheckOut(s.notify_check_out);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    // Async fetches; state only changes after the awaits.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    void notificationsAllowed().then(setAllowed);
  }, [load]);

  async function enableNotifications() {
    setAsking(true);
    setAllowed(await requestNotificationPermission().catch(() => false));
    setAsking(false);
  }

  async function confirm() {
    setConfirming(true);
    setError(null);
    try {
      const user = await confirmSchedule({ notify_check_in: checkIn, notify_check_out: checkOut });
      // Token is saved after confirming; failures here never block Home.
      if (allowed) await registerForPush();
      await updateUser(user);
    } catch (err) {
      setError(getErrorMessage(err));
      setConfirming(false);
    }
  }

  if (!schedule) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        {error ? (
          <>
            <ErrorBanner message={error} />
            <PrimaryButton title="Try Again" icon="refresh" onPress={() => void load()} />
            <PrimaryButton title="Log out" variant="outline" onPress={() => void signOut()} />
          </>
        ) : (
          <ActivityIndicator size="large" color={colors.primary} />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Ionicons name="calendar-outline" size={30} color={colors.primaryDark} />
          <View style={styles.flex}>
            <Text style={styles.title} accessibilityRole="header">
              Your Work Schedule
            </Text>
            <Text style={styles.muted}>Please check your hours and confirm.</Text>
          </View>
        </View>

        {error && <ErrorBanner message={error} />}

        <View style={styles.card}>
          {ORDER.map((weekday, i) => {
            const d = schedule.week.find((x) => x.weekday === weekday);
            if (!d) return null;
            return (
              <View key={weekday} style={[styles.row, i > 0 && styles.rowBorder]}>
                <Text style={[styles.day, !d.is_working_day && styles.off]}>{d.day}</Text>
                <Text style={[styles.hours, !d.is_working_day && styles.off]}>
                  {d.is_working_day ? `${formatHm(d.start_time)} – ${formatHm(d.end_time)}` : 'Off'}
                </Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.muted}>Coming in early or leaving early is fine. The hours are used for friendly reminders.</Text>

        <View style={[styles.card, styles.cardPadded]}>
          <View style={styles.header}>
            <Ionicons name="notifications-outline" size={22} color={colors.primaryDark} />
            <Text style={styles.section}>Reminders</Text>
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Remind me to check in</Text>
            <Switch value={checkIn} onValueChange={setCheckIn} trackColor={{ true: colors.primary }} />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Remind me to check out</Text>
            <Switch value={checkOut} onValueChange={setCheckOut} trackColor={{ true: colors.primary }} />
          </View>
          {allowed ? (
            <View style={styles.header}>
              <Ionicons name="checkmark-circle" size={20} color={colors.green} />
              <Text style={[styles.label, { color: colors.green }]}>Notifications are on.</Text>
            </View>
          ) : (
            <>
              <PrimaryButton
                title="Enable notifications"
                icon="notifications-outline"
                variant="outline"
                loading={asking}
                disabled={!checkIn && !checkOut}
                onPress={() => void enableNotifications()}
              />
              {allowed === false && (
                <Text style={styles.muted}>
                  If nothing appears, allow notifications for this app in your phone settings.
                </Text>
              )}
            </>
          )}
        </View>

        <View style={styles.footer}>
          <PrimaryButton title="Confirm" icon="checkmark" size="large" loading={confirming} onPress={() => void confirm()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  content: { padding: 20, gap: 16, flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flex: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  section: { fontSize: 17, fontWeight: '600', color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  card: { backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  cardPadded: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 11 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  day: { fontSize: 16, fontWeight: '600', color: colors.text },
  hours: { fontSize: 16, color: colors.text, fontVariant: ['tabular-nums'] },
  off: { color: colors.muted, fontWeight: '400' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 15, color: colors.text },
  footer: { marginTop: 'auto' },
});
