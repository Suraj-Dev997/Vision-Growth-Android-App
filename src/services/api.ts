import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, TOKEN_KEY } from '../config/api';

export type ApiResult<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  code?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

export type ListParams = {
  search?: string;
  page?: number;
  limit?: number;
};

async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function api<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResult<T>> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let body: ApiResult<T>;
  try {
    body = await res.json();
  } catch {
    throw new Error(`Invalid response (${res.status})`);
  }

  if (!res.ok) {
    const err: any = new Error(body.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export const authApi = {
  register: (payload: Record<string, any>) =>
    api('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  verifyOtp: (email: string, otp: string) =>
    api('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
  resendOtp: (email: string) =>
    api('/auth/resend-otp', { method: 'POST', body: JSON.stringify({ email }) }),
  login: (email: string, password: string) =>
    api<{ token: string; doctor: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  forgotPassword: (email: string) =>
    api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyResetOtp: (email: string, otp: string) =>
    api<{ reset_token: string; email: string }>('/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),
  resetPassword: (payload: {
    reset_token: string;
    password: string;
    confirm_password: string;
  }) => api('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => api('/auth/me'),
};

export type AppConfig = {
  android_min_version_code: number;
  android_latest_version_code: number;
  force_update: boolean;
  update_title: string;
  update_message: string;
  android_store_url: string;
};

export const appApi = {
  config: () => api<AppConfig>('/app/config'),
};

function toQuery(params: Record<string, string | number | undefined>) {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return q ? `?${q}` : '';
}

export const childrenApi = {
  list: ({ search = '', page = 1, limit = 20 }: ListParams = {}) =>
    api(`/children${toQuery({ search: search || undefined, page, limit })}`),
  get: (id: number | string) => api(`/children/${id}`),
  createAssessment: (payload: Record<string, any>) =>
    api('/children/assessment', { method: 'POST', body: JSON.stringify(payload) }),
  addVisit: (childId: number | string, visit: Record<string, any>) =>
    api(`/children/${childId}/visits`, {
      method: 'POST',
      body: JSON.stringify(visit),
    }),
};

export type FollowUpParams = ListParams & {
  from?: string;
  to?: string;
};

export const visitsApi = {
  list: ({ search = '', page = 1, limit = 20 }: ListParams = {}) =>
    api(`/visits${toQuery({ search: search || undefined, page, limit })}`),
  followUps: ({
    from,
    to,
    search = '',
    page = 1,
    limit = 20,
  }: FollowUpParams = {}) =>
    api(
      `/visits/follow-ups${toQuery({
        from,
        to,
        search: search || undefined,
        page,
        limit,
      })}`,
    ),
  get: (id: number | string) => api(`/visits/${id}`),
  pdfLink: (id: number | string) =>
    api<{
      token: string;
      url: string;
      downloadUrl: string;
      expiresInSec: number;
      filename: string;
    }>(`/visits/${id}/pdf-link`, { method: 'POST' }),
};
