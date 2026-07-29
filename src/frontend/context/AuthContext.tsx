import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, RegisterPayload, LoginPayload, GoogleAuthPayload } from '../../backend/models/user';
import { authApi } from '../../backend/services/authApi';
import {
  supabase,
  signInWithGoogleOAuth,
  signInWithGmailPassword,
  signUpWithGmail,
  signOutFromSupabase,
} from '../lib/supabase';
import { signInWithFirebaseGoogle, signOutFromFirebase } from '../lib/firebase';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isRealtimeConnected: boolean;
  authProviderName: 'Supabase Google OAuth' | 'Supabase Gmail Auth' | 'Backend Auth' | 'Firebase Google OAuth';
  loginWithEmail: (payload: LoginPayload) => Promise<UserProfile>;
  registerWithEmail: (payload: RegisterPayload) => Promise<UserProfile>;
  loginWithGoogle: (payload: GoogleAuthPayload) => Promise<UserProfile>;
  loginWithSupabaseGoogle: () => Promise<void>;
  loginWithFirebaseGoogle: () => Promise<UserProfile>;
  loginWithGmailSupabase: (email: string, pass: string) => Promise<UserProfile>;
  registerWithGmailSupabase: (email: string, pass: string, name: string) => Promise<UserProfile>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'freshkeep_user_profile';
const TOKEN_STORAGE_KEY = 'freshkeep_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  });

  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(true);
  const [authProviderName, setAuthProviderName] = useState<
    'Supabase Google OAuth' | 'Supabase Gmail Auth' | 'Backend Auth' | 'Firebase Google OAuth'
  >('Supabase Google OAuth');

  // Save Session Helper
  const saveAuthSession = (
    authToken: string,
    userProfile: UserProfile,
    provider: 'Supabase Google OAuth' | 'Supabase Gmail Auth' | 'Backend Auth' | 'Firebase Google OAuth' = 'Supabase Google OAuth'
  ) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, authToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userProfile));
    setToken(authToken);
    setUser(userProfile);
    setAuthProviderName(provider);
  };

  // 1. Supabase Real-time Auth State Change Listener
  useEffect(() => {
    // Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleSupabaseSession(session);
      }
    });

    // Real-time listener for Auth changes (Sign In, Token Refresh, Sign Out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[SUPABASE AUTH REALTIME EVENT] ${event}`, session?.user?.email);
      setIsRealtimeConnected(true);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          handleSupabaseSession(session);
        }
      } else if (event === 'SIGNED_OUT') {
        // Clear session
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSupabaseSession = (session: any) => {
    const sbUser = session.user;
    const email = sbUser.email || 'user@gmail.com';
    const fullName =
      sbUser.user_metadata?.full_name ||
      sbUser.user_metadata?.name ||
      email.split('@')[0].replace('.', ' ');
    const picture =
      sbUser.user_metadata?.avatar_url ||
      sbUser.user_metadata?.picture ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`;

    const nameParts = fullName.trim().split(' ');
    const givenName = nameParts[0] || 'User';
    const familyName = nameParts.slice(1).join(' ') || '';

    const profile: UserProfile = {
      id: sbUser.id || `sb_${Date.now()}`,
      email,
      name: fullName,
      givenName,
      familyName,
      picture,
      authProvider: sbUser.app_metadata?.provider === 'google' ? 'google' : 'email',
      createdAt: sbUser.created_at || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    const isGoogle = sbUser.app_metadata?.provider === 'google';
    saveAuthSession(
      session.access_token || `sb_jwt_${sbUser.id}`,
      profile,
      isGoogle ? 'Supabase Google OAuth' : 'Supabase Gmail Auth'
    );
  };

  // 2. Email + Password Login (Backend Express API)
  const loginWithEmail = async (payload: LoginPayload): Promise<UserProfile> => {
    const res = await authApi.login(payload);
    saveAuthSession(res.token, res.user, 'Backend Auth');
    return res.user;
  };

  // 3. Email + Password Registration (Backend Express API)
  const registerWithEmail = async (payload: RegisterPayload): Promise<UserProfile> => {
    const res = await authApi.register(payload);
    saveAuthSession(res.token, res.user, 'Backend Auth');
    return res.user;
  };

  // 4. Google Auth via Express API
  const loginWithGoogle = async (payload: GoogleAuthPayload): Promise<UserProfile> => {
    const res = await authApi.googleAuth(payload);
    saveAuthSession(res.token, res.user, 'Supabase Google OAuth');
    return res.user;
  };

  // 5. Direct Supabase Google OAuth Handshake
  const loginWithSupabaseGoogle = async (): Promise<void> => {
    await signInWithGoogleOAuth();
  };

  // 5.5. Firebase Google Auth
  const loginWithFirebaseGoogle = async (): Promise<UserProfile> => {
    const fbUser = await signInWithFirebaseGoogle();
    
    if (!fbUser) throw new Error('Firebase login failed');

    const profile: UserProfile = {
      id: fbUser.uid,
      email: fbUser.email || '',
      name: fbUser.displayName || 'Firebase User',
      givenName: fbUser.displayName?.split(' ')[0] || 'User',
      familyName: fbUser.displayName?.split(' ').slice(1).join(' ') || '',
      picture: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fbUser.email || '')}`,
      authProvider: 'google',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    const token = await fbUser.getIdToken();
    saveAuthSession(token, profile, 'Firebase Google OAuth');
    return profile;
  };

  // 6. Direct Supabase Gmail Password Auth
  const loginWithGmailSupabase = async (email: string, pass: string): Promise<UserProfile> => {
    const data = await signInWithGmailPassword(email, pass);
    if (data.session) {
      handleSupabaseSession(data.session);
      return user!;
    }
    throw new Error('Login failed');
  };

  // 7. Direct Supabase Gmail Register
  const registerWithGmailSupabase = async (
    email: string,
    pass: string,
    name: string
  ): Promise<UserProfile> => {
    const data = await signUpWithGmail(email, pass, name);
    if (data.session) {
      handleSupabaseSession(data.session);
      return user!;
    }
    throw new Error('Registration failed');
  };

  // 8. Logout
  const logout = () => {
    signOutFromSupabase();
    signOutFromFirebase().catch(e => console.warn('Firebase signout error:', e));
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isRealtimeConnected,
        authProviderName,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginWithSupabaseGoogle,
        loginWithFirebaseGoogle,
        loginWithGmailSupabase,
        registerWithGmailSupabase,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
