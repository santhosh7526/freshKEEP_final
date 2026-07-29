import { createClient } from '@supabase/supabase-js';

// Default Supabase project configuration (Can be overridden via environment variables)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://freshkeep-app.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyZXNoa2VlcC1hcHAiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDE1NTU4NDAwfQ.demo_key_freshkeep_realtime';

export const isSupabaseConfigured = () => {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
};

// Initialize Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Broadcast channel for real-time local cross-tab fallback sync
export const realtimeBroadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('freshkeep_realtime_sync')
  : null;

// Realtime Google / Gmail OAuth Sign-In
export async function signInWithGoogleOAuth() {
  const redirectUrl = window.location.origin + window.location.pathname;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;
  return data;
}

// Gmail / Email Password Authentication
export async function signInWithGmailPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

// Gmail / Email Sign Up
export async function signUpWithGmail(email: string, password: string, name?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
      },
    },
  });
  if (error) throw error;
  return data;
}

// Supabase Sign Out
export async function signOutFromSupabase() {
  const { error } = await supabase.auth.signOut();
  if (error) console.warn('[SUPABASE AUTH] Sign out error or demo session reset:', error.message);
}
