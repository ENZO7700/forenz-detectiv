export function createPageUrl(pageName) {
  return '/' + (pageName || '').replace(/ /g, '-');
}

export * from './cryptoUtils.js';
export * from './imageExporter.js';
export * from './utmTracker.js';
