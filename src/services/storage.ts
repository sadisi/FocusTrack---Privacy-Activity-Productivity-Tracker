import {
  ExtensionStorage,
  UserSettings,
  DailyActivity,
  CurrentTrackingState,
  CategoryType,
} from '../types';
import {
  DEFAULT_PRODUCTIVE_CATEGORIES,
  DEFAULT_DISTRACTING_CATEGORIES,
} from '../utils/categories';

export function getTodayKey(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export const DEFAULT_SETTINGS: UserSettings = {
  onboardingCompleted: false,
  trackingEnabled: true,
  idleThresholdSeconds: 60,
  theme: 'dark',
  categoryOverrides: {},
  productiveCategories: DEFAULT_PRODUCTIVE_CATEGORIES,
  distractingCategories: DEFAULT_DISTRACTING_CATEGORIES,
  goals: [
    {
      id: 'default-goal-1',
      title: '2 Hours Learning / Dev',
      type: 'min_category',
      targetMinutes: 120,
      targetValue: 'Development',
      period: 'daily',
      createdAt: Date.now(),
    },
    {
      id: 'default-goal-2',
      title: 'Limit Social Media under 45m',
      type: 'max_category',
      targetMinutes: 45,
      targetValue: 'Social Media',
      period: 'daily',
      createdAt: Date.now(),
    },
  ],
  focusMode: {
    enabled: false,
    mode: 'warning',
    blockedDomains: ['youtube.com', 'reddit.com', 'x.com', 'facebook.com', 'instagram.com'],
    blockedCategories: ['Social Media', 'Entertainment'],
    scheduleEnabled: false,
    startTime: '09:00',
    endTime: '17:00',
  },
  notifications: {
    enabled: true,
    siteReminderEnabled: true,
    siteReminderMinutes: 45,
    dailyReminderEnabled: true,
    dailyReminderHours: 4,
  },
  pauseUntil: null,
};

export const DEFAULT_CURRENT_STATE: CurrentTrackingState = {
  activeDomain: null,
  activeTabId: null,
  startTime: null,
  isWindowFocused: true,
  isIdle: false,
  isPaused: false,
  pauseUntil: null,
};

/**
 * Storage service interfacing with chrome.storage.local with browser mock fallback.
 */
export const StorageService = {
  async getStorage(): Promise<ExtensionStorage> {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const data = await chrome.storage.local.get(['settings', 'activities', 'currentState']);
      return {
        settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
        activities: data.activities || {},
        currentState: { ...DEFAULT_CURRENT_STATE, ...(data.currentState || {}) },
      };
    } else {
      // LocalStorage fallback for dev mode in non-extension tab
      const rawSettings = localStorage.getItem('focustrack_settings');
      const rawActivities = localStorage.getItem('focustrack_activities');
      const rawState = localStorage.getItem('focustrack_current_state');

      return {
        settings: rawSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(rawSettings) } : DEFAULT_SETTINGS,
        activities: rawActivities ? JSON.parse(rawActivities) : {},
        currentState: rawState ? { ...DEFAULT_CURRENT_STATE, ...JSON.parse(rawState) } : DEFAULT_CURRENT_STATE,
      };
    }
  },

  async getSettings(): Promise<UserSettings> {
    const storage = await this.getStorage();
    return storage.settings;
  },

  async saveSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const currentSettings = await this.getSettings();
    const updatedSettings = { ...currentSettings, ...settings };

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ settings: updatedSettings });
    } else {
      localStorage.setItem('focustrack_settings', JSON.stringify(updatedSettings));
    }

    return updatedSettings;
  },

  async getActivities(): Promise<Record<string, DailyActivity>> {
    const storage = await this.getStorage();
    return storage.activities;
  },

  async saveActivities(activities: Record<string, DailyActivity>): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ activities });
    } else {
      localStorage.setItem('focustrack_activities', JSON.stringify(activities));
    }
  },

  async getTodayActivity(): Promise<DailyActivity> {
    const activities = await this.getActivities();
    const today = getTodayKey();
    if (!activities[today]) {
      return {
        date: today,
        totalTime: 0,
        domains: {},
        sessions: [],
      };
    }
    return activities[today];
  },

  async getCurrentState(): Promise<CurrentTrackingState> {
    const storage = await this.getStorage();
    return storage.currentState;
  },

  async saveCurrentState(state: Partial<CurrentTrackingState>): Promise<void> {
    const current = await this.getCurrentState();
    const updated = { ...current, ...state };

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ currentState: updated });
    } else {
      localStorage.setItem('focustrack_current_state', JSON.stringify(updated));
    }
  },

  async clearData(options: { todayOnly?: boolean; last7Days?: boolean; all?: boolean }): Promise<void> {
    if (options.all) {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.remove(['activities', 'currentState']);
      } else {
        localStorage.removeItem('focustrack_activities');
        localStorage.removeItem('focustrack_current_state');
      }
      return;
    }

    const activities = await this.getActivities();
    const todayKey = getTodayKey();

    if (options.todayOnly) {
      delete activities[todayKey];
    } else if (options.last7Days) {
      const now = new Date();
      for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const k = getTodayKey(d);
        delete activities[k];
      }
    }

    await this.saveActivities(activities);
  }
};
