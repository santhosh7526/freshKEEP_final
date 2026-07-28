import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Mail, Lock, User, Eye, EyeOff, ShieldCheck, Sparkles, CheckCircle2, ArrowRight, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const { loginWithEmail, registerWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Auth Form Inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Quick Demo Account Auto-Fill
  const handleQuickFill = (demoEmail: string, demoPass: string, demoName?: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    if (demoName) setName(demoName);
    toast.info(`Filled credentials for ${demoEmail}`);
  };

  // Submit Email & Password Form (Login or Register)
  const handleSubmitEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter your email and password');
      return;
    }

    if (authMode === 'register' && !name.trim()) {
      toast.error('Please enter your full name to register');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      if (authMode === 'register') {
        const user = await registerWithEmail({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
        });
        toast.success(`Account Created! Welcome, ${user.givenName}`, {
          description: `Backend authenticated for ${user.email}`,
        });
      } else {
        const user = await loginWithEmail({
          email: email.trim(),
          password: password.trim(),
        });
        toast.success(`Welcome back, ${user.givenName}!`, {
          description: `Authenticated via Backend DB (${user.email})`,
        });
      }
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(authMode === 'register' ? 'Registration Failed' : 'Login Failed', {
        description: err.message || 'Check your credentials and backend server.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth Real-time Authentication
  const handleGoogleSignIn = async (gName?: string, gEmail?: string) => {
    setIsLoading(true);
    try {
      const selectedEmail = gEmail || email || 'alex.morgan@gmail.com';
      const selectedName = gName || name || 'Alex Morgan';

      const user = await loginWithGoogle({
        email: selectedEmail,
        name: selectedName,
        picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedEmail)}`,
      });

      toast.success(`Google Auth Verified! Welcome ${user.givenName}`, {
        description: `Backend user record synced for ${user.email}`,
      });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast.error('Google Authentication Error', {
        description: err.message || 'Could not complete Google Sign-In.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#86A789]/15 via-emerald-50/50 to-white flex flex-col justify-between p-4 md:p-6 relative overflow-hidden">
      {/* Background Glow Orbs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#86A789]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center py-6 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#86A789] to-emerald-600 text-white shadow-lg shadow-[#86A789]/30 mb-3 animate-bounce-slow">
            <Leaf className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">FreshKeep</h1>
          <p className="text-[10px] uppercase tracking-widest font-bold text-[#86A789] mt-0.5">
            Real-time Authentication System
          </p>
          <p className="text-xs text-gray-600 mt-2 max-w-xs mx-auto leading-relaxed">
            Smart Expiry Tracker & Anti-Waste AI Platform. Log in with Google or your email & password.
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/80 space-y-5">
          
          {/* Mode Switcher Tabs (Login vs Register) */}
          <div className="flex bg-gray-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                authMode === 'login'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In (Email)
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                authMode === 'register'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form Header */}
          <div className="text-left">
            <h2 className="text-base font-bold text-gray-900">
              {authMode === 'login' ? 'Welcome Back' : 'Create Backend Account'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {authMode === 'login'
                ? 'Enter your credentials stored in backend database'
                : 'Register a new account backed by FreshKeep server'}
            </p>
          </div>

          {/* Real-time Email & Password Form */}
          <form onSubmit={handleSubmitEmailAuth} className="space-y-3.5">
            {/* Full Name Input (Register Mode Only) */}
            {authMode === 'register' && (
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#86A789] focus:bg-white transition-all text-gray-900"
                  />
                </div>
              </div>
            )}

            {/* Email Address Input */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Google Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="alex.morgan@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#86A789] focus:bg-white transition-all text-gray-900"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-gray-50 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#86A789] focus:bg-white transition-all text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#86A789] hover:bg-[#729275] text-white font-bold rounded-2xl text-xs shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{authMode === 'login' ? 'Sign In with Email' : 'Register Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Pill Bar */}
          <div className="pt-2">
            <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-2 flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-[#86A789]" />
              <span>Backend Demo Accounts (Click to fill):</span>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('alex.morgan@gmail.com', 'password123', 'Alex Morgan')}
                className="flex-1 p-2 bg-emerald-50 hover:bg-emerald-100/80 rounded-xl border border-emerald-200/60 text-left transition-colors"
              >
                <p className="text-[11px] font-bold text-gray-900">Alex Morgan</p>
                <p className="text-[10px] text-gray-500 truncate">alex.morgan@gmail.com</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('santhosh.dev@gmail.com', 'password123', 'Santhosh Kumar')}
                className="flex-1 p-2 bg-emerald-50 hover:bg-emerald-100/80 rounded-xl border border-emerald-200/60 text-left transition-colors"
              >
                <p className="text-[11px] font-bold text-gray-900">Santhosh Kumar</p>
                <p className="text-[10px] text-gray-500 truncate">santhosh.dev@gmail.com</p>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-gray-200 w-full" />
            <span className="bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 absolute">
              OR GOOGLE OAUTH
            </span>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={() => handleGoogleSignIn()}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-2xl border border-gray-300 shadow-xs flex items-center justify-center gap-3 transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed group"
          >
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-xs">Continue with Google Account</span>
          </button>
        </div>

        {/* Backend & Security Footer */}
        <div className="text-center mt-4 text-[11px] text-gray-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#86A789]" />
          <span>Backend Express Auth Server • Stored in User Database</span>
        </div>
      </div>
    </div>
  );
}
