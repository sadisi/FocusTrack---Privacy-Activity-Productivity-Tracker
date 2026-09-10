import React, { useState } from 'react';
import { Goal, GoalType } from '../types';
import { ALL_CATEGORIES } from '../utils/categories';
import { X, Target } from 'lucide-react';

interface GoalModalProps {
  existingGoal?: Goal;
  onSave: (goal: Goal) => void;
  onClose: () => void;
}

const GOAL_TYPES: { value: GoalType; label: string; description: string }[] = [
  { value: 'min_productive', label: 'Minimum Productive Time', description: 'Spend at least N minutes on productive sites' },
  { value: 'max_distracting', label: 'Limit Distracting Time', description: 'Keep distracting site usage under N minutes' },
  { value: 'min_category', label: 'Minimum Category Time', description: 'Spend at least N minutes on a specific category' },
  { value: 'max_category', label: 'Limit Category Time', description: 'Keep a specific category usage under N minutes' },
  { value: 'min_domain', label: 'Minimum Site Time', description: 'Spend at least N minutes on a specific site' },
  { value: 'max_domain', label: 'Limit Site Time', description: 'Keep a specific site under N minutes' },
];

export const GoalModal: React.FC<GoalModalProps> = ({ existingGoal, onSave, onClose }) => {
  const [title, setTitle] = useState(existingGoal?.title || '');
  const [type, setType] = useState<GoalType>(existingGoal?.type || 'min_productive');
  const [targetMinutes, setTargetMinutes] = useState(existingGoal?.targetMinutes || 60);
  const [targetValue, setTargetValue] = useState(existingGoal?.targetValue || '');

  const needsTargetValue = ['min_category', 'max_category', 'min_domain', 'max_domain'].includes(type);
  const isCategory = ['min_category', 'max_category'].includes(type);

  const handleSave = () => {
    if (!title.trim() || (needsTargetValue && !targetValue)) return;

    const goal: Goal = {
      id: existingGoal?.id || `goal-${Date.now()}`,
      title: title.trim(),
      type,
      targetMinutes,
      targetValue: needsTargetValue ? targetValue : undefined,
      period: 'daily',
      createdAt: existingGoal?.createdAt || Date.now(),
    };

    onSave(goal);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold text-white">{existingGoal ? 'Edit Goal' : 'New Goal'}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Goal Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 2 hours of coding daily"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Goal Type</label>
            <select
              value={type}
              onChange={(e) => { setType(e.target.value as GoalType); setTargetValue(''); }}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              {GOAL_TYPES.map((gt) => (
                <option key={gt.value} value={gt.value}>{gt.label}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              {GOAL_TYPES.find((g) => g.value === type)?.description}
            </p>
          </div>

          {needsTargetValue && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                {isCategory ? 'Category' : 'Website Domain'}
              </label>
              {isCategory ? (
                <select
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Select a category</option>
                  {ALL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="e.g. github.com"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
                />
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Target: <span className="text-white font-semibold">{targetMinutes >= 60 ? `${Math.floor(targetMinutes / 60)}h ${targetMinutes % 60}m` : `${targetMinutes}m`}</span>
            </label>
            <input
              type="range"
              min={5}
              max={480}
              step={5}
              value={targetMinutes}
              onChange={(e) => setTargetMinutes(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>5m</span>
              <span>2h</span>
              <span>4h</span>
              <span>8h</span>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || (needsTargetValue && !targetValue)}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {existingGoal ? 'Save Changes' : 'Create Goal'}
          </button>
        </div>
      </div>
    </div>
  );
};
