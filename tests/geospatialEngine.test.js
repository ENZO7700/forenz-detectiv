import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getDistanceBetweenLocationsKm,
  getMinTravelTimeMinutes,
  evaluateTravelFeasibility
} from '../base44/shared/geospatialEngine.ts';

describe('Geospatial Engine & Impossible Travel', () => {
  test('správne vypočíta vzdialenosť medzi Bratislavou a Košicami', () => {
    const distance = getDistanceBetweenLocationsKm('Bratislava', 'Košice');
    assert.ok(distance >= 380);
    assert.ok(distance <= 480);
  });

  test('správne vypočíta minimálny čas jazdy autom (400 km = ~4-5 hodín)', () => {
    const time = getMinTravelTimeMinutes(400);
    assert.ok(time >= 240);
  });

  test('odhalí nemožné alibi (Bratislava 14:00 -> Košice 14:40 za 40 minút)', () => {
    const result = evaluateTravelFeasibility(
      'Bratislava',
      '14:00',
      'Košice',
      '14:40',
      'Tibor Podozrivý'
    );

    assert.ok(result);
    assert.strictEqual(result.isFeasible, false);
    assert.strictEqual(result.severity, 'critical');
    assert.ok(result.explanation.includes('Fyzikálne nemožný presun'));
  });

  test('povolí možný presun pri dostatočnom časovom okne (Bratislava 08:00 -> Košice 16:00)', () => {
    const result = evaluateTravelFeasibility(
      'Bratislava',
      '08:00',
      'Košice',
      '16:00',
      'Tibor Podozrivý'
    );

    assert.ok(result);
    assert.strictEqual(result.isFeasible, true);
    assert.strictEqual(result.severity, 'none');
  });
});
