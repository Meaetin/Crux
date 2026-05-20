import { initSession } from '$lib/state/session.svelte';

export const ssr = false;
export const prerender = false;

export async function load() {
  await initSession();
}
