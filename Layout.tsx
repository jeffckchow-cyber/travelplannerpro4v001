import React from 'react';
import { useTrips } from '../store';

export const Layout: React.FC<{ 
  children: React.ReactNode;
  activeView: 'dashboard' | 'itinerary' | 'budget' | 'toolbox';
  setView: (view: 'dashboard' | 'itinerary' | 'budget' | 'toolbox') => void;
}> = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-[#1C1C1E] font-['Inter']">
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>
    </div>
  );
};