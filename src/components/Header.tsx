import React from 'react';
import { Bell, Settings } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="flex items-center justify-between h-16 px-6 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg accent-gradient flex items-center justify-center text-white font-bold text-lg">F</div>
          <h1 className="font-display text-xl font-bold tracking-tight">FITV2</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-full hover:bg-muted transition-colors relative">
            <Bell size={20} className="text-muted-foreground" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-background" />
          </button>
          <button className="p-2 rounded-full hover:bg-muted transition-colors">
            <Settings size={20} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  );
};
