import React, { useMemo } from 'react';
import { DailyActivity } from '../types';
import { formatTime } from '../analytics/productivity';

interface ActivityChartProps {
  activities: Record<string, DailyActivity>;
  days?: number;
}

export const ActivityChart: React.FC<ActivityChartProps> = ({ activities, days = 7 }) => {
  const chartData = useMemo(() => {
    const result: {
      date: string;
      label: string;
      totalSeconds: number;
      hours: number;
      shortLabel: string;
      siteCount: number;
    }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;

      const totalSeconds = activities[dateKey]?.totalTime || 0;
      const hours = totalSeconds / 3600;
      const siteCount = Object.keys(activities[dateKey]?.domains || {}).length;

      result.push({
        date: dateKey,
        label: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        shortLabel: i === 0 ? 'Today' : days <= 7
          ? d.toLocaleDateString('en-US', { weekday: 'short' })
          : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        totalSeconds,
        hours: parseFloat(hours.toFixed(2)),
        siteCount,
      });
    }

    return result;
  }, [activities, days]);

  const maxSeconds = Math.max(...chartData.map((d) => d.totalSeconds), 1);

  // Y-axis labels based on max
  const yAxisLabels = useMemo(() => {
    const maxHours = maxSeconds / 3600;
    if (maxHours < 0.5) {
      return [0, 10, 20, 30].map(m => ({ label: `${m}m`, seconds: m * 60 }));
    } else if (maxHours < 2) {
      return [0, 0.5, 1, 1.5, 2].map(h => ({ label: h === 0 ? '0' : `${h}h`, seconds: h * 3600 }));
    } else if (maxHours < 8) {
      const step = Math.ceil(maxHours / 4);
      return [0, 1, 2, 3, 4].map(i => ({ label: i * step === 0 ? '0' : `${i * step}h`, seconds: i * step * 3600 }));
    } else {
      const step = Math.ceil(maxHours / 4);
      return [0, 1, 2, 3, 4].map(i => ({ label: i * step === 0 ? '0' : `${i * step}h`, seconds: i * step * 3600 }));
    }
  }, [maxSeconds]);

  const chartHeight = 120;

  return (
    <div className="w-full">
      <div className="flex gap-3">
        {/* Y-axis */}
        <div className="flex flex-col justify-between text-right pb-6" style={{ height: chartHeight + 24 }}>
          {[...yAxisLabels].reverse().map(({ label }) => (
            <span key={label} className="text-[10px] text-slate-600 leading-none">{label}</span>
          ))}
        </div>

        {/* Bars + X-axis */}
        <div className="flex-1">
          {/* Horizontal grid lines */}
          <div className="relative" style={{ height: chartHeight }}>
            {yAxisLabels.map(({ label, seconds }) => {
              const pct = (seconds / maxSeconds) * 100;
              return (
                <div
                  key={label}
                  className="absolute w-full border-t border-slate-800/50"
                  style={{ bottom: `${pct}%` }}
                />
              );
            })}

            {/* Bars */}
            <div className="absolute inset-0 flex items-end gap-1">
              {chartData.map(({ date, label, totalSeconds: secs, hours, shortLabel, siteCount }) => {
                const pct = maxSeconds > 0 ? (secs / maxSeconds) * 100 : 0;
                const isToday = shortLabel === 'Today';
                const hasData = secs > 0;

                return (
                  <div key={date} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-20 pointer-events-none">
                      <div className="bg-slate-800 border border-slate-700/80 rounded-xl px-3 py-2 text-xs whitespace-nowrap shadow-2xl">
                        <div className="text-slate-300 font-medium mb-1">{label}</div>
                        <div className="text-cyan-400 font-bold">{formatTime(secs)}</div>
                        {siteCount > 0 && (
                          <div className="text-slate-500 mt-0.5">{siteCount} site{siteCount !== 1 ? 's' : ''}</div>
                        )}
                      </div>
                      <div className="w-2 h-2 bg-slate-800 border-r border-b border-slate-700/80 rotate-45 mx-auto -mt-1" />
                    </div>

                    {/* Bar */}
                    <div
                      className={`w-full rounded-t-md transition-all duration-700 ${
                        isToday
                          ? 'bg-gradient-to-t from-cyan-700 via-cyan-500 to-cyan-400 shadow-sm shadow-cyan-500/30'
                          : hasData
                            ? 'bg-gradient-to-t from-slate-700 to-slate-600 group-hover:from-slate-600 group-hover:to-slate-500'
                            : 'bg-slate-800/40'
                      }`}
                      style={{
                        height: hasData ? `${Math.max(pct, 3)}%` : '2px',
                        opacity: hasData ? 1 : 0.3,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="flex gap-1 mt-1.5">
            {chartData.map(({ date, shortLabel }) => {
              const isToday = shortLabel === 'Today';
              return (
                <div key={date} className="flex-1 text-center">
                  <span className={`text-[10px] font-medium ${isToday ? 'text-cyan-400' : 'text-slate-600'}`}>
                    {shortLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
