
import React from 'react';
import { MoveLeft, ShieldAlert, ScanSearch, RotateCcw } from 'lucide-react';

interface BlockingOverlayProps {
  currentDistance: number;
  minDistance: number;
  isVisible: boolean;
  onRecalibrate?: () => void;
}

export const BlockingOverlay: React.FC<BlockingOverlayProps> = ({ currentDistance, minDistance, isVisible, onRecalibrate }) => {
  if (!isVisible) return null;

  const isUnknown = currentDistance === -1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl transition-all duration-300">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-slate-950/50 to-slate-950 pointer-events-none"></div>
      
      <div className="text-center p-8 max-w-2xl relative w-full">
        <div className="absolute -inset-4 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        
        <ShieldAlert className="w-40 h-40 mx-auto text-red-500 mb-8 animate-bounce opacity-90 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
        
        <h1 className="text-6xl font-bold text-white mb-2 font-tech tracking-wider uppercase">警告: 距离过近</h1>
        <p className="text-red-400 text-lg mb-8 uppercase tracking-[0.2em]">System Override: Vision Protection Active</p>
        
        <div className="grid grid-cols-2 gap-8 mb-12">
           <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl">
              <span className="block text-slate-400 text-xs uppercase mb-1">当前距离</span>
              <span className="text-4xl font-mono font-bold text-red-400">
                {isUnknown ? (
                    <span className="flex items-center justify-center gap-2 text-2xl animate-pulse">
                        <ScanSearch className="w-6 h-6" /> 搜索中...
                    </span>
                ) : (
                    <>{currentDistance.toFixed(0)} <span className="text-sm">cm</span></>
                )}
              </span>
           </div>
           <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl opacity-60">
              <span className="block text-slate-400 text-xs uppercase mb-1">安全阈值</span>
              <span className="text-4xl font-mono font-bold text-white">{minDistance} <span className="text-sm">cm</span></span>
           </div>
        </div>
        
        <div className="flex flex-col items-center gap-4">
            <div className="bg-gradient-to-r from-red-900/40 to-red-800/40 rounded-full px-8 py-4 border border-red-500/50 inline-flex items-center gap-4 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <MoveLeft className="w-6 h-6 animate-pulse text-white" />
                <span className="text-xl text-white font-medium tracking-wide">请后退以解除锁定</span>
                <MoveLeft className="w-6 h-6 animate-pulse text-white rotate-180" />
            </div>

            {onRecalibrate && (
                 <button 
                    onClick={onRecalibrate}
                    className="text-slate-500 hover:text-white text-xs uppercase tracking-widest flex items-center gap-2 mt-4 hover:underline decoration-slate-500 underline-offset-4 transition-colors"
                 >
                    <RotateCcw className="w-3 h-3" />
                    Emergency Unlock / Recalibrate
                 </button>
            )}
        </div>
      </div>
    </div>
  );
};
