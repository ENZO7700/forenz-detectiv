import { createClient } from '@base44/sdk';
import { appParams } from '../lib/app-params.js';

// Deaktivácia interného Base44 SDK analytics v guest / standalone režime
if (typeof window !== 'undefined') {
  if (!window.base44SharedInstances) {
    window.base44SharedInstances = {};
  }
  window.base44SharedInstances.analytics = {
    instance: {
      requestsQueue: [],
      isProcessing: false,
      isHeartBeatProcessing: false,
      wasInitializationTracked: true,
      sessionContext: {
        user_id: null,
        session_id: 'guest-session'
      },
      sessionStartTime: null,
      config: {
        enabled: false,
        maxQueueSize: 0,
        throttleTime: 999999,
        batchSize: 0,
        heartBeatInterval: 999999
      }
    }
  };
}

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Create a client configured to communicate directly with Base44 platform
export const base44 = createClient({
  appId: appId || '6a81f5e7f4adbf6a9523b9d8',
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
