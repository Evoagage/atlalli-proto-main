'use client';
import { useMemo } from 'react';

interface SpiderChartProps {
  data: {
    bitterness: number;
    malt: number;
    body: number;
    aroma: number;
    abv: number;
  };
}

export default function SpiderChart({ data }: SpiderChartProps) {
  // Trigonometry to calculate the polygon points
  const points = useMemo(() => {
    const center = 50;
    const radius = 40;
    // Map object values to array order: Top, Right-Top, Right-Bot, Left-Bot, Left-Top
    const values = [data.bitterness, data.malt, data.body, data.aroma, data.abv];
    const angleSlice = (Math.PI * 2) / 5;

    return values.map((val, i) => {
      const r = (val / 100) * radius;
      const x = center + r * Math.sin(i * angleSlice);
      const y = center - r * Math.cos(i * angleSlice);
      return `${x},${y}`;
    }).join(' ');
  }, [data]);

  return (
    <div className="relative w-full max-w-[300px] aspect-square mx-auto">
      <svg className="w-full h-full drop-shadow-[0_0_15px_rgba(213,123,7,0.2)]" viewBox="0 0 100 100">
        {/* Background Grid (Web) */}
        {[40, 30, 20].map((r) => (
          <polygon key={r} fill="none" stroke="#444" strokeDasharray="2 2" strokeWidth="0.5"
            points={Array.from({ length: 5 }).map((_, i) => {
               const angle = (Math.PI * 2) / 5;
               const x = 50 + r * Math.sin(i * angle);
               const y = 50 - r * Math.cos(i * angle);
               return `${x},${y}`;
            }).join(' ')} 
          />
        ))}
        
        {/* Axis Lines */}
        {Array.from({ length: 5 }).map((_, i) => (
           <line key={i} stroke="#333" strokeWidth="0.5" x1="50" y1="50"
             x2={50 + 45 * Math.sin(i * (Math.PI * 2) / 5)}
             y2={50 - 45 * Math.cos(i * (Math.PI * 2) / 5)}
           />
        ))}

        {/* The Data Shape */}
        <polygon 
          points={points} 
          fill="rgba(213, 123, 7, 0.2)" 
          stroke="#d57b07" 
          strokeWidth="1.5" 
          className="transition-all duration-500 ease-out" 
        />
      </svg>
      
      {/* Labels */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-[9px] font-bold text-liquid-gold bg-obsidian-night/90 px-1.5 py-0.5 rounded border border-liquid-gold/20">BITTERNESS</div>
      <div className="absolute top-[35%] right-0 translate-x-1 text-[9px] font-bold text-liquid-gold bg-obsidian-night/90 px-1.5 py-0.5 rounded border border-liquid-gold/20">MALT</div>
      <div className="absolute bottom-[15%] right-0 text-[9px] font-bold text-liquid-gold bg-obsidian-night/90 px-1.5 py-0.5 rounded border border-liquid-gold/20">BODY</div>
      <div className="absolute bottom-[15%] left-0 text-[9px] font-bold text-liquid-gold bg-obsidian-night/90 px-1.5 py-0.5 rounded border border-liquid-gold/20">AROMA</div>
      <div className="absolute top-[35%] left-0 -translate-x-1 text-[9px] font-bold text-liquid-gold bg-obsidian-night/90 px-1.5 py-0.5 rounded border border-liquid-gold/20">ABV</div>
    </div>
  );
}