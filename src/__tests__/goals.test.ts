import { describe, it, expect } from 'vitest';
import { evaluateGoals } from '../analytics/goals';
import { Goal, DailyActivity, UserSettings } from '../types';
import { DEFAULT_SETTINGS } from '../services/storage';

const settings: UserSettings = {
  ...DEFAULT_SETTINGS,
  productiveCategories: ['Development', 'Education'],
  distractingCategories: ['Entertainment', 'Social Media'],
};

const TODAY = '2026-09-10';

function makeActivity(domains: DailyActivity['domains'] = {}): Record<string, DailyActivity> {
  const totalTime = Object.values(domains).reduce((s, d) => s + d.totalTime, 0);
  return {
    [TODAY]: {
      date: TODAY,
      totalTime,
      domains,
      sessions: [],
    },
  };
}

describe('evaluateGoals', () => {
  it('evaluates min_productive goal as achieved when enough time', () => {
    const goals: Goal[] = [{
      id: 'g1', title: 'Test', type: 'min_productive',
      targetMinutes: 60, period: 'daily', createdAt: Date.now(),
    }];

    const activities = makeActivity({
      'github.com': { domain: 'github.com', category: 'Development', totalTime: 5400, visitCount: 3, lastActive: Date.now() },
    });

    const results = evaluateGoals(goals, activities, TODAY, settings);
    expect(results[0].isAchieved).toBe(true);
    expect(results[0].currentMinutes).toBe(90);
  });

  it('evaluates min_productive goal as not achieved when insufficient', () => {
    const goals: Goal[] = [{
      id: 'g1', title: 'Test', type: 'min_productive',
      targetMinutes: 120, period: 'daily', createdAt: Date.now(),
    }];

    const activities = makeActivity({
      'github.com': { domain: 'github.com', category: 'Development', totalTime: 3600, visitCount: 2, lastActive: Date.now() },
    });

    const results = evaluateGoals(goals, activities, TODAY, settings);
    expect(results[0].isAchieved).toBe(false);
    expect(results[0].remainingMinutes).toBe(60);
  });

  it('evaluates max_category goal as not achieved when over limit', () => {
    const goals: Goal[] = [{
      id: 'g2', title: 'Limit Social', type: 'max_category',
      targetMinutes: 30, targetValue: 'Social Media', period: 'daily', createdAt: Date.now(),
    }];

    const activities = makeActivity({
      'reddit.com': { domain: 'reddit.com', category: 'Social Media', totalTime: 3600, visitCount: 10, lastActive: Date.now() },
    });

    const results = evaluateGoals(goals, activities, TODAY, settings);
    expect(results[0].isAchieved).toBe(false);
    expect(results[0].currentMinutes).toBe(60);
  });

  it('evaluates max_category goal as achieved when under limit', () => {
    const goals: Goal[] = [{
      id: 'g2', title: 'Limit Social', type: 'max_category',
      targetMinutes: 60, targetValue: 'Social Media', period: 'daily', createdAt: Date.now(),
    }];

    const activities = makeActivity({
      'reddit.com': { domain: 'reddit.com', category: 'Social Media', totalTime: 1200, visitCount: 3, lastActive: Date.now() },
    });

    const results = evaluateGoals(goals, activities, TODAY, settings);
    expect(results[0].isAchieved).toBe(true);
  });

  it('handles empty activities gracefully', () => {
    const goals: Goal[] = [{
      id: 'g1', title: 'Test', type: 'min_productive',
      targetMinutes: 60, period: 'daily', createdAt: Date.now(),
    }];

    const results = evaluateGoals(goals, {}, TODAY, settings);
    expect(results[0].currentMinutes).toBe(0);
    expect(results[0].isAchieved).toBe(false);
  });

  it('handles empty goals array', () => {
    const results = evaluateGoals([], {}, TODAY, settings);
    expect(results).toHaveLength(0);
  });
});
