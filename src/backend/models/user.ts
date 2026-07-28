export interface UserProfile {
  id: string;
  name: string;
  givenName: string;
  email: string;
  picture: string;
  authProvider: 'email' | 'google';
  createdAt: string;
}

export interface UserAccount extends UserProfile {
  passwordHash?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: UserProfile;
  message?: string;
}

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface GoogleAuthPayload {
  googleToken?: string;
  email: string;
  name: string;
  picture?: string;
}
