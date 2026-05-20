import type { Session } from '@supabase/supabase-js';
import { supabase } from '$lib/supabase/client';
import { startSync, stopSync, clearLocalUserData } from '$lib/sync/engine.svelte';

export const session = $state<{ current: Session | null; ready: boolean }>({
  current: null,
  ready: false
});

let initPromise: Promise<void> | null = null;
let currentUserId: string | null = null;

function handleSessionChange(next: Session | null) {
  const nextUserId = next?.user.id ?? null;

  if (nextUserId !== currentUserId) {
    if (currentUserId) {
      // Switched accounts (or signed out) on this device — drop the previous
      // user's local data before bringing the next one's data down.
      stopSync();
      void clearLocalUserData();
    }
    currentUserId = nextUserId;
  }

  session.current = next;

  if (next) startSync();
  else stopSync();
}

export function initSession(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const { data } = await supabase.auth.getSession();
    currentUserId = data.session?.user.id ?? null;
    session.current = data.session;
    session.ready = true;

    if (data.session) startSync();

    supabase.auth.onAuthStateChange((_event, s) => {
      handleSessionChange(s);
    });
  })();

  return initPromise;
}

export async function signOut() {
  await supabase.auth.signOut();
}
