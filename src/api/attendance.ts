import { api } from './client';
import type { RecordAttendanceBody, RecordAttendanceResponse, TodayResponse } from './types';

export async function getToday() {
  const { data } = await api.get<TodayResponse>('/attendance/today');
  return data;
}

/** First call of the day checks in, the second checks out; the server decides which. */
export async function recordAttendance(body: RecordAttendanceBody) {
  const { data } = await api.post<RecordAttendanceResponse>('/attendance', body);
  return data;
}
