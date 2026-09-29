import React from 'react';
import { ShieldCheck, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  onOpenAPKModal?: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const { isInstallable, install } = usePWAInstall();

  return (
    <header className="w-full flex items-center justify-between py-4 px-2 select-none border-b border-white/[0.08] mb-4">
      {/* Brand & App Info */}
      <div className="flex items-center gap-3.5">
        <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/25 via-cyan-500/15 to-transparent border border-emerald-500/35 shadow-lg shadow-emerald-500/15">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#07080c]" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              پروکسی لب
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              RK
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 font-medium mt-0.5">
            تقویت کانفیگ و دور زدن فیلترینگ
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {isInstallable && (
          <button
            onClick={install}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-gray-200 border border-white/[0.12] text-xs sm:text-sm font-bold transition active:scale-95 shadow-sm"
          >
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">نصب برنامه</span>
            <span className="sm:hidden">نصب</span>
          </button>
        )}
      </div>
    </header>
  );
};
