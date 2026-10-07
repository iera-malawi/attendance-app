import { isAxiosError } from 'axios';
import type { ApiErrorBody } from '../api/types';

export const NETWORK_ERROR_MESSAGE =
  "Can't reach the server. Check you're on the office Wi-Fi/internet.";

/** Turns any thrown value into a message safe to show the user. */
export function getErrorMessage(err: unknown): string {
  if (isAxiosError<ApiErrorBody>(err)) {
    if (!err.response) return NETWORK_ERROR_MESSAGE;

    const data = err.response.data;
    const firstFieldError = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined;
    if (firstFieldError) return firstFieldError;
    if (data?.message) return data.message;
    if (err.response.status === 429) return 'Too many attempts. Please wait a minute and try again.';
    return `Something went wrong (error ${err.response.status}). Please try again.`;
  }
  if (err instanceof Error && err.message) return err.message;
  return 'Something went wrong. Please try again.';
}

/** Friendly messages for POST /attendance rejections, keyed by the server's error code. */
export function getAttendanceErrorMessage(err: unknown): string {
  if (isAxiosError<ApiErrorBody>(err) && err.response?.data?.code) {
    const data = err.response.data;
    switch (data.code) {
      case 'out_of_range':
        return data.distance_m != null
          ? `You are about ${data.distance_m} m from the office. Move closer and try again.`
          : 'You are too far from the office. Move closer and try again.';
      case 'mock_location':
        return 'Fake location detected. Turn off any location-changing apps.';
      case 'invalid_qr':
        return 'This QR code is outdated. Ask admin for the new one.';
      case 'already_checked_out':
        return "You've already checked out today.";
      case 'already_checked_in':
        return "You've already checked in today.";
      case 'not_checked_in':
        return "You haven't checked in yet today.";
      case 'already_in_field':
        return "You're already in the field.";
      case 'field_not_allowed':
        return "Field work isn't enabled for your account. Ask admin.";
    }
  }
  return getErrorMessage(err);
}
