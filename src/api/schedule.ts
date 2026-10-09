import { api } from './client';
import type { FieldCategory, ScheduleResponse, User } from './types';

export async function getSchedule() {
  const { data } = await api.get<{ data: ScheduleResponse }>('/schedule');
  return data.data;
}

/** Confirms the weekly schedule (once) and saves reminder preferences. */
export async function confirmSchedule(prefs: { notify_check_in: boolean; notify_check_out: boolean }) {
  const { data } = await api.post<{ data: User }>('/schedule/confirm', prefs);
  return data.data;
}

export async function getFieldCategories() {
  const { data } = await api.get<{ data: FieldCategory[] }>('/field-categories');
  return data.data;
}

export async function registerPushToken(token: string, device: string | null) {
  await api.post('/push-tokens', { platform: 'app', token, device });
}

export async function unregisterPushToken(token: string) {
  await api.delete('/push-tokens', { data: { token } });
}
