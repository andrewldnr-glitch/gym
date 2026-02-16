import React from 'react';
import { Home, Dumbbell, Trophy, User, Search } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'workouts', icon: Dumbbell, label: 'Workouts' },
    { id: 'explore', icon: Search, label: 'Explore' },
    { id: 'stats', icon: Trophy, label: 'Stats' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="glass-nav pb-safe">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 transition-all duration-300 relative group`}
            >
              <div className={`
                p-2 rounded-xl transition-all duration-300
                ${isActive ? 'bg-primary/10 text-primary scale-110' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
              `}>
                <Icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`
                text-[10px] font-medium mt-1 transition-all duration-300
                ${isActive ? 'text-primary opacity-100' : 'text-muted-foreground opacity-70'}
              `}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute -top-1 w-1 h-1 bg-primary rounded-full animate-fade-in" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
