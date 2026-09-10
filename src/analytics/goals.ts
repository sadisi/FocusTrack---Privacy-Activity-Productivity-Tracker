import { Goal, DailyActivity, UserSettings, CategoryType } from '../types';
import { getCategoryProductivityType } from '../utils/categories';

export interface GoalProgress {
  goal: Goal;
  currentMinutes: number;
  targetMinutes: number;
  remainingMinutes: number;
  percentage: number; // 0 to 100+
  isAchieved: boolean;
  statusText: string;
}

export function evaluateGoals(
  goals: Goal[],
  activities: Record<string, DailyActivity>,
  todayKey: string,
  settings: UserSettings
): GoalProgress[] {
  const todayActivity = activities[todayKey] || {
    date: todayKey,
    totalTime: 0,
    domains: {},
    sessions: [],
  };

  return goals.map((goal) => {
    let currentSeconds = 0;
    const isMinGoal = goal.type.startsWith('min_');

    if (goal.type === 'min_category' || goal.type === 'max_category') {
      const targetCategory = goal.targetValue as CategoryType;
      Object.values(todayActivity.domains || {}).forEach((d) => {
        if (d.category === targetCategory) {
          currentSeconds += d.totalTime;
        }
      });
    } else if (goal.type === 'min_productive') {
      Object.values(todayActivity.domains || {}).forEach((d) => {
        if (
          getCategoryProductivityType(
            d.category,
            settings.productiveCategories,
            settings.distractingCategories
          ) === 'productive'
        ) {
          currentSeconds += d.totalTime;
        }
      });
    } else if (goal.type === 'max_distracting') {
      Object.values(todayActivity.domains || {}).forEach((d) => {
        if (
          getCategoryProductivityType(
            d.category,
            settings.productiveCategories,
            settings.distractingCategories
          ) === 'distracting'
        ) {
          currentSeconds += d.totalTime;
        }
      });
    } else if (goal.type === 'min_domain' || goal.type === 'max_domain') {
      const targetDomain = (goal.targetValue || '').toLowerCase();
      Object.values(todayActivity.domains || {}).forEach((d) => {
        if (d.domain.toLowerCase() === targetDomain) {
          currentSeconds += d.totalTime;
        }
      });
    }

    const currentMinutes = Math.round(currentSeconds / 60);
    const targetMinutes = goal.targetMinutes;

    let percentage = 0;
    if (targetMinutes > 0) {
      percentage = Math.min(100, Math.round((currentMinutes / targetMinutes) * 100));
    }

    let isAchieved = false;
    let remainingMinutes = 0;
    let statusText = '';

    if (isMinGoal) {
      isAchieved = currentMinutes >= targetMinutes;
      remainingMinutes = Math.max(0, targetMinutes - currentMinutes);
      statusText = isAchieved
        ? 'Goal Achieved!'
        : `${remainingMinutes}m remaining to reach target`;
    } else {
      isAchieved = currentMinutes <= targetMinutes;
      remainingMinutes = Math.max(0, targetMinutes - currentMinutes);
      statusText = isAchieved
        ? `${remainingMinutes}m buffer left`
        : `Exceeded target by ${currentMinutes - targetMinutes}m`;
    }

    return {
      goal,
      currentMinutes,
      targetMinutes,
      remainingMinutes,
      percentage,
      isAchieved,
      statusText,
    };
  });
}
