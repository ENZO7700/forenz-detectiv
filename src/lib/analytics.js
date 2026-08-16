/**
 * Privacy-First Product Analytics pre ForenzDetectiv (PostHog Integration).
 * Striktne anonymizuje a odstraňuje akékoľvek osobné údaje, mená osôb a texty spisov (GDPR súlad).
 */

let isPostHogInitialized = false;

// Kľúčové polia, ktoré nesmú byť odoslané do analytiky
const SENSITIVE_PROPERTY_KEYS = [
  'quote',
  'source_quote',
  'text',
  'source_text',
  'claim_text',
  'name',
  'speaker',
  'person_name',
  'source_name',
  'target_name',
  'address',
  'ssn',
  'email',
  'phone',
  'license_plate'
];

/**
 * Očistí vlastnosti udalosti od citlivých identifikačných údajov
 */
export function sanitizeAnalyticsProps(props = {}) {
  if (!props || typeof props !== 'object') return {};

  const clean = {};
  for (const [key, value] of Object.entries(props)) {
    const isSensitive = SENSITIVE_PROPERTY_KEYS.some((sk) => key.toLowerCase().includes(sk));
    if (!isSensitive) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        clean[key] = sanitizeAnalyticsProps(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean;
}

/**
 * Inicializácia PostHog
 */
export function initAnalytics() {
  if (isPostHogInitialized) return;

  const key = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_POSTHOG_KEY : null;
  const host = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com' : 'https://eu.i.posthog.com';

  if (!key) {
    // V offline / lokálnom režime zostáva tichý fallback
    isPostHogInitialized = true;
    return;
  }

  try {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.init(key, {
        api_host: host,
        autocapture: false,
        mask_all_text: true,
        mask_all_element_attributes: true,
        disable_session_recording: true,
        persistence: 'localStorage'
      });
      isPostHogInitialized = true;
    }
  } catch (err) {
    console.warn('[Analytics] Inicializácia PostHog zlyhala:', err);
  }
}

/**
 * Všeobecný odosielateľ udalosti
 */
export function trackEvent(eventName, rawProperties = {}) {
  const properties = sanitizeAnalyticsProps(rawProperties);

  if (typeof window !== 'undefined' && window.posthog && typeof window.posthog.capture === 'function') {
    window.posthog.capture(eventName, properties);
  }

  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.debug(`[Analytics 📊] ${eventName}`, properties);
  }
}

/**
 * 8 Špecifických ForenzDetectiv Biznis a North Star Udalostí:
 */

// 1. Spis vytvorený
export function trackCaseCreated(source = 'upload', fileCount = 1) {
  trackEvent('case_created', { source, file_count: fileCount });
}

// 2. Súbor nahraný
export function trackFileUploaded(fileType, sizeKb) {
  trackEvent('file_uploaded', { file_type: fileType, size_kb: sizeKb });
}

// 3. Detegovaný rozpor
export function trackContradictionDetected(count, hasAlibiConflict = false) {
  trackEvent('contradiction_detected', { count, has_alibi_conflict: hasAlibiConflict });
}

// 4. North Star: Zobrazený detail rozporu
export function trackContradictionViewed(contradictionType, timeToViewSec = 0) {
  trackEvent('contradiction_viewed', {
    contradiction_type: contradictionType || 'unknown',
    time_to_view_sec: Math.round(timeToViewSec)
  });
}

// 5. Kontrola Alibi
export function trackAlibiChecked(status, speedKmh = 0, distanceKm = 0) {
  trackEvent('alibi_checked', {
    status, // 'possible' | 'impossible' | 'suspicious'
    speed_kmh: Math.round(speedKmh),
    distance_km: Math.round(distanceKm)
  });
}

// 6. Spustený Demo spis
export function trackDemoLaunched(caseId = 'ba-ke') {
  trackEvent('demo_launched', { case_id: caseId });
}

// 7. Exportovaný súdny PDF protokol
export function trackPdfExported(pageCount = 1, withHash = true) {
  trackEvent('pdf_exported', { page_count: pageCount, with_hash: withHash });
}

// 8. Vygenerovaná share karta rozporu
export function trackShareCardGenerated(type = 'alibi_impossible') {
  trackEvent('share_card_generated', { type });
}
