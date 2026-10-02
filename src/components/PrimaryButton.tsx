import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

interface Props {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: ComponentProps<typeof Ionicons>['name'];
  variant?: 'solid' | 'outline';
  size?: 'normal' | 'large';
}

export default function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  icon,
  variant = 'solid',
  size = 'normal',
}: Props) {
  const isDisabled = !!(disabled || loading);
  const solid = variant === 'solid';
  const fg = solid ? '#FFFFFF' : colors.accent;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        size === 'large' && styles.large,
        solid ? styles.solid : styles.outline,
        pressed && !isDisabled && (solid ? styles.solidPressed : styles.outlinePressed),
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={size === 'large' ? 26 : 20} color={fg} />}
          <Text style={[styles.text, size === 'large' && styles.textLarge, { color: fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  large: { minHeight: 68 },
  solid: { backgroundColor: colors.accent },
  solidPressed: { backgroundColor: colors.accentDark },
  outline: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.accent },
  outlinePressed: { backgroundColor: colors.accentSoft },
  disabled: { opacity: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  text: { fontSize: 16, fontWeight: '600' },
  textLarge: { fontSize: 19 },
});
