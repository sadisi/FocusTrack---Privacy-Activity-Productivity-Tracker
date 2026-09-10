import React, { useMemo, useState } from 'react';
import { DailyActivity, UserSettings, CategoryType } from '../types';
import { formatTimeCompact } from '../analytics/productivity';

interface CategoryChartProps {
  activity: DailyActivity;
  settings: UserSettings;
}

const CATEGORY_COLORS: Record<string, string> = {
  Development: '#10b981',
  Education: '#06b6d4',
  Work: '#3b82f6',
  Productivity: '#8b5cf6',
  Communication: '#a855f7',
  'Social Media': '#f43f5e',
  Entertainment: '#f59e0b',
  News: '#f97316',
  Shopping: '#ec4899',
  Finance: '#14b8a6',
  Search: '#0ea5e9',
  Other: '#64748b',
};

export const CategoryDonutChart: React.FC<CategoryChartProps> = ({ activity, settings }) => {
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

  const { slices, totalSeconds } = useMemo(() => {
    const catTotals: Partial<Record<CategoryType, number>> = {};

    Object.values(activity.domains || {}).forEach((d) => {
      catTotals[d.category] = (catTotals[d.category] || 0) + d.totalTime;
    });

    const total = Object.values(catTotals).reduce((sum, t) => sum + (t || 0), 0);
    if (total === 0) return { slices: [], totalSeconds: 0 };

    const result = Object.entries(catTotals)
      .filter(([, t]) => t && t > 0)
      .sort(([, a], [, b]) => (b || 0) - (a || 0))
      .map(([cat, seconds]) => ({
        category: cat as CategoryType,
        seconds: seconds || 0,
        percentage: ((seconds || 0) / total) * 100,
        color: CATEGORY_COLORS[cat] || '#64748b',
      }));

    return { slices: result, totalSeconds: total };
  }, [activity]);

  if (slices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-2">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="16" stroke="#1e293b" strokeWidth="8" />
          <circle cx="20" cy="20" r="16" stroke="#334155" strokeWidth="8" strokeDasharray="30 70" />
        </svg>
        <p className="text-sm">No activity data yet</p>
      </div>
    );
  }

  const radius = 50;
  const cx = 68;
  const cy = 68;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;
  // Start from the top (-90 deg = -(circumference * 0.25))
  const startOffset = circumference * 0.25;

  // Build segments with correct offsets
  let runningDash = 0;
  const segments = slices.map((slice) => {
    const dash = (slice.percentage / 100) * circumference;
    const dashOffset = circumference - runningDash + startOffset;
    runningDash += dash;
    return { ...slice, dash, dashOffset };
  });

  const hoveredSlice = hoveredCat ? slices.find((s) => s.category === hoveredCat) : null;

  return (
    <div className="flex items-center gap-4">
      {/* SVG Donut */}
      <div className="flex-shrink-0 relative">
        <svg width="136" height="136" viewBox="0 0 136 136">
          {/* Background track */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
          />
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx={cx} cy={cy} r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={hoveredCat === seg.category ? strokeWidth + 3 : strokeWidth - 2}
              strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
              strokeDashoffset={seg.dashOffset}
              strokeLinecap="butt"
              style={{
                transition: 'stroke-width 0.15s ease, stroke-dasharray 0.5s ease',
                cursor: 'pointer',
                filter: hoveredCat === seg.category ? `drop-shadow(0 0 6px ${seg.color}80)` : 'none',
              }}
              onMouseEnter={() => setHoveredCat(seg.category)}
              onMouseLeave={() => setHoveredCat(null)}
            />
          ))}
          {/* Center display */}
          {hoveredSlice ? (
            <>
              <text x={cx} y={cy - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill={hoveredSlice.color}>
                {Math.round(hoveredSlice.percentage)}%
              </text>
              <text x={cx} y={cy + 6} textAnchor="middle" fontSize="8" fill="#94a3b8">
                {hoveredSlice.category.split(' ')[0]}
              </text>
              <text x={cx} y={cy + 18} textAnchor="middle" fontSize="8" fill="#64748b">
                {formatTimeCompact(hoveredSlice.seconds)}
              </text>
            </>
          ) : (
            <>
              <text x={cx} y={cy - 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="white">
                {formatTimeCompact(totalSeconds)}
              </text>
              <text x={cx} y={cy + 11} textAnchor="middle" fontSize="9" fill="#64748b">
                total today
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        {segments.slice(0, 7).map((seg) => (
          <div
            key={seg.category}
            className={`flex items-center justify-between gap-2 px-2 py-1 rounded-lg transition-colors cursor-default ${
              hoveredCat === seg.category ? 'bg-slate-800/70' : 'hover:bg-slate-800/40'
            }`}
            onMouseEnter={() => setHoveredCat(seg.category)}
            onMouseLeave={() => setHoveredCat(null)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-xs text-slate-300 truncate">{seg.category}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-slate-500">{formatTimeCompact(seg.seconds)}</span>
              <span className="text-xs font-semibold" style={{ color: seg.color }}>
                {Math.round(seg.percentage)}%
              </span>
            </div>
          </div>
        ))}
        {segments.length > 7 && (
          <div className="text-xs text-slate-500 pl-2">+{segments.length - 7} more</div>
        )}
      </div>
    </div>
  );
};
