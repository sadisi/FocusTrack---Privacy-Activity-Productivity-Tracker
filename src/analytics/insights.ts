import { DailyActivity, UserSettings, CategoryType } from '../types';
import { calculateProductivityBreakdown, formatTime } from './productivity';
import { getDomainCategory } from '../utils/categories';

export interface DailySummaryData {
  totalTimeStr: string;
  totalTimeSeconds: number;
  topSite: { domain: string; timeStr: string; timeSeconds: number } | null;
  mostProductivePeriod: string;
  productiveTimeStr: string;
  mostActiveCategory: CategoryType | null;
}

export interface WeeklyInsightCard {
  id: string;
  type: 'increase' | 'highlight' | 'active_day' | 'category_stat';
  title: string;
  description: string;
  badge: string;
}

/**
 * Computes Daily Summary from actual today activity
 */
export function generateDailySummary(
  todayActivity: DailyActivity,
  settings: UserSettings
): DailySummaryData {
  const breakdown = calculateProductivityBreakdown(todayActivity, settings);
  const domains = Object.values(todayActivity.domains || {});

  // 1. Top site today
  let topSite: { domain: string; timeStr: string; timeSeconds: number } | null = null;
  if (domains.length > 0) {
    const sorted = [...domains].sort((a, b) => b.totalTime - a.totalTime);
    topSite = {
      domain: sorted[0].domain,
      timeStr: formatTime(sorted[0].totalTime),
      timeSeconds: sorted[0].totalTime,
    };
  }

  // 2. Most active category
  const categoryTotals: Record<string, number> = {};
  domains.forEach((d) => {
    categoryTotals[d.category] = (categoryTotals[d.category] || 0) + d.totalTime;
  });
  let mostActiveCategory: CategoryType | null = null;
  let maxCatTime = 0;
  Object.entries(categoryTotals).forEach(([cat, time]) => {
    if (time > maxCatTime) {
      maxCatTime = time;
      mostActiveCategory = cat as CategoryType;
    }
  });

  // 3. Most productive period (hourly bucket analysis)
  const hourlyBuckets = new Array(24).fill(0);
  (todayActivity.sessions || []).forEach((session) => {
    const date = new Date(session.startTime);
    const hour = date.getHours();
    hourlyBuckets[hour] += session.duration;
  });

  let peakHour = 9;
  let maxBucketTime = 0;
  hourlyBuckets.forEach((time, h) => {
    if (time > maxBucketTime) {
      maxBucketTime = time;
      peakHour = h;
    }
  });

  const startHourStr = peakHour === 0 ? '12 AM' : peakHour <= 12 ? `${peakHour} AM` : `${peakHour - 12} PM`;
  const endHour = (peakHour + 2) % 24;
  const endHourStr = endHour === 0 ? '12 AM' : endHour <= 12 ? `${endHour} AM` : `${endHour - 12} PM`;
  const mostProductivePeriod = maxBucketTime > 0 ? `${startHourStr} – ${endHourStr}` : 'Not enough session data';

  return {
    totalTimeStr: formatTime(todayActivity.totalTime),
    totalTimeSeconds: todayActivity.totalTime,
    topSite,
    mostProductivePeriod,
    productiveTimeStr: formatTime(breakdown.productiveTime),
    mostActiveCategory,
  };
}

/**
 * Generates Weekly Insights from the past 7 to 14 days of activities
 */
