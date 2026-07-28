import { UserAccount, UserProfile } from '../models/user';

const STORAGE_KEY = 'freshkeep_backend_users_db';

// Pre-seeded initial accounts
const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'user_alex_1001',
    name: 'Alex Morgan',
    givenName: 'Alex',
    email: 'alex.morgan@gmail.com',
    passwordHash: 'password123',
    picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    authProvider: 'email',
    createdAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'user_santhosh_1002',
    name: 'Santhosh Kumar',
    givenName: 'Santhosh',
    email: 'santhosh.dev@gmail.com',
    passwordHash: 'password123',
    picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=santhosh.dev@gmail.com',
    authProvider: 'google',
    createdAt: '2026-02-01T12:00:00.000Z',
  },
];

class UserStore {
  private users: UserAccount[] = [];

  constructor() {
    this.loadUsers();
  }

  private loadUsers() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(STORAGE_KEY);
        this.users = raw ? JSON.parse(raw) : [...DEFAULT_USERS];
        if (!raw) this.saveUsers();
      } else {
        this.users = [...DEFAULT_USERS];
      }
    } catch {
      this.users = [...DEFAULT_USERS];
    }
  }

  private saveUsers() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.users));
      }
    } catch (e) {
      console.error('Failed to save users database:', e);
    }
  }

  public getAll(): UserAccount[] {
    return this.users;
  }

  public findByEmail(email: string): UserAccount | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  public findById(id: string): UserAccount | undefined {
    return this.users.find((u) => u.id === id);
  }

  public createUser(userData: {
    name: string;
    email: string;
    password?: string;
    picture?: string;
    authProvider: 'email' | 'google';
  }): UserAccount {
    const emailNormalized = userData.email.toLowerCase().trim();
    const existing = this.findByEmail(emailNormalized);
    if (existing) {
      throw new Error(`Account with email ${emailNormalized} already exists.`);
    }

    const givenName = userData.name.trim().split(' ')[0] || userData.name;
    const newUser: UserAccount = {
      id: `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: userData.name.trim(),
      givenName,
      email: emailNormalized,
      passwordHash: userData.password ? userData.password : undefined,
      picture:
        userData.picture ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(emailNormalized)}`,
      authProvider: userData.authProvider,
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);
    this.saveUsers();
    return newUser;
  }

  public toPublicProfile(user: UserAccount): UserProfile {
    const { passwordHash, ...publicProfile } = user;
    return publicProfile;
  }
}

export const userStore = new UserStore();
