import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export default function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.box} accessibilityRole="alert">
      <Ionicons name="alert-circle" size={22} color={colors.danger} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  text: { flex: 1, color: colors.danger, fontSize: 15, lineHeight: 21 },
});
