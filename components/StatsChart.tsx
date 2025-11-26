import React, { useMemo } from 'react';
import { DailyRecord } from '../types';

interface StatsChartProps {
  data: DailyRecord[];
  futureData?: { date: string; value: number }[];
}

export const StatsChart: React.FC<StatsChartProps> = ({ data, futureData }) => {
  const height = 200;
  const width = 600;
  const padding = 30;

  const allDataPoints = useMemo(() => {
    const historical = data.map(d => ({ 
        label: d.date.slice(5), 
        val: d.score, 
        isFuture: false 
    }));
    
    const future = futureData ? futureData.map(d => ({
        label: d.date.slice(5),
        val: d.value,
        isFuture: true
    })) : [];

    return [...historical, ...future];
  }, [data, futureData]);

  if (allDataPoints.length === 0) return null;

  // Scale calculations
  const maxY = 100;
  const maxX = allDataPoints.length - 1;
  
  const getX = (index: number) => padding + (index / maxX) * (width - padding * 2);
  const getY = (val: number) => height - padding - (val / maxY) * (height - padding * 2);

  // Generate path for historical
  const historicalPoints = allDataPoints.filter(d => !d.isFuture);
  const historicalPathD = historicalPoints.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.val)}`
  ).join(' ');

  // Generate path for future (connecting from last historical)
  let futurePathD = '';
  if (futureData && futureData.length > 0) {
      const lastHistIndex = historicalPoints.length - 1;
      const futureStartIndex = lastHistIndex; 
      
      // Start form last historical point
      const pointsToDraw = [historicalPoints[lastHistIndex], ...allDataPoints.filter(d => d.isFuture)];
      
      futurePathD = pointsToDraw.map((p, i) => {
          const globalIndex = futureStartIndex + i;
          return `${i === 0 ? 'M' : 'L'} ${getX(globalIndex)} ${getY(p.val)}`;
      }).join(' ');
  }

  return (
    <div className="w-full h-full overflow-hidden select-none">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
        {/* Grid Lines */}
        {[0, 25, 50, 75, 100].map(tick => (
          <g key={tick}>
            <line 
              x1={padding} 
              y1={getY(tick)} 
              x2={width - padding} 
              y2={getY(tick)} 
              stroke="#334155" 
              strokeWidth="1" 
              strokeDasharray="4 4"
            />
            <text x={0} y={getY(tick) + 4} className="text-[10px] fill-slate-500">{tick}</text>
          </g>
        ))}

        {/* Historical Line */}
        <path 
            d={historicalPathD} 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="3" 
            className="drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
        />
        
        {/* Future Line (Dashed) */}
        {futurePathD && (
             <path 
                d={futurePathD} 
                fill="none" 
                stroke="#6366f1" 
                strokeWidth="3" 
                strokeDasharray="8 4"
                className="drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
            />
        )}

        {/* Data Points */}
        {allDataPoints.map((p, i) => (
          <g key={i} className="group">
            <circle 
              cx={getX(i)} 
              cy={getY(p.val)} 
              r="4" 
              className={`transition-all duration-300 group-hover:r-6 ${p.isFuture ? 'fill-indigo-500' : 'fill-emerald-500'}`}
            />
            
            {/* Tooltip */}
            <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <rect x={getX(i) - 25} y={getY(p.val) - 35} width="50" height="25" rx="4" fill="#1e293b" stroke="#475569" />
                <text x={getX(i)} y={getY(p.val) - 19} textAnchor="middle" className="text-[12px] fill-white font-mono">
                    {p.val}%
                </text>
            </g>
            
            {/* X Axis Label */}
            <text x={getX(i)} y={height - 10} textAnchor="middle" className="text-[10px] fill-slate-400 font-mono">
                {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};