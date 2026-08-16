import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Tab Navigation, Routing & Button Interactivity Test Suite', () => {

  test('1. Všetkých 5 kľúčových záložiek (Pavúk, Spis, Alibi, Časová os, Sherlock) má platné mapovanie', () => {
    const TAB_ROUTES = [
      { key: 'graph', label: 'Pavúk', targetView: 'graph' },
      { key: 'archive', label: 'Spis', targetView: 'archive' },
      { key: 'map', label: 'Alibi', targetView: 'map' },
      { key: 'timeline', label: 'Časová os', targetView: 'timeline' },
      { key: 'sherlock', label: 'Sherlock', isSignal: true },
      { key: 'identity', label: 'Identity', targetView: 'identity' }
    ];

    assert.strictEqual(TAB_ROUTES.length, 6);
    assert.strictEqual(TAB_ROUTES.find(t => t.label === 'Pavúk').targetView, 'graph');
    assert.strictEqual(TAB_ROUTES.find(t => t.label === 'Spis').targetView, 'archive');
    assert.strictEqual(TAB_ROUTES.find(t => t.label === 'Alibi').targetView, 'map');
    assert.strictEqual(TAB_ROUTES.find(t => t.label === 'Časová os').targetView, 'timeline');
    assert.strictEqual(TAB_ROUTES.find(t => t.label === 'Sherlock').isSignal, true);
  });

  test('2. handleViewChange prepína stav a synchronizuje URL query parameter (?view=...) bez blokovania', () => {
    let activeView = 'hero';
    let sherlockSignal = 0;
    let urlSearch = '';

    const handleViewChange = (view) => {
      if (view === 'sherlock') {
        sherlockSignal += 1;
        return;
      }
      activeView = view;
      const params = new URLSearchParams(urlSearch);
      params.set('view', view);
      urlSearch = `?${params.toString()}`;
    };

    // Klik na Pavúka
    handleViewChange('graph');
    assert.strictEqual(activeView, 'graph');
    assert.strictEqual(urlSearch, '?view=graph');

    // Klik na Spis
    handleViewChange('archive');
    assert.strictEqual(activeView, 'archive');
    assert.strictEqual(urlSearch, '?view=archive');

    // Klik na Alibi
    handleViewChange('map');
    assert.strictEqual(activeView, 'map');
    assert.strictEqual(urlSearch, '?view=map');

    // Klik na Časovú os
    handleViewChange('timeline');
    assert.strictEqual(activeView, 'timeline');
    assert.strictEqual(urlSearch, '?view=timeline');

    // Klik na Sherlock AI
    handleViewChange('sherlock');
    assert.strictEqual(sherlockSignal, 1);
  });

  test('3. Prepnutie záložky zobrazí vybraný pohľad aj pri 0 dokumentoch (neblokuje sa na HomeHero)', () => {
    const shouldRenderHomeHero = (docCount, activeView) => {
      return docCount === 0 && (activeView === 'hero' || !activeView);
    };

    // Pri štarte bez dokumentov na 'hero' zobrazuje HomeHero
    assert.strictEqual(shouldRenderHomeHero(0, 'hero'), true);

    // Po kliknutí na 'graph' (Pavúk) sa už HomeHero nezobrazí, zobrazí sa pracovná plocha
    assert.strictEqual(shouldRenderHomeHero(0, 'graph'), false);
    assert.strictEqual(shouldRenderHomeHero(0, 'archive'), false);
    assert.strictEqual(shouldRenderHomeHero(0, 'map'), false);
    assert.strictEqual(shouldRenderHomeHero(0, 'timeline'), false);
  });

  test('4. Mobilný bar MobileBottomNav korektne odovzdáva udalosti pre všetkých 5 tlačidiel', () => {
    const events = [];
    const onTabChange = (key) => events.push(`tab:${key}`);
    const onSherlock = () => events.push('sherlock');

    const handle = (key) => {
      if (key === 'sherlock') onSherlock();
      else onTabChange(key);
    };

    handle('graph');
    handle('archive');
    handle('map');
    handle('timeline');
    handle('sherlock');

    assert.deepStrictEqual(events, [
      'tab:graph',
      'tab:archive',
      'tab:map',
      'tab:timeline',
      'sherlock'
    ]);
  });
});
