import React, { useState } from 'react';
import { AppShell } from './components/AppShell';
import { StatsSection } from './components/StatsSection';
import { WorkoutCard } from './components/WorkoutCard';
import { TimerOverlay } from './components/TimerOverlay';
import { Search, Filter, Play, ChevronRight } from 'lucide-react';

const CATEGORIES = ['All', 'Strength', 'HIIT', 'Yoga', 'Cardio', 'Mobility'];

const WORKOUTS = [
  {
    id: 1,
    title: 'Full Body Explosive HIIT',
    duration: '25 min',
    level: 'High',
    calories: '350',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
    tag: 'Trending'
  },
  {
    id: 2,
    title: 'Functional Core Strength',
    duration: '45 min',
    level: 'Medium',
    calories: '280',
    image: 'https://images.unsplash.com/photo-1541534741688-6078c65b5a33?w=800&q=80',
    tag: 'New'
  },
  {
    id: 3,
    title: 'Lower Body Power Build',
    duration: '40 min',
    level: 'High',
    calories: '420',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80'
  },
  {
    id: 4,
    title: 'Zen Morning Yoga Flow',
    duration: '20 min',
    level: 'Low',
    calories: '120',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80'
  }
];

function App() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [isTimerOpen, setIsTimerOpen] = useState(false);

  return (
    <AppShell>
      <TimerOverlay 
        isOpen={isTimerOpen} 
        onClose={() => setIsTimerOpen(false)} 
        title="Explosive HIIT Session"
      />
      
      {/* Search & Welcome */}
      <div className="px-6 py-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-display font-black tracking-tighter uppercase">Morning, <span className="text-primary">Alex</span></h2>
            <p className="text-muted-foreground text-sm font-medium">Ready for your workout today?</p>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-primary/20 p-1">
            <img 
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80" 
              alt="Profile" 
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Search programs, trainers..." 
              className="w-full h-12 bg-surface border border-border/50 rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
          <button className="w-12 h-12 bg-surface border border-border/50 rounded-xl flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <StatsSection />

      {/* Quick Action / Active Workout */}
      <div className="px-6 py-2">
        <div className="premium-card p-4 flex items-center gap-4 bg-primary/5 border-primary/20">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Play size={24} fill="currentColor" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Continue Workout</p>
            <h4 className="font-bold text-sm">Hypertrophy Chest & Triceps</h4>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[65%]" />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground">65%</span>
            </div>
          </div>
          <ChevronRight size={20} className="text-muted-foreground" />
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-6">
          <h3 className="font-display font-bold text-lg">Categories</h3>
          <button className="text-primary text-xs font-bold uppercase tracking-widest hover:underline">View All</button>
        </div>
        
        <div className="flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300
                ${activeCategory === cat 
                  ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105' 
                  : 'bg-surface border border-border/50 text-muted-foreground hover:border-primary/30'}
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Workout Banner */}
      <div className="px-6 py-6">
        <div 
          onClick={() => setIsTimerOpen(true)}
          className="relative h-44 rounded-2xl overflow-hidden group cursor-pointer"
        >
          <img 
            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80" 
            alt="Hero" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/40 to-transparent" />
          
          <div className="absolute inset-0 p-6 flex flex-col justify-center max-w-[70%] space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Premium Program</p>
            <h3 className="text-2xl font-display font-black text-white leading-tight tracking-tighter">ELITE SUMMER BODY 2024</h3>
            <div className="flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-xl text-xs font-bold w-fit hover:bg-opacity-90 transition-all active:scale-95">
              <Play size={14} fill="currentColor" />
              <span>START NOW</span>
            </div>
          </div>
        </div>
      </div>

      {/* Workouts Grid */}
      <div className="px-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-lg">Recommended for You</h3>
          <button className="text-primary text-xs font-bold uppercase tracking-widest hover:underline">See More</button>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {WORKOUTS.map((workout, i) => (
            <div key={workout.id} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <WorkoutCard {...workout} />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export default App;
