/**
 * Sentry & Telemetry Layer pre ForenzDetectiv.
 * Zabezpečuje bezpečné zaznamenávanie chýb s anonymizáciou citlivých údajov (GDPR / ochrana spisov).
 */

let isSentryInitialized = false;
let SentryModule = null;

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
export async function initSentry() {
  if (isSentryInitialized) return;

  const dsn = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SENTRY_DSN : null;

  if (!dsn) {
    isSentryInitialized = true;
    return;
  }

  try {
    SentryModule = await import('@sentry/react');
    SentryModule.init({
      dsn,
      environment: import.meta.env?.MODE || 'production',
      tracesSampleRate: 0.1,
      beforeSend(event) {
        if (event.extra) {
          event.extra = sanitizeDiagnosticData(event.extra);
        }
        if (event.contexts) {
          event.contexts = sanitizeDiagnosticData(event.contexts);
        }
        if (event.tags) {
          event.tags = sanitizeDiagnosticData(event.tags);
        }
        return event;
      }
    });
    isSentryInitialized = true;
    if (import.meta.env?.DEV) {
      console.info('[Sentry] Inicializovaný s ochranou osobných údajov.');
    }
  } catch (err) {
    console.warn('[Sentry] Inicializácia zlyhala:', err);
    isSentryInitialized = true;
  }
}

/**
 * Zachytenie výnimky s automatickou anonymizáciou
 */
export function captureException(error, context = {}) {
  const safeContext = sanitizeDiagnosticData(context);

  if (SentryModule && typeof SentryModule.captureException === 'function') {
    SentryModule.captureException(error, { extra: safeContext });
  } else if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.warn('[Telemetry Error Captured]:', error?.message || error, safeContext);
  }
}

/**
 * Zachytenie správy
 */
export function captureMessage(message, level = 'info') {
  if (SentryModule && typeof SentryModule.captureMessage === 'function') {
    SentryModule.captureMessage(message, level);
  } else if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.info(`[Telemetry ${level.toUpperCase()}]:`, message);
  }
}
