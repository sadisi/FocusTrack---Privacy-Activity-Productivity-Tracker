import { extractDomain } from '../utils/domain';
import { getDomainCategory } from '../utils/categories';
import { StorageService, getTodayKey } from '../services/storage';
import { Session } from '../types';

export class TrackingEngine {
  private static instance: TrackingEngine;
  private currentDomain: string | null = null;
  private currentTabId: number | null = null;
  private startTime: number | null = null;
  private isWindowFocused: boolean = true;
  private isIdle: boolean = false;
  private isPaused: boolean = false;
  private lastTabUpdateKey: string | null = null; // dedup guard

  private constructor() {}

  public static getInstance(): TrackingEngine {
    if (!TrackingEngine.instance) {
      TrackingEngine.instance = new TrackingEngine();
    }
    return TrackingEngine.instance;
  }

  /**
   * Initializes state and attaches event listeners (Service Worker entrypoint)
   */
  public async init(): Promise<void> {
    const settings = await StorageService.getSettings();

    // Check pause status
    if (settings.pauseUntil && settings.pauseUntil > Date.now()) {
      this.isPaused = true;
    } else if (settings.pauseUntil && settings.pauseUntil <= Date.now()) {
      await StorageService.saveSettings({ pauseUntil: null });
      this.isPaused = false;
    }

    // Configure Chrome Idle detection
    if (typeof chrome !== 'undefined' && chrome.idle) {
      chrome.idle.setDetectionInterval(settings.idleThresholdSeconds || 60);
    }

    // Identify active tab on init
    await this.checkCurrentActiveTab();
  }

  /**
   * Main flush method: accumulates elapsed seconds for current active domain into storage
   */
  public async flushCurrentSession(): Promise<void> {
    const now = Date.now();
    const settings = await StorageService.getSettings();

    // Check if pause expired
    if (this.isPaused && settings.pauseUntil && settings.pauseUntil <= now) {
      this.isPaused = false;
      await StorageService.saveSettings({ pauseUntil: null });
    }

    const canTrack =
      settings.trackingEnabled &&
      !this.isPaused &&
      this.isWindowFocused &&
      !this.isIdle &&
      this.currentDomain != null &&
      this.startTime != null;

    if (canTrack && this.currentDomain && this.startTime) {
      const elapsedMs = now - this.startTime;
      const elapsedSec = Math.floor(elapsedMs / 1000);

      if (elapsedSec > 0) {
        await this.addTimeForDomain(this.currentDomain, elapsedSec, this.startTime, now, settings.categoryOverrides);
        // Reset start time to now for ongoing tracking
        this.startTime = now;
        await StorageService.saveCurrentState({
          activeDomain: this.currentDomain,
          activeTabId: this.currentTabId,
          startTime: this.startTime,
          isWindowFocused: this.isWindowFocused,
          isIdle: this.isIdle,
          isPaused: this.isPaused,
        });
      }
    } else if (!canTrack) {
      // Don't wipe startTime entirely — only null it if the reason is idle/unfocused/paused
      // It will be restored when tracking resumes via onTabChanged / onIdleStateChanged
      if (this.startTime !== null && !this.isWindowFocused || this.isIdle || this.isPaused) {
        this.startTime = null;
      }
    }

    await this.updateBadge(settings.trackingEnabled);
  }

  /**
   * Adds elapsed time to today's activity storage
   */
  public async addTimeForDomain(
    domain: string,
    elapsedSeconds: number,
    sessionStartMs: number,
    sessionEndMs: number,
    categoryOverrides: Record<string, any> = {}
  ): Promise<void> {
    const activities = await StorageService.getActivities();
    const todayKey = getTodayKey();

    if (!activities[todayKey]) {
      activities[todayKey] = {
        date: todayKey,
        totalTime: 0,
        domains: {},
        sessions: [],
      };
    }

    const today = activities[todayKey];
    today.totalTime += elapsedSeconds;

    const category = getDomainCategory(domain, categoryOverrides);

    if (!today.domains[domain]) {
      today.domains[domain] = {
        domain,
        category,
        totalTime: elapsedSeconds,
        visitCount: 1,
        lastActive: sessionEndMs,
        firstVisit: sessionStartMs,
      };
    } else {
      today.domains[domain].totalTime += elapsedSeconds;
      today.domains[domain].lastActive = sessionEndMs;
      today.domains[domain].category = category; // keep category fresh
      // Preserve firstVisit if already set
      if (!today.domains[domain].firstVisit) {
        today.domains[domain].firstVisit = sessionStartMs;
      }
    }

    // Add session if >= 2s
    if (elapsedSeconds >= 2) {
      const newSession: Session = {
        id: `${domain}-${sessionStartMs}`,
        domain,
        startTime: sessionStartMs,
        endTime: sessionEndMs,
        duration: elapsedSeconds,
      };
      today.sessions.push(newSession);
    }

    await StorageService.saveActivities(activities);
  }

