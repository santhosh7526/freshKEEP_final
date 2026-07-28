import express from 'express';
import cors from 'cors';
import { userStore } from './storage/userStore';
import { LoginPayload, RegisterPayload, GoogleAuthPayload } from './models/user';

const app = express();
const PORT = process.env.PORT || 5001;

// Session Tokens Store
const activeSessions = new Map<string, string>(); // token -> userId

app.use(cors());
app.use(express.json());

// Helper to generate simple token
function generateToken(userId: string): string {
  const token = `fk_jwt_${userId}_${Date.now()}`;
  activeSessions.set(token, userId);
  return token;
}

// 1. REGISTER Endpoint (Email + Password)
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password }: RegisterPayload = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    const existing = userStore.findByEmail(email);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this Google/Email address already exists. Please sign in.',
      });
    }

    const newUser = userStore.createUser({
      name,
      email,
      password,
      authProvider: 'email',
    });

    const token = generateToken(newUser.id);
    const publicProfile = userStore.toPublicProfile(newUser);

    console.log(`[BACKEND AUTH] New user registered successfully: ${newUser.email}`);
    return res.status(201).json({
      success: true,
      token,
      user: publicProfile,
      message: 'Account created successfully!',
    });
  } catch (error: any) {
    console.error('[BACKEND AUTH ERROR] Register:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error during registration.',
    });
  }
});

// 2. LOGIN Endpoint (Email + Password)
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password }: LoginPayload = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email address and password are required.',
      });
    }

    const user = userStore.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Account not found with this email. Please check your email or Sign Up.',
      });
    }

    if (user.passwordHash && user.passwordHash !== password) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.',
      });
    }

    const token = generateToken(user.id);
    const publicProfile = userStore.toPublicProfile(user);

    console.log(`[BACKEND AUTH] User logged in: ${user.email}`);
    return res.json({
      success: true,
      token,
      user: publicProfile,
      message: 'Logged in successfully!',
    });
  } catch (error: any) {
    console.error('[BACKEND AUTH ERROR] Login:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error during login.',
    });
  }
});

// 3. GOOGLE AUTH Endpoint (Real-time Google OAuth Handshake)
app.post('/api/auth/google', (req, res) => {
  try {
    const { email, name, picture }: GoogleAuthPayload = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Google profile email and name are required.',
      });
    }

    let user = userStore.findByEmail(email);

    if (!user) {
      // Auto-register Google user in backend DB
      user = userStore.createUser({
        name,
        email,
        picture,
        authProvider: 'google',
      });
      console.log(`[BACKEND AUTH] New Google user auto-registered: ${email}`);
    } else {
      console.log(`[BACKEND AUTH] Google user authenticated: ${email}`);
    }

    const token = generateToken(user.id);
    const publicProfile = userStore.toPublicProfile(user);

    return res.json({
      success: true,
      token,
      user: publicProfile,
      message: 'Google Sign In successful!',
    });
  } catch (error: any) {
    console.error('[BACKEND AUTH ERROR] Google Sign In:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to authenticate with Google.',
    });
  }
});

// 4. VERIFY SESSION / ME Endpoint
app.get('/api/auth/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No session token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const userId = activeSessions.get(token);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
    }

    const user = userStore.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({
      success: true,
      user: userStore.toPublicProfile(user),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch session.' });
  }
});

// 5. LOGOUT Endpoint
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    activeSessions.delete(token);
  }
  return res.json({ success: true, message: 'Logged out successfully.' });
});

app.listen(PORT, () => {
  console.log(`====================================================================`);
  console.log(`🚀 FRESHKEEP AUTHENTICATION BACKEND SERVER STARTED`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   Endpoints: /api/auth/login, /api/auth/register, /api/auth/google`);
  console.log(`====================================================================`);
});
