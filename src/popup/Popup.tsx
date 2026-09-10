import React, { useEffect, useState, useCallback } from 'react';
import { StorageService } from '../services/storage';
import { CurrentTrackingState, DailyActivity, UserSettings, DomainActivity } from '../types';
import { formatTimeLive, formatTime, calculateProductivityBreakdown } from '../analytics/productivity';
import { getFaviconUrl, formatDomainDisplayName } from '../utils/domain';

// ─── SVG Icon Components ──────────────────────────────────────────────────────

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l1.5 3.5L10 8l-3.5 1.5L5 13l-1.5-3.5L0 8l3.5-1.5L5 3z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l1 2.5L22.5 13l-2.5 1L19 16.5l-1-2.5L15.5 13l2.5-1L19 9z" />
  </svg>
);

const DashboardIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const PauseIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

const PlayIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5.14v14l11-7-11-7z" />
  </svg>
);

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" d="M12 7v5l3 3" />
  </svg>
);

const ZapIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const GlobeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" d="M3.6 9h16.8M3.6 15h16.8" />
    <path strokeLinecap="round" d="M12 3c-2 3-3 6-3 9s1 6 3 9M12 3c2 3 3 6 3 9s-1 6-3 9" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

export const Popup: React.FC = () => {
  const [state, setState] = useState<CurrentTrackingState | null>(null);
  const [today, setToday] = useState<DailyActivity | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [liveSessionSeconds, setLiveSessionSeconds] = useState<number>(0);
  const [sortMode, setSortMode] = useState<'recent' | 'time'>('recent');
  const [showPauseMenu, setShowPauseMenu] = useState<boolean>(false);
  const [tickSeed, setTickSeed] = useState(0);

  const fetchData = useCallback(async () => {
    let current: CurrentTrackingState | null = null;
    let todayData: DailyActivity | null = null;

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
        if (res && res.state && res.today) {
          current = res.state;
          todayData = res.today;
        }
      } catch (e) {
        // fallback to storage
      }
    }

    if (!current) current = await StorageService.getCurrentState();
    if (!todayData) todayData = await StorageService.getTodayActivity();
    const userSettings = await StorageService.getSettings();

    setState(current);
    setToday(todayData);
    setSettings(userSettings);
  }, []);

  // Data refresh every second
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Live seconds ticker (sub-second precision feel)
  useEffect(() => {
    const timer = setInterval(() => setTickSeed((s) => s + 1), 500);
    return () => clearInterval(timer);
  }, []);

  // Compute live session seconds
  useEffect(() => {
    if (state && state.startTime && !state.isPaused && !state.isIdle && state.isWindowFocused) {
      const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
      setLiveSessionSeconds(elapsed);
    } else {
      setLiveSessionSeconds(0);
    }
  }, [state, tickSeed]);

  const openDashboard = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
    } else {
      window.open('/dashboard.html', '_blank');
    }
  };

  const handlePause = async (minutes: number | null) => {
    setShowPauseMenu(false);
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      if (minutes === null) {
        await chrome.runtime.sendMessage({ type: 'RESUME_TRACKING' });
      } else {
        await chrome.runtime.sendMessage({ type: 'PAUSE_TRACKING', minutes });
      }
    } else {
      if (minutes === null) {
        await StorageService.saveSettings({ pauseUntil: null });
      } else {
        await StorageService.saveSettings({ pauseUntil: Date.now() + minutes * 60 * 1000 });
      }
    }
    await fetchData();
  };

  if (!state || !today || !settings) {
    return (
      <div className="flex items-center justify-center h-full p-8 gap-2.5">
        <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-sm">Loading FocusTrack...</span>
      </div>
    );
  }

  const breakdown = calculateProductivityBreakdown(today, settings);
  const activeDomain = state.activeDomain;
  const isPaused = !!(settings.pauseUntil && settings.pauseUntil > Date.now());
  const isTracking = settings.trackingEnabled && !isPaused && !state.isIdle && state.isWindowFocused;

  // Live total time = stored totalTime + live session seconds
  const liveTotalTime = today.totalTime + (isTracking && activeDomain ? liveSessionSeconds : 0);

  // Today's domains (up to 4) sorted by latest visited (lastActive desc) or time
  const topDomains = Object.values(today.domains || {})
    .sort((a, b) => {
      if (sortMode === 'recent') {
        const aActive = a.domain === activeDomain ? Date.now() : (a.lastActive || 0);
        const bActive = b.domain === activeDomain ? Date.now() : (b.lastActive || 0);
        return bActive - aActive;
      }
      const aTime = a.domain === activeDomain ? a.totalTime + liveSessionSeconds : a.totalTime;
      const bTime = b.domain === activeDomain ? b.totalTime + liveSessionSeconds : b.totalTime;
      return bTime - aTime;
    })
    .slice(0, 4);

  const activeDomainTime = activeDomain && today.domains[activeDomain]
    ? today.domains[activeDomain].totalTime + liveSessionSeconds
    : liveSessionSeconds;

  const siteCount = Object.keys(today.domains || {}).length;

  return (
    <div className="flex flex-col bg-slate-950 text-slate-100 overflow-hidden" style={{ width: 340, minHeight: 480 }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-800/70">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <ZapIcon className="w-4 h-4 text-white" />
            </div>
            {/* Live pulse dot */}
            {isTracking && (
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
            )}
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white">FocusTrack</h1>
            <p className="text-[10px] text-slate-500 font-medium leading-tight">
              {isTracking ? 'Tracking active' : isPaused ? 'Tracking paused' : 'Idle'}
            </p>
          </div>
        </div>
        <button
          onClick={openDashboard}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-cyan-400 text-xs font-medium transition-all border border-slate-700/60 hover:border-slate-600"
        >
          <DashboardIcon className="w-3.5 h-3.5" />
          Dashboard
        </button>
      </div>

      {/* ── Paused Banner ── */}
      {isPaused && (
        <div className="mx-3 mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 text-xs">
            <PauseIcon className="w-3.5 h-3.5" />
            <span className="font-medium">Tracking paused</span>
          </div>
          <button
            onClick={() => handlePause(null)}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 text-xs font-semibold transition-colors"
          >
            Resume
          </button>
        </div>
      )}

      {/* ── Active Site Card ── */}
      <div className="mx-3 mt-3 p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800/80 relative overflow-hidden">
        {/* Glow accent */}
        {isTracking && activeDomain && (
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        )}

        <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2.5">
          Current Tab
        </div>

        {activeDomain ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex-shrink-0">
                <img
                  src={getFaviconUrl(activeDomain)}
                  alt={activeDomain}
                  className="w-8 h-8 rounded-lg"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  {formatDomainDisplayName(activeDomain)}
                </div>
                <div className="text-[10px] text-slate-500 truncate">{activeDomain}</div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-bold text-cyan-400 font-mono leading-tight tabular-nums">
                {formatTimeLive(activeDomainTime)}
              </div>
              <div className="text-[10px] text-slate-500">on site today</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-slate-500">
            <GlobeIcon className="w-6 h-6 opacity-40" />
            <div>
              <div className="text-xs font-medium text-slate-400">No trackable site</div>
              <div className="text-[10px] text-slate-600">Open a webpage to start tracking</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-3 gap-2 mx-3 mt-2.5">
        {/* Total Time */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
          <div className="flex items-center gap-1 mb-1">
            <ClockIcon className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] text-slate-500 font-medium">Total</span>
          </div>
          <div className="text-sm font-bold text-white tabular-nums">{formatTime(liveTotalTime)}</div>
        </div>

        {/* Productivity */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
          <div className="flex items-center gap-1 mb-1">
            <ZapIcon className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] text-slate-500 font-medium">Score</span>
          </div>
          <div className="text-sm font-bold text-cyan-400">{breakdown.score}<span className="text-[10px] text-slate-600 font-normal">/100</span></div>
        </div>

        {/* Sites */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/60">
          <div className="flex items-center gap-1 mb-1">
            <GlobeIcon className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] text-slate-500 font-medium">Sites</span>
          </div>
          <div className="text-sm font-bold text-white">{siteCount}</div>
        </div>
      </div>

      {/* ── Sites Section ── */}
      {topDomains.length > 0 && (
        <div className="mx-3 mt-2.5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {sortMode === 'recent' ? 'Latest Visited Sites' : 'Top Sites Today'}
            </div>
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setSortMode('recent')}
                className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors ${
                  sortMode === 'recent' ? 'bg-cyan-500/20 text-cyan-400 font-semibold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Latest
              </button>
              <button
                onClick={() => setSortMode('time')}
                className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors ${
                  sortMode === 'time' ? 'bg-cyan-500/20 text-cyan-400 font-semibold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Time
              </button>
            </div>
          </div>
          <div className="space-y-1">
            {topDomains.map((domain) => {
              const dTime = domain.domain === activeDomain
                ? domain.totalTime + liveSessionSeconds
                : domain.totalTime;
              const pct = liveTotalTime > 0 ? (dTime / liveTotalTime) * 100 : 0;
              return (
                <div key={domain.domain} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-slate-900/60 transition-colors">
                  <img
                    src={getFaviconUrl(domain.domain)}
                    alt={domain.domain}
                    className="w-4 h-4 rounded flex-shrink-0"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {formatDomainDisplayName(domain.domain)}
                      </span>
                      <span className="text-xs font-semibold text-slate-300 flex-shrink-0 tabular-nums">
                        {formatTime(dTime)}
                      </span>
                    </div>
                    {/* Mini bar */}
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          domain.domain === activeDomain
                            ? 'bg-gradient-to-r from-cyan-600 to-cyan-400'
                            : 'bg-slate-600'
                        }`}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-600 flex-shrink-0">{Math.round(pct)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Footer Controls ── */}
      <div className="relative mt-auto mx-3 pt-3 pb-3.5 border-t border-slate-800/70 flex items-center justify-between gap-2">
        <div className="relative">
          <button
            onClick={() => setShowPauseMenu(!showPauseMenu)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              isPaused
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-slate-800 border-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {isPaused
              ? <><PlayIcon className="w-3.5 h-3.5" />Resume</>
              : <><PauseIcon className="w-3.5 h-3.5 text-amber-400" />Pause</>
            }
          </button>

          {showPauseMenu && !isPaused && (
            <div className="absolute bottom-full left-0 mb-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/50 py-1.5 z-50">
              {[
                { label: 'Pause for 15 minutes', minutes: 15 },
                { label: 'Pause for 30 minutes', minutes: 30 },
                { label: 'Pause for 1 hour', minutes: 60 },
                { label: 'Pause until tomorrow', minutes: 1440 },
              ].map(({ label, minutes }) => (
                <button
                  key={minutes}
                  onClick={() => handlePause(minutes)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-800 text-slate-200 text-xs transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <ShieldIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] text-slate-500 font-medium">100% Local</span>
        </div>
      </div>
    </div>
  );
};
