import { describe, it, expect } from 'vitest';
import { formatTime, formatTimeLive, formatTimeCompact, calculateProductivityBreakdown } from '../analytics/productivity';
import { DomainActivity, DailyActivity, UserSettings } from '../types';
import { DEFAULT_SETTINGS } from '../services/storage';

describe('Tracking & Live Data Features', () => {
  it('formats live ticking time correctly for seconds, minutes, and hours', () => {
    expect(formatTimeLive(5)).toBe('5s');
    expect(formatTimeLive(45)).toBe('45s');
    expect(formatTimeLive(90)).toBe('1m 30s');
    expect(formatTimeLive(3665)).toBe('1h 1m 5s');
  });

  it('formats compact time correctly', () => {
    expect(formatTimeCompact(50)).toBe('50s');
    expect(formatTimeCompact(300)).toBe('5m');
    expect(formatTimeCompact(7300)).toBe('2h 1m');
  });

  it('sorts domain activities by lastActive timestamp (Latest Visited first)', () => {
    const now = Date.now();
    const domains: Record<string, DomainActivity> = {
      'github.com': {
        domain: 'github.com',
        category: 'Development',
        totalTime: 1200,
        visitCount: 5,
        lastActive: now - 300000, // 5 mins ago
      },
      'youtube.com': {
        domain: 'youtube.com',
        category: 'Entertainment',
        totalTime: 3600,
        visitCount: 10,
        lastActive: now - 60000, // 1 min ago (most recent!)
      },
      'stackoverflow.com': {
        domain: 'stackoverflow.com',
        category: 'Development',
        totalTime: 800,
        visitCount: 3,
        lastActive: now - 600000, // 10 mins ago
      },
    };

    const sortedByRecent = Object.values(domains).sort(
      (a, b) => (b.lastActive || 0) - (a.lastActive || 0)
    );

    expect(sortedByRecent[0].domain).toBe('youtube.com');
    expect(sortedByRecent[1].domain).toBe('github.com');
    expect(sortedByRecent[2].domain).toBe('stackoverflow.com');
  });

  it('accurately calculates productivity breakdown with short live tracking sessions', () => {
    const todayActivity: DailyActivity = {
      date: '2026-09-10',
      totalTime: 15, // 15s total (e.g. three 5s visits)
      domains: {
        'github.com': {
          domain: 'github.com',
          category: 'Development',
          totalTime: 10,
          visitCount: 2,
          lastActive: Date.now(),
        },
        'reddit.com': {
          domain: 'reddit.com',
          category: 'Social Media',
          totalTime: 5,
          visitCount: 1,
          lastActive: Date.now() - 10000,
        },
      },
      sessions: [],
    };

    const breakdown = calculateProductivityBreakdown(todayActivity, DEFAULT_SETTINGS);
    expect(breakdown.productiveTime).toBe(10);
    expect(breakdown.distractingTime).toBe(5);
    expect(breakdown.score).toBeGreaterThan(0);
  });
});
