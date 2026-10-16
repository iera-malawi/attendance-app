import * as Location from 'expo-location';

export interface Position {
  lat: number;
  lng: number;
  accuracy: number | null;
  is_mock: boolean;
}

export type LocationErrorKind = 'permission' | 'services_off' | 'unavailable';

export const LOCATION_PERMISSION_MESSAGE =
  'Location access is needed to confirm you are at the office. Allow location for this app in your phone settings.';

const MESSAGES: Record<LocationErrorKind, string> = {
  permission: LOCATION_PERMISSION_MESSAGE,
  services_off: 'Location (GPS) is turned off. Turn it on in your phone settings and try again.',
  unavailable: "Couldn't get your location. Move to an open area and try again.",
};

export class LocationError extends Error {
  constructor(public readonly kind: LocationErrorKind) {
    super(MESSAGES[kind]);
    this.name = 'LocationError';
  }
}

const MAX_WAIT_MS = 10_000;
const GOOD_ACCURACY_M = 30;

async function ensurePermission() {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) throw new LocationError('permission');
}

async function ensureServicesOn() {
  if (await Location.hasServicesEnabledAsync()) return;
  // Shows the system "Turn on location" dialog; throws if the user declines.
  try {
    await Location.enableNetworkProviderAsync();
    if (await Location.hasServicesEnabledAsync()) return;
  } catch {
    // Fall through to the error below.
  }
  throw new LocationError('services_off');
}

/** Watches for up to 10s, stopping early once accuracy is <= 30 m, and returns the most accurate fix. */
function watchBestFix(): Promise<Location.LocationObject | null> {
  return new Promise((resolve) => {
    let best: Location.LocationObject | null = null;
    let sub: Location.LocationSubscription | null = null;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      sub?.remove();
      resolve(best);
    };

    const timer = setTimeout(finish, MAX_WAIT_MS);

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 0 },
      (loc) => {
        const acc = loc.coords.accuracy ?? Infinity;
        if (!best || acc < (best.coords.accuracy ?? Infinity)) best = loc;
        if (acc <= GOOD_ACCURACY_M) finish();
      },
      () => finish(),
    )
      .then((s) => {
        // The watch may start after we already finished; stop it right away then.
        if (done) s.remove();
        else sub = s;
      })
      .catch(finish);
  });
}

/** Throws LocationError when permission is denied, GPS is off, or no fix arrives in time. */
export async function getBestPosition(): Promise<Position> {
  await ensurePermission();
  await ensureServicesOn();

  const loc = await watchBestFix();
  if (!loc) throw new LocationError('unavailable');

  return {
    lat: loc.coords.latitude,
    lng: loc.coords.longitude,
    accuracy: loc.coords.accuracy,
    is_mock: loc.mocked ?? false,
  };
}
