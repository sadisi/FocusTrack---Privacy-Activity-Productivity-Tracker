import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StorageService, getTodayKey } from '../services/storage';
import { DailyActivity, UserSettings, DomainActivity, Goal, CurrentTrackingState } from '../types';
import { ALL_CATEGORIES } from '../utils/categories';
import { formatTime, formatTimeLive, calculateProductivityBreakdown } from '../analytics/productivity';
import { evaluateGoals } from '../analytics/goals';
import { generateDailySummary, generateWeeklyInsights } from '../analytics/insights';
import { exportDataAsJSON, exportDataAsCSV, importDataFromJSON } from '../analytics/export';
import { getFaviconUrl, formatDomainDisplayName } from '../utils/domain';
import { CategoryBadge } from '../components/CategoryBadge';
import { ProgressBar } from '../components/ProgressBar';
import { DomainDetailModal } from '../components/DomainDetailModal';
import { GoalModal } from '../components/GoalModal';
import { OnboardingModal } from '../components/OnboardingModal';
import { ActivityChart } from '../components/ActivityChart';
import { CategoryDonutChart } from '../components/CategoryDonutChart';

// ── SVG Icon Components ────────────────────────────────────────────────────────

const Icon = {
  Dashboard: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  BarChart: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V7m6 12V3M3 19h18" />
    </svg>
  ),
  Target: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  ),
  Lightbulb: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M9 21h6M12 3a6 6 0 016 6c0 2.22-1.2 4.16-3 5.2V17H9v-2.8C7.2 13.16 6 11.22 6 9a6 6 0 016-6z" />
    </svg>
  ),
  Settings: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path strokeLinecap="round" d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
    </svg>
  ),
  Shield: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  ShieldCheck: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path strokeLinecap="round" d="M9 12l2 2 4-4" />
    </svg>
  ),
  ShieldAlert: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path strokeLinecap="round" d="M12 9v4M12 17h.01" />
    </svg>
  ),
  Search: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
    </svg>
  ),
  Clock: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 7v5l3 3" />
    </svg>
  ),
  TrendingUp: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M23 6l-9.5 9.5-5-5L1 18" /><path strokeLinecap="round" d="M17 6h6v6" />
    </svg>
  ),
  Zap: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  Award: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="6" /><path strokeLinecap="round" d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
    </svg>
  ),
  Trash: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </svg>
  ),
  Download: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M12 2v13m-5-4l5 5 5-5M3 20h18" />
    </svg>
  ),
  Upload: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M12 22V9m5 4l-5-5-5 5M3 20h18" />
    </svg>
  ),
  Plus: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Edit: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path strokeLinecap="round" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Check: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  CheckCircle: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M9 12l2 2 4-4" />
    </svg>
  ),
  Alert: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <path strokeLinecap="round" d="M12 9v4M12 17h.01" />
    </svg>
  ),
  Sparkles: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.5 4H18l-3.5 2.5 1.5 4-4-3-4 3 1.5-4L6 6h4.5z" opacity="0.9" />
      <path d="M19 10l.8 2h2.2l-1.8 1.3.7 2-1.9-1.4-1.9 1.4.7-2L15 12h2.2z" opacity="0.7" />
      <path d="M5 10l.8 2H8l-1.8 1.3.7 2L5 13.9l-1.9 1.4.7-2L2 12h2.2z" opacity="0.7" />
    </svg>
  ),
  Lock: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  ChevronRight: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
  Globe: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M3.6 9h16.8M3.6 15h16.8" />
      <path strokeLinecap="round" d="M12 3c-2 3-3 6-3 9s1 6 3 9M12 3c2 3 3 6 3 9s-1 6-3 9" />
    </svg>
  ),
  X: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  SortAsc: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M3 6h18M3 12h12M3 18h6" />
    </svg>
  ),
  RefreshCw: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" d="M23 4v6h-6M1 20v-6h6" />
      <path strokeLinecap="round" d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  ),
  Fire: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 23c-4.97 0-9-3.58-9-8 0-3.08 1.84-6.31 4.5-8.5.34-.28.84-.13.97.29.58 1.9 1.8 3.32 3.03 4.21.36.26.86-.03.82-.47-.28-3.05 1.15-6.19 3.65-8.03.38-.28.9.03.86.5-.27 3.05 1.34 5.34 2.87 6.84.34.33.92.09.91-.38-.05-2.22 1.05-3.95 2.1-4.96.34-.33.91-.07.89.4-.13 3.65 1.4 6.13 3.4 8.1.35.34.28.92-.15 1.17A8.99 8.99 0 0112 23z" />
    </svg>
  ),
  SlashCircle: ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M5.636 5.636l12.728 12.728" />
    </svg>
  ),
};

// ── Toggle Switch Component ────────────────────────────────────────────────────

const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <button
    onClick={onChange}
    role="switch"
    aria-checked={checked}
    className={`toggle-track ${checked ? 'on' : 'off'}`}
  >
    <div className="toggle-thumb" />
  </button>
);

// ── Types ─────────────────────────────────────────────────────────────────────

