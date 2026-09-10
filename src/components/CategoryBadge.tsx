import React from 'react';
import { CategoryType } from '../types';

interface CategoryBadgeProps {
  category: CategoryType;
  size?: 'sm' | 'md';
}

const CATEGORY_STYLES: Record<CategoryType, string> = {
  Development: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Education: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Work: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Productivity: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  Communication: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'Social Media': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  Entertainment: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  News: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Shopping: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
  Finance: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  Search: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  Other: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, size = 'md' }) => {
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.Other;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-medium rounded-md border ${padding} ${style}`}>
      {category}
    </span>
  );
};
