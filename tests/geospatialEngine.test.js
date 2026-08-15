import { describe, it, expect } from 'vitest';
import {
  getDistanceBetweenLocationsKm,
  getMinTravelTimeMinutes,
  evaluateTravelFeasibility,
  resolveLocationCoords
} from '../base44/shared/geospatialEngine.ts';

describe('Geospatial Engine & Impossible Travel', () => {
  it('správne vypočíta vzdialenosť medzi Bratislavou a Košicami', () => {
    const distance = getDistanceBetweenLocationsKm('Bratislava', 'Košice');
    expect(distance).toBeGreaterThanOrEqual(380);
    expect(distance).toBeLessThanOrEqual(480);
  });

  it('správne vypočíta minimálny čas jazdy autom (400 km = ~4-5 hodín)', () => {
    const time = getMinTravelTimeMinutes(400);
    expect(time).toBeGreaterThanOrEqual(240);
  });

  it('odhalí nemožné alibi (Bratislava 14:00 -> Košice 14:40 za 40 minút)', () => {
    const result = evaluateTravelFeasibility(
      'Bratislava',
      '14:00',
      'Košice',
      '14:40',
      'Tibor Podozrivý'
    );

    expect(result).not.toBeNull();
    expect(result.isFeasible).toBe(false);
    expect(result.severity).toBe('critical');
    expect(result.explanation).toContain('Fyzikálne nemožný presun');
  });

  it('povolí možný presun pri dostatočnom časovom okne (Bratislava 08:00 -> Košice 16:00)', () => {
    const result = evaluateTravelFeasibility(
      'Bratislava',
      '08:00',
      'Košice',
      '16:00',
      'Tibor Podozrivý'
    );

    expect(result).not.toBeNull();
    expect(result.isFeasible).toBe(true);
    expect(result.severity).toBe('none');
  });
});
