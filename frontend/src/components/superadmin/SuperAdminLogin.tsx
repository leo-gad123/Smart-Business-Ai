import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { User } from '../../types';
import {
  superAdminLogin,
  superAdminResendOTP,
  superAdminVerifyOTP,
} from '../../services/superAdminAuthApi';

interface SuperAdminLoginProps {
  onAuthenticated: (user: User, token: string) => void;
  onBackToLanding: () => void;
}

type Step = 'credentials' | 'otp';

export const SuperAdminLogin: React.FC<SuperAdminLoginProps> = ({ onAuthenticated, onBackToLanding }) => {
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'otp') otpRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await superAdminLogin({ email: email.trim(), password });
      if (!res.ok) {
        setError(res.message || 'Invalid credentials');
        return;
      }
      setSuccess(res.message || 'OTP sent to your email');
      setResendCooldown(60);
      setStep('otp');
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return;
    setError('');
    setLoading(true);
    try {
      const res = await superAdminVerifyOTP({ email: email.trim(), code: otpCode });
      if (!res.ok || !res.token || !res.user) {
        setError(res.message || 'Invalid or expired OTP');
        return;
      }
      onAuthenticated(res.user as User, res.token);
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await superAdminResendOTP({ email: email.trim() });
      if (!res.ok) {
        setError(res.message || 'Failed to resend OTP');
        return;
      }
      setSuccess(res.message || 'New OTP sent');
      setResendCooldown(60);
      setOtpCode('');
    } catch {
      setError('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 mb-6 transition-colors text-sm"
        >
          <ArrowLeft size={14} />
          Back to landing
        </button>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 text-center border-b border-white/10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/30 mb-3">
              <ShieldAlert className="text-red-400" size={26} />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {step === 'credentials' ? 'Platform Admin Login' : 'Verify OTP'}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {step === 'credentials'
                ? 'Sign in with your registered admin credentials'
                : `Enter the 6-digit code sent to ${email}`}
            </p>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Success */}
            {success && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-2">
                <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0" />
                {success}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* STEP 1 — Email + Password */}
            {step === 'credentials' && (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1 block">Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                      placeholder="admin@smartstock.rw"
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1 block">Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                      placeholder="System password"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim() || !password}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    'Send Verification Code'
                  )}
                </button>
              </form>
            )}

            {/* STEP 2 — OTP */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1 block">6-Digit OTP</label>
                  <input
                    ref={otpRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
                    placeholder="000000"
                    autoComplete="one-time-code"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    'Verify & Sign In'
                  )}
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => { setStep('credentials'); setError(''); setSuccess(''); setOtpCode(''); }}
                    className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
                  >
                    Change email
                  </button>

                  <button
                    type="button"
                    disabled={resendCooldown > 0 || loading}
                    onClick={handleResend}
                    className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          SmartStock POS Platform &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};
