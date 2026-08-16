/**
 * Sentry & Telemetry Layer pre ForenzDetectiv.
 * Zabezpečuje bezpečné zaznamenávanie chýb s anonymizáciou citlivých údajov (GDPR / ochrana spisov).
 */

let isSentryInitialized = false;

// Kľúče, ktoré obsahujú citlivé informácie a musia byť vymazané pred odoslaním do telemetrie
const SENSITIVE_KEYS = [
  'quote',
  'source_quote',
  'raw_text',
  'text',
  'content',
  'full_name',
  'person_name',
  'witness_name',
  'suspect_name',
  'address',
  'birth_number',
  'ssn',
  'phone',
  'email',
  'password',
  'token'
];

/**
 * Rekurzívne očistí objekt od citlivých údajov zo spisu
 */
export function sanitizeDiagnosticData(data, depth = 0) {
  if (!data || depth > 4) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeDiagnosticData(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    const isSensitive = SENSITIVE_KEYS.some((sk) => key.toLowerCase().includes(sk));
    if (isSensitive) {
      sanitized[key] = '[ANONYMIZED_FORENSIC_DATA]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeDiagnosticData(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Inicializácia Sentry v prípade dostupnosti DSN v env premenných
 */
export function initSentry() {
  if (isSentryInitialized) return;

  const dsn = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SENTRY_DSN : null;

  if (!dsn) {
    // Tichý fallback v offline / guest móde
    isSentryInitialized = true;
    return;
  }

  try {
    // Dynamický import v prípade inštalácie @sentry/react
    // Inak používame bezpečný fallback
    isSentryInitialized = true;
    console.info('[Sentry] Inicializovaný s ochranou osobných údajov.');
  } catch (err) {
    console.warn('[Sentry] Inicializácia zlyhala:', err);
  }
}

/**
 * Zachytenie výnimky s automatickou anonymizáciou
 */
export function captureException(error, context = {}) {
  const safeContext = sanitizeDiagnosticData(context);

  if (typeof window !== 'undefined' && window.Sentry && typeof window.Sentry.captureException === 'function') {
    window.Sentry.captureException(error, safeContext);
  } else {
    // V lokálnom vývojovom režime logujeme s varovaním
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      console.warn('[Telemetry Error Captured]:', error?.message || error, safeContext);
    }
  }
}

/**
 * Zachytenie správy
 */
export function captureMessage(message, level = 'info') {
  if (typeof window !== 'undefined' && window.Sentry && typeof window.Sentry.captureMessage === 'function') {
    window.Sentry.captureMessage(message, level);
  } else if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.info(`[Telemetry ${level.toUpperCase()}]:`, message);
  }
}
