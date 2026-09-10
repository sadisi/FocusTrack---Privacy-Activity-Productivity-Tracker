import { describe, it, expect } from 'vitest';
import { calculateProductivityBreakdown, formatTime } from '../analytics/productivity';
import { DailyActivity, UserSettings } from '../types';
import { DEFAULT_SETTINGS } from '../services/storage';

function makeActivity(overrides: Partial<DailyActivity> = {}): DailyActivity {
  return {
    date: '2026-09-10',
    totalTime: 0,
    domains: {},
    sessions: [],
    ...overrides,
  };
}

const settings: UserSettings = {
  ...DEFAULT_SETTINGS,
  productiveCategories: ['Development', 'Education', 'Work'],
  distractingCategories: ['Entertainment', 'Social Media'],
};

describe('calculateProductivityBreakdown', () => {
  it('returns score 100 with zero activity', () => {
    const result = calculateProductivityBreakdown(makeActivity(), settings);
    expect(result.score).toBe(100);
    expect(result.totalTime).toBe(0);
  });

  it('returns score 100 when all time is productive', () => {
    const activity = makeActivity({
      totalTime: 3600,
      domains: {
        'github.com': { domain: 'github.com', category: 'Development', totalTime: 3600, visitCount: 5, lastActive: Date.now() },
      },
    });
    const result = calculateProductivityBreakdown(activity, settings);
    expect(result.score).toBe(100);
    expect(result.productivePercentage).toBe(100);
  });

  it('returns low score with all entertainment', () => {
    const activity = makeActivity({
      totalTime: 3600,
      domains: {
        'youtube.com': { domain: 'youtube.com', category: 'Entertainment', totalTime: 3600, visitCount: 3, lastActive: Date.now() },
      },
    });
    const result = calculateProductivityBreakdown(activity, settings);
    expect(result.score).toBe(0);
    expect(result.distractingPercentage).toBe(100);
  });

  it('calculates mixed score correctly', () => {
    const activity = makeActivity({
      totalTime: 4000,
      domains: {
        'github.com': { domain: 'github.com', category: 'Development', totalTime: 2000, visitCount: 5, lastActive: Date.now() },
        'youtube.com': { domain: 'youtube.com', category: 'Entertainment', totalTime: 2000, visitCount: 2, lastActive: Date.now() },
      },
    });
    const result = calculateProductivityBreakdown(activity, settings);
    // Productive: 2000/4000 = 50%, distracting: 2000/4000 = 50%
    // score = (2000 + 0*0.5) / 4000 * 100 = 50
    expect(result.score).toBe(50);
    expect(result.productivePercentage).toBe(50);
    expect(result.distractingPercentage).toBe(50);
  });
});

describe('formatTime', () => {
  it('returns 0s for zero seconds', () => {
    expect(formatTime(0)).toBe('0s');
  });

  it('formats minutes correctly', () => {
    expect(formatTime(90)).toBe('1m 30s');
    expect(formatTime(600)).toBe('10m');
  });

  it('formats hours correctly', () => {
    expect(formatTime(3600)).toBe('1h');
    expect(formatTime(5400)).toBe('1h 30m');
    expect(formatTime(9000)).toBe('2h 30m');
  });

  it('handles negative and null values', () => {
    expect(formatTime(-10)).toBe('0s');
  });
});
