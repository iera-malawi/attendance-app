export type Role = 'admin' | 'staff';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  is_active: boolean;
  is_field_staff: boolean;
  schedule_confirmed: boolean;
  notify_check_in: boolean;
  notify_check_out: boolean;
  device_bound: boolean;
}

export interface LoginResponse {
  token: string;
  token_type: 'Bearer';
  user: User;
}

export type AttendanceStatus = 'not_checked_in' | 'checked_in' | 'in_field' | 'checked_out';
export type AttendanceType = 'office' | 'field';
export type AttendanceAction = 'check_in' | 'field_check_in' | 'leave_for_field' | 'check_out';
export type FieldAction = Extract<AttendanceAction, 'field_check_in' | 'leave_for_field'>;
export type FieldStatus = 'approved' | 'pending' | 'rejected';

export interface Attendance {
  id: number;
  user_id: number;
  date: string;
  time_in: string | null;
  time_out: string | null;
  method_in: 'qr' | 'button' | null;
  method_out: 'qr' | 'button' | null;
  platform_in: 'app' | 'web';
  platform_out: 'app' | 'web' | null;
  type: AttendanceType;
  field_category: string | null;
  field_note_in: string | null;
  field_note_out: string | null;
  left_for_field_at: string | null;
  left_for_field_note: string | null;
  field_status: FieldStatus;
  status: AttendanceStatus;
}

export interface TodayResponse {
  date: string;
  status: AttendanceStatus;
  type: AttendanceType | null;
  attendance: Attendance | null;
  schedule: DaySchedule;
}

/** One weekday (0 = Sunday … 6 = Saturday). */
export interface WorkDay {
  weekday: number;
  day: string;
  is_working_day: boolean;
  start_time: string; // HH:MM
  end_time: string;
}

/** Hours for one date; not a working day on days off and holidays. */
export interface DaySchedule {
  date: string;
  is_working_day: boolean;
  start_time: string | null;
  end_time: string | null;
  holiday: string | null;
}

export interface ScheduleResponse {
  week: WorkDay[];
  today: DaySchedule;
  late_grace_minutes: number;
  holidays_upcoming: { id: number; date: string; name: string }[];
  confirmed: boolean;
  notify_check_in: boolean;
  notify_check_out: boolean;
}

export interface FieldCategory {
  id: number;
  name: string;
  requires_note: boolean;
}

export type AttendanceMethod = 'qr' | 'button';

export interface RecordAttendanceBody {
  method: AttendanceMethod;
  lat: number;
  lng: number;
  is_mock: boolean;
  platform: 'app' | 'web';
  qr_token?: string;
  /** Omitted for the classic flow: the server picks check-in or check-out. */
  action?: AttendanceAction;
  field_category?: string;
  note?: string;
}

export interface RecordAttendanceResponse {
  action: AttendanceAction;
  distance_m: number;
  attendance: Attendance;
}

/** Shape of every backend error: {"message", "code"?, "errors"?, ...extra} */
export interface ApiErrorBody {
  message?: string;
  code?: string;
  errors?: Record<string, string[]>;
  /** Sent with code "out_of_range". */
  distance_m?: number;
  radius_m?: number;
}
