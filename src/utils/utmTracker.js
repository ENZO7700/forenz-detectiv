/**
 * Nástroj pre zber a sledovanie marketingových UTM parametrov pre meranie B2B konverzií.
 */

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref'];

/**
 * Pri načítaní stránky zachytí všetky UTM parametre z URL a bezpečne ich uloží do sessionStorage.
 */
export function captureUtmParameters() {
  if (typeof window === 'undefined') return {};

  const urlParams = new URLSearchParams(window.location.search);
  const utmData = {};
  let hasUtm = false;

  UTM_KEYS.forEach(key => {
    const val = urlParams.get(key);
    if (val) {
      utmData[key] = val;
      hasUtm = true;
    }
  });

  if (hasUtm) {
    try {
      sessionStorage.setItem('forenz_utm_params', JSON.stringify(utmData));
    } catch (e) {
      console.warn('Nepodarilo sa uložiť UTM parametre', e);
    }
  }

  return getStoredUtmParameters();
}

/**
 * Vráti uložené UTM parametre zo sessionStorage.
 * @returns {Record<string, string>}
 */
export function getStoredUtmParameters() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem('forenz_utm_params');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
