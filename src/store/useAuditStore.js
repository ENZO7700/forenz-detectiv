import { create } from 'zustand';

const getStoredLogs = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('forenz_audit_logs');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const persistLogs = (logs) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('forenz_audit_logs', JSON.stringify(logs.slice(-200)));
    } catch (e) {
      console.warn('Nepodarilo sa uložiť audit log do localStorage', e);
    }
  }
};

export const useAuditStore = create((set, get) => ({
  logs: getStoredLogs(),

  logAction: (actionType, details = {}) => {
    const newEntry = {
      id: 'LOG-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      action: actionType, // 'CASE_CREATED' | 'DOC_UPLOADED' | 'AI_ANALYSIS' | 'CONTRADICTION_FLAGGED' | 'PDF_EXPORTED' | 'VIEW_ACCESSED'
      details: typeof details === 'string' ? { description: details } : details,
      userRole: 'Vyšetrovateľ / Obhajca'
    };

    set((state) => {
      const updated = [newEntry, ...state.logs].slice(0, 200);
      persistLogs(updated);
      return { logs: updated };
    });

    return newEntry;
  },

  clearLogs: () => {
    persistLogs([]);
    set({ logs: [] });
  },

  exportLogsAsCsv: () => {
    const { logs } = get();
    const headers = 'ID,Časová pečiatka (ISO),Typ akcie,Rola,Detaily\n';
    const rows = logs.map(l => {
      const desc = JSON.stringify(l.details || {}).replace(/"/g, '""');
      return `"${l.id}","${l.timestamp}","${l.action}","${l.userRole}","${desc}"`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `forenz-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  exportLogsAsTxt: () => {
    const { logs } = get();
    const content = [
      '=================================================================',
      'FORENZDETECTIV — AUDIT LOG & REŤAZEC DÔKAZOV (CHAIN OF CUSTODY)',
      `Vygenerované: ${new Date().toLocaleString('sk-SK')}`,
      `Počet záznamov: ${logs.length}`,
      '=================================================================\n',
      ...logs.map(l => `[${l.timestamp}] [${l.action}] (${l.userRole}) -> ${JSON.stringify(l.details)}`)
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `forenz-audit-log-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}));
