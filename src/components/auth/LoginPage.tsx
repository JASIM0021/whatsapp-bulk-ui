import { useState, useRef } from 'react';
import { Mail, Lock, ArrowLeft, User, ShieldCheck, KeyRound, Bot } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { apiFetch, API_ENDPOINTS } from '@/config/api';
import { useSEO } from '@/hooks/useSEO';

type Step =
  | 'form'            // login / signup form
  | 'signup-otp'      // email verification after signup
  | 'forgot-email'    // enter email for password reset
  | 'forgot-otp'      // enter reset OTP
  | 'forgot-newpw';   // enter new password

export function LoginPage() {
  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<'login' | 'signup'>(
    location.pathname === '/signup' ? 'signup' : 'login'
  );

  const hasBotDraft = (() => {
    try {
      const raw = localStorage.getItem('botx_bot_draft');
      if (!raw) return false;
      const d = JSON.parse(raw);
      return !!d.completedAt && !!d.businessName;
    } catch { return false; }
  })();

  // After login, redirect back to where the user came from (e.g. /check-chatbot)
  const redirectTo: string = (location.state as { redirect?: string })?.redirect || '/app';

  const getPostAuthDest = () => {
    if (hasBotDraft) return '/setup';
    return redirectTo;
  };

  useSEO({
    title: mode === 'login' ? 'Sign In - NexBotix' : 'Sign Up - NexBotix',
    description: mode === 'login' ? 'Sign in to access your NexBotix dashboard.' : 'Create a new account on NexBotix and get started with free messages today.',
    url: mode === 'login' ? 'https://nexbotix.todayintech.in/login' : 'https://nexbotix.todayintech.in/signup'
  });

  const [step, setStep] = useState<Step>('form');

  // ── Form fields ──────────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // ── Forgot password fields ───────────────────────────────────────────
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // ── OTP boxes (shared for signup + reset) ───────────────────────────
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ── Helpers ──────────────────────────────────────────────────────────
  const resetOtp = () => setOtp(['', '', '', '', '']);

  const startCooldown = () => {
    setResendCooldown(60);
    const iv = setInterval(() => {
      setResendCooldown((p) => { if (p <= 1) { clearInterval(iv); return 0; } return p - 1; });
    }, 1000);
  };

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 4) otpRefs[i + 1].current?.focus();
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs[i - 1].current?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 5);
    if (!pasted) return;
    e.preventDefault();
    const next = ['', '', '', '', ''];
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    otpRefs[Math.min(pasted.length, 4)].current?.focus();
  };

  const switchMode = (m: 'login' | 'signup') => {
    setMode(m);
    setStep('form');
    setError('');
    setSuccessMsg('');
    setAcceptedTerms(false);
    resetOtp();
    window.history.replaceState(null, '', m === 'signup' ? '/signup' : '/login');
  };

  const goBack = () => { setStep('form'); setError(''); setSuccessMsg(''); resetOtp(); };

  // ── Google Login ─────────────────────────────────────────────────────
  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      setError('');
      setIsLoading(true);
      try {
        const res = await apiFetch(API_ENDPOINTS.auth.googleLogin, {
          method: 'POST',
          body: JSON.stringify({ access_token: tokenResponse.access_token }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Google login failed');
        loginWithToken(data.data.token, data.data.user);
        navigate(getPostAuthDest());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Google login failed');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => setError('Google sign-in was cancelled or failed'),
  });

  // ── Login ────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Signup → send OTP ────────────────────────────────────────────────
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Name is required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (!acceptedTerms) { setError('Please accept the Terms & Conditions and Privacy Policy to continue.'); return; }

    setIsLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.auth.sendOtp, {
        method: 'POST',
        body: JSON.stringify({ email, name: name.trim(), password }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to send code');
      setStep('signup-otp');
      startCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Verify signup OTP → create account ──────────────────────────────
  const handleSignupOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 5) { setError('Please enter the complete 5-digit code'); return; }
    setError('');
    setIsLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.auth.verifyOtp, {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Invalid code');
      loginWithToken(data.data.token, data.data.user);
      navigate('/setup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendSignupOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setIsLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.auth.sendOtp, {
        method: 'POST',
        body: JSON.stringify({ email, name: name.trim(), password }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to resend');
      resetOtp();
      otpRefs[0].current?.focus();
      startCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Forgot password — step 1: send OTP ──────────────────────────────
  const handleForgotEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!resetEmail.trim()) { setError('Email is required'); return; }
    setIsLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.auth.forgotPassword, {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to send code');
      setStep('forgot-otp');
      startCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Forgot password — step 2: verify OTP ────────────────────────────
  const handleForgotOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 5) { setError('Please enter the complete 5-digit code'); return; }
    setError('');
    // Just advance to new-password step; actual verification happens with reset-password call
    setStep('forgot-newpw');
    setError('');
  };

  const handleResendResetOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setIsLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.auth.forgotPassword, {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to resend');
      resetOtp();
      otpRefs[0].current?.focus();
      startCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Forgot password — step 3: set new password ───────────────────────
  const handleNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmNewPassword) { setError('Passwords do not match'); return; }
    setIsLoading(true);
    try {
      const res = await apiFetch(API_ENDPOINTS.auth.resetPassword, {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail, code: otp.join(''), newPassword }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to reset password');
      // Success → back to login with message
      setStep('form');
      setMode('login');
      setEmail(resetEmail);
      setPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      resetOtp();
      setSuccessMsg('Password reset successfully! You can now sign in with your new password.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
      // If code was wrong, go back to OTP step
      if (err instanceof Error && err.message.toLowerCase().includes('code')) {
        setStep('forgot-otp');
        resetOtp();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ── Shared OTP boxes (plain JSX, not a component — avoids remount/focus-loss on re-render) ──
  const otpBoxes = (
    <div className="flex gap-3 justify-center" onPaste={handleOtpPaste}>
      {otp.map((digit, i) => (
        <input
          key={i}
          ref={otpRefs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleOtpChange(i, e.target.value)}
          onKeyDown={(e) => handleOtpKeyDown(i, e)}
          className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
        />
      ))}
    </div>
  );

  // ── Left panel ───────────────────────────────────────────────────────
  const LeftPanel = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="hidden lg:flex flex-col justify-between w-1/2 bg-green-600 p-12 text-white">
      <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <img src="/icon-192.png" alt="NexBotix" className="w-10 h-10 rounded-xl object-contain" />
        <span className="text-2xl font-bold">NexBotix</span>
      </Link>
      <div>
        <h2 className="text-4xl font-bold mb-4 leading-tight">{title}</h2>
        <p className="text-green-100 text-lg">{subtitle}</p>
      </div>
      <div className="flex gap-6 text-green-200 text-sm">
        <span>Secure per-user sessions</span>
        <span>•</span>
        <span>50 free messages</span>
        <span>•</span>
        <span>No credit card</span>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════
  // STEP: signup OTP verification
  // ════════════════════════════════════════════════════════════════════
  if (step === 'signup-otp') {
    return (
      <div className="min-h-screen flex">
        <LeftPanel title={`One last step —\nverify your email`} subtitle={`We sent a 5-digit code to ${email}. Enter it to activate your account.`} />
        <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
          <div className="w-full max-w-md">
            <button onClick={goBack} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
              <ArrowLeft size={16} /> Back
            </button>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Check your email</h1>
              <p className="text-gray-500 text-sm mb-8 text-center">
                We sent a 5-digit code to<br /><span className="font-medium text-gray-700">{email}</span>
              </p>
              <form onSubmit={handleSignupOtpSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 text-center">Enter verification code</label>
                  {otpBoxes}
                </div>
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-center">{error}</div>}
                <button type="submit" disabled={isLoading || otp.join('').length < 5}
                  className="w-full py-2.5 px-4 bg-green-600 text-white font-medium rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {isLoading ? 'Verifying...' : 'Verify & Create Account'}
                </button>
              </form>
              <p className="text-xs text-gray-400 text-center mt-6">
                Didn't receive the code?{' '}
                {resendCooldown > 0
                  ? <span className="text-gray-400">Resend in {resendCooldown}s</span>
                  : <button type="button" onClick={handleResendSignupOtp} disabled={isLoading} className="text-green-600 hover:underline font-medium disabled:opacity-50">Resend code</button>
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // STEP: forgot-email
  // ════════════════════════════════════════════════════════════════════
  if (step === 'forgot-email') {
    return (
      <div className="min-h-screen flex">
        <LeftPanel title={`Reset your\npassword`} subtitle="Enter your registered email and we'll send you a 5-digit reset code." />
        <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
          <div className="w-full max-w-md">
            <button onClick={goBack} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
              <ArrowLeft size={16} /> Back to Sign In
            </button>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
                  <KeyRound className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Forgot password?</h1>
              <p className="text-gray-500 text-sm mb-8 text-center">
                Enter the email address associated with your account and we'll send you a reset code.
              </p>
              <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="you@example.com" required autoFocus
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" />
                  </div>
                </div>
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
                <button type="submit" disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-green-600 text-white font-medium rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {isLoading ? 'Sending...' : 'Send Reset Code'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // STEP: forgot-otp
  // ════════════════════════════════════════════════════════════════════
  if (step === 'forgot-otp') {
    return (
      <div className="min-h-screen flex">
        <LeftPanel title={`Check your\nemail`} subtitle={`We sent a reset code to ${resetEmail}.`} />
        <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
          <div className="w-full max-w-md">
            <button onClick={() => { setStep('forgot-email'); setError(''); resetOtp(); }}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
              <ArrowLeft size={16} /> Change email
            </button>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Enter reset code</h1>
              <p className="text-gray-500 text-sm mb-8 text-center">
                We sent a 5-digit code to<br /><span className="font-medium text-gray-700">{resetEmail}</span>
              </p>
              <form onSubmit={handleForgotOtpSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 text-center">Enter reset code</label>
                  {otpBoxes}
                </div>
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-center">{error}</div>}
                <button type="submit" disabled={isLoading || otp.join('').length < 5}
                  className="w-full py-2.5 px-4 bg-green-600 text-white font-medium rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {isLoading ? 'Verifying...' : 'Continue'}
                </button>
              </form>
              <p className="text-xs text-gray-400 text-center mt-6">
                Didn't receive the code?{' '}
                {resendCooldown > 0
                  ? <span className="text-gray-400">Resend in {resendCooldown}s</span>
                  : <button type="button" onClick={handleResendResetOtp} disabled={isLoading} className="text-green-600 hover:underline font-medium disabled:opacity-50">Resend code</button>
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // STEP: forgot-newpw
  // ════════════════════════════════════════════════════════════════════
  if (step === 'forgot-newpw') {
    return (
      <div className="min-h-screen flex">
        <LeftPanel title={`Set your\nnew password`} subtitle="Choose a strong password you haven't used before." />
        <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
          <div className="w-full max-w-md">
            <button onClick={() => { setStep('forgot-otp'); setError(''); resetOtp(); }}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
              <ArrowLeft size={16} /> Back
            </button>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                  <Lock className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">New password</h1>
              <p className="text-gray-500 text-sm mb-8 text-center">
                Must be at least 6 characters.
              </p>
              <form onSubmit={handleNewPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••" required minLength={6} autoFocus
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••" required
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" />
                  </div>
                </div>
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
                <button type="submit" disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-green-600 text-white font-medium rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // STEP: main login / signup form
  // ════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-green-600 p-12 text-white">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src="/icon-192.png" alt="NexBotix" className="w-10 h-10 rounded-xl object-contain" />
          <span className="text-2xl font-bold">NexBotix</span>
        </Link>
        <div>
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Reach thousands of customers<br />with a single click
          </h2>
          <p className="text-green-100 text-lg">
            Send personalised bulk messages, manage templates, and track delivery — all from one dashboard.
          </p>
        </div>
        <div className="flex gap-6 text-green-200 text-sm">
          <span>Secure per-user sessions</span>
          <span>•</span>
          <span>10 ready-made templates</span>
          <span>•</span>
          <span>Live send progress</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to home
          </Link>

          <Link to="/" className="flex lg:hidden items-center gap-2 mb-8 justify-center hover:opacity-80 transition-opacity">
            <img src="/icon-192.png" alt="NexBotix" className="w-10 h-10 rounded-xl object-contain" />
            <span className="text-xl font-bold text-gray-900">NexBotix</span>
          </Link>

          {hasBotDraft && (
            <div className="w-full max-w-md mx-auto mb-4 flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot size={15} className="text-white" />
              </div>
              <p className="text-sm text-green-800 font-medium">
                🤖 Your WhatsApp bot is ready — {mode === 'signup' ? 'sign up' : 'log in'} to activate it!
              </p>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button type="button" onClick={() => switchMode('login')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                Sign In
              </button>
              <button type="button" onClick={() => switchMode('signup')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'signup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                Sign Up
              </button>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              {mode === 'login' ? 'Sign in to your account to continue.' : 'Start with 50 free messages. No credit card required.'}
            </p>

            {/* Success message after password reset */}
            {successMsg && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                {successMsg}
              </div>
            )}

            {/* Google Sign-in */}
            <button
              type="button"
              onClick={() => googleLogin()}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs text-gray-400">
                <span className="px-2 bg-white">or continue with email</span>
              </div>
            </div>

            <form onSubmit={mode === 'login' ? handleLogin : handleSignupSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name" required
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  {mode === 'login' && (
                    <button type="button" onClick={() => { setStep('forgot-email'); setResetEmail(email); setError(''); setSuccessMsg(''); }}
                      className="text-xs text-green-600 hover:underline font-medium">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" required minLength={mode === 'signup' ? 6 : undefined}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" />
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••" required
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" />
                  </div>
                </div>
              )}

              {mode === 'signup' && (
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer" />
                  <span className="text-xs text-gray-600 leading-relaxed">
                    I have read and agree to the{' '}
                    <Link to="/terms" target="_blank" className="text-green-600 hover:underline font-medium">Terms & Conditions</Link>,{' '}
                    <Link to="/privacy" target="_blank" className="text-green-600 hover:underline font-medium">Privacy Policy</Link>, and{' '}
                    <Link to="/refund" target="_blank" className="text-green-600 hover:underline font-medium">Refund Policy</Link>.
                  </span>
                </label>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
              )}

              <button type="submit" disabled={isLoading || (mode === 'signup' && !acceptedTerms)}
                className="w-full py-2.5 px-4 bg-green-600 text-white font-medium rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {isLoading
                  ? (mode === 'login' ? 'Signing in...' : 'Sending code...')
                  : (mode === 'login' ? 'Sign In' : 'Send Verification Code')}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-6">
              {mode === 'login' ? (
                <>Don't have an account?{' '}
                  <button type="button" onClick={() => switchMode('signup')} className="text-green-600 hover:underline font-medium">Sign up free</button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button type="button" onClick={() => switchMode('login')} className="text-green-600 hover:underline font-medium">Sign in</button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
