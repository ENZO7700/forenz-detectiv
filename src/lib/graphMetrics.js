import Graph from 'graphology';
import pagerank from 'graphology-metrics/centrality/pagerank.js';

export const RELATIONSHIP_TYPES = {
  SPOLUPACHATEL: 'spolupachatel',
  NEPRIATELSTVO: 'nepriatelstvo',
  FINANCIE: 'financie',
  RODINA: 'rodina',
  ALIBI: 'alibi',
  KONTAKT: 'kontakt'
};

// Klasifikácia vzťahu podľa textu/typu
export function classifyRelationship(edge) {
  const label = String(edge?.label || edge?.type || '');
  const desc = String(edge?.description || '');
  const raw = `${label} ${desc}`;
  const full = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  if (full.includes('spolupach') || full.includes('spolupachatel') || full.includes('dohoda') || full.includes('komplic')) {
    return {
      type: RELATIONSHIP_TYPES.SPOLUPACHATEL,
      color: '#dc2626', // Červená
      strokeWidth: 3,
      importance: 5,
      labelBadge: 'Spolupáchateľ'
    };
  }

  if (full.includes('nepriatel') || full.includes('konflikt') || full.includes('hadka') || full.includes('vyhrazanie') || full.includes('rozpor')) {
    return {
      type: RELATIONSHIP_TYPES.NEPRIATELSTVO,
      color: '#f97316', // Oranžová
      strokeWidth: 2.5,
      importance: 4,
      labelBadge: 'Konflikt'
    };
  }

  if (full.includes('peniaz') || full.includes('platba') || full.includes('ucet') || full.includes('prevod') || full.includes('dlh') || full.includes('pozicka')) {
    return {
      type: RELATIONSHIP_TYPES.FINANCIE,
      color: '#eab308', // Zlatá / Žltá
      strokeWidth: 2.5,
      importance: 4,
      labelBadge: 'Finančný tok'
    };
  }

  if (full.includes('otec') || full.includes('matka') || full.includes('syn') || full.includes('dcera') || full.includes('brat') || full.includes('sestra') || full.includes('manzel') || full.includes('rodin')) {
    return {
      type: RELATIONSHIP_TYPES.RODINA,
      color: '#8b5cf6', // Fialová
      strokeWidth: 2,
      importance: 3,
      labelBadge: 'Rodina'
    };
  }

  if (full.includes('alibi') || full.includes('potvrdil') || full.includes('svedci')) {
    return {
      type: RELATIONSHIP_TYPES.ALIBI,
      color: '#10b981', // Zelená
      strokeWidth: 2,
      importance: 3,
      labelBadge: 'Alibi kontakt'
    };
  }

  return {
    type: RELATIONSHIP_TYPES.KONTAKT,
    color: '#3b82f6', // Modrá
    strokeWidth: 1.5,
    importance: 1,
    labelBadge: 'Kontakt'
  };
}

// Výpočet sieťovej centrality (PageRank & Degree) pre osoby
export function calculateGraphMetrics(persons = [], edges = []) {
  if (!persons.length) return { nodesWithMetrics: [], topSuspects: [] };

  const graph = new Graph({ multi: true, type: 'undirected' });

  // 1. Pridanie uzlov
  for (const p of persons) {
    const id = String(p.id || p.label);
    if (!graph.hasNode(id)) {
      graph.addNode(id, { ...p });
    }
  }

  // 2. Pridanie hrán
  for (const e of edges) {
    const src = String(e.source?.id || e.source || '');
    const tgt = String(e.target?.id || e.target || '');
    if (src && tgt && graph.hasNode(src) && graph.hasNode(tgt) && src !== tgt) {
      try {
        graph.addEdge(src, tgt, { ...e });
      } catch {
        // Ignoruj duplicitné hrany
      }
    }
  }

  // 3. Výpočet PageRank
  let scores = {};
  try {
    if (graph.order > 0 && graph.size > 0) {
      scores = pagerank(graph, { alpha: 0.85, maxIterations: 100, tolerance: 1e-6 }) || {};
    }
  } catch (err) {
    console.warn('PageRank calculation fallback:', err);
  }

  // 4. Obohatenie uzlov o metriky
  const nodesWithMetrics = persons.map((p) => {
    const id = String(p.id || p.label);
    const prScore = scores[id] || (1 / (persons.length || 1));
    const degree = graph.hasNode(id) ? graph.degree(id) : 0;

    // Normalizácia polomeru uzla: min 5, max 16
    const normalizedRadius = Math.min(16, Math.max(6, 6 + prScore * 35 + degree * 0.8));

    return {
      ...p,
      pageRankScore: prScore,
      degree,
      isKeyHub: degree >= 3 || prScore > 0.1,
      nodeRadius: normalizedRadius
    };
  });

  const topSuspects = [...nodesWithMetrics]
    .sort((a, b) => (b.pageRankScore || 0) - (a.pageRankScore || 0))
    .slice(0, 5);

  return {
    nodesWithMetrics,
    topSuspects,
    graphStats: {
      totalNodes: graph.order,
      totalEdges: graph.size
    }
  };
}
