import React from 'react';
import { Zap, Link2 } from 'lucide-react';

export type MainTabType = 'enhancer' | 'chain';

interface NavigationProps {
  activeTab: MainTabType;
  onChangeTab: (tab: MainTabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onChangeTab,
}) => {
  const handleSelect = (tab: MainTabType) => {
    if (navigator.vibrate) navigator.vibrate(25);
    onChangeTab(tab);
  };

  return (
    <nav className="w-full my-4 sm:my-6 flex justify-center">
      <div className="w-full p-1.5 bg-[#10131c] border border-white/[0.1] rounded-2xl flex items-center shadow-xl shadow-black/40 gap-1.5">
        <button
          type="button"
          onClick={() => handleSelect('enhancer')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm sm:text-base font-bold transition-all duration-200 active:scale-98 ${
            activeTab === 'enhancer'
              ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/15 text-emerald-300 border border-emerald-500/40 shadow-md shadow-emerald-500/10'
              : 'text-gray-400 hover:text-gray-200 border border-transparent'
          }`}
        >
          <Zap className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'enhancer' ? 'text-emerald-400 fill-emerald-400/25' : 'text-gray-500'}`} />
          <span>تقویت کانفیگ (فرگمنت)</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelect('chain')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm sm:text-base font-bold transition-all duration-200 active:scale-98 ${
            activeTab === 'chain'
              ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/15 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10'
              : 'text-gray-400 hover:text-gray-200 border border-transparent'
          }`}
        >
          <Link2 className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'chain' ? 'text-cyan-400' : 'text-gray-500'}`} />
          <span>ترکیب دو کانفیگ</span>
        </button>
      </div>
    </nav>
  );
};
