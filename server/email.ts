import nodemailer from 'nodemailer';
import crypto from 'crypto';
import type { Transporter } from 'nodemailer';

interface PendingOTP {
  codeHash: string;
  email: string;
  role: 'owner' | 'employee' | 'superadmin';
  expiresAt: number;
  attempts: number;
  sentAt: number;
  sendCount: number;
}

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_WINDOW = 5; // max OTP emails per window, per address
const SEND_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MIN_RESEND_INTERVAL_MS = 30 * 1000; // wait at least 30s between emails

// Random per-process salt: stored codes are never plaintext in memory
const OTP_HASH_SALT = crypto.randomBytes(16).toString('hex');

// In-memory OTP store (keyed by email+role)
const pendingOTPStore = new Map<string, PendingOTP>();

// Send-rate tracking (keyed by lowercased email)
const sendLog = new Map<string, number[]>();

// Nodemailer transporter — configured via env vars or falls back to Ethereal test account
let transporterPromise: Promise<Transporter> | null = null;

async function getTransporter(): Promise<Transporter> {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

      if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
        console.log(`[SmartStock Email] Using SMTP: ${SMTP_HOST}:${SMTP_PORT || 587}`);
        return nodemailer.createTransport({
          host: SMTP_HOST,
          port: Number(SMTP_PORT) || 587,
          secure: Number(SMTP_PORT) === 465,
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
          },
        });
      }

      // Fallback: Ethereal test account (real email goes to Ethereal inbox, viewable at ethereal.email)
      console.log('[SmartStock Email] No SMTP env vars set — creating Ethereal test account...');
      const testAccount = await nodemailer.createTestAccount();
      console.log(`[SmartStock Email] Ethereal login: ${testAccount.user}`);
      console.log('[SmartStock Email] View sent emails at https://ethereal.email/login');
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    })();
  }
  return transporterPromise;
}

function generateCode(): string {
  return String(crypto.randomInt(100000, 1000000)); // cryptographically secure 6-digit code
}

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(`${OTP_HASH_SALT}:${code}`).digest('hex');
}

function storeKey(email: string, role: string): string {
  return `${email.toLowerCase()}:${role}`;
}

function sendWindow(email: string): number[] {
  const key = email.toLowerCase();
  const now = Date.now();
  const timestamps = (sendLog.get(key) || []).filter((t) => t >= now - SEND_WINDOW_MS);
  return timestamps;
}

function recordSend(email: string): void {
  const key = email.toLowerCase();
  sendLog.set(key, [...sendWindow(email), Date.now()]);
}

export async function sendOTP(params: {
  email: string;
  role: 'owner' | 'employee' | 'superadmin';
  userName?: string;
}): Promise<{ ok: boolean; message: string; retryAfterSeconds?: number; previewUrl?: string }> {
  try {
    const key = storeKey(params.email, params.role);
    const now = Date.now();

    const recentSends = sendWindow(params.email);
    if (recentSends.length >= MAX_SENDS_PER_WINDOW) {
      const oldest = recentSends[0];
      const retryAfterSeconds = Math.max(1, Math.ceil((oldest + SEND_WINDOW_MS - now) / 1000));
      return {
        ok: false,
        message: `Too many OTP requests for ${params.email}. Please try again in ${retryAfterSeconds}s.`,
        retryAfterSeconds,
      };
    }

    const previous = pendingOTPStore.get(key);
    if (previous && now - previous.sentAt < MIN_RESEND_INTERVAL_MS && previous.sendCount > 0) {
      const retryAfterSeconds = Math.max(1, Math.ceil((previous.sentAt + MIN_RESEND_INTERVAL_MS - now) / 1000));
      return {
        ok: false,
        message: `Please wait ${retryAfterSeconds}s before requesting another code.`,
        retryAfterSeconds,
      };
    }

    const code = generateCode();
    pendingOTPStore.set(key, {
      codeHash: hashCode(code),
      email: params.email,
      role: params.role,
      expiresAt: now + OTP_TTL_MS,
      attempts: 0,
      sentAt: now,
      sendCount: (previous?.sendCount || 0) + 1,
    });
    recordSend(params.email);

    const transporter = await getTransporter();
    const roleLabel = params.role === 'superadmin' ? 'Platform Admin' : params.role === 'employee' ? 'Staff' : 'Store Owner';

    const htmlBody = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: linear-gradient(135deg, #059669, #047857); padding: 28px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.3px;">SmartStock RWANDA</h1>
          <p style="color: #d1fae5; margin: 6px 0 0; font-size: 12px;">Security Verification — ${roleLabel}</p>
        </div>
        <div style="padding: 32px 24px; text-align: center;">
          <p style="color: #334155; font-size: 14px; margin: 0 0 8px;">Hello ${params.userName || 'there'},</p>
          <p style="color: #64748b; font-size: 13px; margin: 0 0 24px;">Your one-time verification code is:</p>
          <div style="background: #f8fafc; border: 2px dashed #059669; border-radius: 12px; padding: 18px 0; margin: 0 40px;">
            <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 900; color: #059669; letter-spacing: 12px;">${code}</span>
          </div>
          <p style="color: #94a3b8; font-size: 11px; margin: 20px 0 0;">This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
          <p style="color: #94a3b8; font-size: 11px; margin: 6px 0 0;">If you did not request this, please ignore this email.</p>
        </div>
        <div style="background: #f1f5f9; padding: 14px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #94a3b8; font-size: 10px; margin: 0;">SmartStock POS Platform &copy; ${new Date().getFullYear()} &bull; Kigali, Rwanda</p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"SmartStock Security" <${process.env.SMTP_USER || 'noreply@smartstock.rw'}>`,
      to: params.email,
      subject: `[SmartStock] Your Login Verification Code: ${code}`,
      text: `SmartStock RWANDA — Security Verification\n\nHello ${params.userName || 'there'},\n\nYour login verification code is: ${code}\n\nThis code expires in 5 minutes. Do not share it with anyone.\n\nIf you did not request this, please ignore this email.`,
      html: htmlBody,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    if (previewUrl) {
      console.log(`[SmartStock Email] OTP preview: ${previewUrl}`);
    }

    console.log(`[SmartStock Email] OTP sent to ${params.email} (${roleLabel}) — message ID: ${info.messageId}`);
    return { ok: true, message: `OTP sent to ${params.email}`, previewUrl };
  } catch (err) {
    console.error('[SmartStock Email] Failed to send OTP:', err);
    return { ok: false, message: `Failed to send email: ${(err as Error).message}` };
  }
}

export function verifyOTP(params: {
  email: string;
  role: 'owner' | 'employee' | 'superadmin';
  code: string;
}): { ok: boolean; message: string } {
  const key = storeKey(params.email, params.role);
  const pending = pendingOTPStore.get(key);

  if (!pending) {
    return { ok: false, message: 'No OTP was sent to this email. Please request a new code.' };
  }

  if (Date.now() > pending.expiresAt) {
    pendingOTPStore.delete(key);
    return { ok: false, message: 'This OTP has expired. Please request a new code.' };
  }

  if (pending.attempts >= MAX_ATTEMPTS) {
    pendingOTPStore.delete(key);
    return { ok: false, message: 'Too many failed attempts. Please request a new code.' };
  }

  pending.attempts += 1;

  if (pending.codeHash === hashCode(params.code)) {
    pendingOTPStore.delete(key);
    return { ok: true, message: 'OTP verified successfully.' };
  }

  return { ok: false, message: `Incorrect code. ${Math.max(0, MAX_ATTEMPTS - pending.attempts)} attempts remaining.` };
}
