import React, { useState } from 'react';
import { Header } from './components/Header';
import { Navigation, MainTabType } from './components/Navigation';
import { EnhancerView } from './components/EnhancerView';
import { ChainView } from './components/ChainView';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTabType>('enhancer');

  return (
    <div className="relative min-h-screen bg-[#07080c] text-[#f1f3f9] font-sans selection:bg-emerald-500/30 selection:text-white flex flex-col justify-between bg-grid-pattern">
      {/* Cyber Ambient Glows */}
      <div className="glow-spot-1" />
      <div className="glow-spot-2" />

      {/* Main Mobile App Container */}
      <div className="relative z-10 w-full max-w-md sm:max-w-xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex-1 flex flex-col justify-between">
        {/* Top: Header & Tab Navigation */}
        <div className="w-full">
          <Header />
          <Navigation
            activeTab={activeTab}
            onChangeTab={setActiveTab}
          />
        </div>

        {/* Center: Main View */}
        <main className="w-full flex-1 flex flex-col justify-center py-2 sm:py-4 transition-opacity duration-200">
          {activeTab === 'enhancer' && <EnhancerView />}
          {activeTab === 'chain' && <ChainView onRunConfig={() => {}} />}
        </main>

        {/* Bottom subtle indicator */}
        <footer className="w-full pt-8 pb-4 text-center border-t border-white/[0.06] mt-6">
          <p className="text-xs sm:text-sm text-gray-400 font-mono tracking-wider">
            PROXY LAB • FRAGMENT ANTI-DPI
          </p>
        </footer>
      </div>
    </div>
  );
}
