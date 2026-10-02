import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import ResultScreen from '../screens/ResultScreen';
import ScanScreen from '../screens/ScanScreen';
import SplashScreen from '../screens/SplashScreen';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Scan: undefined;
  /** Gets the location, submits, and shows the outcome. */
  Result: { method: 'button' } | { method: 'qr'; qrToken: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { token, loading } = useAuth();

  if (loading) return <SplashScreen />;

  // Switching on the token means clearing it (logout or a 401) always lands on Login.
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Scan" component={ScanScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Result" component={ResultScreen} options={{ gestureEnabled: false, animation: 'fade' }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ animationTypeForReplace: 'pop' }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
