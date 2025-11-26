
import React, { useState } from 'react';
import { Camera, Sparkles, Loader2, CheckCircle, ScanFace } from 'lucide-react';
import { analyzeErgonomics } from '../services/geminiService';
import { ErgonomicAnalysis } from '../types';

interface ErgoCoachProps {
  webcamRef: React.RefObject<HTMLVideoElement>;
}

export const ErgoCoach: React.FC<ErgoCoachProps> = ({ webcamRef }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ErgonomicAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!webcamRef.current) return;
    
    const video = webcamRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.8);

    setLoading(true);
    setError(null);
    
    try {
      const result = await analyzeErgonomics(base64);
      setAnalysis(result);
    } catch (err) {
      setError("无法连接到 Gemini");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-400 font-tech uppercase tracking-wide">
          <ScanFace className="w-5 h-5" />
          姿态诊断系统
        </h2>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] border border-indigo-400/30"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          {loading ? '分析中...' : '开始扫描'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-900/30 border border-red-800 text-red-200 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {analysis ? (
        <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300 flex-1">
          <div className="flex items-center gap-4">
            <div className={`text-5xl font-bold font-mono ${analysis.score > 70 ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'text-amber-400'}`}>
              {analysis.score}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-xs text-slate-400 uppercase tracking-wider">
                <span>Ergonomic Score</span>
                <span>{analysis.score > 80 ? 'EXCELLENT' : 'WARNING'}</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${analysis.score > 70 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-amber-500'}`} 
                  style={{ width: `${analysis.score}%` }} 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
              <span className="text-slate-500 block text-[10px] uppercase tracking-wider mb-1">Lighting</span>
              <span className="font-medium text-slate-200">{analysis.lighting}</span>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
              <span className="text-slate-500 block text-[10px] uppercase tracking-wider mb-1">Posture</span>
              <span className="font-medium text-slate-200">{analysis.posture}</span>
            </div>
          </div>

          <div className="space-y-2 bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
            <p className="text-[10px] uppercase tracking-wider text-indigo-400 mb-2">System Recommendations</p>
            {analysis.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl p-8">
            <Sparkles className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm text-center">保持正常坐姿<br/>让 AI 分析您的健康状况</p>
        </div>
      )}
    </div>
  );
};