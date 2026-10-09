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

export async function getDeviceInfo(): Promise<DeviceInfo> {
  const version = Application.nativeApplicationVersion;
  const build = Application.nativeBuildVersion;

  return {
    platform: 'app',
    install_id: await getDeviceId(),
    device_name: Device.deviceName,
    device_type: Device.deviceType != null ? (DEVICE_TYPES[Device.deviceType] ?? null) : null,
    brand: Device.brand ?? Device.manufacturer,
    // iOS reports e.g. "iPhone 15" as modelName; Android the marketing or model code.
    model: Device.modelName ?? Device.modelId ?? null,
    os_name: Device.osName,
    os_version: Device.osVersion,
    app_version: version ? (build ? `${version} (${build})` : version) : null,
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
