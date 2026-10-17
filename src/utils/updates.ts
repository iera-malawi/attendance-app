import { useEffect } from 'react';
import * as Updates from 'expo-updates';

/**
 * Checks for an OTA update on cold launch and, if one is available, downloads
 * it and reloads into it immediately. Runs once per app start.
 *
 * No-ops in development, in Expo Go, and whenever updates are disabled
 * (missing/invalid URL, no runtime version, etc.) — in those cases the update
 * methods reject, so the whole flow is guarded and wrapped in try/catch.
 *
 * `updates.checkAutomatically` is set to "ON_ERROR_RECOVERY" in app.json so the
 * library's own launch check doesn't run alongside this manual one.
 */
export function useLaunchUpdateCheck() {
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;

    let cancelled = false;
    (async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (cancelled || !result.isAvailable) return;
        await Updates.fetchUpdateAsync();
        if (cancelled) return;
        await Updates.reloadAsync(); // nothing meaningful should run after this
      } catch (error) {
        console.warn('[updates] launch check failed', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);
}
