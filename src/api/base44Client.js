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
