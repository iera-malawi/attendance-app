import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/favicon.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="iERA logo"
      />
      <Text style={styles.title}>Staff Attendance</Text>
      <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  // Source is 500x500 with transparent padding around the diamond.
  logo: { width: 160, height: 160 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 12 },
  spinner: { marginTop: 24 },
});
