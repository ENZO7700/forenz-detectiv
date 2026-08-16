/**
 * Demo case (BA–KE / Praha–Brno) is local/dev only.
 * Production builds must leave VITE_ENABLE_DEMO unset/false so demo never
 * injects synthetic cases into the store, IndexedDB, or analytics as real data.
 * Playwright sets window.__FORENZ_E2E_DEMO__ via addInitScript (Windows-safe).
 */
export function isDemoEnabled() {
  if (typeof window !== 'undefined' && window.__FORENZ_E2E_DEMO__ === true) {
    return true;
  }
  return import.meta.env.VITE_ENABLE_DEMO === 'true';
}
