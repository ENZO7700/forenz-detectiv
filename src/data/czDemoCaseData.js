/**
 * Český ukážkový vyšetrovací spis pre prezentácie a testovanie: Kauza Praha – Brno.
 */
export const CZ_DEMO_CASE = {
  caseTitle: 'Kauza Praha – Brno (Spis ČVS-442/2026)',
  description: 'Vyšetřování podvodu a ověření alibi podezřelého Ing. Jana Nováka na dálnici D1.',
  documents: [
    {
      id: 'doc_cz_1',
      title: 'Protokol o výslechu svědka (Kavárna Praha)',
      created_at: '2026-03-12',
      content: 'Svědek Mgr. Petr Dvořák uvedl: "Dne 12.3.2026 jsem se osobně setkal s panem Ing. Janem Novákem v kavárně v Praze na Václavském náměstí. Jednání skončilo přesně v 15:00, kdy pan Novák nasedl do černého vozu Škoda Superb."'
    },
    {
      id: 'doc_cz_2',
      title: 'Záznam o předání bankovních dokumentů (Brno)',
      created_at: '2026-03-12',
      content: 'Podle protokolu bankovní pobočky v Brně (náměstí Svobody) byl Ing. Jan Novák fyzicky přítomen a podepsal převzetí hotovosti v 15:35 téhož dne.'
    }
  ],
  persons: [
    { id: 'p_cz_1', name: 'Ing. Jan Novák', type: 'podozrivý', details: 'Obviněný podnikatel' },
    { id: 'p_cz_2', name: 'Mgr. Petr Dvořák', type: 'svedok', details: 'Svědek z Prahy' }
  ],
  contradictions: [
    {
      id: 'c_cz_1',
      type: 'Geograficky nemožné alibi',
      entity_ref: 'Ing. Jan Novák',
      locationA: 'Praha (Václavské náměstí)',
      timeA: '15:00',
      locationB: 'Brno (náměstí Svobody)',
      timeB: '15:35',
      distanceKm: 210,
      intervalMinutes: 35,
      requiredSpeedKmH: 360,
      quoteA: '„Jednání skončilo přesně v 15:00 v Praze...“ (Výpověď svědka)',
      quoteB: '„...fyzicky přítomen a podepsal převzetí v Brně v 15:35.“ (Bankovní protokol)',
      explanation: 'Přesun Praha ➡️ Brno (210 km) za 35 minut vyžaduje průměrnou rychlost 360 km/h po D1, což je s pozemním vozidlem fyzikálně vyloučeno.'
    }
  ]
};
