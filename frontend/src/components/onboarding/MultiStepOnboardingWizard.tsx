import React, { useState, useEffect, useRef } from 'react';
import {
  Store,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Sparkles,
  ArrowRight,
  Clock,
  RotateCcw,
  Smartphone,
  Check,
  AlertCircle,
  KeyRound,
  User,
  Building2,
  ChevronLeft,
  X,
  CheckCheck,
  Users
} from 'lucide-react';
import { OnboardingRegistration } from '../../types';
import { PostPaymentOnboardingMenu } from './PostPaymentOnboardingMenu';
import { MtnMomoPaymentModal } from '../payment/MtnMomoPaymentModal';
import { getMtnMomoConfig, refreshMtnMomoConfig } from '../../services/mtnMomo';
import { planForWorkerCount, formatRwf } from '../../services/subscriptionApi';

export interface MultiStepOnboardingWizardProps {
  onRegisterShop: (data: Omit<OnboardingRegistration, 'id' | 'createdAt'>) => OnboardingRegistration;
  onNavigateToPOS: () => void;
  onNavigateToStock: () => void;
  onClose?: () => void;
  onSwitchToLogin?: () => void;
  isModal?: boolean;
}

export type OnboardingStep = 1 | 2 | 3 | 4 | 5; // 5 is post-onboarding success

const RWANDA_DISTRICTS = [
  { id: 'nyarugenge', label: 'Nyarugenge, Kigali', tag: 'City Center / Nyamirambo', province: 'Kigali' },
  { id: 'gasabo', label: 'Gasabo, Kigali', tag: 'Kimironko / Remera / Gisozi', province: 'Kigali' },
  { id: 'kicukiro', label: 'Kicukiro, Kigali', tag: 'Sonatubes / Gikondo / Kanombe', province: 'Kigali' },
  { id: 'rubavu', label: 'Rubavu (Gisenyi)', tag: 'Western Border Trading', province: 'Western' },
  { id: 'musanze', label: 'Musanze (Ruhengeri)', tag: 'Northern Commercial Hub', province: 'Northern' },
  { id: 'huye', label: 'Huye (Butare)', tag: 'Southern Province Central', province: 'Southern' },
  { id: 'rwamagana', label: 'Rwamagana', tag: 'Eastern Trade Center', province: 'Eastern' },
  { id: 'muhanga', label: 'Muhanga (Gitarama)', tag: 'Southern Commerce', province: 'Southern' },
  { id: 'rusizi', label: 'Rusizi (Cyangugu)', tag: 'Lake Kivu Port & Trade', province: 'Western' }
];

