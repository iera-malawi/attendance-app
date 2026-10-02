import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getToday } from '../api/attendance';
import type { TodayResponse } from '../api/types';
import ErrorBanner from '../components/ErrorBanner';
import LiveClock from '../components/LiveClock';
import PrimaryButton from '../components/PrimaryButton';
import StatusCard from '../components/StatusCard';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme';
import { getErrorMessage } from '../utils/errors';
import { firstName } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  function open(screen: 'Scan' | 'Result') {
    if (busy.current) return;
    busy.current = true;
    if (screen === 'Scan') navigation.navigate('Scan');
    else navigation.navigate('Result', { method: 'button' });
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
  const actionLabel = doneForToday ? 'Done for today' : status === 'checked_in' ? 'Check Out' : 'Check In';
  const actionIcon = doneForToday ? 'checkmark-done' : status === 'checked_in' ? 'exit-outline' : 'enter-outline';

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
        <LiveClock />

        {error && <ErrorBanner message={error} />}

        <StatusCard today={today} loading={loading} />

        <View style={styles.actions}>
          <PrimaryButton
            title="Scan QR"
            icon="qr-code-outline"
            size="large"
            disabled={doneForToday}
            onPress={() => open('Scan')}
          />
          <PrimaryButton
            title={actionLabel}
            icon={actionIcon}
            size="large"
            variant="outline"
            disabled={doneForToday}
            onPress={() => open('Result')}
          />
          {doneForToday && <Text style={styles.note}>See you tomorrow.</Text>}
        </View>
      </ScrollView>
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
  actions: { gap: 12, marginTop: 8 },
  note: { textAlign: 'center', color: colors.muted, fontSize: 14 },
});
