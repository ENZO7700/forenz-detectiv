/**
 * Interaktívny Demo Spis pre ForenzDetectiv: Kauza Bratislava – Košice (Alibi Paradox)
 * Slúži ako okamžitá ukážka (Aha! moment) detekcie nemožného alibi a faktických rozporov s citáciami.
 */

export const DEMO_CASE_DATA = {
  documents: [
    {
      id: 'demo-doc-1',
      title: 'Zápisnica o výsluchu svedka — Ján Kováč.pdf',
      status: 'analyzed',
      created_date: new Date().toISOString(),
      source_text: 'Dňa 14. júna 2026 o 14:15 som osobne videl podozrivého Petra Nováka vychádzať z pobočky banky na Dunajskej ulici v Bratislave. Mal na sebe tmavú bundu a niesol čiernu športovú tašku.',
      image_url: ''
    },
    {
      id: 'demo-doc-2',
      title: 'Zápisnica o výsluchu obvineného — Peter Novák.pdf',
      status: 'analyzed',
      created_date: new Date().toISOString(),
      source_text: 'Kategoricky odmietam akúkoľvek účasť na incidente. V daný deň som vôbec nebol v Bratislave. V čase od 14:00 do 17:00 som sa nepretržite nachádzal vo svojom byte v Košiciach na Hlavnej ulici č. 14 a sledoval televízny prenos, čo mi môže dosvedčiť suseda.',
      image_url: ''
    },
    {
      id: 'demo-doc-3',
      title: 'Kamerový záznam & Terminál — ČS D1 Trnava.pdf',
      status: 'analyzed',
      created_date: new Date().toISOString(),
      source_text: 'Dňa 14. júna 2026 v čase 14:30 bola na ČS D1 Trnava vykonaná bezkontaktná platba kartou vedenou na meno Peter Novák za nákup pohonných hmôt. Kamerový záznam potvrdzuje vozidlo Škoda Octavia BA-982XY.',
      image_url: ''
    }
  ],

  persons: [
    {
      id: 'demo-p-1',
      document_id: 'demo-doc-1',
      name: 'Ján Kováč',
      role: 'witness',
      color: '#3b82f6',
      notes: 'Očitý svedok na Dunajskej ulici v Bratislave'
    },
    {
      id: 'demo-p-2',
      document_id: 'demo-doc-2',
      name: 'Peter Novák',
      role: 'suspect',
      color: '#ef4444',
      notes: 'Hlavný podozrivý tvrdiaci alibi v Košiciach'
    },
    {
      id: 'demo-p-3',
      document_id: 'demo-doc-2',
      name: 'Elena Horváthová',
      role: 'alibi',
      color: '#10b981',
      notes: 'Suseda v Košiciach'
    }
  ],

  relationships: [
    {
      id: 'demo-rel-1',
      document_id: 'demo-doc-1',
      source_name: 'Ján Kováč',
      target_name: 'Peter Novák',
      label: 'videl vychádzať',
      time: '14:15',
      description: 'Svedok videl podozrivého o 14:15 v Bratislave na Dunajskej ulici.'
    },
    {
      id: 'demo-rel-2',
      document_id: 'demo-doc-2',
      source_name: 'Elena Horváthová',
      target_name: 'Peter Novák',
      label: 'uvádza ako alibi',
      time: '14:00-17:00',
      description: 'Suseda v Košiciach uvedená ako potvrdenie alibi.'
    }
  ],

  locations: [
    {
      id: 'demo-loc-1',
      document_id: 'demo-doc-1',
      name: 'Bratislava',
      address: 'Dunajská ulica, Bratislava',
      lat: 48.1486,
      lng: 17.1077
    },
    {
      id: 'demo-loc-2',
      document_id: 'demo-doc-3',
      name: 'Trnava',
      address: 'ČS Slovnaft D1, Trnava',
      lat: 48.3774,
      lng: 17.5883
    },
    {
      id: 'demo-loc-3',
      document_id: 'demo-doc-2',
      name: 'Košice',
      address: 'Hlavná ulica 14, Košice',
      lat: 48.7164,
      lng: 21.2611
    }
  ],

  events: [
    {
      id: 'demo-ev-1',
      document_id: 'demo-doc-1',
      title: 'Videný v Bratislave',
      time: '14:15',
      location: 'Bratislava',
      person_name: 'Peter Novák',
      description: 'Svedok Ján Kováč videl Petra Nováka s čiernou taškou.'
    },
    {
      id: 'demo-ev-2',
      document_id: 'demo-doc-3',
      title: 'Platba kartou v Trnave',
      time: '14:30',
      location: 'Trnava',
      person_name: 'Peter Novák',
      description: 'Záznam terminálu a kamery na ČS D1.'
    },
    {
      id: 'demo-ev-3',
      document_id: 'demo-doc-2',
      title: 'Tvrdený pobyt v Košiciach',
      time: '14:55',
      location: 'Košice',
      person_name: 'Peter Novák',
      description: 'Peter Novák tvrdí, že pozeral televíziu v Košiciach.'
    }
  ],

  claims: [
    {
      id: 'demo-cl-1',
      document_id: 'demo-doc-2',
      speaker: 'Peter Novák',
      claim_text: 'V čase od 14:00 do 17:00 som bol nepretržite v Košiciach.',
      time_ref: '14:00-17:00',
      location_ref: 'Košice'
    },
    {
      id: 'demo-cl-2',
      document_id: 'demo-doc-1',
      speaker: 'Ján Kováč',
      claim_text: 'O 14:15 som videl Petra Nováka na Dunajskej v Bratislave.',
      time_ref: '14:15',
      location_ref: 'Bratislava'
    }
  ],

  redFlags: [
    {
      id: 'demo-rf-1',
      document_id: 'demo-doc-2',
      title: 'Rozpor v alibi (Bratislava vs Košice)',
      severity: 'critical',
      description: 'Časový odstup 40 minút medzi BA (14:15) a KE (14:55) predstavuje rýchlosť 675 km/h.',
      quote: 'V čase od 14:00 do 17:00 som sa nepretržite nachádzal vo svojom byte v Košiciach'
    }
  ],

  flaggedPassages: [
    {
      id: 'demo-fp-1',
      document_id: 'demo-doc-1',
      quote: 'Dňa 14. júna 2026 o 14:15 som osobne videl podozrivého Petra Nováka v Bratislave.',
      reason: 'Kľúčové umiestnenie v čase incidentu',
      severity: 'high'
    },
    {
      id: 'demo-fp-2',
      document_id: 'demo-doc-2',
      quote: 'V daný deň som vôbec nebol v Bratislave.',
      reason: 'Vyvrátené svedeckou výpoveďou a kamerovým záznamom z D1',
      severity: 'critical'
    }
  ],

  vehicles: [
    {
      id: 'demo-veh-1',
      document_id: 'demo-doc-3',
      license_plate: 'BA-982XY',
      model: 'Škoda Octavia čierna',
      owner_name: 'Peter Novák'
    }
  ],

  contradictions: [
    {
      id: 'demo-contra-1',
      document_a_id: 'demo-doc-1',
      document_b_id: 'demo-doc-2',
      entity_ref: 'Peter Novák',
      type: 'alibi_impossible',
      severity: 'critical',
      title: '❌ Geograficky nemožné alibi (Bratislava ➡️ Košice za 40 min)',
      description: 'Svedecká výpoveď potvrdzuje prítomnosť Petra Nováka v Bratislave o 14:15 a kamerový záznam z Trnavy o 14:30. Tvrdenie obvineného o pobyte v Košiciach o 14:55 by vyžadovalo presun 450 km za 40 minút priemernou rýchlosťou 675 km/h, čo je pozemným vozidlom fyzikálne nemožné.',
      source_quote_a: 'Dňa 14. júna 2026 o 14:15 som osobne videl podozrivého Petra Nováka vychádzať z pobočky banky na Dunajskej ulici v Bratislave.',
      source_quote_b: 'V čase od 14:00 do 17:00 som sa nepretržite nachádzal vo svojom byte v Košiciach na Hlavnej ulici č. 14.',
      speed_kmh: 675,
      distance_km: 450,
      time_delta_minutes: 40
    },
    {
      id: 'demo-contra-2',
      document_a_id: 'demo-doc-3',
      document_b_id: 'demo-doc-2',
      entity_ref: 'Peter Novák',
      type: 'factual_conflict',
      severity: 'high',
      title: '⚠️ Priamy rozpor: Záznam z čerpacej stanice Trnava vs. Domáci pobyt',
      description: 'Obvinený tvrdí, že neopustil byt v Košiciach, avšak bankový terminál a kamera zaznamenali jeho platbu a vozidlo na D1 v Trnave o 14:30.',
      source_quote_a: 'Dňa 14. júna 2026 v čase 14:30 bola na ČS D1 Trnava vykonaná platba kartou vedenou na meno Peter Novák...',
      source_quote_b: 'V daný deň som vôbec nebol v Bratislave... bol som v Košiciach.'
    }
  ],

  overrides: []
};
