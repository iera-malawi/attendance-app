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
import ErrorBanner from '../components/ErrorBanner';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';
import { getErrorMessage } from '../utils/errors';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);

  const canSubmit = email.trim() !== '' && password !== '' && !loading;

  async function handleLogin() {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      // On success the navigator swaps to Home; this screen unmounts.
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Ionicons name="finger-print" size={44} color={colors.primaryDark} />
          </View>
          <Text style={styles.title}>Staff Attendance</Text>
          <Text style={styles.subtitle}>Sign in with your work account</Text>

          {error && <ErrorBanner message={error} />}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@company.com"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            keyboardType="email-address"
            textContentType="username"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              ref={passwordRef}
              style={[styles.input, styles.passwordInput]}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={colors.muted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              editable={!loading}
            />
            <Pressable
              style={styles.eye}
              onPress={() => setShowPassword((s) => !s)}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              hitSlop={8}
            >
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={24} color={colors.muted} />
            </Pressable>
          </View>

          <View style={styles.submit}>
            <PrimaryButton title="Login" onPress={handleLogin} loading={loading} disabled={!canSubmit} />
          </View>
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
  passwordRow: { justifyContent: 'center' },
  passwordInput: { paddingRight: 52 },
  eye: { position: 'absolute', right: 4, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  submit: { marginTop: 16 },
});
