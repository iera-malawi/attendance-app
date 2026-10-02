import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const FALLBACK_KEY = 'device_id_fallback';

function uuidV4(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

let cached: string | null = null;

/** Stable per-device ID used by the backend to bind one account to one phone. */
export async function getDeviceId(): Promise<string> {
  if (cached) return cached;

  let id: string | null = null;
  try {
    if (Platform.OS === 'android') id = Application.getAndroidId();
    else if (Platform.OS === 'ios') id = await Application.getIosIdForVendorAsync();
  } catch {
    id = null;
  }

  if (!id) {
    id = await SecureStore.getItemAsync(FALLBACK_KEY);
    if (!id) {
      id = uuidV4();
      await SecureStore.setItemAsync(FALLBACK_KEY, id);
    }
  }

  cached = id;
  return id;
}
