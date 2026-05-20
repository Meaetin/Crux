import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';

const url = env.PUBLIC_SUPABASE_URL;
const anonKey = env.PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing Supabase env vars. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY in .env'
  );
}

const REMEMBER_KEY = 'sb-remember';

function rememberPersistent(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(REMEMBER_KEY) !== 'false';
}

export function setRememberMe(value: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(REMEMBER_KEY, value ? 'true' : 'false');
}

export function getRememberMe(): boolean {
  return rememberPersistent();
}

// Custom adapter so the session lives in localStorage when "remember me" is
// on, and in sessionStorage (dies with the tab) when it's off. Supabase calls
// these synchronously, so we always route to whichever storage is active.
const rememberStorage = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    const store = rememberPersistent() ? window.localStorage : window.sessionStorage;
    return store.getItem(key);
  },
  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    const persist = rememberPersistent();
    const primary = persist ? window.localStorage : window.sessionStorage;
    const other = persist ? window.sessionStorage : window.localStorage;
    primary.setItem(key, value);
    other.removeItem(key);
  },
  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  }
};

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: rememberStorage,
    flowType: 'pkce'
  }
});
