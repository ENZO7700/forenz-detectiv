import React from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import {
  Network, Layers, BarChart3, Search, FolderOpen, Share2, Archive,
  Settings, UserCircle, LogOut, X, ShieldAlert, FileSearch, Scale,
  Sun, Moon, Monitor, Users, HelpCircle, Clock, MapPin
} from 'lucide-react';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

function Item({ icon: Icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm transition-colors text-left ${
        active ? 'bg-blue-600/10 text-blue-700' : 'text-slate-600 hover:bg-white/60'
      }`}
    >
      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-700' : 'text-slate-400'}`} />
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 font-medium">
          {badge}
        </span>
      )}
    </button>
  );
}

function SectionLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold px-3 mt-4 mb-1.5">{children}</p>;
}

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const opts = [
    { value: 'light', label: 'Svetlý', icon: Sun },
    { value: 'dark', label: 'Tmavý', icon: Moon },
    { value: 'system', label: 'Systém', icon: Monitor },
  ];
  return (
    <div className="px-3 mb-2 mt-1">
      <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10">
        {opts.map((o) => {
          const active = theme === o.value;
          return (
            <button
              key={o.value}
              onClick={() => setTheme(o.value)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-medium transition-all ${
                active
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <o.icon className="w-3.5 h-3.5" />
              <span>{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function MobileDrawer({ user, activeView, onNavigate, onClose, onLogout, onOpenIntro, alertCount = 0 }) {
  const go = (view) => { onNavigate(view); onClose(); };

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      {/* Panel */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute left-0 top-0 h-full w-[80%] max-w-xs bg-white/80 backdrop-blur-2xl border-r border-white rounded-r-[28px] shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-sm font-semibold shrink-0">
              {initials(user?.full_name || user?.email)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-blue-800 truncate">{user?.full_name || 'Používateľ'}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable nav */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          <SectionLabel>Pracovný priestor</SectionLabel>
          <Item icon={Network} label="Pavúk" active={activeView === 'graph'} onClick={() => go('graph')} />
          <Item icon={Layers} label="Kartotéka" active={activeView === 'archive'} onClick={() => go('archive')} />
          <Item icon={Clock} label="Timeline" active={activeView === 'timeline'} onClick={() => go('timeline')} />
          <Item icon={MapPin} label="Geografická mapa" active={activeView === 'map'} onClick={() => go('map')} />

          <SectionLabel>Prípady</SectionLabel>
          <Item icon={FolderOpen} label="Všetky prípady" active={activeView === 'overview'} onClick={() => go('overview')} />
          <Item icon={Share2} label="Zdieľané so mnou" onClick={onClose} />
          <Item icon={Archive} label="Archív" active={activeView === 'archive'} onClick={() => go('archive')} />

          <SectionLabel>Analýzy</SectionLabel>
          <Item icon={Search} label="Sherlock" active={activeView === 'sherlock'} onClick={() => go('sherlock')} />
          <Item icon={Scale} label="Rozpory" onClick={onClose} />
          <Item icon={Users} label="Identity" active={activeView === 'identity'} onClick={() => go('identity')} />
          <Item icon={FileSearch} label="Dôkazy" active={activeView === 'archive'} onClick={() => go('archive')} />

          <SectionLabel>Nápoveda & Nastavenia</SectionLabel>
          {onOpenIntro && (
            <Item icon={HelpCircle} label="Sprievodca systémom (Intro)" onClick={() => { onOpenIntro(); onClose(); }} />
          )}
          <ThemeSwitcher />
          <Item icon={Settings} label="Nastavenia" onClick={onClose} />
          <Item icon={UserCircle} label="Účet & Profil" onClick={onClose} />
        </div>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-slate-200 dark:border-white/10">
          {alertCount > 0 && (
            <div className="mb-2 flex items-center gap-2 px-2 py-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-300 text-[11px]">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>{alertCount} aktívnych varovaní / rozporov</span>
            </div>
          )}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Odhlásiť sa</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}