type ActivePage = 'overview' | 'analytics' | 'goals' | 'insights' | 'settings';
type SortBy = 'recent' | 'time' | 'visits' | 'alpha';
type FilterCategory = 'all' | string;

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const Dashboard: React.FC = () => {
  const [currentState, setCurrentState] = useState<CurrentTrackingState | null>(null);
  const [activePage, setActivePage] = useState<ActivePage>('overview');
  const [activities, setActivities] = useState<Record<string, DailyActivity>>({});
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [analyticsRange, setAnalyticsRange] = useState<7 | 30>(7);
  const [confirmDialog, setConfirmDialog] = useState<null | { message: string; onConfirm: () => void }>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [liveSeconds, setLiveSeconds] = useState(0);

  // ── Data Loading ──────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    let currState: CurrentTrackingState | null = null;
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      try {
        const res = await new Promise<any>((resolve) => {
          chrome.runtime.sendMessage({ type: 'GET_CURRENT_STATE' }, (response) => {
            if (chrome.runtime.lastError || !response || response.error) {
              resolve(null);
            } else {
              resolve(response);
            }
          });
        });
        if (res && res.state) {
          currState = res.state;
        }
      } catch (e) {
        // ignore
      }
    }
    if (!currState) currState = await StorageService.getCurrentState();

    const [acts, sets] = await Promise.all([
      StorageService.getActivities(),
      StorageService.getSettings(),
    ]);

    setCurrentState(currState);
    setActivities(acts);
    setSettings(sets);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Live seconds ticker (1s resolution)
  useEffect(() => {
    const timer = setInterval(() => setLiveSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Toast helper
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // ── Derived data ─────────────────────────────────────────────────────────
  const todayKey = getTodayKey();
  const todayActivity = activities[todayKey] || { date: todayKey, totalTime: 0, domains: {}, sessions: [] };

  // Compute live session seconds for active tracking domain
  const liveSessionSeconds = useMemo(() => {
    if (currentState && currentState.startTime && !currentState.isPaused && !currentState.isIdle && currentState.isWindowFocused && currentState.activeDomain) {
      return Math.max(0, Math.floor((Date.now() - currentState.startTime) / 1000));
    }
    return 0;
  }, [currentState, liveSeconds]);

  const liveTotalTime = todayActivity.totalTime + (currentState?.activeDomain ? liveSessionSeconds : 0);

  const streakDays = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = getTodayKey(d);
      if (activities[key] && activities[key].totalTime > 0) {
        count++;
      } else if (i > 0) {
        break;
      }
    }
    return count;
  }, [activities]);

  // Derived activities object with live-updated today stats for charts
  const activitiesWithLive = useMemo(() => {
    const copy = { ...activities };
    const todayAct = copy[todayKey] || { date: todayKey, totalTime: 0, domains: {}, sessions: [] };
    const updatedDomains = { ...(todayAct.domains || {}) };
    if (currentState?.activeDomain) {
      const activeDom = currentState.activeDomain;
      const domData = updatedDomains[activeDom] || {
        domain: activeDom,
        category: 'Uncategorized',
        totalTime: 0,
        visitCount: 1,
        lastActive: Date.now(),
        firstVisit: Date.now(),
      };
      updatedDomains[activeDom] = {
        ...domData,
        totalTime: domData.totalTime + liveSessionSeconds,
      };
    }
    copy[todayKey] = {
      ...todayAct,
      totalTime: liveTotalTime,
      domains: updatedDomains,
    };
    return copy;
  }, [activities, todayKey, currentState, liveSessionSeconds, liveTotalTime]);

  const yesterdayKey = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return getTodayKey(d);
  }, []);

  const breakdown = useMemo(() =>
    settings ? calculateProductivityBreakdown({
      ...todayActivity,
      totalTime: liveTotalTime
    }, settings) : null,
    [todayActivity, liveTotalTime, settings]
  );

  const topDomains = useMemo(() => {
    const domains = Object.values(todayActivity.domains || {});
    return domains.sort((a, b) => {
      const aTime = a.domain === currentState?.activeDomain ? a.totalTime + liveSessionSeconds : a.totalTime;
      const bTime = b.domain === currentState?.activeDomain ? b.totalTime + liveSessionSeconds : b.totalTime;
      return bTime - aTime;
    });
  }, [todayActivity, currentState, liveSessionSeconds]);

  const filteredDomains = useMemo(() => {
    let list = Object.values(todayActivity.domains || {});
    if (filterCategory !== 'all') list = list.filter((d) => d.category === filterCategory);
    if (searchQuery) list = list.filter((d) =>
      d.domain.includes(searchQuery.toLowerCase()) ||
      formatDomainDisplayName(d.domain).toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (sortBy === 'recent') return [...list].sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0));
    if (sortBy === 'visits') return [...list].sort((a, b) => b.visitCount - a.visitCount);
    if (sortBy === 'alpha') return [...list].sort((a, b) => a.domain.localeCompare(b.domain));
    return [...list].sort((a, b) => b.totalTime - a.totalTime);
  }, [todayActivity, filterCategory, searchQuery, sortBy]);

  const goalProgress = useMemo(() =>
    settings ? evaluateGoals(settings.goals, activities, todayKey, settings) : [],
    [settings, activities, todayKey, liveSeconds]
  );

  const dailySummary = useMemo(() =>
    settings ? generateDailySummary(todayActivity, settings) : null,
    [todayActivity, settings, liveSeconds]
  );

  const weeklyInsights = useMemo(() =>
    settings ? generateWeeklyInsights(activities, settings) : [],
    [activities, settings]
  );

  // ── Domain detail helpers ─────────────────────────────────────────────────
  const getWeeklyDomainSeconds = (domain: string) => {
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = getTodayKey(d);
      total += activities[key]?.domains[domain]?.totalTime || 0;
    }
    return total;
  };

  const getMonthlyDomainSeconds = (domain: string) => {
    let total = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = getTodayKey(d);
      total += activities[key]?.domains[domain]?.totalTime || 0;
    }
    return total;
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleSaveGoal = async (goal: Goal) => {
    if (!settings) return;
    const existingIdx = settings.goals.findIndex((g) => g.id === goal.id);
    let updatedGoals: Goal[];
    if (existingIdx >= 0) {
      updatedGoals = settings.goals.map((g, i) => (i === existingIdx ? goal : g));
    } else {
      updatedGoals = [...settings.goals, goal];
    }
    const updated = await StorageService.saveSettings({ goals: updatedGoals });
    setSettings(updated);
    setShowGoalModal(false);
    setEditingGoal(undefined);
    showToast('Goal saved!');
  };

  const handleDeleteGoal = (goalId: string) => {
    setConfirmDialog({
      message: 'Delete this goal? This cannot be undone.',
      onConfirm: async () => {
        if (!settings) return;
        const updated = await StorageService.saveSettings({
          goals: settings.goals.filter((g) => g.id !== goalId),
        });
        setSettings(updated);
        setConfirmDialog(null);
        showToast('Goal deleted.');
      },
    });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const result = await importDataFromJSON(text);
    showToast(result.message);
    if (result.success) await loadData();
    e.target.value = '';
  };

  const handleClearData = (scope: 'today' | 'week' | 'all') => {
    const labels = { today: "today's data", week: "last 7 days of data", all: 'ALL data' };
    setConfirmDialog({
      message: `Clear ${labels[scope]}? This action cannot be undone.`,
      onConfirm: async () => {
        await StorageService.clearData({
          todayOnly: scope === 'today',
          last7Days: scope === 'week',
          all: scope === 'all',
        });
        await loadData();
        setConfirmDialog(null);
        showToast(`Cleared ${labels[scope]}.`);
      },
    });
  };

  const handleOnboarding = async () => {
    if (!settings) return;
    const updated = await StorageService.saveSettings({ onboardingCompleted: true });
    setSettings(updated);
  };

  // ── Nav Items ─────────────────────────────────────────────────────────────
  const navItems: { page: ActivePage; icon: React.ReactNode; label: string }[] = [
    { page: 'overview', icon: <Icon.Dashboard className="w-4 h-4" />, label: 'Overview' },
    { page: 'analytics', icon: <Icon.BarChart className="w-4 h-4" />, label: 'Analytics' },
    { page: 'goals', icon: <Icon.Target className="w-4 h-4" />, label: 'Goals & Focus' },
    { page: 'insights', icon: <Icon.Lightbulb className="w-4 h-4" />, label: 'Insights' },
    { page: 'settings', icon: <Icon.Settings className="w-4 h-4" />, label: 'Settings' },
  ];

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/25 animate-pulse">
            <Icon.Zap className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-300">Loading FocusTrack</p>
            <p className="text-xs text-slate-600 mt-0.5">Fetching your activity data...</p>
          </div>
        </div>
      </div>
    );
  }

  const isTracking = settings.trackingEnabled && !settings.pauseUntil;
  const siteCount = topDomains.length;
  const sessionCount = todayActivity.sessions?.length ?? 0;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Onboarding */}
      {!settings.onboardingCompleted && (
        <OnboardingModal onStartTracking={handleOnboarding} />
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 animate-fade-in-up">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
                <Icon.Alert className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-sm text-slate-300 mt-1">{confirmDialog.message}</p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white shadow-2xl flex items-center gap-2 animate-fade-in-up">
          <Icon.CheckCircle className="w-4 h-4 text-emerald-400" />
          {toastMsg}
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className="w-56 flex-shrink-0 bg-slate-950 border-r border-slate-800/50 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Icon.Zap className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white">FocusTrack</h1>
              <p className="text-[10px] text-slate-500 font-medium">Privacy Analytics</p>
            </div>
          </div>
        </div>

        {/* Status pill */}
        <div className="px-4 pt-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border ${
            isTracking
              ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400'
              : 'bg-amber-500/8 border-amber-500/20 text-amber-400'
          }`}>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isTracking ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {isTracking ? 'Tracking Active' : 'Tracking Paused'}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 mt-2">
          {navItems.map(({ page, icon, label }) => (
            <button
              key={page}
              onClick={() => setActivePage(page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                activePage === page
                  ? 'bg-gradient-to-r from-slate-800 to-slate-800/60 text-white border border-slate-700/50 shadow-sm'
                  : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900/70'
              }`}
            >
              <span className={`flex-shrink-0 ${activePage === page ? 'text-cyan-400' : ''}`}>{icon}</span>
              {label}
              {activePage === page && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />
              )}
            </button>
          ))}
        </nav>

        {/* Privacy Badge */}
        <div className="p-4 border-t border-slate-800/50">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/12">
            <Icon.ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-emerald-400 font-semibold">Privacy First</p>
              <p className="text-[10px] text-slate-600">All data stays local</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-6 border-b border-slate-800/50 bg-slate-950 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">
              {navItems.find((n) => n.page === activePage)?.label}
            </h2>
            <p className="text-xs text-slate-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {liveTotalTime > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <Icon.Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-300 font-semibold tabular-nums">{formatTime(liveTotalTime)}</span>
                <span className="text-slate-600">today</span>
              </div>
            )}
            {streakDays > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold shadow-sm">
                <Icon.Fire className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>{streakDays} day streak</span>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ─── OVERVIEW PAGE ─── */}
          {activePage === 'overview' && (
            <div className="space-y-6 max-w-5xl mx-auto animate-fade-in-up">
              {/* ── Now Tracking Banner ── */}
              {currentState?.activeDomain && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/30 to-slate-900 border border-cyan-500/30 flex items-center justify-between shadow-xl shadow-cyan-500/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      <img
                        src={getFaviconUrl(currentState.activeDomain)}
                        alt={currentState.activeDomain}
                        className="w-10 h-10 rounded-xl bg-slate-800 p-1 shadow-md"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Now Active</span>
                        <span className="text-[10px] text-slate-500 font-mono">Live Counter</span>
                      </div>
                      <h4 className="text-base font-bold text-white leading-tight">
                        {formatDomainDisplayName(currentState.activeDomain)}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono">{currentState.activeDomain}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-cyan-400 font-mono tracking-tight tabular-nums">
                      {formatTimeLive(
                        (todayActivity.domains[currentState.activeDomain]?.totalTime || 0) + liveSessionSeconds
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">spent on site today</div>
                  </div>
                </div>
              )}

              {/* Top Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Time */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors stat-card-cyan">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Total Active Time</span>
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                      <Icon.Clock className="w-4 h-4 text-cyan-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white tabular-nums">{formatTime(liveTotalTime)}</div>
                  <div className="text-xs text-slate-500">{siteCount} site{siteCount !== 1 ? 's' : ''} · {sessionCount} session{sessionCount !== 1 ? 's' : ''}</div>
                </div>

                {/* Productivity Score */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Productivity Score</span>
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                      <Icon.Zap className="w-4 h-4 text-cyan-400" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-cyan-400">{breakdown?.score ?? 0}</span>
                    <span className="text-sm text-slate-600">/ 100</span>
                  </div>
                  <div className="text-xs text-slate-500">Based on category weights</div>
                </div>

                {/* Productive Time */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors stat-card-emerald">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Productive Time</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Icon.TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-emerald-400 tabular-nums">{formatTime(breakdown?.productiveTime ?? 0)}</div>
                  <div className="text-xs text-slate-500">{breakdown?.productivePercentage ?? 0}% of total time</div>
                </div>

                {/* Goals */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors stat-card-violet">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Goals Progress</span>
                    <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
                      <Icon.Award className="w-4 h-4 text-violet-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {goalProgress.filter((g) => g.isAchieved).length}
                    <span className="text-sm text-slate-500 font-normal ml-1">/ {goalProgress.length}</span>
                  </div>
                  <div className="text-xs text-slate-500">goals achieved today</div>
                </div>
              </div>

              {/* Two Column: Top Sites + Category Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* Top Sites */}
                <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Icon.Globe className="w-4 h-4 text-slate-400" />
                      Top Sites Today
                    </h3>
                    <button
                      onClick={() => setActivePage('analytics')}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                    >
                      View all <Icon.ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {topDomains.length === 0 ? (
                    <div className="p-10 text-center text-slate-500">
                      <Icon.Globe className="w-8 h-8 mx-auto mb-3 opacity-25" />
                      <p className="text-sm font-medium">No activity yet</p>
                      <p className="text-xs mt-1 text-slate-600">Browse normally and FocusTrack will track your time.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800/40">
                      {topDomains.slice(0, 7).map((d, i) => {
                        const dTime = d.domain === currentState?.activeDomain
                          ? d.totalTime + liveSessionSeconds
                          : d.totalTime;
                        const pct = liveTotalTime > 0
                          ? Math.round((dTime / liveTotalTime) * 100)
                          : 0;
                        const isHighTime = dTime >= 3600; // >1h warning
                        return (
                          <div
                            key={d.domain}
                            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-800/40 transition-colors text-left group"
                          >
                            <span className="text-xs text-slate-600 w-5 text-center font-medium">{i + 1}</span>
                            <img
                              src={getFaviconUrl(d.domain)}
                              alt={d.domain}
                              className="w-6 h-6 rounded-md flex-shrink-0"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedDomain(d.domain)}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-white truncate group-hover:text-cyan-400 transition-colors">
                                  {formatDomainDisplayName(d.domain)}
                                </span>
                                <CategoryBadge category={d.category} size="sm" />
                                {isHighTime && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-400 font-medium">
                                    &gt;1h spent
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-700 ${
                                      d.domain === currentState?.activeDomain
                                        ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 animate-pulse'
                                        : 'bg-gradient-to-r from-cyan-600 to-cyan-400'
                                    }`}
                                    style={{ width: `${Math.max(pct, 2)}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-slate-600 flex-shrink-0">{d.visitCount} visits</span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 cursor-pointer" onClick={() => setSelectedDomain(d.domain)}>
                              <div className="text-sm font-semibold text-white tabular-nums">{formatTime(dTime)}</div>
                              <div className="text-[10px] text-slate-500">{pct}%</div>
                            </div>
                            <a
                              href={`https://${d.domain}`}
                              target="_blank"
                              rel="noreferrer"
                              title={`Open ${d.domain}`}
                              className="p-1 rounded-lg text-slate-600 hover:text-cyan-400 hover:bg-slate-800 transition-colors flex-shrink-0"
                            >
                              <Icon.ChevronRight className="w-4 h-4" />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Category + Productivity breakdown */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">Category Distribution</h3>
                    <CategoryDonutChart activity={activitiesWithLive[todayKey] || todayActivity} settings={settings} />
                  </div>

                  {breakdown && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                      <h3 className="text-sm font-semibold text-white">Productivity Split</h3>
                      <div className="space-y-2.5">
                        {[
                          { label: 'Productive', time: breakdown.productiveTime, pct: breakdown.productivePercentage, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
                          { label: 'Neutral', time: breakdown.neutralTime, pct: breakdown.neutralPercentage, color: 'bg-amber-500', textColor: 'text-amber-400' },
                          { label: 'Distracting', time: breakdown.distractingTime, pct: breakdown.distractingPercentage, color: 'bg-rose-500', textColor: 'text-rose-400' },
                        ].map(({ label, time, pct, color, textColor }) => (
                          <div key={label}>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className={textColor}>{label}</span>
                              <span className="text-slate-400 tabular-nums">{formatTime(time)}</span>
                            </div>
                            <ProgressBar percentage={pct} colorClass={color} height="thin" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Goals Quick View */}
              {goalProgress.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Icon.Target className="w-4 h-4 text-slate-400" />
                      Today's Goals
                    </h3>
                    <button
                      onClick={() => setActivePage('goals')}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                    >
                      Manage <Icon.ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="divide-y divide-slate-800/40">
                    {goalProgress.slice(0, 3).map(({ goal, currentMinutes, targetMinutes, percentage, isAchieved, statusText }) => (
                      <div key={goal.id} className="px-5 py-3.5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{goal.title}</span>
                            {isAchieved && <Icon.CheckCircle className="w-4 h-4 text-emerald-400" />}
                          </div>
                          <span className="text-xs text-slate-400 tabular-nums">
                            {formatTime(currentMinutes * 60)} / {formatTime(targetMinutes * 60)}
                          </span>
                        </div>
                        <ProgressBar
                          percentage={percentage}
                          colorClass={isAchieved ? 'bg-emerald-500' : 'bg-cyan-500'}
                          height="thin"
                        />
                        <p className="text-[11px] text-slate-600 mt-1">{statusText}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── ANALYTICS PAGE ─── */}
          {activePage === 'analytics' && (
            <div className="space-y-6 max-w-5xl mx-auto animate-fade-in-up">
              {/* Range Tabs */}
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
                {([7, 30] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setAnalyticsRange(r)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      analyticsRange === r
                        ? 'bg-slate-700 text-white shadow-sm border border-slate-600'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r === 7 ? 'Last 7 Days' : 'Last 30 Days'}
                  </button>
                ))}
              </div>

              {/* Activity Chart */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                  <Icon.BarChart className="w-4 h-4 text-slate-400" />
                  Daily Browser Activity
                </h3>
                <ActivityChart activities={activitiesWithLive} days={analyticsRange} />
              </div>

              {/* Category Donut + Top Domains Period */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-white mb-4">Category Distribution — Today</h3>
                  <CategoryDonutChart activity={activitiesWithLive[todayKey] || todayActivity} settings={settings} />
                </div>

                {/* Top Domains Period */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-800/60">
                    <h3 className="text-sm font-semibold text-white">Top Sites — {analyticsRange} Days</h3>
                  </div>
                  <div className="divide-y divide-slate-800/40 max-h-72 overflow-y-auto">
                    {(() => {
                      const aggregated: Record<string, { domain: string; totalTime: number; category: string }> = {};
                      for (let i = 0; i < analyticsRange; i++) {
                        const d = new Date(); d.setDate(d.getDate() - i);
                        const key = getTodayKey(d);
                        Object.values(activities[key]?.domains || {}).forEach((dom) => {
                          if (!aggregated[dom.domain]) {
                            aggregated[dom.domain] = { domain: dom.domain, totalTime: 0, category: dom.category };
                          }
                          aggregated[dom.domain].totalTime += dom.totalTime;
                        });
                      }
                      const sorted = Object.values(aggregated).sort((a, b) => b.totalTime - a.totalTime);
                      if (sorted.length === 0) {
                        return <div className="p-8 text-center text-slate-500 text-sm">No data for this period</div>;
                      }
                      return sorted.slice(0, 8).map((d, i) => (
                        <div key={d.domain} className="flex items-center gap-3 px-5 py-2.5">
                          <span className="text-xs text-slate-600 w-4 text-center">{i + 1}</span>
                          <img src={getFaviconUrl(d.domain)} alt={d.domain} className="w-5 h-5 rounded-md" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white truncate">{formatDomainDisplayName(d.domain)}</div>
                          </div>
                          <div className="text-sm font-semibold text-slate-300 tabular-nums">{formatTime(d.totalTime)}</div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              {/* All Sites Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-800/60 space-y-3">
                  <h3 className="text-sm font-semibold text-white">All Tracked Sites — Today</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-40">
                      <Icon.Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search sites..."
                        className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors"
                      />
                    </div>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    >
                      <option value="all">All Categories</option>
                      {ALL_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortBy)}
                      className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    >
                      <option value="recent">Sort: Latest Visited</option>
                      <option value="time">Sort: Time</option>
                      <option value="visits">Sort: Visits</option>
                      <option value="alpha">Sort: A-Z</option>
                    </select>
                  </div>
                </div>

                {filteredDomains.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    {searchQuery ? 'No results for your search.' : 'No activity yet today.'}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/40 max-h-96 overflow-y-auto">
                    {/* Table header */}
                    <div className="flex items-center gap-3 px-5 py-2 bg-slate-800/30 text-[10px] text-slate-500 uppercase tracking-wider font-semibold sticky top-0">
                      <div className="w-6 flex-shrink-0" />
                      <div className="flex-1">Site</div>
                      <div className="w-16 text-center">Visits</div>
                      <div className="w-20 text-right">Time</div>
                    </div>
                    {filteredDomains.map((d) => {
                      const pct = todayActivity.totalTime > 0
                        ? Math.round((d.totalTime / todayActivity.totalTime) * 100)
                        : 0;
                      return (
                        <button
                          key={d.domain}
                          onClick={() => setSelectedDomain(d.domain)}
                          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-800/40 transition-colors text-left group"
                        >
                          <img
                            src={getFaviconUrl(d.domain)}
                            alt={d.domain}
                            className="w-6 h-6 rounded-md flex-shrink-0"
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white truncate group-hover:text-cyan-400 transition-colors">{formatDomainDisplayName(d.domain)}</span>
                              <CategoryBadge category={d.category} size="sm" />
                            </div>
                            <div className="h-1 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                              <div
                                className="h-full bg-slate-600 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                          <div className="w-16 text-center flex-shrink-0">
                            <span className="text-xs text-slate-400">{d.visitCount} visit{d.visitCount !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="w-20 text-right flex-shrink-0">
                            <div className="text-sm font-semibold text-white tabular-nums">{formatTime(d.totalTime)}</div>
                            <div className="text-[10px] text-slate-600">{pct}%</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── GOALS & FOCUS PAGE ─── */}
          {activePage === 'goals' && (
            <div className="space-y-6 max-w-3xl mx-auto animate-fade-in-up">
              {/* Goals */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Icon.Target className="w-4 h-4 text-slate-400" />
                    Daily Goals
                  </h3>
                  <button
                    onClick={() => { setEditingGoal(undefined); setShowGoalModal(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors shadow-md shadow-cyan-600/20"
                  >
                    <Icon.Plus className="w-3.5 h-3.5" />
                    New Goal
                  </button>
                </div>

                {goalProgress.length === 0 ? (
                  <div className="p-10 text-center text-slate-500">
                    <Icon.Target className="w-8 h-8 mx-auto mb-3 opacity-25" />
                    <p className="text-sm font-medium">No goals set</p>
                    <p className="text-xs mt-1 text-slate-600">Create a goal to start tracking your progress.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/40">
                    {goalProgress.map(({ goal, currentMinutes, targetMinutes, percentage, isAchieved, statusText }) => (
                      <div key={goal.id} className="px-5 py-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            {isAchieved
                              ? <Icon.CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                              : <Icon.Clock className="w-4 h-4 text-slate-500 flex-shrink-0" />
                            }
                            <span className="text-sm font-semibold text-white">{goal.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => { setEditingGoal(goal); setShowGoalModal(true); }}
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-200 transition-colors"
                            >
                              <Icon.Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-colors"
                            >
                              <Icon.Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-slate-500">{statusText}</span>
                          <span className={`font-bold tabular-nums ${isAchieved ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {formatTime(currentMinutes * 60)} / {formatTime(targetMinutes * 60)}
                          </span>
                        </div>
                        <ProgressBar
                          percentage={percentage}
                          colorClass={isAchieved ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-cyan-600 to-cyan-400'}
                          height="normal"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Focus Mode */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <Icon.ShieldAlert className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-semibold text-white">Focus Mode</h3>
                    {settings.focusMode.enabled && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-400 text-[10px] font-semibold">Active</span>
                    )}
                  </div>
                  <Toggle
                    checked={settings.focusMode.enabled}
                    onChange={async () => {
                      const updated = await StorageService.saveSettings({
                        focusMode: { ...settings.focusMode, enabled: !settings.focusMode.enabled },
                      });
                      setSettings(updated);
                    }}
                  />
                </div>

                <div className="p-5 space-y-5">
                  <p className="text-xs text-slate-400">
                    Focus Mode shows warnings (or blocks) specified websites during your focus sessions. You remain in complete control.
                  </p>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-2">Mode</label>
                    <div className="flex gap-2">
                      {(['warning', 'block'] as const).map((m) => (
                        <button
                          key={m}
                          onClick={async () => {
                            const updated = await StorageService.saveSettings({
                              focusMode: { ...settings.focusMode, mode: m },
                            });
                            setSettings(updated);
                          }}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                            settings.focusMode.mode === m
                              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400 shadow-sm'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {m === 'warning' ? (
                            <>
                              <Icon.Alert className="w-3.5 h-3.5 text-amber-400" />
                              <span>Warning</span>
                            </>
                          ) : (
                            <>
                              <Icon.SlashCircle className="w-3.5 h-3.5 text-rose-400" />
                              <span>Block</span>
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-2">Blocked Domains</label>
                    <div className="flex flex-wrap gap-2">
                      {settings.focusMode.blockedDomains.map((d) => (
                        <div key={d} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300">
                          {d}
                          <button
                            onClick={async () => {
                              const updated = await StorageService.saveSettings({
                                focusMode: {
                                  ...settings.focusMode,
                                  blockedDomains: settings.focusMode.blockedDomains.filter((x) => x !== d),
                                },
                              });
                              setSettings(updated);
                            }}
                            className="text-slate-600 hover:text-rose-400 transition-colors"
                          >
                            <Icon.X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const domain = window.prompt('Enter domain to block (e.g. youtube.com):');
                          if (domain && !settings.focusMode.blockedDomains.includes(domain.toLowerCase())) {
                            StorageService.saveSettings({
                              focusMode: {
                                ...settings.focusMode,
                                blockedDomains: [...settings.focusMode.blockedDomains, domain.toLowerCase()],
                              },
                            }).then(setSettings);
                          }
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 border-dashed text-xs text-slate-500 hover:text-slate-200 hover:border-slate-600 transition-colors"
                      >
                        <Icon.Plus className="w-3 h-3" /> Add domain
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── INSIGHTS PAGE ─── */}
          {activePage === 'insights' && (
            <div className="space-y-6 max-w-3xl mx-auto animate-fade-in-up">
              {/* Daily Summary */}
              {dailySummary && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Icon.Lightbulb className="w-4 h-4 text-amber-400" />
                    Today's Summary
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Total Tracked', value: dailySummary.totalTimeStr, color: 'text-white' },
                      { label: 'Productive Time', value: dailySummary.productiveTimeStr, color: 'text-emerald-400' },
                      { label: 'Most Active', value: dailySummary.mostActiveCategory ?? '—', color: 'text-white' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                        <div className="text-xs text-slate-500 mb-1">{label}</div>
                        <div className={`text-base font-bold ${color}`}>{value}</div>
                      </div>
                    ))}
                    <div className="col-span-2 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                      <div className="text-xs text-slate-500 mb-1">Peak Activity Period</div>
                      <div className="text-base font-bold text-cyan-400">{dailySummary.mostProductivePeriod}</div>
                    </div>
                    {dailySummary.topSite && (
                      <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                        <div className="text-xs text-slate-500 mb-1">Top Site</div>
                        <div className="text-sm font-bold text-white truncate">
                          {formatDomainDisplayName(dailySummary.topSite.domain)}
                        </div>
                        <div className="text-xs text-slate-500">{dailySummary.topSite.timeStr}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Weekly Insights */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Icon.TrendingUp className="w-4 h-4 text-cyan-400" />
                  Weekly Insights
                </h3>
                {weeklyInsights.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
                    <Icon.Lightbulb className="w-8 h-8 mx-auto mb-3 opacity-25" />
                    <p className="text-sm">Keep browsing — insights appear after a few days of data.</p>
                  </div>
                ) : (
                  weeklyInsights.map((insight) => (
                    <div key={insight.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white mb-1">{insight.title}</div>
                          <p className="text-xs text-slate-400">{insight.description}</p>
                        </div>
                        <span className="flex-shrink-0 px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-semibold">
                          {insight.badge}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ─── SETTINGS PAGE ─── */}
          {activePage === 'settings' && (
            <div className="space-y-6 max-w-2xl mx-auto animate-fade-in-up">
              {/* Tracking Settings */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800/60">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Icon.Settings className="w-4 h-4 text-slate-400" />
                    Tracking
                  </h3>
                </div>
                <div className="divide-y divide-slate-800/40">
                  {/* Enable Tracking */}
                  <div className="flex items-center justify-between px-5 py-4">
                    <div>
                      <div className="text-sm font-medium text-white">Enable Tracking</div>
                      <div className="text-xs text-slate-500 mt-0.5">Automatically track browser activity</div>
                    </div>
                    <Toggle
                      checked={settings.trackingEnabled}
                      onChange={async () => {
                        const updated = await StorageService.saveSettings({ trackingEnabled: !settings.trackingEnabled });
                        setSettings(updated);
                      }}
                    />
                  </div>

                  {/* Idle Threshold */}
                  <div className="flex items-center justify-between px-5 py-4">
                    <div>
                      <div className="text-sm font-medium text-white">Idle Detection Threshold</div>
                      <div className="text-xs text-slate-500 mt-0.5">Stop tracking after this many seconds of inactivity</div>
                    </div>
                    <select
                      value={settings.idleThresholdSeconds}
                      onChange={async (e) => {
                        const updated = await StorageService.saveSettings({ idleThresholdSeconds: Number(e.target.value) });
                        setSettings(updated);
                      }}
                      className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    >
                      <option value={30}>30 seconds</option>
                      <option value={60}>1 minute</option>
                      <option value={120}>2 minutes</option>
                      <option value={300}>5 minutes</option>
                    </select>
                  </div>

                  {/* Notifications */}
                  <div className="flex items-center justify-between px-5 py-4">
                    <div>
                      <div className="text-sm font-medium text-white">Notifications</div>
                      <div className="text-xs text-slate-500 mt-0.5">Receive break reminders and site usage alerts</div>
                    </div>
                    <Toggle
                      checked={settings.notifications.enabled}
                      onChange={async () => {
                        const updated = await StorageService.saveSettings({
                          notifications: { ...settings.notifications, enabled: !settings.notifications.enabled },
                        });
                        setSettings(updated);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Privacy Section */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800/60">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Icon.Lock className="w-4 h-4 text-emerald-400" />
                    Privacy
                  </h3>
                </div>
                <div className="p-5">
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                      <Icon.ShieldCheck className="w-4 h-4" />
                      Your browsing activity stays on your device
                    </div>
                    <ul className="text-xs text-slate-400 space-y-2 pl-1">
                      {[
                        'FocusTrack tracks only domain names, not full URLs or page content',
                        'No text, passwords, form inputs, or keystrokes are collected',
                        'No account, email, or login required',
                        'All data is stored in your browser using chrome.storage.local',
                        'No data is ever sent to any external server',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <Icon.Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Data Export/Import */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800/60">
                  <h3 className="text-sm font-semibold text-white">Data Export & Import</h3>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => exportDataAsJSON().then(() => showToast('Exported as JSON!'))}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium border border-slate-700 transition-colors"
                    >
                      <Icon.Download className="w-4 h-4" />Export JSON
                    </button>
                    <button
                      onClick={() => exportDataAsCSV().then(() => showToast('Exported as CSV!'))}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium border border-slate-700 transition-colors"
                    >
                      <Icon.Download className="w-4 h-4" />Export CSV
                    </button>
                    <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium border border-slate-700 transition-colors cursor-pointer">
                      <Icon.Upload className="w-4 h-4" />Import JSON
                      <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                    </label>
                  </div>
                  <p className="text-xs text-slate-600">All exports are local files. Nothing is sent to any server.</p>
                </div>
              </div>

              {/* Data Reset */}
              <div className="bg-slate-900 border border-rose-900/25 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-rose-900/25">
                  <h3 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
                    <Icon.Alert className="w-4 h-4" />
                    Danger Zone
                  </h3>
                </div>
                <div className="p-5 space-y-2">
                  <p className="text-xs text-slate-500 mb-3">These actions are permanent and cannot be undone.</p>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: 'Clear Today', scope: 'today' as const },
                      { label: 'Clear Last 7 Days', scope: 'week' as const },
                      { label: 'Clear All Data', scope: 'all' as const },
                    ].map(({ label, scope }) => (
                      <button
                        key={scope}
                        onClick={() => handleClearData(scope)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/8 hover:bg-rose-500/15 text-rose-400 text-sm font-medium border border-rose-500/20 transition-colors"
                      >
                        <Icon.Trash className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Domain Detail Modal */}
      {selectedDomain && todayActivity.domains[selectedDomain] && (
        <DomainDetailModal
          domain={selectedDomain}
          todayActivity={todayActivity.domains[selectedDomain]}
          weeklyTotalSeconds={getWeeklyDomainSeconds(selectedDomain)}
          monthlyTotalSeconds={getMonthlyDomainSeconds(selectedDomain)}
          yesterdaySeconds={activities[yesterdayKey]?.domains[selectedDomain]?.totalTime ?? 0}
          settings={settings}
          onClose={() => setSelectedDomain(null)}
          onSettingsChanged={() => { setSelectedDomain(null); loadData(); }}
        />
      )}

      {/* Goal Modal */}
      {showGoalModal && (
        <GoalModal
          existingGoal={editingGoal}
          onSave={handleSaveGoal}
          onClose={() => { setShowGoalModal(false); setEditingGoal(undefined); }}
        />
      )}
    </div>
  );
};
