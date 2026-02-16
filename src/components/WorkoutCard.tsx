import React from 'react';
import { Timer, Zap, Flame, ChevronRight } from 'lucide-react';

interface WorkoutCardProps {
  title: string;
  duration: string;
  level: string;
  calories: string;
  image: string;
  tag?: string;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({ 
  title, duration, level, calories, image, tag 
}) => {
  return (
    <div className="premium-card group relative overflow-hidden flex flex-col cursor-pointer">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {tag && (
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold tracking-wider uppercase">
            {tag}
          </div>
        )}
        
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-white font-display text-lg font-bold leading-tight group-hover:text-primary transition-colors">
            {title}
          </h3>
        </div>
      </div>
      
      <div className="p-4 flex items-center justify-between">
        <div className="flex gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Timer size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Time</span>
            </div>
            <span className="text-sm font-semibold">{duration}</span>
          </div>
          
          <div className="flex flex-col border-l border-border/50 pl-4">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Zap size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Int</span>
            </div>
            <span className="text-sm font-semibold text-primary">{level}</span>
          </div>
          
          <div className="flex flex-col border-l border-border/50 pl-4">
            <div className="flex items-center gap-1 text-muted-foreground mb-1">
              <Flame size={14} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Burn</span>
            </div>
            <span className="text-sm font-semibold">{calories} kcal</span>
          </div>
        </div>
        
        <div className="p-2 rounded-full bg-muted/50 text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all duration-300">
          <ChevronRight size={18} />
        </div>
      </div>
    </div>
  );
};
