import { useState, useRef } from 'react';
import { Mail, Lock, ArrowLeft, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { apiFetch, API_ENDPOINTS } from '@/config/api';

type Step = 'form' | 'otp';

export function LoginPage() {
  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<'login' | 'signup'>(
    location.pathname === '/signup' ? 'signup' : 'login'
  );

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // OTP step
  const [step, setStep] = useState<Step>('form');
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ── OTP input handlers ──────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const next = [...otp];
    next[index] = value.slice(-1); // one digit per cell
    setOtp(next);
    if (value && index < 4) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
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

  // ── Submit signup form → send OTP ───────────────────────────────────
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
      setIsLoading(true);
      try {
        await login(email, password);
        navigate('/app');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid credentials');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Signup validations
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
      if (!data.success) throw new Error(data.error || 'Failed to send verification code');
      setStep('otp');
      startResendCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Submit OTP ───────────────────────────────────────────────────────
  const handleOtpSubmit = async (e: React.FormEvent) => {
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
      if (!data.success) throw new Error(data.error || 'Invalid verification code');
      loginWithToken(data.data.token, data.data.user);
      navigate('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Resend OTP ───────────────────────────────────────────────────────
  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
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
      setOtp(['', '', '', '', '']);
      otpRefs[0].current?.focus();
      startResendCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setStep('form');
    setError('');
    setAcceptedTerms(false);
    setOtp(['', '', '', '', '']);
    window.history.replaceState(null, '', newMode === 'signup' ? '/signup' : '/login');
  };

  // ── OTP step UI ──────────────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:flex flex-col justify-between w-1/2 bg-green-600 p-12 text-white">
          <div className="flex items-center gap-3">
            <img src="/icon-192.png" alt="Logo" className="w-10 h-10 rounded-xl object-contain" />
            <span className="text-2xl font-bold">WhatsApp Bulk Sender</span>
          </div>
          <div>
            <h2 className="text-4xl font-bold mb-4 leading-tight">
              One last step —<br />verify your email
            </h2>
            <p className="text-green-100 text-lg">
              We sent a 5-digit code to <strong>{email}</strong>. Enter it to activate your account.
            </p>
          </div>
          <div className="flex gap-6 text-green-200 text-sm">
            <span>Secure per-user sessions</span>
            <span>•</span>
            <span>50 free messages</span>
            <span>•</span>
            <span>No credit card</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
          <div className="w-full max-w-md">
            <button
              onClick={() => { setStep('form'); setError(''); setOtp(['', '', '', '', '']); }}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
              <img src="/icon-192.png" alt="Logo" className="w-10 h-10 rounded-xl object-contain" />
              <span className="text-xl font-bold text-gray-900">WhatsApp Bulk Sender</span>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Check your email</h1>
              <p className="text-gray-500 text-sm mb-8 text-center">
                We sent a 5-digit code to<br />
                <span className="font-medium text-gray-700">{email}</span>
              </p>

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                {/* 5-digit OTP boxes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                    Enter verification code
                  </label>
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
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-center">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || otp.join('').length < 5}
                  className="w-full py-2.5 px-4 bg-green-600 text-white font-medium rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Verifying...' : 'Verify & Create Account'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-400">
                  Didn't receive the code?{' '}
                  {resendCooldown > 0 ? (
                    <span className="text-gray-400">Resend in {resendCooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isLoading}
                      className="text-green-600 hover:underline font-medium disabled:opacity-50"
                    >
                      Resend code
                    </button>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-green-600 p-12 text-white">
        <div className="flex items-center gap-3">
          <img src="/icon-192.png" alt="Logo" className="w-10 h-10 rounded-xl object-contain" />
          <span className="text-2xl font-bold">WhatsApp Bulk Sender</span>
        </div>
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
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>

          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <img src="/icon-192.png" alt="Logo" className="w-10 h-10 rounded-xl object-contain" />
            <span className="text-xl font-bold text-gray-900">WhatsApp Bulk Sender</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  mode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  mode === 'signup' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign Up
              </button>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              {mode === 'login'
                ? 'Sign in to your account to continue.'
                : 'Start with 50 free messages. No credit card required.'}
            </p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={mode === 'signup' ? 6 : undefined}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              )}

              {mode === 'signup' && (
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                  />
                  <span className="text-xs text-gray-600 leading-relaxed">
                    I have read and agree to the{' '}
                    <Link to="/terms" target="_blank" className="text-green-600 hover:underline font-medium">
                      Terms & Conditions
                    </Link>
                    ,{' '}
                    <Link to="/privacy" target="_blank" className="text-green-600 hover:underline font-medium">
                      Privacy Policy
                    </Link>
                    , and{' '}
                    <Link to="/refund" target="_blank" className="text-green-600 hover:underline font-medium">
                      Refund Policy
                    </Link>
                    .
                  </span>
                </label>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || (mode === 'signup' && !acceptedTerms)}
                className="w-full py-2.5 px-4 bg-green-600 text-white font-medium rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading
                  ? (mode === 'login' ? 'Signing in...' : 'Sending code...')
                  : (mode === 'login' ? 'Sign In' : 'Send Verification Code')}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-6">
              {mode === 'login' ? (
                <>Don't have an account?{' '}
                  <button type="button" onClick={() => switchMode('signup')} className="text-green-600 hover:underline font-medium">
                    Sign up free
                  </button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button type="button" onClick={() => switchMode('login')} className="text-green-600 hover:underline font-medium">
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
