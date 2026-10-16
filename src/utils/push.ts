import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { registerPushToken, unregisterPushToken } from '../api/schedule';

// Show reminders even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Must match the channelId the server sends (PushSender). */
const CHANNEL_ID = 'reminders';

let registeredToken: string | null = null;

async function ensureChannel() {
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Check-in reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function notificationsAllowed(): Promise<boolean> {
  return (await Notifications.getPermissionsAsync()).granted;
}

/** Shows the system prompt if needed. Returns true if notifications are allowed. */
export async function requestNotificationPermission(): Promise<boolean> {
  await ensureChannel();
  if (await notificationsAllowed()) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/**
 * Gets this device's Expo push token and saves it on the server. Needs permission and an EAS project ID
 * (development/production build); Expo Go on Android cannot receive remote push. Never throws.
 */
export async function registerForPush(): Promise<boolean> {
  try {
    if (!(await notificationsAllowed())) return false;
    await ensureChannel();

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn('Push disabled: no EAS projectId. Run `npx eas-cli@latest init` and use a development build.');
      return false;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await registerPushToken(token, Constants.deviceName ?? null);
    registeredToken = token;
    return true;
  } catch (err) {
    console.warn('Push registration failed', err);
    return false;
  }
}

/** Stops reminders on this device; used on logout. Never throws. */
export async function unregisterPush(): Promise<void> {
  if (!registeredToken) return;
  await unregisterPushToken(registeredToken).catch(() => {});
  registeredToken = null;
}
