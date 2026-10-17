import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/splash-icon.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="iERA Checkpoint logo"
      />
      <Text style={styles.title}>Staff Attendance</Text>
      <ActivityIndicator size="large" color="#FFFFFF" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Brand-blue background + white pin mark, matching the native splash so the
  // hand-off from launch screen to app is seamless.
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  logo: { width: 160, height: 160 },
  title: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginTop: 12 },
  spinner: { marginTop: 24 },
});
