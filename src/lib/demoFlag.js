/**
 * Demo case (BA–KE / Praha–Brno) is local/dev only.
 * Production builds must leave VITE_ENABLE_DEMO unset/false so demo never
 * injects synthetic cases into the store, IndexedDB, or analytics as real data.
 */
export function isDemoEnabled() {
  return import.meta.env.VITE_ENABLE_DEMO === 'true';
}
