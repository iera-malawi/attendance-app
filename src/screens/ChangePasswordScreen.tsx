import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as authApi from '../api/auth';
import ErrorBanner from '../components/ErrorBanner';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { getErrorMessage } from '../utils/errors';

/** Mandatory after signing in with the temporary password from the welcome email. */
export default function ChangePasswordScreen() {
  const { user, updateUser, signOut } = useAuth();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const newRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const canSubmit = current !== '' && password.length >= 8 && confirmation !== '' && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    if (password !== confirmation) {
      setError('The new passwords do not match.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // The navigator moves on (schedule or Home) once the flag clears.
      await updateUser(await authApi.changePassword(current, password, confirmation));
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  }

  const shared = {
    style: styles.input,
    placeholderTextColor: colors.muted,
    secureTextEntry: !showPasswords,
    autoCapitalize: 'none',
    autoCorrect: false,
    editable: !loading,
  } as const;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Ionicons name="key-outline" size={40} color={colors.primaryDark} />
          </View>
          <Text style={styles.title}>Set your password</Text>
          <Text style={styles.subtitle}>
            {user ? `Welcome, ${user.name}. ` : ''}Choose your own password to replace the temporary one we emailed you.
          </Text>

          {error && <ErrorBanner message={error} />}

          <Text style={styles.label}>Temporary password</Text>
          <TextInput
            {...shared}
            value={current}
            onChangeText={setCurrent}
            placeholder="From the email"
            autoComplete="password"
            textContentType="password"
            returnKeyType="next"
            onSubmitEditing={() => newRef.current?.focus()}
          />

          <Text style={styles.label}>New password</Text>
          <TextInput
            {...shared}
            ref={newRef}
            value={password}
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
          />

          <Text style={styles.label}>Confirm new password</Text>
          <TextInput
            {...shared}
            ref={confirmRef}
            value={confirmation}
            onChangeText={setConfirmation}
            placeholder="Type it again"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
          />

          <Pressable
            style={styles.toggle}
            onPress={() => setShowPasswords((s) => !s)}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Ionicons name={showPasswords ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
            <Text style={styles.toggleText}>{showPasswords ? 'Hide passwords' : 'Show passwords'}</Text>
          </Pressable>

          <View style={styles.submit}>
            <PrimaryButton title="Set password" onPress={handleSubmit} loading={loading} disabled={!canSubmit} />
          </View>

          <Pressable style={styles.signOut} onPress={() => void signOut()} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 20, gap: 8 },
  logo: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.muted, textAlign: 'center', marginBottom: 16 },
  label: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 8 },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
  },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  toggleText: { fontSize: 14, color: colors.muted },
  submit: { marginTop: 16 },
  signOut: { alignSelf: 'center', marginTop: 12, padding: 8 },
  signOutText: { fontSize: 15, color: colors.muted, fontWeight: '600' },
});
