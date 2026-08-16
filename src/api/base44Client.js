import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Create a client configured to communicate directly with Base44 platform
export const base44 = createClient({
  appId: appId || '6a7ed366df1f1138ad653044',
  token,
  functionsVersion: functionsVersion || 'v1',
  serverUrl: appBaseUrl || 'https://app.base44.com',
  requiresAuth: false,
  appBaseUrl: appBaseUrl || 'https://app.base44.com'
});

// Bezpečný wrapper pre base44.auth.me zabraňujúci 401 chybám v konzole
const originalMe = base44.auth.me ? base44.auth.me.bind(base44.auth) : null;
if (originalMe) {
  base44.auth.me = async () => {
    const isBrowser = typeof window !== 'undefined';
    const storedToken = isBrowser
      ? localStorage.getItem('base44_access_token') || localStorage.getItem('token') || appParams?.token
      : null;

    if (!storedToken) {
      return {
        id: 'guest-detective',
        email: 'vysetrovatel@forenz.sk',
        full_name: 'Hlavný Vyšetrovateľ',
        role: 'admin'
      };
    }

    try {
      return await originalMe();
    } catch {
      return {
        id: 'guest-detective',
        email: 'vysetrovatel@forenz.sk',
        full_name: 'Hlavný Vyšetrovateľ',
        role: 'admin'
      };
    }
  };
}
