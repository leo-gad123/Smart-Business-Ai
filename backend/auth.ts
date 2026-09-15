import crypto from 'crypto';

export interface SuperAdminSession {
  token: string;
  email: string;
  role: 'superadmin';
  createdAt: number;
  expiresAt: number;
}

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

const sessionStore = new Map<string, SuperAdminSession>();

export function createSuperAdminSession(email: string): { token: string; session: SuperAdminSession } {
  const token = crypto.randomBytes(32).toString('hex');
  const session: SuperAdminSession = {
    token,
    email,
    role: 'superadmin',
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  sessionStore.set(token, session);
  return { token, session };
}

export function verifySuperAdminSession(token?: string): SuperAdminSession | null {
  if (!token) return null;
  const session = sessionStore.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessionStore.delete(token);
    return null;
  }
  return session;
}

export function destroySuperAdminSession(token?: string): void {
  if (!token) return;
  sessionStore.delete(token);
}

export function extractBearerToken(authorization?: string): string | null {
  if (!authorization || !authorization.trim().toLowerCase().startsWith('bearer ')) return null;
  const token = authorization.trim().slice('bearer '.length).trim();
  return token || null;
}