import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Sparkles,
  Lock,
  RefreshCw,
} from 'lucide-react';
import {
  getMtnMomoConfig,
  refreshMtnMomoConfig,
  initiatePayment,
  fetchPaymentStatus,
  processSuccessfulPayment,
  generateTxRef,
} from '../../services/mtnMomo';
import { User, OnboardingRegistration } from '../../types';

export interface MtnMomoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amountRwf?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shopName?: string;
  user?: User;
  workerCount?: number;
  paymentType?: 'SETUP_FEE' | 'MONTHLY';
  subscriptionId?: string;
  billingPeriod?: string;
  onPaymentSuccess: (result: { user: User; onboarding?: OnboardingRegistration; txRef: string }) => void;
  onNavigateToOwner?: () => void;
  onNavigateToPOS?: () => void;
}

type PaymentStatus = 'idle' | 'prompting' | 'verifying' | 'success' | 'error';

export const MtnMomoPaymentModal: React.FC<MtnMomoPaymentModalProps> = ({
  isOpen,
  onClose,
  amountRwf = 30000,
  customerName = 'SmartStock Merchant',
  customerEmail = 'merchant@smartstock.rw',
  customerPhone = '+250 788 123 456',
  shopName = 'SmartStock Rwanda',
  user,
  workerCount = 1,
  paymentType = 'SETUP_FEE' as const,
  subscriptionId,
  billingPeriod,
  onPaymentSuccess,
  onNavigateToOwner,
  onNavigateToPOS,
}) => {
  const [config, setConfig] = useState(getMtnMomoConfig());
  const [gatewayConfigured, setGatewayConfigured] = useState(true);
  const [payerPhone, setPayerPhone] = useState(customerPhone);
  const [payerName, setPayerName] = useState(customerName);
  const [payerEmail, setPayerEmail] = useState(customerEmail);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [completedTxRef, setCompletedTxRef] = useState<string>('');
  const [completedTransactionId, setCompletedTransactionId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [referenceId, setReferenceId] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<string>('');
  const [lastStatus, setLastStatus] = useState<string>('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refresh gateway config on open
  useEffect(() => {
    if (isOpen) {
      setConfig(getMtnMomoConfig());
      setPayerPhone(customerPhone);
      setPayerName(customerName);
      setPayerEmail(customerEmail);
      setPaymentStatus('idle');
      setErrorMessage('');
      setReferenceId('');
      setActionMessage('');
      setLastStatus('');
      setCompletedTxRef('');
      refreshMtnMomoConfig().then((status) => {
        setConfig({ mode: status.env || 'sandbox', currency: status.currency || 'RWF' });
        setGatewayConfigured(status.configured);
      });
    }
  }, [isOpen, customerPhone, customerName, customerEmail]);

  // Clear polling on close
  useEffect(() => {
    if (!isOpen && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [isOpen]);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const handlePaymentVerified = useCallback(
    (txRef: string, mtnTransactionId?: string) => {
      try {
        const result = processSuccessfulPayment({
          referenceId: txRef,
          financialTransactionId: mtnTransactionId,
          user,
          shopName,
          amountRwf,
          workerCount,
          paymentType,
          subscriptionId,
          billingPeriod,
        });

        setCompletedTxRef(txRef);
        setCompletedTransactionId(mtnTransactionId || '');
        setPaymentStatus('success');
        setIsProcessing(false);

        onPaymentSuccess({
          user: result.user,
          onboarding: result.onboarding,
          txRef,
        });
      } catch (err: any) {
        setPaymentStatus('error');
        setErrorMessage(err.message || 'An error occurred during account activation.');
        setIsProcessing(false);
      }
    },
    [amountRwf, user, shopName, workerCount, paymentType, subscriptionId, billingPeriod, payerPhone, onPaymentSuccess]
  );

  const checkStatus = useCallback(async () => {
    if (!referenceId) return;
    try {
      setPaymentStatus((s) => (s === 'prompting' ? 'verifying' : s));
      const res = await fetchPaymentStatus(referenceId);
      setLastStatus(res.status);
      if (res.status === 'SUCCESSFUL') {
        stopPolling();
        const txRef = res.externalId || completedTxRef || referenceId;
        handlePaymentVerified(txRef, res.financialTransactionId);
      } else if (res.status === 'FAILED' || res.status === 'TIMEOUT') {
        stopPolling();
        setPaymentStatus('error');
        setIsProcessing(false);
        setErrorMessage(
          'Payment was declined or expired by the mobile money provider. Please retry or choose another number.'
        );
      }
    } catch (err: any) {
      setPaymentStatus((s) => (s === 'verifying' ? 'prompting' : s));
      setErrorMessage(err.message || 'Could not reach the MTN MoMo gateway.');
    }
  }, [referenceId, completedTxRef, handlePaymentVerified]);

  const startPolling = useCallback(() => {
    stopPolling();
    // Check immediately, then every 3.5s until success/failure.
    checkStatus();
    pollRef.current = setInterval(checkStatus, 3500);
  }, [checkStatus]);

  // Clean up polling on unmount
  useEffect(() => stopPolling, []);

  if (!isOpen) return null;

  // Handle actual payment initiation via MTN MoMo RequestToPay (server-side)
  const handleInitiatePayment = async () => {
    setErrorMessage('');

    const phoneClean = payerPhone.replace(/[^0-9+]/g, '');
    if (!/(250|0)?7[0-9]{8}/.test(phoneClean)) {
      setErrorMessage('Please enter a valid Rwandan MTN Mobile Money number (e.g. +250 788 123 456).');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('prompting');
    setActionMessage('');

    const txRef = generateTxRef('SMARTSTOCK-RW');

    try {
      const result = await initiatePayment({
        amountRwf,
        customerName: payerName,
        customerEmail: payerEmail,
        customerPhone: payerPhone,
        txRef,
        user,
        shopName,
      });

      setReferenceId(result.referenceId);
      setActionMessage(
        `A payment request of ${amountRwf.toLocaleString()} RWF has been sent to ${payerPhone} on MTN MoMo. Check your phone and enter your PIN (*182# / MoMoPay prompt) to authorize.`
      );

      startPolling();
    } catch (err: any) {
      console.warn('MTN MoMo initiate failed:', err);
      setPaymentStatus('error');
      setIsProcessing(false);
      setErrorMessage(err.message || 'Unable to reach MTN MoMo. Please check your gateway credentials in .env');
    }
  };

  return (
    <div
      id="mtn-momo-payment-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="mtn-momo-payment-modal-card"
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400 font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">MTN MoMo Payment</h3>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                    config.mode === 'live'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  }`}
                >
                  {config.mode === 'live' ? 'Live Mode' : 'Sandbox Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Mobile Money RWF (MTN MoMo RequestToPay)</p>
            </div>
          </div>

          <button
            id="btn-close-mtn-momo-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {paymentStatus === 'success' ? (
            /* SUCCESS STATE */
            <div id="mtn-momo-success-screen" className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Payment Verified • MTN MoMo RWF
                </span>
                <h4 className="text-2xl font-extrabold text-white">Subscriber Account Activated!</h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  All demo restrictions have been removed. Your workspace is fully unlocked with active subscription status.
                </p>
              </div>

              {/* Receipt / Tx Summary Box */}
              <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-xl text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Transaction Ref:</span>
                  <span className="font-mono text-emerald-300 font-bold">{completedTxRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Paid:</span>
                  <span className="font-mono text-white font-bold">{amountRwf.toLocaleString()} RWF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gateway:</span>
                  <span className="text-white font-medium">MTN MoMo Mobile Money RWF</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Account Status:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> ACTIVE SUBSCRIBER
                  </span>
                </div>
              </div>

              {/* Seamless Workspace Redirection Buttons */}
              <div className="pt-2 space-y-2">
                {onNavigateToOwner && (
                  <button
                    id="btn-goto-activated-owner"
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToOwner();
                    }}
                    className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Enter Activated Owner Room</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {onNavigateToPOS && (
                  <button
                    id="btn-goto-activated-pos"
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToPOS();
                    }}
                    className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
                  >
                    <span>Launch POS Cashier Workspace</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Environment Configuration Notice */}
              <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Provider:</span>
                  <span className="font-mono text-[11px] text-slate-200 font-medium bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    MTN MoMo (Mobile Money)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Settlement Currency:</span>
                  <span className="font-mono font-bold text-amber-300">RWF (Rwandan Franc)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Rails:</span>
                  <span className="text-slate-300 font-mono text-[11px]">RequestToPay • Push USSD</span>
                </div>
              </div>

              {/* Not configured warning */}
              {!gatewayConfigured && (
                <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>
                    MTN MoMo is not configured. Add <span className="font-mono">MTN_MOMO_SUBSCRIPTION_KEY</span>,{' '}
                    <span className="font-mono">MTN_MOMO_API_USER</span> and{' '}
                    <span className="font-mono">MTN_MOMO_API_KEY</span> to your .env file and restart the server.
                  </span>
                </div>
              )}

              {/* Order Amount Card */}
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-400 font-bold block uppercase tracking-wider">
                    SmartStock Rwanda Subscription
                  </span>
                  <span className="text-[11px] text-slate-400">One-time setup & hardware link</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-white font-mono">{amountRwf.toLocaleString()}</span>
                  <span className="text-xs text-emerald-400 ml-1 font-bold">RWF</span>
                </div>
              </div>

              {/* Payer Details */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    MTN Mobile Money Phone (+250 78x):
                  </label>
                  <input
                    id="input-mtn-phone"
                    type="tel"
                    value={payerPhone}
                    onChange={(e) => setPayerPhone(e.target.value)}
                    placeholder="+250 788 123 456"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    You will receive a Mobile Money push prompt to confirm {amountRwf.toLocaleString()} RWF using your PIN.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Merchant Name:</label>
                    <input
                      id="input-mtn-name"
                      type="text"
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Email Address:</label>
                    <input
                      id="input-mtn-email"
                      type="email"
                      value={payerEmail}
                      onChange={(e) => setPayerEmail(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Prompting / Awaiting Payment Instruction */}
              {(paymentStatus === 'prompting' || paymentStatus === 'verifying') && (
                <div className="p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-2 text-xs text-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin shrink-0" />
                    <div>
                      <strong className="block font-bold">
                        {paymentStatus === 'verifying' ? 'Verifying payment with MTN MoMo...' : 'Awaiting authorization...'}
                      </strong>
                      <span>
                        {actionMessage ||
                          `A payment request of ${amountRwf.toLocaleString()} RWF was sent to ${payerPhone}.`}
                      </span>
                    </div>
                  </div>

                  {lastStatus && (
                    <div className="flex items-center justify-between text-[11px] text-amber-300/80 font-mono">
                      <span>Last status: {lastStatus}</span>
                      <button
                        type="button"
                        onClick={() => checkStatus()}
                        className="flex items-center gap-1 font-bold text-amber-200 hover:text-amber-100 transition cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> Verify now
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <button
                  id="btn-mtn-pay-now"
                  type="button"
                  disabled={isProcessing || paymentStatus === 'verifying'}
                  onClick={handleInitiatePayment}
                  className="w-full py-3.5 px-4 bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-neutral-950 font-bold rounded-xl text-sm sm:text-base transition duration-150 shadow-lg shadow-yellow-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isProcessing && paymentStatus === 'prompting' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin" />
                      <span>Connecting to MTN MoMo...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Pay {amountRwf.toLocaleString()} RWF via MTN MoMo</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-1">
                <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                  Powered by MTN Mobile Money (Rwanda) • RequestToPay
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};