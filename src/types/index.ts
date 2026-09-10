export type CategoryType =
  | 'Development'
  | 'Education'
  | 'Work'
  | 'Productivity'
  | 'Communication'
  | 'Social Media'
  | 'Entertainment'
  | 'News'
  | 'Shopping'
  | 'Finance'
  | 'Search'
  | 'Other';

export type ProductivityType = 'productive' | 'neutral' | 'distracting';

export interface Session {
  id: string;
  domain: string;
  startTime: number;
  endTime: number;
  duration: number; // in seconds
}

export interface DomainActivity {
  domain: string;
  category: CategoryType;
  totalTime: number; // in seconds
  visitCount: number;
  lastActive: number; // timestamp ms
  firstVisit?: number; // timestamp ms — first time seen today
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  totalTime: number; // in seconds
  domains: Record<string, DomainActivity>;
  sessions: Session[];
}

export type GoalType =
  | 'min_category'
  | 'max_category'
  | 'min_productive'
  | 'max_distracting'
  | 'min_domain'
  | 'max_domain';

export interface Goal {
  id: string;
  title: string;
  type: GoalType;
  targetMinutes: number;
  targetValue?: string; // domain name or category name
  period: 'daily' | 'weekly';
  createdAt: number;
}

export interface FocusModeConfig {
  enabled: boolean;
  mode: 'warning' | 'block';
  blockedDomains: string[];
  blockedCategories: CategoryType[];
  scheduleEnabled: boolean;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
}

export interface NotificationSettings {
  enabled: boolean;
  siteReminderEnabled: boolean;
  siteReminderMinutes: number;
  dailyReminderEnabled: boolean;
  dailyReminderHours: number;
}

export interface UserSettings {
  onboardingCompleted: boolean;
  trackingEnabled: boolean;
  idleThresholdSeconds: number;
  theme: 'dark' | 'light' | 'system';
  categoryOverrides: Record<string, CategoryType>;
  productiveCategories: CategoryType[];
  distractingCategories: CategoryType[];
  goals: Goal[];
  focusMode: FocusModeConfig;
  notifications: NotificationSettings;
  pauseUntil: number | null; // ms timestamp or null
}

export interface CurrentTrackingState {
  activeDomain: string | null;
  activeTabId: number | null;
  startTime: number | null;
  isWindowFocused: boolean;
  isIdle: boolean;
  isPaused: boolean;
  pauseUntil: number | null;
}

export interface ExtensionStorage {
  settings: UserSettings;
  activities: Record<string, DailyActivity>; // Key: YYYY-MM-DD
  currentState: CurrentTrackingState;
}

export type DateRange = 'today' | '7days' | '30days' | 'all';