export function generateWeeklyInsights(
  activities: Record<string, DailyActivity>,
  settings: UserSettings
): WeeklyInsightCard[] {
  const insights: WeeklyInsightCard[] = [];
  const daysMap: Record<string, number> = {}; // dayName -> totalTime
  const categoryTotals: Record<string, number> = {};
  const domainTotals: Record<string, number> = {};

  const dates = Object.keys(activities).sort();
  if (dates.length === 0) {
    return [
      {
        id: 'empty-insight',
        type: 'highlight',
        title: 'Start Browsing to Unlock Insights',
        description: 'FocusTrack will generate weekly productivity patterns as you browse normally.',
        badge: 'Getting Started',
      },
    ];
  }

  // Aggregate past 7 days data
  const last7Dates = dates.slice(-7);
  let total7DayTime = 0;

  last7Dates.forEach((dateKey) => {
    const act = activities[dateKey];
    total7DayTime += act.totalTime;

    // Day of week
    const dateObj = new Date(dateKey);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    daysMap[dayName] = (daysMap[dayName] || 0) + act.totalTime;

    // Domains & Categories
    Object.values(act.domains || {}).forEach((d) => {
      categoryTotals[d.category] = (categoryTotals[d.category] || 0) + d.totalTime;
      domainTotals[d.domain] = (domainTotals[d.domain] || 0) + d.totalTime;
    });
  });

  // 1. Most active day insight
  let topDay = '';
  let topDayTime = 0;
  Object.entries(daysMap).forEach(([day, time]) => {
    if (time > topDayTime) {
      topDayTime = time;
      topDay = day;
    }
  });
  if (topDay) {
    insights.push({
      id: 'active-day',
      type: 'active_day',
      title: `Most Active Day: ${topDay}`,
      description: `You recorded your highest browser focus time on ${topDay} with ${formatTime(topDayTime)}.`,
      badge: 'Peak Activity',
    });
  }

  // 2. Top Category highlight
  let topCat: CategoryType | null = null;
  let topCatTime = 0;
  Object.entries(categoryTotals).forEach(([cat, time]) => {
    if (time > topCatTime) {
      topCatTime = time;
      topCat = cat as CategoryType;
    }
  });
  if (topCat && topCatTime > 0) {
    insights.push({
      id: 'top-category',
      type: 'category_stat',
      title: `${topCat} Lead Usage`,
      description: `You spent ${formatTime(topCatTime)} on ${topCat} websites over the past week.`,
      badge: 'Category Focus',
    });
  }

  // 3. Top Domain highlight
  let topDomain = '';
  let topDomainTime = 0;
  Object.entries(domainTotals).forEach(([dom, time]) => {
    if (time > topDomainTime) {
      topDomainTime = time;
      topDomain = dom;
    }
  });
  if (topDomain && topDomainTime > 0) {
    insights.push({
      id: 'top-domain',
      type: 'highlight',
      title: `${topDomain} was your #1 site`,
      description: `Accumulated ${formatTime(topDomainTime)} of active focus time on ${topDomain}.`,
      badge: 'Top Site',
    });
  }

  // 4. Comparison insight if past 14 days exist
  if (dates.length >= 14) {
    const prev7Dates = dates.slice(-14, -7);
    let prev7DayDevelopmentTime = 0;
    let curr7DayDevelopmentTime = 0;

    prev7Dates.forEach((dKey) => {
      Object.values(activities[dKey]?.domains || {}).forEach((d) => {
        if (d.category === 'Development' || d.category === 'Education') {
          prev7DayDevelopmentTime += d.totalTime;
        }
      });
    });

    last7Dates.forEach((dKey) => {
      Object.values(activities[dKey]?.domains || {}).forEach((d) => {
        if (d.category === 'Development' || d.category === 'Education') {
          curr7DayDevelopmentTime += d.totalTime;
        }
      });
    });

    if (prev7DayDevelopmentTime > 0) {
      const pctChange = Math.round(
        ((curr7DayDevelopmentTime - prev7DayDevelopmentTime) / prev7DayDevelopmentTime) * 100
      );
      if (pctChange > 0) {
        insights.push({
          id: 'dev-increase',
          type: 'increase',
          title: `${pctChange}% Increase in Dev & Learning`,
          description: `You spent ${pctChange}% more time on development & education websites compared to last week.`,
          badge: 'Productivity Boost',
        });
      }
    }
  }

  return insights;
}
