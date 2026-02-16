import React, { useState } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      <div className="w-full max-w-lg min-h-screen flex flex-col bg-background shadow-2xl shadow-black/50 relative overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto pb-24 scroll-smooth">
          {children}
        </main>
        
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* Abstract Background Elements for Depth */}
        <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[20%] left-[-10%] w-48 h-48 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      </div>
    </div>
  );
};
