const API_BASE = '/api/otp';

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(
      `Unable to reach the OTP server (${(err as Error).message}). Start it with "npm run server" (port 4000) and make sure your firewall allows it.`
    );
  }

  const text = await res.text();
  let data: { ok: boolean; message: string; previewUrl?: string };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `OTP server returned an unexpected response (HTTP ${res.status}). Verify the backend is running on port 4000: ${text.slice(0, 200)}`
    );
  }

  if (!res.ok) {
    throw new Error(data?.message || `OTP server error (HTTP ${res.status}).`);
  }
  return data as T;
}

export async function sendLoginOTP(params: {
  email: string;
  role: 'owner' | 'employee' | 'cashier' | 'superadmin';
  userName?: string;
}): Promise<{ ok: boolean; message: string; previewUrl?: string }> {
  const data = await post<{ ok: boolean; message: string; previewUrl?: string }>('/send', params);
  if (!data.ok) {
    throw new Error(data.message || 'Failed to send OTP email.');
  }
  return data;
}

export interface VerifyOTPResponse {
  ok: boolean;
  message: string;
  role?: 'owner' | 'employee' | 'superadmin';
  user?: any;
}

export async function verifyLoginOTP(params: {
  email: string;
  role: 'owner' | 'employee' | 'cashier' | 'superadmin';
  code: string;
}): Promise<VerifyOTPResponse> {
  const data = await post<VerifyOTPResponse>('/verify', params);
  if (!data.ok) {
    throw new Error(data.message || 'OTP verification failed.');
  }
  return data;
}