import { api } from './client';
import type { LoginResponse, User } from './types';

export async function login(email: string, password: string, deviceId: string) {
  const { data } = await api.post<LoginResponse>('/login', {
    email,
    password,
    device_id: deviceId,
  });
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
