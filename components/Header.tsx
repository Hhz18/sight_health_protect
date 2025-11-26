
import React from 'react';
import { Eye, ExternalLink, PictureInPicture2 } from 'lucide-react';
import { UserStats } from '../types';

interface HeaderProps {
  userStats: UserStats;
  activeTab: 'monitor' | 'dashboard';
  setActiveTab: (tab: 'monitor' | 'dashboard') => void;
  onTogglePiP: () => void;
  isPiPActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({ userStats, activeTab, setActiveTab, onTogglePiP, isPiPActive }) => {
  
  const openMiniMode = () => {
    const width = 300;
    const height = 400;
    const left = window.screen.width - width - 50;
    const top = 50;
    
    // Fix: Use current location as base to construct URL correctly
    // This solves the 404 error by ensuring we keep the host/path intact
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'mini');
    
    window.open(
      url.toString(), 
      'VisionGuardMini', 
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    );
  };

  return (
    <header className="flex flex-col md:flex-row items-center justify-between mb-8 glass-panel p-4 rounded-xl border-t-2 border-indigo-500/50">
      <div className="flex items-center gap-4 mb-4 md:mb-0">
        <div className="relative">
          <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.5)]">
            <Eye className="w-7 h-7 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-tech uppercase neon-text">
            VisionGuard <span className="text-indigo-400 text-lg align-top">PRO</span>
          </h1>
          <p className="text-slate-400 text-xs tracking-widest uppercase">视力防御系统在线</p>
        </div>
      </div>

      {/* XP Bar */}
      <div className="flex-1 max-w-md w-full px-4 md:px-12">
        <div className="flex justify-between text-xs font-bold text-indigo-300 mb-1 uppercase">
          <span>LV.{userStats.level}</span>
          <span>{Math.floor(userStats.currentXP)} / {Math.floor(userStats.nextLevelXP)} XP</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 shadow-[0_0_10px_#6366f1] transition-all duration-500"
            style={{ width: `${(userStats.currentXP / userStats.nextLevelXP) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('monitor')}
          className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
            activeTab === 'monitor'
              ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]'
              : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          监控
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all ${
            activeTab === 'dashboard'
              ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]'
              : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          数据
        </button>
        
        {/* PiP Button (Always on Top) */}
        <button
          onClick={onTogglePiP}
          className={`px-3 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all border flex items-center gap-2 ${
            isPiPActive 
             ? 'bg-emerald-900/50 border-emerald-500 text-emerald-400' 
             : 'hover:bg-slate-800 text-indigo-400 border-indigo-500/30'
          }`}
          title="画中画模式 (始终置顶)"
        >
           <PictureInPicture2 className="w-4 h-4" />
           {isPiPActive ? '已置顶' : '画中画'}
        </button>

        <button
          onClick={openMiniMode}
          className="px-3 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all hover:bg-slate-800 text-indigo-400 border border-indigo-500/30 flex items-center gap-2"
          title="打开独立弹窗"
        >
           <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
