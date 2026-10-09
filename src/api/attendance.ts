import { api } from './client';
import type { RecordAttendanceBody, RecordAttendanceResponse, TodayResponse } from './types';

export async function getToday() {
  const { data } = await api.get<TodayResponse>('/attendance/today');
  return data;
}

/** Without an action the server decides: first call checks in, the second checks out. */
export async function recordAttendance(body: RecordAttendanceBody) {
  const { data } = await api.post<RecordAttendanceResponse>('/attendance', body);
  return data;
}
