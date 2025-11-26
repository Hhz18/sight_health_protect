import React, { useEffect, useState } from 'react';
import { useCamera } from '../hooks/useCamera';
import { CalibrationData } from '../types';
import { loadCalibrationData } from '../services/storageService';
import { ScanFace, AlertTriangle } from 'lucide-react';

export const MiniMonitor: React.FC = () => {
  const [calibration, setCalibration] = useState<CalibrationData | null>(null);
  // We use a simplified state here
  const { videoRef, currentDistance } = useCamera('monitor', calibration);
  const [minDistance] = useState(40); // Default, or could load from storage too

  useEffect(() => {
    const saved = loadCalibrationData();
    if (saved) {
      setCalibration(saved);
    }
  }, []);

  const isTooClose = currentDistance > 0 && currentDistance < minDistance;

  // Change window background color based on status
  useEffect(() => {
    if (isTooClose) {
      document.body.style.backgroundColor = '#450a0a'; // Dark Red
    } else {
      document.body.style.backgroundColor = '#020617'; // Dark Slate
    }
  }, [isTooClose]);

  if (!calibration) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center p-4 bg-slate-950 text-white">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
        <h2 className="font-bold mb-2">未校准</h2>
        <p className="text-sm text-slate-400">请先在主界面完成系统校准。</p>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col relative overflow-hidden transition-colors duration-500 ${isTooClose ? 'bg-red-950' : 'bg-slate-950'}`}>
      {/* Video Background */}
      <video 
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
        style={{ transform: 'scaleX(-1)' }}
        muted
        playsInline
      />
      
      {/* HUD Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
        <div className={`text-6xl font-mono font-bold mb-2 ${isTooClose ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
          {currentDistance === -1 ? '--' : currentDistance.toFixed(0)}
          <span className="text-lg ml-2 text-white/50">CM</span>
        </div>
        
        {isTooClose && (
          <div className="bg-red-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest animate-bounce">
            距离过近
          </div>
        )}

        <div className="absolute top-2 left-2 flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-widest">
           <ScanFace className="w-3 h-3" />
           VisionGuard Mini
        </div>
      </div>

      {/* Border Warning */}
      <div className={`absolute inset-0 border-[8px] pointer-events-none transition-colors duration-300 ${isTooClose ? 'border-red-600 animate-pulse' : 'border-emerald-600/20'}`}></div>
    </div>
  );
};
