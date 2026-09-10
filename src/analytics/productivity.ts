import { DailyActivity, UserSettings, CategoryType } from '../types';
import { getCategoryProductivityType } from '../utils/categories';

export interface ProductivityBreakdown {
  score: number; // 0 to 100
  productiveTime: number; // seconds
  distractingTime: number; // seconds
  neutralTime: number; // seconds
  totalTime: number; // seconds
  productivePercentage: number;
  distractingPercentage: number;
  neutralPercentage: number;
}

export function calculateProductivityBreakdown(
  activity: DailyActivity,
  settings: UserSettings
): ProductivityBreakdown {
  let productiveTime = 0;
  let distractingTime = 0;
  let neutralTime = 0;

  const domains = activity.domains || {};
  Object.values(domains).forEach((d) => {
    const prodType = getCategoryProductivityType(
      d.category,
      settings.productiveCategories,
      settings.distractingCategories
    );

    if (prodType === 'productive') {
      productiveTime += d.totalTime;
    } else if (prodType === 'distracting') {
      distractingTime += d.totalTime;
    } else {
      neutralTime += d.totalTime;
    }
  });

  const totalTime = activity.totalTime || (productiveTime + distractingTime + neutralTime);

  if (totalTime === 0) {
    return {
      score: 100,
      productiveTime: 0,
      distractingTime: 0,
      neutralTime: 0,
      totalTime: 0,
      productivePercentage: 0,
      distractingPercentage: 0,
      neutralPercentage: 0,
    };
  }

  // Formula: Productive (100%) + Neutral (50%) / Total
  const rawScore = ((productiveTime + 0.5 * neutralTime) / totalTime) * 100;
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  return {
    score,
    productiveTime,
    distractingTime,
    neutralTime,
    totalTime,
    productivePercentage: Math.round((productiveTime / totalTime) * 100),
    distractingPercentage: Math.round((distractingTime / totalTime) * 100),
    neutralPercentage: Math.round((neutralTime / totalTime) * 100),
  };
}

/**
 * Formats seconds into a human-readable string with proper granularity.
 * < 60s  →  "45s"
 * < 3600s → "1m 30s"
 * >= 3600s → "2h 15m"
 */
export function formatTime(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0s';
  const secs = Math.floor(totalSeconds);
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (minutes > 0) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Formats seconds for live ticking display — always shows finest granularity.
 * 45 → "45s"
 * 90 → "1m 30s"
 * 3700 → "1h 1m 40s"
 */
export function formatTimeLive(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0s';
  const secs = Math.floor(totalSeconds);
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m ${seconds}s` : `${hours}h ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Compact time for charts/tooltips: "2h 15m" or "45m" or "30s"
 */
export function formatTimeCompact(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0s';
  const secs = Math.floor(totalSeconds);
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Detailed format: always shows h m s
 */
export function formatTimeDetailed(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0s';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
