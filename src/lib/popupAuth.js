import { appParams } from '@/lib/app-params';

/**
 * Otvorí Google OAuth prihlásenie v modálnom Popup okne s premostením domény.
 * Tento prístup rieši "Domain is not valid" a "MismatchingStateError" na vlastných doménach (Vercel).
 */
export function loginWithGooglePopup(fromUrl = '/') {
  const { appId, appBaseUrl } = appParams;
  const redirectUrl = new URL(fromUrl, window.location.origin).toString();
  const popupOrigin = window.location.origin;

  // Premostenie: Base44 overí vlastnú doménu app.base44.com a následne pošle token do popup_origin
  const base44InternalReturn = `${appBaseUrl}/apps/${appId}`;
  const queryParams = `app_id=${encodeURIComponent(appId)}&from_url=${encodeURIComponent(base44InternalReturn)}&popup_origin=${encodeURIComponent(popupOrigin)}`;
  const loginUrl = `${appBaseUrl}/api/apps/auth/login?${queryParams}`;

  const width = 500;
  const height = 650;
  const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
  const top = Math.round(window.screenY + (window.outerHeight - height) / 2);

  const popup = window.open(
    loginUrl,
    'base44_auth_popup',
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no`
  );

  if (!popup || popup.closed || typeof popup.closed === 'undefined') {
    window.location.href = loginUrl;
    return;
  }

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      window.removeEventListener('message', onMessage);
      clearInterval(pollTimer);
      try {
        if (!popup.closed) popup.close();
      } catch (_) {}
    };

    const onMessage = (event) => {
      if (!event.origin.includes('base44.com')) return;
      if (!event.data?.access_token) return;

      cleanup();

      const { access_token, is_new_user } = event.data;
      if (access_token) {
        localStorage.setItem('base44_access_token', access_token);
        localStorage.setItem('token', access_token);
      }

      const callbackUrl = new URL(redirectUrl);
      callbackUrl.searchParams.set('access_token', access_token);
      if (is_new_user != null) {
        callbackUrl.searchParams.set('is_new_user', String(is_new_user));
      }

      window.location.href = callbackUrl.toString();
      resolve(event.data);
    };

    const pollTimer = setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new Error('Prihlasovacie okno bolo zatvorené pred dokončením.'));
      }
    }, 500);

    window.addEventListener('message', onMessage);
  });
}
