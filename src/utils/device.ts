import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** What the app reports at login; the server builds the fingerprint from this plus the request itself. */
export interface DeviceInfo {
  platform: 'app';
  install_id: string;
  device_name: string | null;
  device_type: string | null;
  brand: string | null;
  model: string | null;
  os_name: string | null;
  os_version: string | null;
  app_version: string | null;
  memory_gb: number | null;
}

const DEVICE_TYPES: Record<number, string> = {
  [Device.DeviceType.PHONE]: 'phone',
  [Device.DeviceType.TABLET]: 'tablet',
  [Device.DeviceType.DESKTOP]: 'desktop',
  [Device.DeviceType.TV]: 'tv',
};

/** Trims to the server's max length for that field; empty becomes null. */
const clip = (value: string | null | undefined, max: number) => value?.trim().slice(0, max) || null;

export async function getDeviceInfo(): Promise<DeviceInfo> {
  const version = Application.nativeApplicationVersion;
  const build = Application.nativeBuildVersion;

  return {
    platform: 'app',
    install_id: await getDeviceId(),
    device_name: clip(Device.deviceName, 255),
    device_type: Device.deviceType != null ? (DEVICE_TYPES[Device.deviceType] ?? null) : null,
    brand: clip(Device.brand ?? Device.manufacturer, 100),
    // iOS reports e.g. "iPhone 15" as modelName; Android the marketing or model code.
    model: clip(Device.modelName ?? Device.modelId, 100),
    // Some Android phones report osName as a long build fingerprint instead of "Android".
    os_name: Platform.OS === 'android' ? 'Android' : clip(Device.osName, 50),
    os_version: clip(Device.osVersion, 50),
    app_version: clip(version ? (build ? `${version} (${build})` : version) : null, 50),
    memory_gb: Device.totalMemory ? Math.round((Device.totalMemory / 1024 ** 3) * 10) / 10 : null,
  };
}

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
