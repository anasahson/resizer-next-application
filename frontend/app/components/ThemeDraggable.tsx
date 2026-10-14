'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';

export default function ThemeDraggable() {
  const [isDark, setIsDark] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragProgress, setDragProgress] = useState<number>(1); // 0 = Light (Left), 1 = Dark (Right)

  const trackRef = useRef<HTMLDivElement>(null);

  // Initialize theme from DOM / localStorage. The mounted flag has to flip on
  // mount so SSR/client renders stay identical until hydration.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const saved = localStorage.getItem('resizer-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialDark = saved === 'dark' || (!saved && prefersDark);

    setIsDark(initialDark);
    setDragProgress(initialDark ? 1 : 0);

    if (initialDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, []);

  const applyTheme = (dark: boolean) => {
    setIsDark(dark);
    setDragProgress(dark ? 1 : 0);
    if (dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('resizer-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('resizer-theme', 'light');
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    updateProgressFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateProgressFromPointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);

    // Snap to closest theme
    if (dragProgress >= 0.5) {
      applyTheme(true);
    } else {
      applyTheme(false);
    }
  };

  const updateProgressFromPointer = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const knobWidth = 36;
    const availableWidth = rect.width - knobWidth;
    const relativeX = clientX - rect.left - knobWidth / 2;
    const progress = Math.max(0, Math.min(1, relativeX / availableWidth));
    setDragProgress(progress);
  };

  if (!mounted) return null;

  // Knob position in percentage
  const knobLeftPercent = dragProgress * 100;

  return (
    <div className="flex flex-col items-center sm:items-start gap-2 select-none">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted dark:text-zinc-400">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Drag to Switch Day & Night</span>
      </div>

      {/* Draggable Track */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative w-48 h-10 rounded-full p-1 border cursor-grab active:cursor-grabbing transition-colors duration-300 shadow-inner overflow-hidden flex items-center justify-between px-3 ${
          dragProgress > 0.5
            ? 'bg-zinc-900 border-zinc-700 shadow-black/40'
            : 'bg-gradient-to-r from-amber-100 via-sky-100 to-amber-200 border-amber-300 shadow-amber-500/10'
        }`}
        title="Drag the knob left for Day (Light) or right for Night (Dark)"
      >
        {/* Track Label Left: Sun */}
        <div
          className={`flex items-center gap-1 text-[10px] font-extrabold uppercase transition-opacity duration-200 z-0 ${
            dragProgress < 0.5 ? 'text-amber-700 opacity-100' : 'text-zinc-600 opacity-40'
          }`}
        >
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>Day</span>
        </div>

        {/* Track Label Right: Moon */}
        <div
          className={`flex items-center gap-1 text-[10px] font-extrabold uppercase transition-opacity duration-200 z-0 ${
            dragProgress >= 0.5 ? 'text-indigo-300 opacity-100' : 'text-amber-800 opacity-40'
          }`}
        >
          <span>Night</span>
          <Moon className="w-3.5 h-3.5 text-indigo-400" />
        </div>

        {/* Draggable Knob */}
        <div
          className="absolute top-1 bottom-1 w-9 rounded-full shadow-lg flex items-center justify-center pointer-events-none transition-transform duration-75 z-10"
          style={{
            left: `calc(${dragProgress} * (100% - 2.5rem) + 0.25rem)`,
            backgroundColor: dragProgress > 0.5 ? '#1e1b4b' : '#f59e0b',
            boxShadow:
              dragProgress > 0.5
                ? '0 0 12px rgba(99, 102, 241, 0.5)'
                : '0 0 12px rgba(245, 158, 11, 0.6)',
          }}
        >
          {dragProgress > 0.5 ? (
            <Moon className="w-4 h-4 text-indigo-200 animate-pulse" />
          ) : (
            <Sun className="w-4 h-4 text-white animate-spin-slow" />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between w-48 text-[10px] text-muted dark:text-zinc-500 px-1 font-mono">
        <span>☀️ Light Mode</span>
        <span>🌙 Dark Mode</span>
      </div>
    </div>
  );
}
