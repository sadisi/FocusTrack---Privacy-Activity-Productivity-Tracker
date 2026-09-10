import React from 'react';
import { ShieldCheck, Zap, BarChart3, Lock, CheckCircle2 } from 'lucide-react';

interface OnboardingModalProps {
  onStartTracking: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onStartTracking }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/25">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Welcome to FocusTrack</h2>
          <p className="text-sm text-slate-400">
            Understand where your browser time goes without giving up your privacy.
          </p>
        </div>

        {/* 3 Key Benefits */}
        <div className="space-y-3.5 pt-2">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-800/80">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 mt-0.5">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Automatic Active Time Tracking</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Measures active browser time on websites only when tab and window are focused and you are not idle.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-800/80">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 mt-0.5">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Productivity & Goal Analytics</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Get transparent productivity scores, set custom goals, and unlock real data-driven insights.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-800/80">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">100% On-Device & Private</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                No account required. No logins, passwords, remote servers, or external tracking. Your browsing activity stays on your device.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Assurance & Button */}
        <div className="pt-2 space-y-4">
          <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Your browsing activity stays on your device</span>
          </div>

          <button
            onClick={onStartTracking}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            Start Tracking Immediately
          </button>
        </div>
      </div>
    </div>
  );
};
