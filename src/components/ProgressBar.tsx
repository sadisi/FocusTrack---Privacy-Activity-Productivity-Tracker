import React from 'react';

interface ProgressBarProps {
  percentage: number; // 0 to 100+
  colorClass?: string;
  height?: 'thin' | 'normal' | 'thick';
  animate?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  colorClass = 'bg-cyan-500',
  height = 'normal',
  animate = true,
}) => {
  const capped = Math.min(100, Math.max(0, percentage));

  const heightClass = {
    thin: 'h-1',
    normal: 'h-2',
    thick: 'h-3',
  }[height];

  return (
    <div className={`w-full bg-slate-800 rounded-full ${heightClass} overflow-hidden`}>
      <div
        className={`${heightClass} rounded-full ${colorClass} ${animate ? 'transition-all duration-700 ease-out' : ''}`}
        style={{ width: `${capped}%` }}
      />
    </div>
  );
};
