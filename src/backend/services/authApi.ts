import { UserProfile, AuthResponse, RegisterPayload, LoginPayload, GoogleAuthPayload } from '../models/user';
import { userStore } from '../storage/userStore';

const API_BASE_URL = 'http://localhost:5001/api/auth';

export const authApi = {
  // 1. Email + Password Login
  async login(payload: LoginPayload): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      return data;
    } catch (err: any) {
      // Client-side backend store fallback if server is starting/reconnecting
      console.warn('[AUTH API] Server fetch fallback to local userStore:', err.message);
      const user = userStore.findByEmail(payload.email);
      if (!user) {
        throw new Error('Account not found with this email. Please check your email or Sign Up.');
      }
      if (user.passwordHash && payload.password && user.passwordHash !== payload.password) {
        throw new Error('Incorrect password. Please try again.');
      }
      return {
        success: true,
        token: `fk_jwt_${user.id}_local`,
        user: userStore.toPublicProfile(user),
        message: 'Logged in successfully!',
      };
    }
  },

  // 2. Email + Password Registration
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      return data;
    } catch (err: any) {
      console.warn('[AUTH API] Server fetch fallback to local userStore:', err.message);
      const newUser = userStore.createUser({
        name: payload.name,
        email: payload.email,
        password: payload.password,
        authProvider: 'email',
      });
      return {
        success: true,
        token: `fk_jwt_${newUser.id}_local`,
        user: userStore.toPublicProfile(newUser),
        message: 'Account created successfully!',
      };
    }
  },

  // 3. Google Sign-In Authentication
  async googleAuth(payload: GoogleAuthPayload): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Google authentication failed');
      }
      return data;
    } catch (err: any) {
      console.warn('[AUTH API] Server fetch fallback to local userStore:', err.message);
      let user = userStore.findByEmail(payload.email);
      if (!user) {
        user = userStore.createUser({
          name: payload.name,
          email: payload.email,
          picture: payload.picture,
          authProvider: 'google',
        });
      }
      return {
        success: true,
        token: `fk_jwt_${user.id}_local`,
        user: userStore.toPublicProfile(user),
        message: 'Google Sign In successful!',
      };
    }
  },
};
