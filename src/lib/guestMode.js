import { appParams } from '@/lib/app-params';

/** True when the browser has a Base44 auth token (logged-in user). */
export function hasAuthToken() {
  if (typeof window === 'undefined') return false;
  return !!(
    localStorage.getItem('base44_access_token') ||
    localStorage.getItem('token') ||
    appParams?.token
  );
}

/** Guest/offline sessions must never rely on cloud entity create or fetchData refresh. */
export function isGuestOfflineSession() {
  return !hasAuthToken();
}
