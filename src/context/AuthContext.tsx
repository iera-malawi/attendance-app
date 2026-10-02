import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import { setUnauthorizedHandler } from '../api/client';
import type { User } from '../api/types';
import { getDeviceId } from '../utils/device';
import { clearAuth, getStoredUser, getToken, setStoredUser, setToken } from '../utils/storage';

export const ADMIN_BLOCKED_MESSAGE = 'Please use the admin dashboard.';

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const reset = useCallback(async () => {
    await clearAuth();
    setTokenState(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => void reset());
    return () => setUnauthorizedHandler(null);
  }, [reset]);

  // Restore the session on app start.
  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([getToken(), getStoredUser<User>()]);
        if (storedToken && storedUser?.role === 'staff') {
          setTokenState(storedToken);
          setUser(storedUser);
          // Refresh the profile in the background; a 401 here logs out via the interceptor.
          authApi
            .me()
            .then((fresh) => {
              setUser(fresh);
              void setStoredUser(fresh);
            })
            .catch(() => {});
        } else if (storedToken || storedUser) {
          await clearAuth();
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const deviceId = await getDeviceId();
    const res = await authApi.login(email.trim(), password, deviceId);

    if (res.user.role !== 'staff') {
      // Revoke the admin token we just received; it is never used in the app.
      await authApi.logout(res.token).catch(() => {});
      throw new Error(ADMIN_BLOCKED_MESSAGE);
    }

    await setToken(res.token);
    await setStoredUser(res.user);
    setTokenState(res.token);
    setUser(res.user);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Still log out locally if the server is unreachable.
    }
    await reset();
  }, [reset]);

  const value = useMemo(
    () => ({ token, user, loading, signIn, signOut }),
    [token, user, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