export const MultiStepOnboardingWizard: React.FC<MultiStepOnboardingWizardProps> = ({
  onRegisterShop,
  onNavigateToPOS,
  onNavigateToStock,
  onClose,
  onSwitchToLogin,
  isModal = true
}) => {
  // Current step: 1 (User & Business Info), 2 (Location & Recovery), 3 (Setup Payment & Promo), 4 (OTP Verification), 5 (Success Menu)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);

  // Step 1 Fields: User & Business Details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [captchaVerified, setCaptchaVerified] = useState(true);

  // Step 2 Fields: Location & Recovery
  const [selectedDistrict, setSelectedDistrict] = useState('Nyarugenge, Kigali');
  const [businessAddress, setBusinessAddress] = useState('');
  const [recoveryPhoneNumber, setRecoveryPhoneNumber] = useState('');

  // Worker Count → Subscription Plan auto-selection (required)
  const WORKER_COUNT_OPTIONS = [
    { label: '1 Worker', value: 1 },
    { label: '2 – 5 Workers', value: 3 },
    { label: '6 – 10 Workers', value: 8 },
    { label: '11+ Workers', value: 15 },
  ];
  const [workerCount, setWorkerCount] = useState<number>(3);
  const selectedPlan = planForWorkerCount(workerCount);

  // Step 3 Fields: Payment Channel & Phone
  const [paymentMethod, setPaymentMethod] = useState<'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD'>('MTN_MOMO');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isMtnMomoModalOpen, setIsMtnMomoModalOpen] = useState(false);
  const [mtnMomoConfig, setMtnMomoConfig] = useState(getMtnMomoConfig());

  useEffect(() => {
    refreshMtnMomoConfig().then((status) => {
      setMtnMomoConfig({ ...getMtnMomoConfig(), mode: status.env });
    });
  }, []);

  // Step 4 Fields: OTP Verification
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState<number>(60);
  const [otpError, setOtpError] = useState('');
  const [otpResentAlert, setOtpResentAlert] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Error State
  const [errorMessage, setErrorMessage] = useState('');

  // Refs for 6 OTP boxes
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Keep payment phone in sync with primary phone if user didn't modify it
  useEffect(() => {
    if (phoneNumber && !paymentPhone) {
      setPaymentPhone(phoneNumber);
    }
  }, [phoneNumber, paymentPhone]);

  // 60-second OTP countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentStep === 4 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentStep, countdown]);

  // Focus first OTP digit when entering Step 4
  useEffect(() => {
    if (currentStep === 4) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [currentStep]);

  // --------------------------------------------------------------------------
  // STEP 1 VALIDATION & ADVANCE
  // --------------------------------------------------------------------------
  const handleStep1Continue = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!firstName.trim()) {
      setErrorMessage('Please enter your First Name.');
      return;
    }
    if (!lastName.trim()) {
      setErrorMessage('Please enter your Last Name.');
      return;
    }
    if (!emailAddress.trim() || !emailAddress.includes('@')) {
      setErrorMessage('Please provide a valid Email Address for system alerts and recovery.');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.replace(/\D/g, '').length < 9) {
      setErrorMessage('Please provide a valid Rwandan Phone Number (e.g. +250 788 000 000).');
      return;
    }
    if (!businessName.trim()) {
      setErrorMessage('Please enter your Business / Shop Name.');
      return;
    }
    if (!termsAccepted) {
      setErrorMessage('You must accept the Terms & Conditions and Privacy Policy to proceed.');
      return;
    }
    if (!captchaVerified) {
      setErrorMessage('Please complete the security verification badge.');
      return;
    }

    setCurrentStep(2);
  };

  // --------------------------------------------------------------------------
  // STEP 2 VALIDATION & ADVANCE
  // --------------------------------------------------------------------------
  const handleStep2Continue = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!selectedDistrict) {
      setErrorMessage('Please select your business district or commercial zone.');
      return;
    }

    // Advance to Step 3: Setup Payment & Promo
    setCurrentStep(3);
  };

  // --------------------------------------------------------------------------
  // STEP 3: SETUP PAYMENT TRIGGER (MTN MoMo GATEWAY / MOBILE MONEY RWF)
  // --------------------------------------------------------------------------
  const handleStep3PayAndContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsMtnMomoModalOpen(true);
  };

  const handleMtnMomoSuccess = (result: { user: any; onboarding?: any; txRef: string }) => {
    setIsMtnMomoModalOpen(false);
    const ownerFullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    onRegisterShop({
      shopName: businessName.trim() || 'SmartStock Shop Kigali',
      ownerFullName,
      ownerPhone: phoneNumber.trim() || paymentPhone.trim(),
      ownerEmail: emailAddress.trim(),
      recoveryPhone: recoveryPhoneNumber.trim() || undefined,
      districtLocation: selectedDistrict,
      shopType: 'Supermarket',
      staffCount: workerCount,
      workerCount,
      setupFeePaidRwf: selectedPlan.setupFee,
      monthlyPlanRwf: selectedPlan.monthlyFee,
      paymentMethod: 'MTN_MOMO',
      paymentReference: result.txRef,
      mtnTxRef: result.txRef,
      mtnTransactionId: result.txRef,
      mtnStatus: 'SUCCESSFUL',
      trainingScheduledDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
      status: 'ACTIVE'
    });
    // Seamlessly transition to the activated workspace / post-payment onboarding menu
    setCurrentStep(5);
  };

  // --------------------------------------------------------------------------
  // STEP 4: OTP INPUT HANDLERS & ACTIVATION
  // --------------------------------------------------------------------------
  const handleOtpChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    if (!cleanVal) {
      const updated = [...otpDigits];
      updated[index] = '';
      setOtpDigits(updated);
      return;
    }

    const char = cleanVal.slice(-1);
    const updated = [...otpDigits];
    updated[index] = char;
    setOtpDigits(updated);
    setOtpError('');

    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const updated = [...otpDigits];
    for (let i = 0; i < pastedData.length; i++) {
      updated[i] = pastedData[i];
    }
    setOtpDigits(updated);
    setOtpError('');
    const nextIdx = Math.min(pastedData.length, 5);
    otpInputRefs.current[nextIdx]?.focus();
  };

  const handleUseDemoOtp = () => {
    setOtpDigits(['2', '0', '2', '6', '0', '9']);
    setOtpError('');
    setTimeout(() => {
      otpInputRefs.current[5]?.focus();
    }, 50);
  };

  const handleResendOtp = () => {
    if (countdown > 0) return;
    setCountdown(60);
    setOtpResentAlert(true);
    setTimeout(() => setOtpResentAlert(false), 4000);
  };

  const handleVerifyOtpAndOpenDashboard = () => {
    const fullCode = otpDigits.join('');
    if (fullCode.length < 6) {
      setOtpError('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError('');

    setTimeout(() => {
      // Save registration to local database & activate store owner
      const ownerFullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      onRegisterShop({
        shopName: businessName.trim(),
        ownerFullName,
        ownerPhone: phoneNumber.trim(),
        ownerEmail: emailAddress.trim(),
        recoveryPhone: recoveryPhoneNumber.trim() || undefined,
        districtLocation: selectedDistrict,
        shopType: 'Supermarket',
        staffCount: workerCount,
        workerCount,
        setupFeePaidRwf: selectedPlan.setupFee,
        monthlyPlanRwf: selectedPlan.monthlyFee,
        paymentMethod,
        paymentReference: `RW-MOMO-${Math.floor(100000 + Math.random() * 900000)}`,
        trainingScheduledDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
        status: 'ACTIVE'
      });

      setIsVerifyingOtp(false);
      setCurrentStep(5); // Show success onboarding menu
    }, 900);
  };

  // Masked phone display for OTP confirmation
  const maskedPhone = phoneNumber.trim().length > 7
    ? `${phoneNumber.trim().slice(0, 8)}...`
    : phoneNumber.trim() || '+250 788...';

  // --------------------------------------------------------------------------
  // RENDER STEP 5 (POST-PAYMENT SUCCESS MENU)
  // --------------------------------------------------------------------------
  if (currentStep === 5) {
    return (
      <div
        className={`${
          isModal
            ? 'fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6 overflow-y-auto'
            : "w-full min-h-screen py-8 px-4 flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center lg:bg-fixed relative"
        }`}
      >
        {isModal ? (
          <div
            className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center lg:bg-fixed"
            onClick={onClose}
          >
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
        )}

        <div className="relative z-10 w-full max-w-4xl mx-auto p-2 sm:p-4 my-auto">
          <PostPaymentOnboardingMenu
            shopName={businessName || 'SmartStock Shop Kigali'}
            ownerName={`${firstName} ${lastName}`.trim() || 'Store Owner'}
            ownerPhone={phoneNumber || '+250 788 123 456'}
            onNavigateToPOS={onNavigateToPOS}
            onNavigateToStock={onNavigateToStock}
            onClose={onClose}
          />
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // MAIN MULTI-STEP WIZARD CONTAINER
  // --------------------------------------------------------------------------
  return (
    <div
      id="smartstock-onboarding-wizard"
      className={`${
        isModal
          ? 'fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6 overflow-y-auto'
          : "w-full min-h-screen py-8 px-4 flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center lg:bg-fixed relative"
      }`}
    >
      {/* Supermarket store interior background with warm blur overlay matching Photo 2 */}
      {isModal ? (
        <div
          className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center lg:bg-fixed"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
      )}

      {/* Floating Modal Card Dialog: Sharp contrast, clean borders border-slate-700/50, balanced padding */}
      <div
        className={`relative z-10 w-full max-w-xl bg-[#0b1329]/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-6 sm:p-8 text-white my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* Top Header Row: SmartStock logo badge + RWANDA tag + Subtitle & Stepper Indicators (1,2,3,4) + Close */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/30">
              <ShieldCheck className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">SmartStock</span>
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  RWANDA
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Merchant Registration Wizard</p>
            </div>
          </div>

          {/* Stepper Indicators (1, 2, 3, 4) with active step highlighted in emerald green, followed by close button */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-all ${
                  currentStep === s
                    ? 'bg-emerald-500 text-slate-950 font-extrabold ring-2 ring-emerald-400/50 shadow-sm shadow-emerald-500/30'
                    : currentStep > s
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800/80 text-slate-500'
                }`}
              >
                {s}
              </div>
            ))}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="ml-2 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Thin Progress Bar Indicating Completion Status */}
        <div className="w-full bg-slate-800/80 h-1 rounded-full overflow-hidden mt-3 mb-6">
          <div
            className="bg-emerald-500 h-full transition-all duration-300 rounded-full shadow-xs shadow-emerald-500/50"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs text-rose-300 font-medium flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 1: EXACT VISUAL LAYOUT & FORM FIELDS (Step 1 - Account Details) */}
        {/* ================================================================= */}
        {currentStep === 1 && (
          <form onSubmit={handleStep1Continue} className="space-y-4 animate-in fade-in">
            {/* Header Content */}
            <div className="space-y-1">
              {/* Small Sub-heading: "GET STARTED" (Uppercase, muted emerald text) */}
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/90 block">
                GET STARTED
              </span>
              {/* Main Title: "Create your SmartStock account" */}
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Create your SmartStock account
              </h2>
              {/* Subtitle: "Fill in the fields below to set up your business workspace." */}
              <p className="text-sm text-slate-400">
                Fill in the fields below to set up your business workspace.
              </p>
            </div>

            {/* Input Fields Architecture (Grid 2-Columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {/* 1. First Name (Input text box with user icon inside) */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  First Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="input-first-name"
                    type="text"
                    required
                    placeholder="Jean-Pierre"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-[#111c38] border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:bg-[#152244] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 outline-none transition"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* 2. Last Name (Input text box with user icon inside) */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Last Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="input-last-name"
                    type="text"
                    required
                    placeholder="Mugabo"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-[#111c38] border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:bg-[#152244] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 outline-none transition"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Row 2: Email & Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* 3. Email Address (Input email box with mail icon inside) */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="input-email-address"
                    type="email"
                    required
                    placeholder="mugabo@example.rw"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full bg-[#111c38] border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:bg-[#152244] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 outline-none transition"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* 4. Phone Number (Input tel box with phone icon inside and placeholder +250 78...) */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Phone Number <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="input-phone-number"
                    type="tel"
                    required
                    placeholder="+250 78..."
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-[#111c38] border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 font-mono focus:bg-[#152244] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 outline-none transition"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* 5. Business Name (Full width input box with store/building icon inside) */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Business Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-business-name"
                  type="text"
                  required
                  placeholder="e.g. Simba Supermarket Kigali"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-[#111c38] border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:bg-[#152244] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 outline-none transition"
                />
                <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Terms Acceptance: Emerald checked box with integrated hyperlinked text */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300 select-none">
                <input
                  id="checkbox-terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-2 focus:ring-emerald-500/50 bg-[#111c38] cursor-pointer accent-emerald-500"
                />
                <span className="leading-relaxed">
                  I accept the{' '}
                  <a href="#terms" onClick={(e) => e.preventDefault()} className="text-emerald-400 hover:text-emerald-300 hover:underline">Terms & Conditions</a>,{' '}
                  <a href="#privacy" onClick={(e) => e.preventDefault()} className="text-emerald-400 hover:text-emerald-300 hover:underline">Privacy Policy</a>, and{' '}
                  <a href="#cookies" onClick={(e) => e.preventDefault()} className="text-emerald-400 hover:text-emerald-300 hover:underline">Cookie Policy</a>.
                </span>
              </label>
            </div>

            {/* Security Verification: Cloudflare Turnstile Box - Dark green verification widget ("Success! Verification complete") */}
            <div
              id="cloudflare-turnstile-badge"
              className="p-3 bg-[#0a2318] border border-emerald-500/40 rounded-xl flex items-center justify-between transition hover:border-emerald-500/60"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                    <span>Success! Verification complete</span>
                  </div>
                  <div className="text-[10px] text-emerald-400/80 flex items-center gap-1.5 font-mono">
                    <span>Ray ID: 89f4b7a2...</span>
                    <span>&bull;</span>
                    <span className="hover:underline cursor-pointer">Privacy</span>
                    <span>&bull;</span>
                    <span className="hover:underline cursor-pointer">Terms</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pl-3 border-l border-emerald-900/60">
                {/* Cloudflare logo icon */}
                <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                </svg>
                <div className="text-right">
                  <span className="text-[10px] font-bold tracking-tight text-slate-300 block leading-tight">CLOUDFLARE</span>
                  <span className="text-[9px] text-slate-400 block leading-none">Turnstile</span>
                </div>
              </div>
            </div>

            {/* Primary Action Button: Large full-width emerald "Continue" button at the bottom */}
            <div className="pt-2">
              <button
                id="btn-step1-continue"
                type="submit"
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white font-bold text-sm sm:text-base rounded-xl transition duration-150 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Optional Switch to Login */}
            {onSwitchToLogin && (
              <div className="text-center pt-3 border-t border-slate-800">
                <p className="text-xs text-slate-400">
                  Already have a SmartStock account?{' '}
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline cursor-pointer"
                  >
                    Sign in with Owner PIN
                  </button>
                </p>
              </div>
            )}
          </form>
        )}

        {/* ================================================================= */}
        {/* STEP 2: LOCATION & RECOVERY (District/City Selection + Recovery Phone) */}
        {/* ================================================================= */}
        {currentStep === 2 && (
          <form onSubmit={handleStep2Continue} className="space-y-4 animate-in fade-in">
            {/* Header Content */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/90 block">
                STEP 2 OF 4: LOCATION & RECOVERY
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Where is your business located?
              </h2>
              <p className="text-sm text-slate-400">
                Select your primary trading hub and enter a secondary backup recovery contact.
              </p>
            </div>

            {/* District Selector */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                District / Trading Hub <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <select
                  id="select-district-location"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full bg-[#111c38] border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:bg-[#152244] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 outline-none transition cursor-pointer appearance-none"
                >
                  {RWANDA_DISTRICTS.map((dist) => (
                    <option key={dist.id} value={dist.label} className="bg-[#0b1329] text-white">
                      {dist.label} ({dist.tag})
                    </option>
                  ))}
                </select>
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Quick District Hub Badges */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">Popular Commercial Areas:</span>
              <div className="flex flex-wrap gap-1.5">
                {RWANDA_DISTRICTS.slice(0, 5).map((d) => (
                  <button
                    type="button"
                    key={d.id}
                    onClick={() => setSelectedDistrict(d.label)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition border cursor-pointer ${
                      selectedDistrict === d.label
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold shadow-xs shadow-emerald-500/20'
                        : 'bg-[#111c38]/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {d.label.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Specific Physical Address */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Storefront / Street Address <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  id="input-business-address"
                  type="text"
                  placeholder="e.g. KN 4 Ave, Quartier Commercial, Shop #12"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  className="w-full bg-[#111c38] border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 focus:bg-[#152244] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 outline-none transition"
                />
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Recovery Phone Number */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Recovery Phone Number <span className="text-slate-500 font-normal">(Backup Contact)</span>
              </label>
              <div className="relative">
                <input
                  id="input-recovery-phone"
                  type="tel"
                  placeholder="+250 78... (Backup Phone / WhatsApp)"
                  value={recoveryPhoneNumber}
                  onChange={(e) => setRecoveryPhoneNumber(e.target.value)}
                  className="w-full bg-[#111c38] border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-slate-400 font-mono focus:bg-[#152244] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 outline-none transition"
                />
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Used to restore account access or receive backup SMS alerts if your primary phone is unavailable.
              </p>
            </div>

            {/* Number of Workers → Subscription Plan Selection (Required) */}
            <div className="pt-1">
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Number of Workers <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {WORKER_COUNT_OPTIONS.map((opt) => {
                  const isActive = workerCount === opt.value;
                  return (
                    <button
                      key={opt.value}
                      id={`opt-workers-${opt.value}`}
                      type="button"
                      onClick={() => setWorkerCount(opt.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition cursor-pointer text-left ${
                        isActive
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold shadow-xs shadow-emerald-500/20'
                          : 'bg-[#111c38]/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                      }`}
                    >
                      <Users className="w-4 h-4 shrink-0" />
                      <span>{opt.label}</span>
                      {isActive && <Check className="w-4 h-4 ml-auto" />}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Plan auto-selected: <strong className="text-emerald-300">{selectedPlan.label}</strong> — {formatRwf(selectedPlan.setupFee)} setup fee, {formatRwf(selectedPlan.monthlyFee)}/month after 1 FREE month.
              </p>
            </div>

            {/* Actions: Back and Continue */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-3.5 bg-[#111c38] hover:bg-slate-800 text-slate-300 font-semibold text-sm rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                id="btn-step2-continue"
                type="submit"
                className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white font-bold text-sm sm:text-base rounded-xl transition duration-150 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ================================================================= */}
        {/* STEP 3: SETUP PAYMENT & PROMO (30,000 RWF + Free 1st Month) */}
        {/* ================================================================= */}
        {currentStep === 3 && (
          <form onSubmit={handleStep3PayAndContinue} className="space-y-4 animate-in fade-in">
            {/* Header Content */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/90 block">
                STEP 3 OF 4: SUBSCRIPTION & PROMO ACTIVATION
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Activate your SmartStock Workspace
              </h2>
              <p className="text-sm text-slate-400">
                Transparent setup with first month subscription 100% free.
              </p>
            </div>

            {/* PLAN COMPARISON CARDS (auto-highlighted by worker count) */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Your selected plan (auto-matched to your worker count):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* SINGLE WORKER CARD */}
                <div
                  id="plan-card-single"
                  className={`p-3.5 rounded-xl border transition ${
                    selectedPlan.planType === 'SINGLE_WORKER'
                      ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/50'
                      : 'bg-[#111c38]/60 border-slate-700/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-white text-sm flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-400" /> Single Worker
                    </span>
                    {selectedPlan.planType === 'SINGLE_WORKER' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase">Selected</span>
                    )}
                  </div>
                  <div className="space-y-0.5 text-[11px] text-slate-300">
                    <p><strong className="text-white">15,000 RWF</strong> setup</p>
                    <p>First month <strong className="text-emerald-400">FREE</strong></p>
                    <p><strong className="text-white">4,000 RWF</strong>/month after trial</p>
                    <p className="text-slate-500">Maximum: 1 worker</p>
                  </div>
                </div>

                {/* MULTIPLE WORKERS CARD */}
                <div
                  id="plan-card-multiple"
                  className={`p-3.5 rounded-xl border transition ${
                    selectedPlan.planType === 'MULTIPLE_WORKERS'
                      ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/50'
                      : 'bg-[#111c38]/60 border-slate-700/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-white text-sm flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-400" /> Multiple Workers
                    </span>
                    {selectedPlan.planType === 'MULTIPLE_WORKERS' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase">Selected</span>
                    )}
                  </div>
                  <div className="space-y-0.5 text-[11px] text-slate-300">
                    <p><strong className="text-white">30,000 RWF</strong> setup</p>
                    <p>First month <strong className="text-emerald-400">FREE</strong></p>
                    <p><strong className="text-white">8,000 RWF</strong>/month after trial</p>
                    <p className="text-slate-500">More than 1 worker</p>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Can't switch to a cheaper plan manually — plan is locked to your worker count.
              </p>
            </div>

            {/* PRICING BREAKDOWN CARD */}
            <div className="p-4 bg-[#111c38]/80 border border-slate-700/80 rounded-2xl space-y-3">
              {/* Dynamic MTN MoMo Gateway Status Badge */}
              <div className="p-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-slate-200">MTN MoMo Gateway (Mobile Money RWF)</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                  mtnMomoConfig.mode === 'live'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {mtnMomoConfig.mode === 'live' ? 'Live Mode' : 'Sandbox Mode'}
                </span>
              </div>

              {/* Promo Tag: "Ukwezi kwa 1 ni UBUNTU!" */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2.5 rounded-xl flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-xs text-emerald-300 leading-tight">
                  <strong className="text-emerald-300 font-bold block">
                    Promo: Ukwezi kwa 1 ni UBUNTU!
                  </strong>
                  <span>First month subscription is 0 RWF. Subsequent monthly plan is only {formatRwf(selectedPlan.monthlyFee)}.</span>
                </div>
              </div>

              {/* Line 1: One-time setup fee */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">One-Time System Setup & Hardware Link ({selectedPlan.label}):</span>
                <span className="font-mono font-bold text-white text-sm">{formatRwf(selectedPlan.setupFee)}</span>
              </div>

              {/* Line 2: 1st month promo */}
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-300">1st Month Cloud POS & EBM Subscription:</span>
                  <span className="line-through text-slate-500 font-mono text-[11px]">{formatRwf(selectedPlan.monthlyFee)}</span>
                </div>
                <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[11px]">
                  0 RWF (FREE)
                </span>
              </div>

              <div className="h-px bg-slate-700/70" />

              {/* Total initial payable */}
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-white font-bold text-sm block">Total Initial Setup:</span>
                  <span className="text-[11px] text-slate-400">Includes training & unlimited offline POS</span>
                </div>
                <span className="font-mono font-extrabold text-xl text-emerald-400">
                  {formatRwf(selectedPlan.setupFee)}
                </span>
              </div>
            </div>

            {/* Payment Channel Selector */}
            <div className="pt-1">
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Choose Payment Channel (Hitamo Uburyo bwo Kwishyura):
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {/* MTN MoMo */}
                <button
                  type="button"
                  id="btn-pay-mtn-wizard"
                  onClick={() => setPaymentMethod('MTN_MOMO')}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    paymentMethod === 'MTN_MOMO'
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold ring-1 ring-amber-400'
                      : 'bg-[#111c38] border-slate-700/70 text-slate-300 hover:bg-[#152244]'
                  }`}
                >
                  <span className="text-xs font-bold">MTN MoMo</span>
                  <span className="text-[10px] text-amber-300/80 font-mono">*182# Push</span>
                </button>

                {/* Airtel Money */}
                <button
                  type="button"
                  id="btn-pay-airtel-wizard"
                  onClick={() => setPaymentMethod('AIRTEL_MONEY')}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    paymentMethod === 'AIRTEL_MONEY'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold ring-1 ring-rose-500'
                      : 'bg-[#111c38] border-slate-700/70 text-slate-300 hover:bg-[#152244]'
                  }`}
                >
                  <span className="text-xs font-bold">Airtel Money</span>
                  <span className="text-[10px] text-rose-300/80 font-mono">*500# Push</span>
                </button>

                {/* Card */}
                <button
                  type="button"
                  id="btn-pay-card-wizard"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    paymentMethod === 'CARD'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold ring-1 ring-emerald-500'
                      : 'bg-[#111c38] border-slate-700/70 text-slate-300 hover:bg-[#152244]'
                  }`}
                >
                  <span className="text-xs font-bold">Visa / Card</span>
                  <span className="text-[10px] text-emerald-300/80 font-mono">Instant Card</span>
                </button>
              </div>
            </div>

            {/* Payment Phone Number Input */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Payment Prompt Phone Number ({paymentMethod === 'MTN_MOMO' ? 'MTN' : paymentMethod === 'AIRTEL_MONEY' ? 'Airtel' : 'Billing Contact'}):
              </label>
              <div className="relative">
                <input
                  id="input-payment-phone"
                  type="tel"
                  required
                  placeholder="+250 78..."
                  value={paymentPhone}
                  onChange={(e) => setPaymentPhone(e.target.value)}
                  className="w-full bg-[#111c38] border border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white font-mono focus:bg-[#152244] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 outline-none transition"
                />
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                You will receive a USSD flash prompt to confirm 30,000 RWF using your mobile money PIN.
              </p>
            </div>

            {/* Actions: Back and Pay & Continue */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-3.5 bg-[#111c38] hover:bg-slate-800 text-slate-300 font-semibold text-sm rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                id="btn-step3-pay-continue"
                type="submit"
                disabled={isProcessingPayment}
                className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white font-bold text-sm sm:text-base rounded-xl transition duration-150 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isProcessingPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Connecting MTN MoMo...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Pay {formatRwf(selectedPlan.setupFee)} via MTN MoMo</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ================================================================= */}
        {/* STEP 4: OTP VERIFICATION (6-Digit SMS & Email Verification Code) */}
        {/* ================================================================= */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-in fade-in">
            {/* Header Content */}
            <div className="text-center space-y-1.5 pb-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-md shadow-emerald-500/10">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/90 block">
                STEP 4 OF 4: OTP VERIFICATION
              </span>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Verify your phone & email
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Enter the 6-digit verification code sent to <strong className="text-slate-200">{maskedPhone}</strong> and <strong className="text-slate-200">{emailAddress}</strong>.
              </p>
            </div>

            {/* OTP Status Messages */}
            {otpResentAlert && (
              <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 text-center font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>A new 6-digit verification code has been dispatched via SMS and Email!</span>
              </div>
            )}

            {otpError && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs text-rose-300 text-center font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            {/* 6-Digit Verification Code Inputs */}
            <div className="py-2">
              <div className="flex justify-center items-center gap-2 sm:gap-3">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpInputRefs.current[index] = el; }}
                    id={`wizard-otp-digit-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-extrabold rounded-xl border-2 transition outline-none ${
                      digit
                        ? 'border-emerald-500 bg-[#111c38] text-emerald-400 shadow-md shadow-emerald-500/20 ring-1 ring-emerald-500/50'
                        : 'border-slate-700/80 bg-[#111c38] text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:bg-[#152244]'
                    }`}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              {/* Demo Helper Pill */}
              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={handleUseDemoOtp}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline inline-flex items-center gap-1.5 cursor-pointer bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30 transition hover:bg-emerald-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Use Demo OTP: 202609</span>
                </button>
              </div>
            </div>

            {/* Primary Action Button: Large full-width emerald "Verify & Open Dashboard" */}
            <div className="pt-2">
              <button
                id="btn-verify-open-dashboard"
                type="button"
                disabled={isVerifyingOtp}
                onClick={handleVerifyOtpAndOpenDashboard}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-white font-bold text-sm sm:text-base rounded-xl transition duration-150 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isVerifyingOtp ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Code & Provisioning Workspace...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify & Open Dashboard</span>
                  </>
                )}
              </button>
            </div>

            {/* Resend Code & Back Navigation */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="text-slate-400 hover:text-white hover:underline cursor-pointer"
              >
                &larr; Back to Payment Details
              </button>

              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {countdown > 0 ? (
                  <span className="font-mono text-slate-400">
                    Resend Code in: <strong className="text-emerald-400">{countdown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Resend Code (Ongera Wohereze)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MTN MoMo Payment Gateway Modal (Mobile Money RWF) */}
      <MtnMomoPaymentModal
        isOpen={isMtnMomoModalOpen}
        onClose={() => setIsMtnMomoModalOpen(false)}
        amountRwf={selectedPlan.setupFee}
        customerName={`${firstName} ${lastName}`.trim() || 'SmartStock Merchant'}
        customerEmail={emailAddress.trim() || 'merchant@smartstock.rw'}
        customerPhone={paymentPhone.trim() || phoneNumber.trim() || '+250 788 123 456'}
        shopName={businessName.trim() || 'SmartStock Rwanda'}
        workerCount={workerCount}
        paymentType="SETUP_FEE"
        onPaymentSuccess={handleMtnMomoSuccess}
        onNavigateToOwner={() => {
          setIsMtnMomoModalOpen(false);
          setCurrentStep(5);
        }}
        onNavigateToPOS={() => {
          setIsMtnMomoModalOpen(false);
          onNavigateToPOS();
        }}
      />
    </div>
  );
};

export default MultiStepOnboardingWizard;
