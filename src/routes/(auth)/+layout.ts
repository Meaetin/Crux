import { redirect } from '@sveltejs/kit';
import { session } from '$lib/state/session.svelte';

export const load = ({ url }) => {
  // Reset-password is reached via a recovery link that establishes a session,
  // so we explicitly let signed-in users land there to set a new password.
  if (url.pathname === '/reset-password') return;
  if (session.current) {
    throw redirect(303, '/');
  }
};
