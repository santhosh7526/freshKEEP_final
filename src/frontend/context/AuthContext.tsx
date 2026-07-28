import React, { createContext, useContext, useState } from 'react';
import { UserProfile, RegisterPayload, LoginPayload, GoogleAuthPayload } from '../../backend/models/user';
import { authApi } from '../../backend/services/authApi';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  loginWithEmail: (payload: LoginPayload) => Promise<UserProfile>;
  registerWithEmail: (payload: RegisterPayload) => Promise<UserProfile>;
  loginWithGoogle: (payload: GoogleAuthPayload) => Promise<UserProfile>;
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

  const saveAuthSession = (authToken: string, userProfile: UserProfile) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, authToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userProfile));
    setToken(authToken);
    setUser(userProfile);
  };

  const loginWithEmail = async (payload: LoginPayload): Promise<UserProfile> => {
    const res = await authApi.login(payload);
    saveAuthSession(res.token, res.user);
    return res.user;
  };

  const registerWithEmail = async (payload: RegisterPayload): Promise<UserProfile> => {
    const res = await authApi.register(payload);
    saveAuthSession(res.token, res.user);
    return res.user;
  };

  const loginWithGoogle = async (payload: GoogleAuthPayload): Promise<UserProfile> => {
    const res = await authApi.googleAuth(payload);
    saveAuthSession(res.token, res.user);
    return res.user;
  };

  const logout = () => {
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
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
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
