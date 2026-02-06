'use client';

import { useState } from 'react';
import SpiderChart from '@/components/SpiderChart'; // Import your new component

export default function PreferencesPage() {
  const [prefs, setPrefs] = useState({
    bitterness: 85,
    malt: 70,
    body: 45,
    aroma: 60,
    abv: 80
  });

  const handleChange = (key: keyof typeof prefs, val: string) => {
    setPrefs(prev => ({ ...prev, [key]: parseInt(val) }));
  };

  return (
    <div className="flex flex-col min-h-full p-6 gap-8">
      {/* Header */}
      <header className="text-center">
        <h1 className="text-2xl font-tenor text-liquid-gold">TASTE PROFILE</h1>
        <p className="text-xs text-white/50 tracking-widest uppercase">Calibrate your palate</p>
      </header>

      {/* 1. CHART ON TOP */}
      <div className="glass-panel p-4 rounded-2xl bg-white/5 border border-white/10">
        <SpiderChart data={prefs} />
      </div>

      {/* 2. SLIDERS BELOW */}
      <div className="flex flex-col gap-6">
  {Object.entries(prefs).map(([key, val]) => (
    <div key={key} className="grid grid-cols-[80px_1fr_40px] items-center gap-4 group">
      {/* Label using --text-dim (Bone White 40%) */}
      <label className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider group-hover:text-[var(--text-primary)] transition-colors">
        {key}
      </label>
      
      <div className="relative h-6 flex items-center">
        {/* The Slider Input */}
        <input 
          value={val}
          onChange={(e) => handleChange(key as keyof typeof prefs, e.target.value)}
          className="w-full relative z-10 accent-[var(--liquid-gold)] h-1 bg-[var(--industrial-surface)] rounded-lg appearance-none cursor-pointer border border-[var(--border-subtle)] hover:border-[var(--liquid-gold)]/40 transition-all" 
          style={{
            // Customizing the track color to use your Midnight/Amber theme
            background: `linear-gradient(to right, var(--liquid-gold) 0%, var(--liquid-gold) ${val}%, var(--industrial-surface) ${val}%, var(--industrial-surface) 100%)`
          }}
          type="range" 
          max="100" 
          min="5" 
        />
      </div>

      {/* Value Indicator using --liquid-gold (Signature Amber) */}
      <span className="text-xs font-mono text-[var(--liquid-gold)] text-right drop-shadow-[0_0_5px_var(--liquid-gold)]">
        {val}
      </span>
    </div>
  ))}
</div>

      <button className="w-full py-4 mt-4 bg-liquid-gold text-obsidian-night font-bold uppercase tracking-widest rounded-xl hover:bg-white transition-colors">
        Save Calibration
      </button>
    </div>
  );
}