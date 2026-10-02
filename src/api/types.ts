export type Role = 'admin' | 'staff';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  is_active: boolean;
  device_bound: boolean;
}

export interface LoginResponse {
  token: string;
  token_type: 'Bearer';
  user: User;
}

export type AttendanceStatus = 'not_checked_in' | 'checked_in' | 'checked_out';

export interface Attendance {
  id: number;
  user_id: number;
  date: string;
  time_in: string | null;
  time_out: string | null;
  method_in: 'qr' | 'button' | null;
  method_out: 'qr' | 'button' | null;
  status: AttendanceStatus;
}

export interface TodayResponse {
  date: string;
  status: AttendanceStatus;
  attendance: Attendance | null;
}

export type AttendanceMethod = 'qr' | 'button';

export interface RecordAttendanceBody {
  method: AttendanceMethod;
  lat: number;
  lng: number;
  is_mock: boolean;
  qr_token?: string;
}

export interface RecordAttendanceResponse {
  action: 'check_in' | 'check_out';
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
