import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { fileToNormalizedBase64, base64DataUrlToBlobFile } from '@/lib/imageProcessor';
import { parseTimeToMinutes, namesMatch } from '@/lib/forenzUtils';
import { mapWithAdaptiveConcurrency } from '@/lib/adaptiveConcurrency';
import DocumentList from '@/components/forenz/DocumentList';
import ScanButton from '@/components/forenz/ScanButton';
import BulkScanButton from '@/components/forenz/BulkScanButton';
import StatsBar from '@/components/forenz/StatsBar';
import GraphCanvas from '@/components/forenz/GraphCanvas';
import PersonPanel from '@/components/forenz/PersonPanel';
import TimeSlider from '@/components/forenz/TimeSlider';
import RedFlagsPanel from '@/components/forenz/RedFlagsPanel';
import SherlockChat from '@/components/forenz/SherlockChat';
import ArchiveView from '@/components/forenz/ArchiveView';
import EventTimeline from '@/components/forenz/EventTimeline';
import QuickSearchDialog from '@/components/forenz/QuickSearchDialog';
import WelcomeIntroModal from '@/components/forenz/WelcomeIntroModal';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { exportForensicCasePdf } from '@/lib/pdfExporter';
import { Network, Download, Loader2, Share2, ShieldCheck, Archive, LayoutDashboard, BarChart3, Ban, Layers, Menu, Bell, Users, FileText, ShieldAlert, Clock, Search as SearchIcon, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MobileDrawer from '@/components/forenz/MobileDrawer';
import MobileBottomNav from '@/components/forenz/MobileBottomNav';
import MobileDashboard from '@/components/forenz/MobileDashboard';
import IdentityPanel from '@/components/forenz/IdentityPanel';
import CollapsibleSidebar from '@/components/forenz/CollapsibleSidebar';
import { useForenzStore } from '@/store/useForenzStore';

export default function ForenzDetectiv({ readOnly = false, scope = null, sharedBy = null, initialData = null }) {
  const documents = useForenzStore((s) => s.documents);
  const persons = useForenzStore((s) => s.persons);
  const relationships = useForenzStore((s) => s.relationships);
  const redFlags = useForenzStore((s) => s.redFlags);
  const flaggedPassages = useForenzStore((s) => s.flaggedPassages);
  const claims = useForenzStore((s) => s.claims);
  const events = useForenzStore((s) => s.events);
  const locations = useForenzStore((s) => s.locations);
  const vehicles = useForenzStore((s) => s.vehicles);
  const contradictions = useForenzStore((s) => s.contradictions);
  const overrides = useForenzStore((s) => s.overrides);

  const loading = useForenzStore((s) => s.loading);
  const scanning = useForenzStore((s) => s.scanning);
  const setScanning = useForenzStore((s) => s.setScanning);
  const bulkProgress = useForenzStore((s) => s.bulkProgress);
  const setBulkProgress = useForenzStore((s) => s.setBulkProgress);
  const selectedDocId = useForenzStore((s) => s.selectedDocId);
  const setSelectedDocId = useForenzStore((s) => s.setSelectedDocId);
  const activeView = useForenzStore((s) => s.activeView);
  const setActiveView = useForenzStore((s) => s.setActiveView);
  const selectedPerson = useForenzStore((s) => s.selectedPerson);
  const setSelectedPerson = useForenzStore((s) => s.setSelectedPerson);
  const currentUser = useForenzStore((s) => s.currentUser);
  const setCurrentUser = useForenzStore((s) => s.setCurrentUser);
  const sherlockSignal = useForenzStore((s) => s.sherlockSignal);
  const setSherlockSignal = useForenzStore((s) => s.setSherlockSignal);
  const selectedEdge = useForenzStore((s) => s.selectedEdge);
  const setSelectedEdge = useForenzStore((s) => s.setSelectedEdge);
  const maxTime = useForenzStore((s) => s.maxTime);
  const setMaxTime = useForenzStore((s) => s.setMaxTime);
  const showStats = useForenzStore((s) => s.showStats);
  const setShowStats = useForenzStore((s) => s.setShowStats);
  const activeShare = useForenzStore((s) => s.activeShare);
  const setActiveShare = useForenzStore((s) => s.setActiveShare);
  const leftCollapsed = useForenzStore((s) => s.leftCollapsed);
  const setLeftCollapsed = useForenzStore((s) => s.setLeftCollapsed);
  const rightCollapsed = useForenzStore((s) => s.rightCollapsed);
  const setRightCollapsed = useForenzStore((s) => s.setRightCollapsed);
  const searchOpen = useForenzStore((s) => s.searchOpen);
  const setSearchOpen = useForenzStore((s) => s.setSearchOpen);
  const introOpen = useForenzStore((s) => s.introOpen);
  const setIntroOpen = useForenzStore((s) => s.setIntroOpen);
  const replaying = useForenzStore((s) => s.replaying);
  const setReplaying = useForenzStore((s) => s.setReplaying);
  const activeEdgeId = useForenzStore((s) => s.activeEdgeId);
  const setActiveEdgeId = useForenzStore((s) => s.setActiveEdgeId);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const replayRef = useRef(null);
  const pulseRef = useRef(null);

  const fetchStoreData = useForenzStore((s) => s.fetchData);
  const fetchData = useCallback(() => fetchStoreData(scope, initialData), [fetchStoreData, scope, initialData]);

  useEffect(() => {
    fetchStoreData(scope, initialData);
  }, [fetchStoreData, scope, initialData]);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const handleSherlockTab = useCallback(() => {
    setActiveView('graph');
    setSherlockSignal((s) => s + 1);
  }, []);

  const graphEdges = useMemo(() => {
    return relationships
      .map((r) => {
        const s = persons.find((p) => p.document_id === r.document_id && p.name === r.source_name);
        const t = persons.find((p) => p.document_id === r.document_id && p.name === r.target_name);
        return {
          id: r.id,
          source: s?.id,
          target: t?.id,
          sourceName: r.source_name,
          targetName: r.target_name,
          label: r.label,
          time: r.time,
          description: r.description,
          document_id: r.document_id,
          document_title: r.document_title
        };
      })
      .filter((e) => e.source && e.target);
  }, [relationships, persons]);

  const mergedEdges = useMemo(() => {
    const edges = [];
    for (let i = 0; i < persons.length; i++) {
      for (let j = i + 1; j < persons.length; j++) {
        if (persons[i].document_id !== persons[j].document_id && namesMatch(persons[i].name, persons[j].name)) {
          edges.push({ source: persons[i].id, target: persons[j].id });
        }
      }
    }
    return edges;
  }, [persons]);

  const visiblePersons = useMemo(
    () => (selectedDocId ? persons.filter((p) => p.document_id === selectedDocId) : persons),
    [persons, selectedDocId]
  );
  const visibleEdges = useMemo(
    () => graphEdges.filter((e) => !selectedDocId || e.document_id === selectedDocId),
    [graphEdges, selectedDocId]
  );
  const visibleMerged = useMemo(() => (selectedDocId ? [] : mergedEdges), [mergedEdges, selectedDocId]);
  const visibleRedFlags = useMemo(
    () => (selectedDocId ? redFlags.filter((r) => r.document_id === selectedDocId) : redFlags),
    [redFlags, selectedDocId]
  );
  const visibleFlaggedPassages = useMemo(
    () => (selectedDocId ? flaggedPassages.filter((p) => p.document_id === selectedDocId) : flaggedPassages),
    [flaggedPassages, selectedDocId]
  );
  const visibleClaims = useMemo(
    () => (selectedDocId ? claims.filter((c) => c.document_id === selectedDocId) : claims),
    [claims, selectedDocId]
  );
  const visibleEvents = useMemo(
    () => (selectedDocId ? events.filter((e) => e.document_id === selectedDocId) : events),
    [events, selectedDocId]
  );
  const visibleContradictions = useMemo(
    () => {
      if (!selectedDocId) return contradictions;
      return contradictions.filter((c) => c.document_a_id === selectedDocId || c.document_b_id === selectedDocId);
    },
    [contradictions, selectedDocId]
  );

  const timeBounds = useMemo(() => {
    const times = visibleEdges.map((e) => parseTimeToMinutes(e.time)).filter((t) => t != null);
    if (!times.length) return { min: 0, max: 0, hasTime: false };
    return { min: Math.min(...times), max: Math.max(...times), hasTime: true };
  }, [visibleEdges]);

  const timeEnabled = timeBounds.hasTime;
  useEffect(() => {
    if (timeBounds.hasTime) setMaxTime(timeBounds.max);
    stopReplay();
  }, [timeBounds.min, timeBounds.max, timeBounds.hasTime]);

  const handleScan = async (file) => {
    setScanning(true);
    try {
      // LOAD → PREPROCESS → UPLOAD preprocessed → RELEASE local memory → ANALYZE FROM STORAGE
      const base64 = await fileToNormalizedBase64(file);
      const outFile = base64DataUrlToBlobFile(base64, file.name);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: outFile });
      const doc = await base44.entities.Document.create({
        title: file.name,
        image_url: file_url,
        status: 'pending'
      });
      await fetchData();
      try {
        await base44.functions.invoke('analyzeDocument', {
          documentId: doc.id,
          documentTitle: file.name
        });
      } catch (err) {
        console.error('Analýza zlyhala:', err);
      }
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setScanning(false);
    }
  };

  const handleBulkScan = async (files) => {
    const batch = files.slice(0, 100);
    setScanning(true);
    setBulkProgress({ total: batch.length, done: 0, analyzing: 0, failed: 0 });
    try {
      // Pipeline jeden-dokument-na-workera: preprocess → upload → create → analyze,
      // potom sa lokálna pamäť (base64/blob) uvoľní. Žiadny queue držiaci 100 base64.
      await mapWithAdaptiveConcurrency(batch, 6, 8, async (file) => {
        let base64 = await fileToNormalizedBase64(file);
        let outFile = base64DataUrlToBlobFile(base64, file.name);
        const { file_url } = await base44.integrations.Core.UploadFile({ file: outFile });
        // Explicitné uvoľnenie lokálnej pamäte — GC môže zahodiť base64/blob pred
        // ďalším dokumentom (pre 100 dokumentov ~ rozdiel 2 GB vs 200 MB heap).
        base64 = null;
        outFile = null;
        const doc = await base44.entities.Document.create({
          title: file.name,
          image_url: file_url,
          status: 'pending'
        });
        setBulkProgress((p) => ({ ...p, analyzing: p.analyzing + 1 }));
        try {
          const res = await base44.functions.invoke('analyzeDocument', {
            documentId: doc.id,
            documentTitle: file.name
          });
          if (res?.data?.ok) {
            setBulkProgress((p) => ({ ...p, analyzing: Math.max(0, p.analyzing - 1), done: p.done + 1 }));
          } else {
            setBulkProgress((p) => ({ ...p, analyzing: Math.max(0, p.analyzing - 1), failed: p.failed + 1 }));
          }
        } catch (err) {
          console.error('Analýza zlyhala:', err);
          setBulkProgress((p) => ({ ...p, analyzing: Math.max(0, p.analyzing - 1), failed: p.failed + 1 }));
        }
      });
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setScanning(false);
      setBulkProgress(null);
    }
  };

  const handleRetryAnalysis = async (doc) => {
    try {
      await base44.entities.Document.update(doc.id, { status: 'pending', last_error: '' });
      setBulkProgress({ total: 1, done: 0, analyzing: 1, failed: 0 });
      try {
        const res = await base44.functions.invoke('analyzeDocument', { documentId: doc.id, documentTitle: doc.title });
        setBulkProgress(null);
        if (!res?.data?.ok) showToast('Analýza opäť zlyhala: ' + (res?.data?.error || ''));
      } catch (err) {
        setBulkProgress(null);
        showToast('Retry zlyhal: ' + (err?.message || ''));
      }
      await fetchData();
    } catch (e) {
      console.error(e);
      setBulkProgress(null);
      showToast('Retry zlyhal');
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Naozaj zmazať výpoveď "${doc.title}" a všetky súvisiace dáta (osoby, vzťahy, varovania, tvrdenia, udalosti, miesta, vozidlá, rozpory)? Túto akciu nie je možné vrátiť späť.`)) {
      return;
    }
    try {
      await base44.entities.Person.deleteMany({ document_id: doc.id });
      await base44.entities.Relationship.deleteMany({ document_id: doc.id });
      await base44.entities.RedFlag.deleteMany({ document_id: doc.id });
      await base44.entities.FlaggedPassage.deleteMany({ document_id: doc.id });
      await base44.entities.ForensicClaim.deleteMany({ document_id: doc.id });
      await base44.entities.Event.deleteMany({ document_id: doc.id });
      await base44.entities.Location.deleteMany({ document_id: doc.id });
      await base44.entities.Vehicle.deleteMany({ document_id: doc.id });
      // Contradiction môže byť ako ktorákoľvek strana — mažem obidve
      await base44.entities.Contradiction.deleteMany({ document_a_id: doc.id });
      await base44.entities.Contradiction.deleteMany({ document_b_id: doc.id });
      await base44.entities.Document.delete(doc.id);
      if (selectedDocId === doc.id) setSelectedDocId(null);
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleShare = async () => {
    try {
      const me = await base44.auth.me();
      const bytes = new Uint8Array(24);
      crypto.getRandomValues(bytes);
      const token = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
      const docId = selectedDocId || '';
      const docTitle = selectedDocId
        ? documents.find((d) => d.id === selectedDocId)?.title
        : 'Celý prípad';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const created = await base44.entities.SharedCase.create({
        token,
        document_id: docId,
        document_title: docTitle || '',
        expires_at: expiresAt,
        created_by: me.id,
        created_by_name: me.full_name || me.email || 'Neznámy'
      });
      const url = `${window.location.origin}/shared/${token}`;
      await navigator.clipboard.writeText(url);
      setActiveShare({ id: created.id, token });
      showToast('Link skopírovaný (platný 7 dní)');
    } catch (e) {
      console.error(e);
      showToast('Zdieľanie zlyhalo');
    }
  };

  const handleRevokeShare = async () => {
    if (!activeShare) return;
    try {
      await base44.entities.SharedCase.update(activeShare.id, {
        revoked_at: new Date().toISOString()
      });
      setActiveShare(null);
      showToast('Link zneplatnený');
    } catch (e) {
      console.error(e);
      showToast('Zneplatnenie zlyhalo');
    }
  };

  const handleCreateOverrides = async (payloads) => {
    if (!payloads?.length) return;
    try {
      await base44.entities.IdentityOverride.bulkCreate(payloads);
      const ovs = await base44.entities.IdentityOverride.list('-created_date', 500);
      setOverrides(ovs || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRevokeOverride = async (id) => {
    try {
      await base44.entities.IdentityOverride.delete(id);
      const ovs = await base44.entities.IdentityOverride.list('-created_date', 500);
      setOverrides(ovs || []);
    } catch (e) {
      console.error(e);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleSelectEdge = useCallback((e) => {
    setSelectedPerson(null);
    setSelectedEdge(e);
  }, []);

  const handleSelectPerson = useCallback((p) => {
    setSelectedEdge(null);
    setSelectedPerson(p);
  }, []);

  const handleJumpToPerson = useCallback((person) => {
    setSelectedDocId(person.document_id);
    setSelectedPerson(person);
    setSelectedEdge(null);
    setActiveView('graph');
  }, []);

  const handleJumpToEdge = useCallback((documentId, edgeId) => {
    setSelectedDocId(documentId);
    setSelectedPerson(null);
    setSelectedEdge(graphEdges.find((e) => e.id === edgeId) || null);
    setActiveView('graph');
  }, [graphEdges]);

  const handleJumpToContradiction = useCallback((contr) => {
    const docId = contr.document_a_id;
    setSelectedDocId(docId);
    setSelectedEdge(null);
    const p = persons.find((pp) => pp.document_id === docId && pp.name === contr.entity_ref);
    setSelectedPerson(p || null);
    setActiveView('graph');
  }, [persons]);

  const handleJumpToArchive = useCallback((documentId) => {
    setSelectedDocId(documentId);
    setActiveView('archive');
  }, []);

  const handleExport = async () => {
    try {
      const canvas = document.querySelector('.relative.flex-1 canvas');
      await exportForensicCasePdf({
        documents: selectedDocId ? documents.filter((d) => d.id === selectedDocId) : documents,
        persons: visiblePersons,
        relationships: visibleEdges,
        redFlags: visibleRedFlags,
        flaggedPassages: visibleFlaggedPassages,
        claims: visibleClaims,
        events: visibleEvents,
        contradictions: visibleContradictions,
        graphCanvasElement: canvas,
        scopeTitle: selectedDocId ? `Výpoveď: ${documents.find((d) => d.id === selectedDocId)?.title || selectedDocId}` : 'Celý prípad'
      });
      showToast('PDF report bol úspešne vygenerovaný.');
    } catch (err) {
      console.error('Export do PDF zlyhal:', err);
      showToast('Export do PDF zlyhal: ' + (err.message || ''));
    }
  };

  const handleExportAll = async () => {
    try {
      const canvas = document.querySelector('.relative.flex-1 canvas');
      await exportForensicCasePdf({
        documents,
        persons,
        relationships,
        redFlags,
        flaggedPassages,
        claims,
        events,
        contradictions,
        graphCanvasElement: canvas,
        scopeTitle: 'Kompletný vyšetrovací archív'
      });
      showToast('Kompletný archívny PDF report bol úspešne vygenerovaný.');
    } catch (err) {
      console.error('Export archívu do PDF zlyhal:', err);
      showToast('Export archívu zlyhal: ' + (err.message || ''));
    }
  };

  // Replay controls
  const stopReplay = useCallback(() => {
    if (replayRef.current) {
      clearInterval(replayRef.current);
      replayRef.current = null;
    }
    setReplaying(false);
  }, []);

  const startReplay = useCallback(() => {
    if (!timeEnabled) return;
    setReplaying(true);
    setMaxTime(timeBounds.min);
    let cur = timeBounds.min;
    replayRef.current = setInterval(() => {
      const next = Math.min(cur + 5, timeBounds.max);
      cur = next;
      setMaxTime(next);
      const entered = visibleEdges.filter((e) => {
        const t = parseTimeToMinutes(e.time);
        return t != null && t <= next && t > next - 5;
      });
      if (entered.length) {
        setActiveEdgeId(entered[entered.length - 1].id);
        clearTimeout(pulseRef.current);
        pulseRef.current = setTimeout(() => setActiveEdgeId(null), 2000);
      }
      if (next >= timeBounds.max) {
        clearInterval(replayRef.current);
        replayRef.current = null;
        setReplaying(false);
      }
    }, 800);
  }, [timeEnabled, timeBounds.min, timeBounds.max, visibleEdges]);

  useEffect(() => {
    return () => {
      clearInterval(replayRef.current);
      clearTimeout(pulseRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      {sharedBy && (
        <div className="flex items-center gap-2 px-4 py-2 bg-violet-600/15 border-b border-violet-600/30 text-violet-200 text-sm">
          <ShieldCheck className="w-4 h-4" />
          <span>Zdieľaný prípad od <strong>{sharedBy}</strong> · len na čítanie</span>
        </div>
      )}

      <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-white/40 dark:border-white/10 liquid-glass-panel shrink-0">
        <button onClick={() => setMobileMenuOpen(true)} className="text-blue-700 dark:text-blue-400 hover:text-blue-900 p-1" aria-label="Menu">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex-1 flex items-center justify-center gap-2">
          <Network className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          <h1 className="text-sm font-bold text-blue-800 dark:text-blue-300">ForenzDetectiv</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <button className="relative text-blue-700 dark:text-blue-400 hover:text-blue-900 p-1" aria-label="Notifikácie">
            <Bell className="w-5 h-5" />
            {(redFlags.length + contradictions.length) > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-600 text-[8px] text-white flex items-center justify-center font-bold">
                {redFlags.length + contradictions.length}
              </span>
            )}
          </button>
          {!readOnly && <ScanButton onScan={handleScan} scanning={scanning} />}
        </div>
      </header>

      <header className="hidden lg:flex items-center gap-3 px-4 py-3 border-b border-white/40 dark:border-white/10 liquid-glass-panel shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-red-600 p-0.5 flex items-center justify-center shadow-glass-sm">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Network className="w-4 h-4 text-white" />
            </div>
          </div>
          <h1 className="text-base font-bold text-blue-900 dark:text-white tracking-tight">ForenzDetectiv</h1>
        </div>
        <span className="text-xs text-blue-700/80 dark:text-blue-400/80 font-medium hidden sm:inline">
          {documents.length} výpovedí · {persons.length} osôb · {relationships.length} vzťahov · {redFlags.length} varovaní · {flaggedPassages.length} zvýraznení
        </span>
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <button
            onClick={() => setSearchOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl liquid-glass-card text-slate-700 dark:text-slate-200 text-sm shadow-glass-sm"
            title="Rýchle vyhľadávanie v prípade (Ctrl+K)"
          >
            <SearchIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Hľadať</span>
            <kbd className="hidden md:inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-700 text-slate-500 dark:text-slate-400">Ctrl+K</kbd>
          </button>
          <button
            onClick={() => setIntroOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-gradient-to-r from-blue-600/15 via-white/50 to-red-600/15 dark:from-blue-600/25 dark:via-slate-800/50 dark:to-red-600/25 text-slate-800 dark:text-slate-100 border border-blue-200/60 dark:border-white/10 hover:bg-white/90 dark:hover:bg-slate-700 transition-all text-sm shadow-glass-sm"
            title="Sprievodca systémom ForenzDetectiv (3 kroky)"
          >
            <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline font-medium">Sprievodca</span>
          </button>
          {!readOnly && (
            <>
              <button
                onClick={() => setShowStats((s) => !s)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-2xl text-sm transition-colors ${
                  showStats ? 'bg-blue-600/20 text-blue-700 border border-blue-200/40' : 'bg-white/40 text-slate-600 border border-white hover:bg-white/70'
                }`}
                title="Zobraziť/skryť štatistiky"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Štatistiky</span>
              </button>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/40 text-slate-600 border border-white hover:bg-white/70 transition-colors text-sm"
                title="Dashboard so štatistikami"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <button
                onClick={() => setActiveView('identity')}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/40 text-slate-600 border border-white hover:bg-white/70 transition-colors text-sm"
                title="Správa identít"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Identity</span>
              </button>
              <button
                onClick={handleShare}
                disabled={!documents.length}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-blue-600/10 text-blue-700 border border-blue-200/40 hover:bg-blue-600/20 disabled:opacity-50 transition-colors text-sm"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Zdieľať</span>
              </button>
              {activeShare && (
                <button
                  onClick={handleRevokeShare}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-red-600/10 text-red-700 border border-red-200/40 hover:bg-red-600/20 transition-colors text-sm"
                  title="Zneplatniť aktívny zdieľaný link"
                >
                  <Ban className="w-4 h-4" />
                  <span className="hidden sm:inline">Zneplatniť link</span>
                </button>
              )}
              <button
                onClick={handleExport}
                disabled={!persons.length}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/40 text-slate-600 border border-white hover:bg-white/70 disabled:opacity-50 transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Report PDF</span>
              </button>
              <button
                onClick={handleExportAll}
                disabled={!documents.length}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/40 text-slate-600 border border-white hover:bg-white/70 disabled:opacity-50 transition-colors text-sm"
                title="Hromadný export všetkých prípadov do jedného PDF"
              >
                <Archive className="w-4 h-4" />
                <span className="hidden sm:inline">Archív PDF</span>
              </button>
              <BulkScanButton onBulkScan={handleBulkScan} scanning={scanning} progress={bulkProgress} />
              <ScanButton onScan={handleScan} scanning={scanning} />
            </>
          )}
        </div>
      </header>

      {bulkProgress && (
        <div className="px-4 py-1.5 bg-white/70 backdrop-blur-3xl border-b border-white flex items-center gap-3 text-xs text-blue-600 shrink-0">
          <span className="shrink-0 tabular-nums whitespace-nowrap">
            {bulkProgress.done} ✓ · {bulkProgress.analyzing} ⏳ · {bulkProgress.failed} ✕ / {bulkProgress.total}
          </span>
          <div className="flex-1 h-1.5 rounded bg-slate-800 overflow-hidden flex">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${bulkProgress.total ? (bulkProgress.done / bulkProgress.total) * 100 : 0}%` }} />
            <div className="h-full bg-amber-500 transition-all" style={{ width: `${bulkProgress.total ? (bulkProgress.analyzing / bulkProgress.total) * 100 : 0}%` }} />
            <div className="h-full bg-red-500 transition-all" style={{ width: `${bulkProgress.total ? (bulkProgress.failed / bulkProgress.total) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {showStats && !readOnly && (
        <StatsBar
          documents={documents}
          persons={persons}
          relationships={relationships}
          redFlags={redFlags}
          flaggedPassages={flaggedPassages}
        />
      )}

      <div className="hidden lg:flex shrink-0 items-center gap-1 px-4 py-2 border-b border-white bg-white/70 backdrop-blur-3xl">
        <button
          onClick={() => setActiveView('graph')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
            activeView === 'graph' ? 'bg-blue-600/15 text-blue-700 border border-blue-200/40' : 'bg-white/40 text-slate-600 border border-white hover:bg-white/70'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          Pavúk
        </button>
        <button
          onClick={() => setActiveView('archive')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
            activeView === 'archive' ? 'bg-blue-600/15 text-blue-700 border border-blue-200/40' : 'bg-white/40 text-slate-600 border border-white hover:bg-white/70'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Kartotéka
        </button>
        <button
          onClick={() => setActiveView('identity')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
            activeView === 'identity' ? 'bg-blue-600/15 text-blue-700 border border-blue-200/40' : 'bg-white/40 text-slate-600 border border-white hover:bg-white/70'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Identity
        </button>
        <button
          onClick={() => setActiveView('timeline')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
            activeView === 'timeline' ? 'bg-blue-600/15 text-blue-700 border border-blue-200/40' : 'bg-white/40 text-slate-600 border border-white hover:bg-white/70'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Timeline
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="flex-1 flex min-h-0 overflow-hidden"
        >
      {activeView === 'timeline' ? (
        <EventTimeline
          events={visibleEvents}
          contradictions={visibleContradictions}
          persons={visiblePersons}
          selectedPerson={selectedPerson}
          onSelectPerson={handleJumpToPerson}
        />
      ) : activeView === 'archive' ? (
        <ArchiveView
          documents={documents}
          persons={persons}
          relationships={relationships}
          redFlags={redFlags}
          flaggedPassages={flaggedPassages}
          claims={claims}
          events={events}
          locations={locations}
          vehicles={vehicles}
          contradictions={contradictions}
          selectedDocId={selectedDocId}
          onSelectDoc={setSelectedDocId}
          onJumpToPerson={handleJumpToPerson}
          onJumpToEdge={handleJumpToEdge}
          onJumpToContradiction={handleJumpToContradiction}
          readOnly={readOnly}
        />
      ) : activeView === 'overview' ? (
        <MobileDashboard
          documents={documents}
          persons={persons}
          relationships={relationships}
          redFlags={redFlags}
          contradictions={contradictions}
          onSelectPerson={handleJumpToPerson}
        />
      ) : activeView === 'identity' ? (
        <IdentityPanel overrides={overrides} persons={persons} onRevokeOverride={handleRevokeOverride} />
      ) : (
        <div className="relative flex-1 flex flex-col lg:flex-row overflow-hidden p-2 lg:p-3 gap-2 lg:gap-3">
          <CollapsibleSidebar
            side="left"
            collapsed={leftCollapsed}
            onToggle={() => setLeftCollapsed((c) => !c)}
            expandedWidth={272}
            bubbleIcon={FileText}
            bubbleLabel={documents.length}
          >
            <DocumentList
              documents={documents}
              selectedDocId={selectedDocId}
              onSelect={setSelectedDocId}
              onDelete={readOnly ? null : handleDelete}
              onRetry={readOnly ? null : handleRetryAnalysis}
            />
          </CollapsibleSidebar>

          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <GraphCanvas
              persons={visiblePersons}
              graphEdges={visibleEdges}
              mergedEdges={visibleMerged}
              selectedPersonId={selectedPerson?.id}
              onSelectPerson={handleSelectPerson}
              selectedEdgeId={selectedEdge?.id}
              onSelectEdge={handleSelectEdge}
              onShowEvidence={handleJumpToArchive}
              maxTime={maxTime}
              timeEnabled={timeEnabled}
              activeEdgeId={activeEdgeId}
              flaggedPassages={flaggedPassages}
              overrides={overrides}
              onCreateOverrides={handleCreateOverrides}
              readOnly={readOnly}
            />
            <TimeSlider
              min={timeBounds.min}
              max={timeBounds.max}
              value={maxTime}
              onChange={setMaxTime}
              replaying={replaying}
              onToggleReplay={() => (replaying ? stopReplay() : startReplay())}
            />
          </div>

          <CollapsibleSidebar
            side="right"
            collapsed={rightCollapsed}
            onToggle={() => setRightCollapsed((c) => !c)}
            expandedWidth={336}
            bubbleIcon={ShieldAlert}
            bubbleLabel={redFlags.length + contradictions.length}
          >
            <div className="relative w-full h-full flex flex-col bg-white/70 backdrop-blur-3xl border-[1.5px] border-white rounded-[32px] shadow-xl overflow-hidden min-w-0 max-h-[35vh] lg:max-h-none">
              <PersonPanel
                person={selectedPerson}
                edge={selectedEdge}
                onShowEvidence={handleJumpToArchive}
                onClose={() => {
                  setSelectedPerson(null);
                  setSelectedEdge(null);
                }}
              />
              <RedFlagsPanel redFlags={visibleRedFlags} />
              <SherlockChat persons={visiblePersons} edges={visibleEdges} redFlags={visibleRedFlags} flaggedPassages={visibleFlaggedPassages} claims={visibleClaims} events={visibleEvents} contradictions={visibleContradictions} openSignal={sherlockSignal} />
            </div>
          </CollapsibleSidebar>
        </div>
      )}
        </motion.div>
      </AnimatePresence>

      {toast && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-white/80 backdrop-blur-3xl border border-white text-blue-800 text-sm shadow-xl">
          {toast}
        </div>
      )}

      {mobileMenuOpen && (
        <MobileDrawer
          user={currentUser}
          activeView={activeView}
          onNavigate={setActiveView}
          onClose={() => setMobileMenuOpen(false)}
          onLogout={handleLogout}
          onOpenIntro={() => setIntroOpen(true)}
          alertCount={redFlags.length + contradictions.length}
        />
      )}

      <MobileBottomNav activeView={activeView} onTabChange={setActiveView} onSherlock={handleSherlockTab} />

      <QuickSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        persons={persons}
        relationships={relationships}
        events={events}
        claims={claims}
        redFlags={redFlags}
        documents={documents}
        contradictions={contradictions}
        onSelectPerson={handleJumpToPerson}
        onSelectEdge={handleJumpToEdge}
        onSelectDoc={handleJumpToArchive}
        onSelectEvent={() => setActiveView('timeline')}
      />

      <WelcomeIntroModal
        open={introOpen}
        onClose={() => setIntroOpen(false)}
      />
    </div>
  );
}