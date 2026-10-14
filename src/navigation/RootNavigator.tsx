import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AttendanceAction } from '../api/types';
import { useAuth } from '../context/AuthContext';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import ResultScreen from '../screens/ResultScreen';
import ScanScreen from '../screens/ScanScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import SplashScreen from '../screens/SplashScreen';

export type RootStackParamList = {
  Login: undefined;
  /** Mandatory while signed in with the emailed temporary password. */
  ChangePassword: undefined;
  /** Mandatory until the staff member confirms the weekly schedule. */
  Schedule: undefined;
  Home: undefined;
  Scan: undefined;
  /** Gets the location, submits, and shows the outcome. */
  Result:
    | { method: 'button'; action?: AttendanceAction; fieldCategory?: string; note?: string }
    | { method: 'qr'; qrToken: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

export default function RootNavigator() {
  const { token, user, loading } = useAuth();
  // Older stored profiles have no flag yet; /me refreshes it in the background.
  const needsPassword = user?.must_change_password === true;
  const needsSchedule = user?.schedule_confirmed === false;

  // Tapping a reminder opens Home (a cold start already lands there).
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      if (navigationRef.isReady() && token && !needsPassword && !needsSchedule) navigationRef.navigate('Home');
    });
    return () => sub.remove();
  }, [token, needsPassword, needsSchedule]);

  if (loading) return <SplashScreen />;

  // Switching on the token means clearing it (logout or a 401) always lands on Login.
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!token ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ animationTypeForReplace: 'pop' }} />
        ) : needsPassword ? (
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        ) : needsSchedule ? (
          <Stack.Screen name="Schedule" component={ScheduleScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Scan" component={ScanScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Result" component={ResultScreen} options={{ gestureEnabled: false, animation: 'fade' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
