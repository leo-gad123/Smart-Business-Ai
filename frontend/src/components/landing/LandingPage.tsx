import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  MessageSquare, 
  Receipt, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  KeyRound, 
  X, 
  PhoneCall, 
  MapPin, 
  Calculator, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Send,
  Building2,
  Scale,
  TrendingUp,
  BarChart3,
  EyeOff,
  Globe,
  ChevronDown,
  Bell,
  Mail,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { OnboardingRegistration } from '../../types';
import { db } from '../../services/db';
import { sendLoginOTP, verifyLoginOTP } from '../../services/otpApi';
import { Language, TRANSLATIONS } from './translations';
import { RegisterShopFlow } from './RegisterShopFlow';

interface LandingPageProps {
  onEnterApp: (role: 'owner' | 'employee' | 'superadmin', tab?: 'pos' | 'inventory' | 'reconciliation' | 'fraud_dashboard' | 'architecture' | 'owner_dashboard' | 'superadmin_dashboard') => void;
  onRegisterShop: (data: Omit<OnboardingRegistration, 'id' | 'createdAt'>) => OnboardingRegistration;
}

interface HeroSlide {
  id: number;
  title: string;
  tag: string;
  badge: string;
  description: string;
  imageUrl: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    title: "Kugurisha Byihuse kuri POS",
    tag: "🛒 Supermarket & Retail",
    badge: "18% RRA VAT EBM",
    description: "Scan barcodes, akira MTN MoMo mu masegonda, kandi uhe umukiriya fagitire yemewe n'amategeko.",
    imageUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1920&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "Igenzura ry'Imiti & Stock POS",
    tag: "💊 Pharmacie & Ubuzima",
    badge: "SMS Alert ku Bakozi",
    description: "Genzura amatariki y'imiti (expiry dates), ibiciro bihinduka, n'ububiko bwo muri pharmacie muri ako kanya.",
    imageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?q=80&w=1920&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "Ibicuruzwa By'Imodoka & Ibyuma",
    tag: "🔧 Pièces de Rechange",
    badge: "Real-Time Stock Alerts",
    description: "Kora inventory ya pièces de rechange zitabarika, barcode scanning, no kubika inyandiko z'igurisha.",
    imageUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?q=80&w=1920&auto=format&fit=crop"
  },
  {
    id: 4,
    title: "Ibicuruzwa by'Ibyobwa & Resto",
    tag: "🍺 Utubari & Stock y'Ibyobwa",
    badge: "Blind Shift Audit",
    description: "Kora reconciliation y'amacupa, ibinyobwa bisohoka, n'amafaranga yishyuwe kuri MoMo mu kabari.",
    imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1920&auto=format&fit=crop"
  }
];

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onRegisterShop }) => {
  // Trilingual Language State (rw = Kinyarwanda default, en = English, fr = Français)
  const [language, setLanguage] = useState<Language>('rw');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const t = TRANSLATIONS[language];

  // Carousel State (3-second slide transition)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Modal states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  
  // Strict Single Login (Email/Phone + Password + Role) + Email OTP Authentication State
  const [authStep, setAuthStep] = useState<'credentials' | 'otp'>('credentials');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState<'' | 'owner' | 'cashier' | 'employee'>('');
  const [loginError, setLoginError] = useState('');

  // Email OTP Verification State
  const [pendingRole, setPendingRole] = useState<'owner' | 'employee' | 'cashier' | 'superadmin'>('owner');
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [otpResent, setOtpResent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpPreviewUrl, setOtpPreviewUrl] = useState<string | null>(null);

  // Daily Leakage Calculator State
  const [dailyLeakage, setDailyLeakage] = useState<number>(500);

  // Lead capture form state ("Wifuza Kutuvugisha?")
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('+250 788 ');
  const [contactShopName, setContactShopName] = useState('');
  const [contactLocation, setContactLocation] = useState('Nyarugenge, Kigali');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  // Auto-play carousel with 3-second transition
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  // OTP Countdown Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (authStep === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [authStep, otpTimer]);

  // Compounded leakage calculations
  const monthlyLeakage = dailyLeakage * 30;
  const annualLeakage = dailyLeakage * 365;

  // Validate the entered credentials, then send an OTP to the registered email on file.
  // role is the SELECTED login role (Owner / Cashier / Employee); the backend verifies it.
  const sendOtpToRegisteredEmail = async (role: 'owner' | 'employee' | 'cashier', email: string, password: string) => {
    const dbRole = role === 'cashier' ? 'employee' : role;
    const roleLabel = role === 'cashier' ? 'staff / cashier' : role === 'employee' ? 'staff' : 'owner';
    const registered = db.getUsers().find(u =>
      u.role === dbRole &&
      (u.email || '').toLowerCase() === email.trim().toLowerCase()
    );
    if (!registered || !registered.email) {
      setLoginError(`No registered ${roleLabel} account matches "${email.trim()}". Please use the account's registered email or contact SmartStock support.`);
      return;
    }
    if (registered.systemPassword && registered.systemPassword !== password.trim()) {
      setLoginError('Ijambobanga (Password) si ryo kuri konti yanditswe. Ongera ugerageze.');
      return;
    }

    setOtpLoading(true);
    setLoginError('');
    try {
      const result = await sendLoginOTP({ email: registered.email, role, userName: registered.name });
      if (result.ok) {
        setPendingRole(role);
        setPendingEmail(registered.email);
        setOtpInput('');
        setOtpTimer(60);
        setOtpPreviewUrl(result.previewUrl || null);
        setAuthStep('otp');
      } else {
        setLoginError(result.message || 'Failed to send OTP email. Please try again.');
      }
    } catch (err) {
      setLoginError((err as Error).message);
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend a fresh OTP email to the account's registered email
  const resendOTP = async () => {
    if (!pendingEmail) return;
    setOtpLoading(true);
    setLoginError('');
    try {
      const result = await sendLoginOTP({ email: pendingEmail, role: pendingRole });
      if (result.ok) {
        setOtpInput('');
        setOtpTimer(60);
        setOtpResent(true);
        setOtpPreviewUrl(result.previewUrl || null);
        setTimeout(() => setOtpResent(false), 4000);
      } else {
        setLoginError(result.message || 'Failed to resend OTP. Please try again.');
      }
    } catch (err) {
      setLoginError((err as Error).message);
    } finally {
      setOtpLoading(false);
    }
  };

  // Find a registered account by email OR phone number (owner or staff/cashier)
  const findRegisteredByIdentifier = (identifier: string) => {
    const value = identifier.trim();
    const normalized = value.toLowerCase();
    return db.getUsers().find(u =>
      (u.email || '').toLowerCase() === normalized ||
      (u.phone || '').replace(/[\s-]/g, '').toLowerCase() === value.replace(/[\s-]/g, '').toLowerCase()
    );
  };

  // Step 1: Unified login — validate selected role (Owner/Cashier/Employee) + credentials,
  // then send OTP to the registered email. The backend re-verifies the selected role.
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const identifier = loginIdentifier.trim();
    if (!identifier) {
      setLoginError('Nyamuneka shyiramo Email cyangwa Inomero ya Telefoni yawe.');
      return;
    }
    if (!loginRole) {
      setLoginError('Hitamo Umurimo (Role): Owner, Cashier cyangwa Employee.');
      return;
    }
    if (!loginPassword.trim() || loginPassword.trim().length < 4) {
      setLoginError('Ijambobanga (Password) rigomba kuba rifite nibura inyuguti 4.');
      return;
    }
    const registered = findRegisteredByIdentifier(identifier);
    if (!registered || !registered.email) {
      setLoginError(`No registered business account matches "${identifier}". Please use the account's registered email/phone or contact SmartStock support.`);
      return;
    }
    if (registered.role === 'superadmin') {
      setLoginError('Super Admin access uses the dedicated /superadmin sign-in. Please navigate there directly.');
      return;
    }
    const selectedDbRole = loginRole === 'cashier' ? 'employee' : loginRole;
    if (registered.role !== selectedDbRole) {
      setLoginError(`The selected role (${loginRole}) does not match the assigned role for "${identifier}".`);
      return;
    }
    sendOtpToRegisteredEmail(loginRole, registered.email, loginPassword);
  };

  // Step 1: Super Admin — validate credentials, then send OTP to registered email
  // Step 2: Verify the OTP via the server and grant access
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanInput = otpInput.trim();
    if (!cleanInput || cleanInput.length !== 6) {
      setLoginError('Shyiramo imibare 6 y\'ikode ya OTP yoherejwe kuri email yawe.');
      return;
    }

    setOtpLoading(true);
    try {
      const result = await verifyLoginOTP({ email: pendingEmail, role: pendingRole, code: cleanInput });
      if (result.ok) {
        setIsAuthModalOpen(false);
        setAuthStep('credentials');
        setOtpInput('');
        setLoginError('');
        setOtpPreviewUrl(null);
        // Role is determined by the backend — never trust the client for routing.
        const verifiedRole = result.role || pendingRole;
        if (verifiedRole === 'owner') {
          onEnterApp('owner', 'owner_dashboard');
        } else if (verifiedRole === 'superadmin') {
          onEnterApp('superadmin', 'superadmin_dashboard');
        } else {
          onEnterApp('employee', 'pos');
        }
      } else {
        setLoginError(result.message || 'Kodi ya OTP yanditse siyo. Ongera ugerageze.');
      }
    } catch (err) {
      setLoginError((err as Error).message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactShopName.trim() || !contactPhone.trim()) {
      alert('Nyamuneka uzuza imyirondoro yose isabwa.');
      return;
    }
    setContactLoading(true);
    setTimeout(() => {
      setContactLoading(false);
      setContactSubmitted(true);
    }, 600);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const currentSlide = HERO_SLIDES[currentSlideIndex];

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">
      {/* 1. CLEAN NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo: Green Shield "SmartStock RWANDA" */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/20">
              <ShieldCheck className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900">SmartStock</span>
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                RWANDA
              </span>
            </div>
          </div>

          {/* Top-Right Action Buttons & Trilingual Language Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sleek Trilingual Language Switcher */}
            <div className="relative">
              <button
                id="btn-language-selector"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer"
                aria-label="Select Language"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-sm leading-none">{t.flag}</span>
                <span className="hidden sm:inline text-xs font-mono font-bold uppercase text-slate-700">{language}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsLangDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden">
                    <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      Ururimi / Language
                    </div>
                    {(['rw', 'en', 'fr'] as Language[]).map((langKey) => {
                      const item = TRANSLATIONS[langKey];
                      const isSelected = language === langKey;
                      return (
                        <button
                          key={langKey}
                          onClick={() => {
                            setLanguage(langKey);
                            setIsLangDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition cursor-pointer ${
                            isSelected 
                              ? 'bg-emerald-50 text-emerald-800 font-bold' 
                              : 'text-slate-700 hover:bg-slate-50 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base leading-none">{item.flag}</span>
                            <span>{item.label}</span>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <button
              id="btn-nav-login"
              onClick={() => {
                setAuthTab('login');
                setAuthStep('credentials');
                setLoginError('');
                setIsAuthModalOpen(true);
              }}
              className="px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{t.nav.login}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. FULL-SCREEN HERO BACKGROUND CAROUSEL OVERLAY */}
      <section 
        className="relative w-full min-h-[620px] sm:min-h-[680px] lg:min-h-[740px] flex items-end overflow-hidden bg-slate-950"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {/* Full-Width Background Images Carousel with 3-Second Crossfade */}
        {HERO_SLIDES.map((slide, index) => {
          const isActive = currentSlideIndex === index;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none'
              }`}
            >
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className={`w-full h-full object-cover object-center transition-transform duration-[4000ms] ease-out ${
                  isActive ? 'scale-105' : 'scale-100'
                }`}
                referrerPolicy="no-referrer"
              />
            </div>
          );
        })}

        {/* Soft dark gradient overlay ensuring optimal contrast for headline text */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-slate-950/80 via-slate-950/30 to-transparent" />

        {/* Overlay Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pb-16 flex flex-col lg:flex-row lg:items-end justify-between gap-8 lg:gap-12">
          
          {/* Bottom-Left Overlay Text & Action Content */}
          <div className="max-w-2xl space-y-5 text-left">
            {/* Small Badge Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 text-xs font-semibold text-emerald-300 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{t.hero.badge}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
              {t.hero.headline}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-xl font-normal">
              {t.hero.subtitle}
            </p>

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                id="btn-hero-register-owner"
                onClick={() => {
                  setAuthTab('register');
                  setIsAuthModalOpen(true);
                }}
                className="px-7 py-4 text-sm sm:text-base font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition flex items-center gap-2.5 shadow-xl shadow-emerald-500/30 group cursor-pointer"
              >
                <span>{t.hero.primaryCta}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </button>
            </div>
          </div>

          {/* Minimalist Carousel Indicators (Pinned to bottom-right corner) */}
          <div className="lg:self-end flex items-center gap-3 bg-slate-950/40 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/10 shadow-lg">
            {/* Progress Dots */}
            <div className="flex items-center gap-1.5">
              {HERO_SLIDES.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlideIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    currentSlideIndex === index ? 'w-6 bg-emerald-400' : 'w-2 bg-white/40 hover:bg-white/75'
                  }`}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>

            <div className="w-px h-3.5 bg-white/20 mx-0.5" />

            {/* Light Slide Navigation Arrows */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentSlideIndex((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))}
                className="w-6 h-6 rounded-full hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition cursor-pointer"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length)}
                className="w-6 h-6 rounded-full hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition cursor-pointer"
                aria-label="Next slide"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 3. THREE KEY PROBLEM SOLVERS (Clean Light Theme with #F8FAFC, Dark Slate #0F172A & Emerald #10B981) */}
      <section id="ibibazo-dukemura" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-3 mb-14">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.problems.eyebrow}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              {t.problems.title}
            </h2>
            <p className="text-sm sm:text-base text-[#334155] max-w-2xl mx-auto leading-relaxed">
              {t.problems.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Bell -> Real-Time Stock & Sales Notifications */}
            <div className="p-7 sm:p-8 bg-white border border-slate-200/90 hover:border-emerald-500 rounded-3xl space-y-4 transition shadow-xs hover:shadow-md flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-105 group-hover:bg-emerald-100/70 transition-all shadow-xs">
                  <Bell className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] tracking-tight">
                  {t.problems.card1.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
                  {t.problems.card1.desc}
                </p>
              </div>
              <div className="pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono font-medium">{t.problems.card1.tag}</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  {t.problems.card1.footer} <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </span>
              </div>
            </div>

            {/* Card 2: Bell / SMS -> SMS Alert Instant */}
            <div className="p-7 sm:p-8 bg-white border border-slate-200/90 hover:border-emerald-500 rounded-3xl space-y-4 transition shadow-xs hover:shadow-md flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-105 group-hover:bg-emerald-100/70 transition-all shadow-xs">
                  <Bell className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] tracking-tight">
                  {t.problems.card2.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
                  {t.problems.card2.desc}
                </p>
              </div>
              <div className="pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono font-medium">{t.problems.card2.tag}</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  {t.problems.card2.footer} <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </span>
              </div>
            </div>

            {/* Card 3: Receipt -> Fagitire za RRA VAT EBM */}
            <div className="p-7 sm:p-8 bg-white border border-slate-200/90 hover:border-emerald-500 rounded-3xl space-y-4 transition shadow-xs hover:shadow-md flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-105 group-hover:bg-emerald-100/70 transition-all shadow-xs">
                  <Receipt className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] tracking-tight">
                  {t.problems.card3.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
                  {t.problems.card3.desc}
                </p>
              </div>
              <div className="pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono font-medium">{t.problems.card3.tag}</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  {t.problems.card3.footer} <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRICING & ROI SECTION (Clean Light Cards) */}
      <section id="igiciro" className="py-16 bg-slate-50 border-y border-slate-200 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100/70 border border-emerald-200 text-emerald-900 rounded-full text-xs font-bold">
              <span>{t.pricing.eyebrow}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
              {t.pricing.title}
            </h2>
            <p className="text-sm text-[#334155] max-w-lg mx-auto">
              {t.pricing.subtitle}
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Step 1: One-Time In-Person Setup Fee */}
            <div className="p-7 sm:p-8 bg-white border border-slate-200 rounded-3xl space-y-5 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t.pricing.setupTitle}</span>
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded-md">{t.pricing.setupBadge}</span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold font-mono text-[#0F172A]">{t.pricing.setupPrice}</span>
                  <span className="text-sm font-bold text-slate-500 font-sans">{t.pricing.setupPriceSub}</span>
                </div>

                <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
                  {t.pricing.setupDesc}
                </p>

                <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{t.pricing.setupF1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{t.pricing.setupF2}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{t.pricing.setupF3}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setAuthTab('register');
                  setIsAuthModalOpen(true);
                }}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{t.pricing.setupCta}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Step 2: Monthly Software Plan */}
            <div className="p-7 sm:p-8 bg-white border-2 border-emerald-500 rounded-3xl space-y-5 flex flex-col justify-between relative shadow-lg shadow-emerald-600/10">
              <div className="absolute top-0 right-0 bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider px-3.5 py-1 rounded-bl-2xl">
                {t.pricing.monthlyPopular}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">{t.pricing.monthlyTitle}</span>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold rounded-md border border-emerald-200">{t.pricing.monthlyBadge}</span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold font-mono text-emerald-700">{t.pricing.monthlyPrice}</span>
                  <span className="text-sm font-bold text-slate-500 font-sans">{t.pricing.monthlyPriceSub}</span>
                </div>

                <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
                  {t.pricing.monthlyDesc}
                </p>

                <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{t.pricing.monthlyF1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{t.pricing.monthlyF2}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{t.pricing.monthlyF3}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setAuthTab('register');
                  setIsAuthModalOpen(true);
                }}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <span>{t.pricing.monthlyCta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Daily Leakage Calculator */}
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-500" />
                <span className="text-base font-bold text-[#0F172A]">{t.pricing.calcHeader}</span>
              </div>
              <span className="text-sm font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                {t.pricing.calcLossPerDay}: {dailyLeakage.toLocaleString()} RWF
              </span>
            </div>

            <input
              type="range"
              min="200"
              max="5000"
              step="100"
              value={dailyLeakage}
              onChange={(e) => setDailyLeakage(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center pt-2">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="text-[#334155] text-xs font-semibold">{t.pricing.calcLoss30d}</div>
                <div className="text-xl font-bold font-mono text-red-600 mt-1">
                  -{monthlyLeakage.toLocaleString()} <span className="text-xs font-sans text-slate-500">RWF</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="text-[#334155] text-xs font-semibold">{t.pricing.calcLoss365d}</div>
                <div className="text-xl font-bold font-mono text-red-600 mt-1">
                  -{annualLeakage.toLocaleString()} <span className="text-xs font-sans text-slate-500">RWF</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div className="text-emerald-800 text-xs font-bold">{t.pricing.calcGainWithSmartStock}</div>
                <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                  +{(annualLeakage - 96000).toLocaleString()} <span className="text-xs font-sans text-emerald-700">RWF / yr</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CONTACT & GUIDANCE SECTION ("Wifuza Kutuvugisha?") */}
      <section id="tuvugishe" className="py-16 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-bold">
            <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.contact.eyebrow}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
            {t.contact.title}
          </h2>
          <p className="text-sm text-[#334155] max-w-lg mx-auto">
            {t.contact.subtitle}
          </p>
        </div>

        {/* Clean White Card Form */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-lg">
          {contactSubmitted ? (
            <div className="text-center py-8 space-y-3 animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">{t.contact.successTitle}, {contactName}!</h3>
              <p className="text-xs sm:text-sm text-[#334155] max-w-md mx-auto">
                {t.contact.successDesc1} <strong className="text-slate-900">"{contactShopName}"</strong> {t.contact.successDesc2}
              </p>
              <p className="text-xs text-emerald-700 font-mono font-bold bg-emerald-50 py-2 px-3 rounded-xl border border-emerald-200 inline-block">
                📲 {t.contact.successCall}
              </p>
              <div>
                <button
                  onClick={() => setContactSubmitted(false)}
                  className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {t.contact.newRequestBtn}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    {t.contact.nameLabel}
                  </label>
                  <input
                    type="text"
                    placeholder={t.contact.namePlaceholder}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    {t.contact.phoneLabel}
                  </label>
                  <input
                    type="text"
                    placeholder="+250 788 123 456"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white outline-none transition"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    {t.contact.shopLabel}
                  </label>
                  <input
                    type="text"
                    placeholder={t.contact.shopPlaceholder}
                    value={contactShopName}
                    onChange={(e) => setContactShopName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    {t.contact.locationLabel}
                  </label>
                  <select
                    value={contactLocation}
                    onChange={(e) => setContactLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white outline-none transition"
                  >
                    <option value="Nyarugenge (Nyamirambo / City Center), Kigali">Nyarugenge, Kigali</option>
                    <option value="Gasabo (Kimironko / Kacyiru / Remera), Kigali">Gasabo, Kigali</option>
                    <option value="Kicukiro (Gikondo / Sonatubes / Kabeza), Kigali">Kicukiro, Kigali</option>
                    <option value="Rubavu (Gisenyi), Western Province">Rubavu (Gisenyi)</option>
                    <option value="Musanze (Ruhengeri), Northern Province">Musanze (Ruhengeri)</option>
                    <option value="Huye (Butare), Southern Province">Huye (Butare)</option>
                    <option value="Rwamagana, Eastern Province">Rwamagana</option>
                    <option value="Rusizi (Cyangugu), Western Province">Rusizi (Cyangugu)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={contactLoading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                {contactLoading ? (
                  <span>{t.contact.submittingBtn}</span>
                ) : (
                  <>
                    <span>{t.contact.submitBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 py-8 px-4 sm:px-6 text-center text-xs text-[#334155] bg-slate-50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-[#0F172A]">SmartStock RWANDA</span>
            <span>&bull; {t.footer.rights}</span>
          </div>
          <div className="flex items-center gap-4 text-[#334155] font-medium">
            <span>Kigali, Rwanda</span>
            <span>&bull;</span>
            <span>MTN MoMo & Airtel Money</span>
            <span>&bull;</span>
            <button onClick={() => scrollToSection('tuvugishe')} className="hover:text-emerald-700 cursor-pointer">
              {t.footer.contactUs}
            </button>
          </div>
        </div>
      </footer>

      {/* AUTHENTICATION & ONBOARDING MODAL */}
      {isAuthModalOpen && (
        <>
          {authTab === 'register' ? (
            <RegisterShopFlow
              onRegisterShop={onRegisterShop}
              onNavigateToPOS={() => {
                setIsAuthModalOpen(false);
                onEnterApp('employee', 'pos');
              }}
              onNavigateToStock={() => {
                setIsAuthModalOpen(false);
                onEnterApp('owner', 'owner_dashboard');
              }}
              onClose={() => {
                setIsAuthModalOpen(false);
              }}
              onSwitchToLogin={() => {
                setAuthTab('login');
              }}
              isModal={true}
            />
          ) : (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
              <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150">
                {/* Modal Header */}
                  <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
                      {authStep === 'otp' ? <Mail className="w-4 h-4 text-white" /> : <Lock className="w-4 h-4 text-white" />}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900">SmartStock RWANDA</h3>
                      <p className="text-xs text-slate-500">
                        {authStep === 'otp' ? "Email OTP Verification" : "Kwinjira no Gufungura Konti"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsAuthModalOpen(false);
                      setAuthStep('credentials');
                      setLoginError('');
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                  {/* STEP 2: EMAIL OTP VERIFICATION SCREEN */}
                  {authStep === 'otp' ? (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div className="text-center space-y-1.5 pb-1">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-700">
                          <Mail className="w-6 h-6" />
                        </div>
                        <h4 className="text-base font-bold text-slate-900">Email OTP Verification</h4>
                        <p className="text-xs text-slate-500">
                          Injiza ikode y'imibare 6 yoherejwe kuri email yawe:
                        </p>
                        <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-800 font-mono">
                          {pendingEmail}
                        </div>
                      </div>

                      {/* Ethereal preview link (development only) */}
                      {otpPreviewUrl && (
                        <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-left space-y-1">
                          <p className="text-[11px] font-bold text-blue-800">Development Mode — Email Preview:</p>
                          <a href={otpPreviewUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline font-mono break-all">
                            {otpPreviewUrl}
                          </a>
                          <p className="text-[10px] text-blue-500">Click to view the OTP email sent via Ethereal (no real SMTP configured).</p>
                        </div>
                      )}

                      {!otpPreviewUrl && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-left space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5" /> Email Sent
                            </span>
                            <span className="text-[10px] text-emerald-600 font-medium">Ubu ako kanya</span>
                          </div>
                          <p className="text-xs text-emerald-950">
                            SmartStock Security: Ikode yawe yo kwinjira yoherejwe kuri email. Injiza kode yo mu email hejuru.
                          </p>
                        </div>
                      )}

                      {loginError && (
                        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs text-center font-medium">
                          {loginError}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-700">Shyiramo Ikode ya OTP (6-Digits)</label>
                        </div>
                        <input
                          id="input-email-otp"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          value={otpInput}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setOtpInput(val);
                            setLoginError('');
                          }}
                          placeholder="••••••"
                          className="w-full text-center tracking-[0.6em] font-mono text-3xl font-extrabold bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-slate-900 focus:border-emerald-600 focus:bg-white outline-none shadow-inner"
                          autoFocus
                          required
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span>Ntiwabonye ikode?</span>
                        {otpTimer > 0 ? (
                          <span className="font-mono font-medium text-slate-500">Ongera wohereze muri ({otpTimer}s)</span>
                        ) : (
                          <button
                            type="button"
                            onClick={resendOTP}
                            disabled={otpLoading}
                            className="text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3 h-3 ${otpLoading ? 'animate-spin' : ''}`} /> {otpLoading ? 'Rohereza...' : 'Ongera wohereze ikode'}
                          </button>
                        )}
                      </div>

                      <div className="space-y-2 pt-2">
                        <button
                          id="btn-verify-otp"
                          type="submit"
                          disabled={otpLoading}
                          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {otpLoading ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Kureka... (Irobeherereje)</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Emeza Ikode & Kwinjira ({pendingRole === 'owner' ? "Owner Dashboard" : pendingRole === 'superadmin' ? "Super Admin Console" : "Cashier POS"})</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setAuthStep('credentials');
                            setLoginError('');
                            setOtpPreviewUrl(null);
                          }}
                          className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Subira inyuma / Hindura Email na Password</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="text-center space-y-1 pb-1">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-700">
                          <KeyRound className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{t.auth.login}</h4>
                        <p className="text-xs text-slate-500">
                          Injiza Email cyangwa Telefoni hamwe na Password yawe, hanyuma ukande "{t.auth.login}" kugira ngo wohererezwe ikode ya OTP.
                        </p>
                      </div>

                      {loginError && (
                        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs text-center font-medium">
                          {loginError}
                        </div>
                      )}

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">{t.auth.emailOrPhone}</label>
                          <input
                            id="login-identifier-input"
                            type="text"
                            autoComplete="username"
                            value={loginIdentifier}
                            onChange={(e) => {
                              setLoginIdentifier(e.target.value);
                              setLoginError('');
                            }}
                            placeholder="email@example.com cyangwa 0788..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white outline-none"
                            required
                            autoFocus
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">{t.auth.password}</label>
                          <input
                            id="login-password-input"
                            type="password"
                            autoComplete="current-password"
                            value={loginPassword}
                            onChange={(e) => {
                              setLoginPassword(e.target.value);
                              setLoginError('');
                            }}
                            placeholder={t.auth.password}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white outline-none"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">{t.auth.selectRole}</label>
                          <select
                            id="login-role-select"
                            value={loginRole}
                            onChange={(e) => {
                              setLoginRole(e.target.value as '' | 'owner' | 'cashier' | 'employee');
                              setLoginError('');
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white outline-none cursor-pointer"
                            required
                          >
                            <option value="" disabled>{t.auth.selectRole}</option>
                            <option value="owner">{t.auth.roleOwner}</option>
                            <option value="cashier">{t.auth.roleCashier}</option>
                            <option value="employee">{t.auth.roleEmployee}</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => alert('Contact SmartStock support at +250 788 100 200 to reset your password.')}
                          className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold hover:underline transition cursor-pointer"
                        >
                          {t.auth.forgotPassword}
                        </button>
                      </div>

                      <div className="space-y-2 pt-1">
                        <button
                          id="btn-login"
                          type="submit"
                          disabled={otpLoading || !loginIdentifier.trim() || !loginPassword.trim() || !loginRole}
                          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {otpLoading ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Rohereza OTP...</span>
                            </>
                          ) : (
                            <>
                              <span>{t.auth.login}</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setAuthTab('register')}
                        className="w-full text-center text-xs text-slate-500 hover:text-emerald-700 font-semibold transition cursor-pointer pt-3 border-t border-slate-100"
                      >
                        {t.auth.registerCta}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
