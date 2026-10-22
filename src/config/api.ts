/**
 * API base URL — switch between local and production anytime.
 *
 * Change ACTIVE_API to 'local' or 'production' below.
 *
 * Local tips:
 *   Physical phone (same Wi‑Fi) → uses LAN_IP
 *   Android emulator → set local to http://10.0.2.2:4000/api
 *   USB + adb reverse → http://127.0.0.1:4000/api
 */

const LAN_IP = '192.168.0.133';

export const API_URLS = {
  local: `http://${LAN_IP}:4000/api`,
  production: 'https://visiongrowthapi.netcastservice.online/api',
} as const;

/** Flip this when you need local vs live API */
export type ApiEnv = keyof typeof API_URLS;
export const ACTIVE_API: ApiEnv = 'production';

export const API_BASE_URL = API_URLS[ACTIVE_API];

export const TOKEN_KEY = 'vg_auth_token';
export const DOCTOR_KEY = 'vg_doctor';
