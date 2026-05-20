import { redirect } from '@sveltejs/kit';
import { session } from '$lib/state/session.svelte';

export const load = () => {
  if (!session.current) {
    throw redirect(303, '/login');
  }
};
