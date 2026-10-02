import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TodayResponse } from '../api/types';
import { colors } from '../theme';
import { formatServerTime } from '../utils/format';

interface Props {
  today: TodayResponse | null;
  loading: boolean;
}

type IconName = ComponentProps<typeof Ionicons>['name'];

export default function StatusCard({ today, loading }: Props) {
  if (!today) {
    return (
      <View style={[styles.card, { backgroundColor: colors.greySoft, borderColor: colors.border }]}>
        {loading ? <ActivityIndicator color={colors.grey} /> : <Text style={styles.sub}>Status unavailable</Text>}
      </View>
    );
  }

  const a = today.attendance;
  let fg = colors.grey;
  let bg = colors.greySoft;
  let icon: IconName = 'time-outline';
  let title = 'Not checked in';
  let sub: string | null = null;

  if (today.status === 'checked_in') {
    fg = colors.green;
    bg = colors.greenSoft;
    icon = 'checkmark-circle';
    title = `Checked in at ${formatServerTime(a?.time_in)}`;
  } else if (today.status === 'checked_out') {
    fg = colors.blue;
    bg = colors.blueSoft;
    icon = 'log-out-outline';
    title = `Checked out at ${formatServerTime(a?.time_out)}`;
    sub = `Checked in at ${formatServerTime(a?.time_in)}`;
  }

  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: fg }]}>
      <Ionicons name={icon} size={32} color={fg} />
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: fg }]}>{title}</Text>
        {sub && <Text style={styles.sub}>{sub}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 84,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  textWrap: { flex: 1 },
  title: { fontSize: 19, fontWeight: '700' },
  sub: { fontSize: 14, color: colors.muted, marginTop: 2 },
});
