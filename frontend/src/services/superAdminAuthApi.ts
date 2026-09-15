const API_BASE = '/api/auth/superadmin';

async function post<T = any>(path: string, body: Record<string, unknown>, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  return res.json() as Promise<T>;
}

async function get<T = any>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json() as Promise<T>;
}

// Step 1: Submit email + password (returns OK and triggers OTP send)
export async function superAdminLogin({ email, password }: { email: string; password: string }) {
  return post<{ ok: boolean; message: string; previewUrl?: string; retryAfterSeconds?: number; error?: string }>(
    '/login',
    { email, password },
  );
}

// Resend OTP (rate-limited server-side)
export async function superAdminResendOTP({ email }: { email: string }) {
  return post<{ ok: boolean; message: string; previewUrl?: string; retryAfterSeconds?: number; error?: string }>(
    '/otp/send',
    { email },
  );
}

// Step 2: Verify 6-digit OTP code → returns session token + user
export interface SuperAdminAuthResponse {
  ok: boolean;
  message: string;
  token?: string;
  user?: any;
  error?: string;
}

export async function superAdminVerifyOTP({ email, code }: { email: string; code: string }) {
  return post<SuperAdminAuthResponse>('/otp/verify', { email, code });
}

// Verify an existing session token is still valid
export async function superAdminCheckSession(token: string) {
  return get<{ ok: boolean; session?: any; error?: string }>('/session', token);
}

// Logout (invalidate session server-side)
export async function superAdminLogout(token: string) {
  return post('/logout', {}, token);
}
