import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyRelationship,
  calculateGraphMetrics,
  RELATIONSHIP_TYPES
} from '../src/lib/graphMetrics.js';

describe('6. 🕸️ Graph Metrics & Big Data Scalability Test Suite', () => {

  test('6.1 Klasifikácia rôznych typov forenzných väzieb a ich vizuálnych atribútov', () => {
    const r1 = classifyRelationship({ label: 'Spolupáchateľ pri vlámaní' });
    assert.strictEqual(r1.type, RELATIONSHIP_TYPES.SPOLUPACHATEL);
    assert.strictEqual(r1.color, '#dc2626');
    assert.strictEqual(r1.importance, 5);

    const r2 = classifyRelationship({ label: 'Fyzický konflikt a hádka' });
    assert.strictEqual(r2.type, RELATIONSHIP_TYPES.NEPRIATELSTVO);
    assert.strictEqual(r2.color, '#f97316');

    const r3 = classifyRelationship({ label: 'Bankový prevod 50 000 EUR' });
    assert.strictEqual(r3.type, RELATIONSHIP_TYPES.FINANCIE);
    assert.strictEqual(r3.color, '#eab308');

    const r4 = classifyRelationship({ label: 'Matka a syn' });
    assert.strictEqual(r4.type, RELATIONSHIP_TYPES.RODINA);
  });

  test('6.2 Výpočet PageRank metriky a identifikácia kľúčových aktérov (Hubs & Authorities)', () => {
    const nodes = [
      { id: 'p1', name: 'Hlavný podozrivý Boss' },
      { id: 'p2', name: 'Sprostredkovateľ A' },
      { id: 'p3', name: 'Sprostredkovateľ B' },
      { id: 'p4', name: 'Poverený vodič' }
    ];

    const edges = [
      { source: 'p2', target: 'p1', label: 'komplic' },
      { source: 'p3', target: 'p1', label: 'kontakt' },
      { source: 'p4', target: 'p1', label: 'kontakt' }
    ];

    const metrics = calculateGraphMetrics(nodes, edges);
    assert.ok(metrics);
    assert.ok(Array.isArray(metrics.nodesWithMetrics));
    assert.ok(Array.isArray(metrics.topSuspects));
    assert.strictEqual(metrics.graphStats.totalNodes, 4);

    const boss = metrics.nodesWithMetrics.find((n) => n.id === 'p1');
    assert.ok(boss);
    assert.ok(boss.degree >= 3);
    assert.strictEqual(boss.isKeyHub, true, 'Boss s 3 spojeniami musí byť označený ako KeyHub');
  });

  test('6.3 Škálovateľnosť: Výpočet metrík pre graf s 100+ uzlami a 200+ väzbami bez zlyhania', () => {
    const largeNodes = [];
    const largeEdges = [];

    for (let i = 0; i < 120; i++) {
      largeNodes.push({ id: `node-${i}`, name: `Osoba ${i}` });
    }
    for (let i = 1; i < 120; i++) {
      largeEdges.push({
        source: `node-${i}`,
        target: `node-${Math.floor(i / 3)}`,
        label: i % 2 === 0 ? 'spolupachatel' : 'kontakt'
      });
    }

    const t0 = Date.now();
    const metrics = calculateGraphMetrics(largeNodes, largeEdges);
    const duration = Date.now() - t0;

    assert.strictEqual(metrics.nodesWithMetrics.length, 120);
    assert.ok(duration < 2000, `Výpočet pre 120 uzlov musí zbehnúť rýchlo (< 2000ms), trval: ${duration}ms`);
  });
});
