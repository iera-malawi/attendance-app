import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { formatLongDate, formatTime } from '../utils/format';

/** Display only: attendance times always come from the server. */
export default function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.wrap}>
      <Text style={styles.date}>{formatLongDate(now)}</Text>
      <Text style={styles.time} adjustsFontSizeToFit numberOfLines={1}>
        {formatTime(now, true)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 8 },
  date: { fontSize: 16, color: colors.muted },
  time: { fontSize: 40, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'], marginTop: 4 },
});
