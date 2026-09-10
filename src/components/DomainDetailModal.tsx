import React, { useState } from 'react';
import { DomainActivity, CategoryType, UserSettings } from '../types';
import { ALL_CATEGORIES } from '../utils/categories';
import { formatTime, formatTimeLive } from '../analytics/productivity';
import { getFaviconUrl, formatDomainDisplayName } from '../utils/domain';
import { CategoryBadge } from './CategoryBadge';
import { StorageService } from '../services/storage';

// ── SVG Icons ──────────────────────────────────────────────────────────────

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const ExternalLinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const ShieldBlockIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" d="M12 7v5l3 3" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────

interface DomainDetailModalProps {
  domain: string;
  todayActivity: DomainActivity;
  weeklyTotalSeconds: number;
  monthlyTotalSeconds: number;
  yesterdaySeconds: number;
  settings: UserSettings;
  onClose: () => void;
  onSettingsChanged: () => void;
}

export const DomainDetailModal: React.FC<DomainDetailModalProps> = ({
  domain,
  todayActivity,
  weeklyTotalSeconds,
  monthlyTotalSeconds,
  yesterdaySeconds,
  settings,
  onClose,
  onSettingsChanged,
}) => {
  const [editingCategory, setEditingCategory] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleCategoryChange = async (newCategory: CategoryType) => {
    setSaving(true);
    const newOverrides = { ...settings.categoryOverrides, [domain]: newCategory };
    await StorageService.saveSettings({ categoryOverrides: newOverrides });
    setSaving(false);
    setEditingCategory(false);
    onSettingsChanged();
  };

  const toggleFocusBlock = async () => {
    const blocked = settings.focusMode.blockedDomains;
    const isBlocked = blocked.includes(domain);
    const updated = isBlocked
      ? blocked.filter((d) => d !== domain)
      : [...blocked, domain];
    await StorageService.saveSettings({
      focusMode: { ...settings.focusMode, blockedDomains: updated },
    });
    onSettingsChanged();
  };

  const isBlocked = settings.focusMode.blockedDomains.includes(domain);

  const firstVisitDate = todayActivity.firstVisit
    ? new Date(todayActivity.firstVisit).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null;

  const avgSession = todayActivity.visitCount > 0
    ? Math.round(todayActivity.totalTime / todayActivity.visitCount)
    : 0;

  const stats = [
    {
      label: 'Today',
      value: formatTime(todayActivity.totalTime),
      highlight: true,
      icon: <ClockIcon className="w-3.5 h-3.5 text-cyan-400" />,
    },
    {
      label: 'Yesterday',
      value: formatTime(yesterdaySeconds) || '—',
      icon: <ClockIcon className="w-3.5 h-3.5 text-slate-500" />,
    },
    {
      label: '7-Day Total',
      value: formatTime(weeklyTotalSeconds),
      icon: <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />,
    },
    {
      label: '30-Day Total',
      value: formatTime(monthlyTotalSeconds),
      icon: <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />,
    },
    {
      label: 'Visits Today',
      value: String(todayActivity.visitCount),
      icon: <ShieldIcon className="w-3.5 h-3.5 text-slate-500" />,
    },
    {
      label: 'Avg Session',
      value: avgSession > 0 ? formatTime(avgSession) : '—',
      icon: <ClockIcon className="w-3.5 h-3.5 text-slate-500" />,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={getFaviconUrl(domain)}
                alt={domain}
                className="w-10 h-10 rounded-xl"
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{formatDomainDisplayName(domain)}</h2>
              <p className="text-xs text-slate-500">{domain}</p>
              {firstVisitDate && (
                <p className="text-[10px] text-slate-600 mt-0.5">First visited today at {firstVisitDate}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Category Row */}
        <div className="px-5 py-3 border-b border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Category:</span>
            <CategoryBadge category={todayActivity.category} />
          </div>
          <button
            onClick={() => setEditingCategory(!editingCategory)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
          >
            {editingCategory ? 'Cancel' : 'Change'}
          </button>
        </div>

        {editingCategory && (
          <div className="px-5 py-3 border-b border-slate-800/60 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                disabled={saving}
                onClick={() => handleCategoryChange(cat)}
                className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                  cat === todayActivity.category
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-semibold'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Stats Grid */}
        <div className="p-5 grid grid-cols-3 gap-2.5">
          {stats.map(({ label, value, highlight, icon }) => (
            <div
              key={label}
              className={`p-3 rounded-xl border ${
                highlight
                  ? 'bg-cyan-500/8 border-cyan-500/25 shadow-sm shadow-cyan-500/10'
                  : 'bg-slate-800/50 border-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-1 mb-1.5">{icon}<span className="text-[10px] text-slate-500 font-medium">{label}</span></div>
              <div className={`text-sm font-bold tabular-nums ${highlight ? 'text-cyan-400' : 'text-white'}`}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={toggleFocusBlock}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
              isBlocked
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isBlocked ? <ShieldBlockIcon className="w-3.5 h-3.5" /> : <ShieldIcon className="w-3.5 h-3.5" />}
            {isBlocked ? 'Unblock Site' : 'Block in Focus Mode'}
          </button>
          <a
            href={`https://${domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 ml-auto"
          >
            <ExternalLinkIcon className="w-3.5 h-3.5" />
            Visit Site
          </a>
        </div>
      </div>
    </div>
  );
};
