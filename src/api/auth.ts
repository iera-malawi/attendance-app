import { api } from './client';
import type { DeviceInfo } from '../utils/device';
import type { LoginResponse, User } from './types';

/** The server builds the device fingerprint from `device` plus the request and binds it on first login. */
export async function login(email: string, password: string, device: DeviceInfo) {
  const { data } = await api.post<LoginResponse>('/login', { email, password, device });
  return data;
}

/** Revokes the given token (or the stored one when omitted). */
export async function logout(token?: string) {
  await api.post('/logout', null, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
}

export async function me() {
  const { data } = await api.get<{ data: User }>('/me');
  return data.data;
}
