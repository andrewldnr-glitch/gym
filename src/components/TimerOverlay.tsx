import React, { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, ChevronDown } from 'lucide-react';

interface TimerOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export const TimerOverlay: React.FC<TimerOverlayProps> = ({ isOpen, onClose, title }) => {
  const [timeLeft, setTimeLeft] = useState(45); // 45 seconds for example
  const [isActive, setIsActive] = useState(false);
  const totalTime = 45;

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  if (!isOpen) return null;

  const progress = timeLeft / totalTime;
  const dashArray = 2 * Math.PI * 120;
  const dashOffset = dashArray * (1 - progress);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-surface border-t sm:border border-border/50 rounded-t-[3rem] sm:rounded-[3rem] p-8 space-y-8 animate-scale-up shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-6 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted rounded-full sm:hidden" 
        />
        
        <div className="flex justify-between items-start pt-4 sm:pt-0">
          <div className="space-y-1">
            <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">Current Set</p>
            <h2 className="text-2xl font-display font-bold tracking-tight">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-muted/20"
              />
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="text-primary transition-all duration-1000 linear"
              />
              
              {/* Decorative dots */}
              {[...Array(12)].map((_, i) => (
                <circle
                  key={i}
                  cx={128 + 120 * Math.cos((i * 30 * Math.PI) / 180)}
                  cy={128 + 120 * Math.sin((i * 30 * Math.PI) / 180)}
                  r="2"
                  className="fill-muted/30"
                />
              ))}
            </svg>
            
            <div className="absolute flex flex-col items-center">
              <span className="text-7xl font-display font-black tracking-tighter tabular-nums">
                {timeLeft}<span className="text-2xl text-muted-foreground ml-1">s</span>
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Time Remaining</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6">
          <button 
            onClick={() => { setTimeLeft(totalTime); setIsActive(false); }}
            className="w-14 h-14 rounded-full bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-90"
          >
            <RotateCcw size={24} />
          </button>
          
          <button 
            onClick={() => setIsActive(!isActive)}
            className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/30 transition-all active:scale-90 hover:scale-105"
          >
            {isActive ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
          </button>
          
          <button 
            className="w-14 h-14 rounded-full bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-90"
          >
            <ChevronDown size={24} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="premium-card p-4 bg-muted/20 flex flex-col items-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Next Move</span>
            <span className="font-bold text-sm mt-1">Diamond Pushups</span>
          </div>
          <div className="premium-card p-4 bg-muted/20 flex flex-col items-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Estimated Heart</span>
            <span className="font-bold text-sm mt-1">145 BPM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
