
import React, { useState, useEffect, useRef } from 'react';
import { Settings, Ruler, Activity, Trophy, BrainCircuit, VideoOff, Loader2, Hourglass } from 'lucide-react';
import { BlockingOverlay } from './components/BlockingOverlay';
import { ErgoCoach } from './components/ErgoCoach';
import { StatsChart } from './components/StatsChart';
import { Header } from './components/Header';
import { MiniMonitor } from './components/MiniMonitor';
import { CalibrationData, AppState, DailyRecord, PredictionData } from './types';
import { getLast7DaysData, saveCalibrationData, loadCalibrationData } from './services/storageService';
import { predictVisionHealth } from './services/geminiService';
import { useCamera } from './hooks/useCamera';
import { useGamification } from './hooks/useGamification';
import { usePiP } from './hooks/usePiP';

// Constants
const CALIBRATION_DISTANCE_CM = 60;
const DEFAULT_MIN_DISTANCE = 40;
const HYSTERESIS_BUFFER = 5;

const App: React.FC = () => {
  // --- Check for Mini Mode in URL ---
  const isMiniMode = new URLSearchParams(window.location.search).get('mode') === 'mini';

  // --- State ---
  const [appState, setAppState] = useState<AppState>(AppState.CALIBRATING);
  const [activeTab, setActiveTab] = useState<'monitor' | 'dashboard'>('monitor');
  const [calibration, setCalibration] = useState<CalibrationData | null>(null);
  const [minDistance, setMinDistance] = useState<number>(DEFAULT_MIN_DISTANCE);
  const [isBlocking, setIsBlocking] = useState(false);
  
  // --- Dashboard Data ---
  const [historyData] = useState<DailyRecord[]>(getLast7DaysData());
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [predicting, setPredicting] = useState(false);

  // --- Custom Hooks ---
  const { videoRef, modelLoaded, cameraError, currentDistance, setCurrentDistance } = useCamera(activeTab, calibration);
  const { userStats, sessionEffectiveTime, sessionTotalTime, combo } = useGamification(appState, currentDistance, minDistance, isBlocking);
  
  // --- PiP Hook ---
  const { togglePiP, isPiPActive } = usePiP({
      videoRef,
      currentDistance,
      minDistance,
      isBlocking
  });

  // --- Audio Alarm Ref ---
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextBeepTimeRef = useRef<number>(0);
  const titleFlashRef = useRef<NodeJS.Timeout | null>(null);

  // --- Load Calibration from Storage on Mount ---
  useEffect(() => {
    const savedCal = loadCalibrationData();
    if (savedCal) {
        setCalibration(savedCal);
        setAppState(AppState.MONITORING); // Skip calibration if saved
    }
  }, []);

  // --- Notification Permission ---
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // --- Hysteresis Logic (Blocking & Alarms) ---
  useEffect(() => {
    if (appState !== AppState.MONITORING) {
      setIsBlocking(false);
      resetTitle();
      return;
    }

    let shouldBlock = isBlocking;

    if (!isBlocking) {
      // Trigger Block: Valid distance AND too close
      if (currentDistance > 0 && currentDistance < minDistance) {
        shouldBlock = true;
      }
    } else {
      // Unblock: Valid distance AND safe (+buffer)
      if (currentDistance > 0 && currentDistance > minDistance + HYSTERESIS_BUFFER) {
        shouldBlock = false;
      }
    }

    setIsBlocking(shouldBlock);

    // --- Alert Systems ---
    if (shouldBlock) {
      handleAlerts();
    } else {
      resetTitle();
    }

  }, [currentDistance, minDistance, isBlocking, appState]);

  // Alert Handler
  const handleAlerts = () => {
      const now = Date.now();
      
      // Flash Document Title
      if (!titleFlashRef.current) {
          let toggle = false;
          titleFlashRef.current = setInterval(() => {
              document.title = toggle ? "⚠️ 警告! ⚠️" : "距离过近!";
              toggle = !toggle;
          }, 1000);
      }

      // Throttle Beep & Notification
      if (now > nextBeepTimeRef.current) {
        playBeep();

        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          new Notification("⚠️ 距离过近警告", {
            body: `当前距离: ${currentDistance.toFixed(0)}cm (标准: ${minDistance}cm). 请立即后退！`,
            tag: 'vision-alert', 
            renotify: true
          } as any);
        }
        nextBeepTimeRef.current = now + 1000;
      }
  };

  const resetTitle = () => {
      if (titleFlashRef.current) {
          clearInterval(titleFlashRef.current);
          titleFlashRef.current = null;
      }
      document.title = "VisionGuard AI - RPG Edition";
  };

  // Helper: Play a synthesized beep
  const playBeep = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1); 
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  // --- Handlers ---
  const calibrate = async () => {
    if (!videoRef.current) return;
    
    // Initialize Audio Context on user interaction
    if (!audioCtxRef.current) {
         audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const { detectFace } = await import('./services/visionService');
    const { width, detected } = await detectFace(videoRef.current);
    
    if (detected && width > 0) {
      const newCal = { referenceFaceWidthPx: width, referenceDistanceCm: CALIBRATION_DISTANCE_CM };
      setCalibration(newCal);
      saveCalibrationData(newCal); // Save to storage
      setAppState(AppState.MONITORING);
      setCurrentDistance(CALIBRATION_DISTANCE_CM); 
    } else {
      alert("未检测到人脸，请注视摄像头。");
    }
  };

  const forceRecalibrate = () => {
    setIsBlocking(false);
    setCalibration(null);
    setAppState(AppState.CALIBRATING);
  };

  const handlePredict = async () => {
      setPredicting(true);
      const data = await predictVisionHealth(historyData);
      setPrediction(data);
      setPredicting(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- Render Mini Monitor ---
  if (isMiniMode) {
      return <MiniMonitor />;
  }

  // --- Render Main App ---
  if (cameraError) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center p-4 bg-slate-950 text-slate-300">
        <VideoOff className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-white">系统故障</h1>
        <p className="mt-2 text-center">无法获取摄像头权限，请检查设置。</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050b14] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0f172a] via-[#020617] to-[#000000] text-slate-200 font-sans selection:bg-indigo-500/30">
      
      <BlockingOverlay 
        currentDistance={currentDistance} 
        minDistance={minDistance} 
        isVisible={isBlocking} 
        onRecalibrate={forceRecalibrate}
      />

      <div className="relative z-10 container mx-auto max-w-6xl p-4 lg:p-8 flex flex-col min-h-screen">
        
        <Header 
            userStats={userStats} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onTogglePiP={togglePiP}
            isPiPActive={isPiPActive}
        />

        {/* --- MONITOR TAB --- */}
        {activeTab === 'monitor' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
            
            {/* Left: Main Viewport */}
            <div className="lg:col-span-2 space-y-6">
              <div className="relative rounded-xl overflow-hidden border-2 border-slate-700 bg-black shadow-2xl aspect-video group neon-border">
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                  muted 
                  playsInline
                  style={{ transform: 'scaleX(-1)' }}
                />
                {!modelLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                    <div className="text-indigo-400 animate-pulse font-tech text-xl">神经网络初始化中...</div>
                  </div>
                )}
                
                {/* HUD Overlay */}
                {appState === AppState.MONITORING && (
                    <>
                        <div className="absolute top-4 left-4">
                            <div className="bg-slate-900/80 backdrop-blur border border-slate-600 px-3 py-1 rounded text-xs text-emerald-400 font-mono flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${currentDistance > -1 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                                {currentDistance > -1 ? '追踪激活' : '搜索中...'}
                            </div>
                        </div>

                        <div className="absolute top-4 right-4">
                            <div className="bg-slate-900/80 backdrop-blur border border-indigo-500/30 px-4 py-2 rounded-lg flex items-center gap-3 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                                <div className={`${sessionEffectiveTime > 0 ? 'animate-spin-slow' : ''}`}>
                                    <Hourglass className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-widest leading-none mb-1">本次专注</span>
                                    <span className="text-xl font-mono font-bold text-white leading-none tracking-wider">
                                        {formatTime(sessionEffectiveTime)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                            <div className="w-64 h-64 border border-indigo-500/50 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                            </div>
                        </div>

                        <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
                            <div className={`px-8 py-3 rounded-xl border backdrop-blur-md transition-colors duration-300 ${
                                currentDistance === -1 ? 'bg-slate-800/60 border-slate-500' :
                                currentDistance < minDistance + 5 ? 'bg-red-900/60 border-red-500' : 'bg-emerald-900/60 border-emerald-500'
                            }`}>
                                <div className="text-center">
                                    <span className="text-xs text-slate-300 uppercase tracking-widest block mb-1">目标距离</span>
                                    <span className="text-3xl font-mono font-bold text-white shadow-black drop-shadow-md">
                                        {currentDistance === -1 ? '--' : currentDistance.toFixed(0)} <span className="text-sm opacity-70">CM</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {combo > 1 && (
                            <div className="absolute top-1/2 right-12 -translate-y-1/2 flex flex-col items-center animate-bounce">
                                <span className="text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-orange-500 drop-shadow-[0_2px_10px_rgba(234,179,8,0.5)]">x{combo}</span>
                                <span className="text-xs font-bold uppercase text-yellow-400 tracking-widest">专注连击</span>
                            </div>
                        )}
                    </>
                )}
              </div>
              
               {appState === AppState.MONITORING && (
                <div className="glass-panel p-6 rounded-xl">
                  <div className="flex items-center gap-2 mb-4 text-indigo-300">
                    <Settings className="w-5 h-5" />
                    <h3 className="font-tech uppercase tracking-wider">校准参数</h3>
                  </div>
                  <div className="flex items-center gap-6">
                      <div className="flex-1">
                        <label className="flex justify-between text-sm mb-2 text-slate-400">
                            <span>警报阈值</span>
                            <span className="font-mono text-white">{minDistance} CM</span>
                        </label>
                        <input 
                            type="range" 
                            min="25" 
                            max="70" 
                            value={minDistance}
                            onChange={(e) => setMinDistance(Number(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                      <button 
                        onClick={() => { setCalibration(null); setAppState(AppState.CALIBRATING); }}
                        className="px-4 py-2 border border-slate-600 rounded hover:bg-slate-700 text-xs uppercase transition-colors"
                      >
                        重新校准
                      </button>
                  </div>
                </div>
               )}
            </div>

            {/* Right: Side Panel */}
            <div className="flex flex-col gap-6">
               <div className="flex-1 min-h-[300px]">
                 <ErgoCoach webcamRef={videoRef} />
               </div>

               <div className="glass-panel p-6 rounded-xl">
                  <h3 className="text-slate-400 text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    本次会话分析
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                        <div className="text-2xl font-mono text-white">{(sessionEffectiveTime / 60).toFixed(1)}</div>
                        <div className="text-[10px] uppercase text-slate-500">有效分钟</div>
                     </div>
                     <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                        <div className="text-2xl font-mono text-white">
                            {sessionTotalTime > 0 ? Math.round((sessionEffectiveTime / sessionTotalTime) * 100) : 0}%
                        </div>
                        <div className="text-[10px] uppercase text-slate-500">效率</div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* --- DASHBOARD TAB --- */}
        {activeTab === 'dashboard' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 animate-in slide-in-from-bottom-4">
                <div className="lg:col-span-2 glass-panel p-8 rounded-xl flex flex-col">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white font-tech uppercase mb-1">专注历史</h2>
                            <p className="text-slate-400 text-sm">过去7天的效率指标</p>
                        </div>
                        <button 
                            onClick={handlePredict}
                            disabled={predicting}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all disabled:opacity-50"
                        >
                            {predicting ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                            AI 健康预测
                        </button>
                    </div>
                    
                    <div className="flex-1 w-full min-h-[300px] relative">
                        <StatsChart data={historyData} futureData={prediction?.futurePoints} />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-xl border-l-4 border-indigo-500 h-full">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            健康透视
                        </h3>
                        
                        {prediction ? (
                            <div className="space-y-6 animate-in fade-in">
                                <div>
                                    <div className="text-sm text-slate-400 uppercase tracking-wider mb-1">预测健康分</div>
                                    <div className={`text-5xl font-mono font-bold ${prediction.healthScore > 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {prediction.healthScore}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        趋势: <span className="text-white uppercase font-bold">{prediction.trend === 'improving' ? '上升' : prediction.trend === 'declining' ? '下降' : '稳定'}</span>
                                    </div>
                                </div>
                                <div className="bg-indigo-900/20 p-4 rounded-lg border border-indigo-500/20">
                                    <p className="text-sm text-indigo-200 leading-relaxed">
                                        "{prediction.analysisText}"
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                <BrainCircuit className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p>点击 "AI 健康预测" 生成未来趋势分析。</p>
                            </div>
                        )}
                    </div>
                </div>
             </div>
        )}

        {/* Calibration Modal */}
        {appState === AppState.CALIBRATING && !isMiniMode && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur">
                <div className="glass-panel p-12 rounded-2xl max-w-lg w-full text-center border-indigo-500/30 shadow-[0_0_50px_rgba(79,70,229,0.2)]">
                    <Ruler className="w-16 h-16 mx-auto text-indigo-500 mb-6" />
                    <h2 className="text-3xl font-bold text-white font-tech mb-4 uppercase">系统校准</h2>
                    <p className="text-slate-300 mb-8">
                        请坐在距离屏幕一臂长 ({CALIBRATION_DISTANCE_CM}cm) 的位置。<br/>
                        注视摄像头。
                    </p>
                    <button 
                        onClick={calibrate}
                        disabled={!modelLoaded}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold tracking-widest uppercase rounded-lg shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {modelLoaded ? '初始化系统' : '加载传感器中...'}
                    </button>
                    <p className="text-xs text-slate-500 mt-4">* 初始化时请允许浏览器发送通知，以启用后台警报</p>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default App;