  /**
   * Checks current active tab in Chrome and updates active domain state
   */
  public async checkCurrentActiveTab(): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.tabs) return;

    try {
      const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (activeTab && activeTab.url) {
        await this.onTabChanged(activeTab.id || null, activeTab.url);
      } else {
        await this.onTabChanged(null, null);
      }
    } catch (e) {
      console.warn('Failed to query active tab:', e);
    }
  }

  /**
   * Event handler when active tab or URL changes
   */
  public async onTabChanged(tabId: number | null, url: string | null): Promise<void> {
    const newDomain = extractDomain(url);

    // Dedup guard: skip if same tab+domain to avoid double-counting on onUpdated events
    const updateKey = `${tabId}:${newDomain}`;
    if (updateKey === this.lastTabUpdateKey) return;
    this.lastTabUpdateKey = updateKey;

    if (this.currentDomain !== newDomain || this.currentTabId !== tabId) {
      // Flush previous domain time before switching
      await this.flushCurrentSession();

      this.currentTabId = tabId;
      this.currentDomain = newDomain;
      this.startTime = newDomain ? Date.now() : null;

      // Increment visit count when navigating to a new domain
      if (newDomain) {
        await this.incrementVisitCount(newDomain);
      }

      await StorageService.saveCurrentState({
        activeDomain: this.currentDomain,
        activeTabId: this.currentTabId,
        startTime: this.startTime,
        isWindowFocused: this.isWindowFocused,
        isIdle: this.isIdle,
        isPaused: this.isPaused,
      });
    }
  }

  private async incrementVisitCount(domain: string): Promise<void> {
    const activities = await StorageService.getActivities();
    const todayKey = getTodayKey();
    const now = Date.now();

    if (!activities[todayKey]) {
      activities[todayKey] = {
        date: todayKey,
        totalTime: 0,
        domains: {},
        sessions: [],
      };
    }

    const settings = await StorageService.getSettings();
    const category = getDomainCategory(domain, settings.categoryOverrides);

    if (!activities[todayKey].domains[domain]) {
      activities[todayKey].domains[domain] = {
        domain,
        category,
        totalTime: 0,
        visitCount: 1,
        lastActive: now,
        firstVisit: now,
      };
    } else {
      activities[todayKey].domains[domain].visitCount += 1;
      activities[todayKey].domains[domain].lastActive = now;
    }

    await StorageService.saveActivities(activities);
  }

  /**
   * Event handler when window focus changes
   */
  public async onWindowFocusChanged(windowId: number): Promise<void> {
    await this.flushCurrentSession();

    if (typeof chrome !== 'undefined' && chrome.windows) {
      this.isWindowFocused = windowId !== chrome.windows.WINDOW_ID_NONE;
    } else {
      this.isWindowFocused = windowId > 0;
    }

    if (this.isWindowFocused) {
      this.lastTabUpdateKey = null; // reset dedup guard to ensure active tab is re-registered
      await this.checkCurrentActiveTab();
    } else {
      this.startTime = null;
    }
  }

  /**
   * Event handler when idle state changes ('active' | 'idle' | 'locked')
   */
  public async onIdleStateChanged(newState: string): Promise<void> {
    await this.flushCurrentSession();

    this.isIdle = newState !== 'active';

    if (!this.isIdle && this.isWindowFocused && this.currentDomain) {
      this.startTime = Date.now();
    } else {
      this.startTime = null;
    }
  }

  /**
   * Handle global pause/resume
   */
  public async setPauseStatus(pauseMinutes: number | null): Promise<void> {
    await this.flushCurrentSession();

    if (pauseMinutes === null) {
      // Resume tracking
      this.isPaused = false;
      await StorageService.saveSettings({ pauseUntil: null });
      if (this.currentDomain && this.isWindowFocused && !this.isIdle) {
        this.startTime = Date.now();
      }
    } else {
      // Pause for specified minutes
      const pauseUntil = Date.now() + pauseMinutes * 60 * 1000;
      this.isPaused = true;
      await StorageService.saveSettings({ pauseUntil });
      this.startTime = null;
    }

    await StorageService.saveCurrentState({
      isPaused: this.isPaused,
      pauseUntil: this.isPaused ? (await StorageService.getSettings()).pauseUntil : null,
    });
  }

  /**
   * Updates toolbar action badge with active time today
   */
  private async updateBadge(trackingEnabled: boolean): Promise<void> {
    if (typeof chrome === 'undefined' || !chrome.action) return;

    if (!trackingEnabled) {
      await chrome.action.setBadgeText({ text: 'OFF' });
      await chrome.action.setBadgeBackgroundColor({ color: '#64748b' });
      return;
    }

    if (this.isPaused) {
      await chrome.action.setBadgeText({ text: '⏸' });
      await chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });
      return;
    }

    const todayActivity = await StorageService.getTodayActivity();
    const totalSecs = todayActivity.totalTime;

    if (totalSecs === 0) {
      await chrome.action.setBadgeText({ text: '' });
      return;
    }

    let text = '';
    const minutes = Math.floor(totalSecs / 60);
    const hours = Math.floor(minutes / 60);

    if (hours >= 10) {
      text = `${hours}h`;
    } else if (hours > 0) {
      text = `${hours}h${minutes % 60}m`;
    } else if (minutes >= 10) {
      text = `${minutes}m`;
    } else if (minutes > 0) {
      text = `${minutes}m`;
    } else {
      text = `${totalSecs}s`;
    }

    // Chrome badge text max 4 chars
    if (text.length > 4) text = text.substring(0, 4);

    await chrome.action.setBadgeText({ text });
    await chrome.action.setBadgeBackgroundColor({ color: '#0284c7' });
  }
}
