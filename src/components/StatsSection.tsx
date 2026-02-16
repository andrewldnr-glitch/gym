import React from 'react';
import { Activity, Flame, Heart, TrendingUp } from 'lucide-react';

export const StatsSection: React.FC = () => {
  return (
    <div className="px-6 py-4 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium mb-1">Weekly Progress</p>
          <h2 className="font-display text-2xl font-bold tracking-tight">Activity Status</h2>
        </div>
        <div className="flex items-center gap-1 text-primary text-sm font-bold bg-primary/10 px-2 py-1 rounded-lg">
          <TrendingUp size={16} />
          <span>+12%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Main Activity Ring Card */}
        <div className="premium-card p-5 col-span-2 flex items-center justify-between bg-gradient-to-br from-card to-card/80">
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary">
                <Activity size={18} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Goal Reached</span>
              </div>
              <p className="text-3xl font-display font-black tracking-tighter">85<span className="text-lg font-medium text-muted-foreground ml-1">%</span></p>
            </div>
            
            <div className="flex gap-4">
              <div className="space-y-0.5">
                <p className="text-muted-foreground text-[10px] font-bold uppercase">Steps</p>
                <p className="font-bold">8,432</p>
              </div>
              <div className="w-px h-8 bg-border/50" />
              <div className="space-y-0.5">
                <p className="text-muted-foreground text-[10px] font-bold uppercase">Active</p>
                <p className="font-bold">45m</p>
              </div>
            </div>
          </div>

          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="48"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                className="text-muted/30"
              />
              <circle
                cx="56"
                cy="56"
                r="48"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 48}
                strokeDashoffset={2 * Math.PI * 48 * (1 - 0.85)}
                strokeLinecap="round"
                className="text-primary transition-all duration-1000 ease-out"
              />
              <circle
                cx="56"
                cy="56"
                r="36"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                className="text-muted/30"
              />
              <circle
                cx="56"
                cy="56"
                r="36"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 36}
                strokeDashoffset={2 * Math.PI * 36 * (1 - 0.65)}
                strokeLinecap="round"
                className="text-accent transition-all duration-1000 delay-300 ease-out"
              />
            </svg>
            <Activity className="absolute text-primary" size={20} />
          </div>
        </div>

        {/* Small Metric Cards */}
        <div className="premium-card p-4 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
            <Flame size={20} />
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium">Calories</p>
            <p className="text-xl font-bold font-display tracking-tight">1,240 <span className="text-[10px] font-medium text-muted-foreground">kcal</span></p>
          </div>
        </div>

        <div className="premium-card p-4 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <Heart size={20} />
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium">Avg Heart</p>
            <p className="text-xl font-bold font-display tracking-tight">72 <span className="text-[10px] font-medium text-muted-foreground">bpm</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};
