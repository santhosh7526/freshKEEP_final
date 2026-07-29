import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Mail, Lock, User, Eye, EyeOff, ShieldCheck, Sparkles, ArrowRight, KeyRound, Radio, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginWithFirebaseGoogle,
    loginWithGmailSupabase,
    registerWithGmailSupabase,
    isRealtimeConnected,
  } = useAuth();
  const navigate = useNavigate();

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Auth Form Inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);



  // Submit Gmail Auth Form (Real-time Supabase Backend Sync)
  const handleSubmitEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter your Gmail address and password');
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
        const user = await registerWithGmailSupabase(email.trim(), password.trim(), name.trim());
        toast.success(`Supabase Account Registered! Welcome ${user?.givenName || name}`, {
          description: `Gmail real-time sync active for ${email}`,
        });
      } else {
        const user = await loginWithGmailSupabase(email.trim(), password.trim());
        toast.success(`Supabase Real-time Auth Verified!`, {
          description: `Logged in with Gmail (${email})`,
        });
      }
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(authMode === 'register' ? 'Registration Failed' : 'Gmail Auth Failed', {
        description: err.message || 'Check your credentials and connection.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time Firebase Google OAuth Redirect / Handshake
  const handleGoogleOAuthSignIn = async () => {
    setIsLoading(true);
    try {
      toast.loading('Redirecting to Firebase Google Authentication...');
      await loginWithFirebaseGoogle();
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast.dismiss();
      toast.error('Google OAuth Failed', {
        description: err.message || 'Could not start Google sign in.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900/10 via-emerald-50/50 to-teal-50/80 flex flex-col justify-between p-4 md:p-6 relative overflow-hidden">
      {/* Dynamic Animated Background Orbs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar with Realtime Status Badge */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between z-10 pt-2 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#86A789] to-emerald-600 flex items-center justify-center text-white shadow-md">
            <Leaf className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-gray-900 text-lg tracking-tight">FreshKeep</span>
        </div>


      </div>

      {/* Main Container */}
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center py-2 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-5">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Authentication
          </h1>
          <p className="text-xs text-gray-600 mt-2 max-w-xs mx-auto leading-relaxed">
            Instant expiry tracking & anti-food waste management with live data sync across all your devices.
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/80 space-y-5">
          
          {/* Mode Switcher Tabs */}
          <div className="flex bg-gray-100/80 p-1 rounded-2xl border border-gray-200/50">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                authMode === 'login'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Gmail Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                authMode === 'register'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Real-time Google / Gmail OAuth Action Button */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleOAuthSignIn}
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-gray-800 font-bold rounded-2xl border border-gray-300 shadow-sm flex items-center justify-center gap-3 transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-emerald-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <svg className="w-5 h-5 transition-transform group-hover:scale-110 flex-shrink-0" viewBox="0 0 24 24">
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
              <span className="text-xs">Sign in with Google via Firebase</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-gray-200 w-full" />
            <span className="bg-white px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 absolute">
              OR GMAIL PASSWORD AUTH
            </span>
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
                    placeholder="e.g. Santhosh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#86A789] focus:bg-white transition-all text-gray-900"
                  />
                </div>
              </div>
            )}

            {/* Gmail Address Input */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Gmail Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="alex.morgan@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-50 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#86A789] focus:bg-white transition-all text-gray-900 font-medium"
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
              className="w-full py-3.5 bg-gradient-to-r from-[#86A789] to-emerald-600 hover:from-[#729275] hover:to-emerald-700 text-white font-bold rounded-2xl text-xs shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{authMode === 'login' ? 'Authenticate with Gmail' : 'Register Gmail Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>


        </div>

        {/* Backend & Security Footer */}
        <div className="text-center mt-4 text-[11px] text-gray-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>End-to-End Encrypted Session</span>
        </div>
      </div>
    </div>
  );
}
