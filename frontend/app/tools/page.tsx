'use client';

import React, { useState, useRef, useCallback } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '')
  || 'http://localhost:5000';

interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

interface ProcessedResult {
  id: string;
  filename: string;
  originalSizeBytes: number;
  outputSizeBytes: number;
  savingsPercent: number;
  width: number;
  height: number;
  format: string;
  processingTimeMs: number;
  dataBase64: string;
}

type ActiveTool = 'convert' | 'compress' | 'resize' | 'batch';
type OutputFormat = 'webp' | 'avif' | 'jpeg' | 'png';
type FitMode = 'contain' | 'cover' | 'fill' | 'inside' | 'outside';

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function genId() { return Math.random().toString(36).substring(2, 11); }
export default function ToolsPage() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [results, setResults] = useState<Map<string, ProcessedResult>>(new Map());
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [dragActive, setDragActive] = useState(false);
  const [activeTool, setActiveTool] = useState<ActiveTool>('convert');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('webp');
  const [quality, setQuality] = useState(82);
  const [maintainRatio, setMaintainRatio] = useState(true);
  const [targetWidth, setTargetWidth] = useState(1280);
  const [targetHeight, setTargetHeight] = useState(720);
  const [fitMode, setFitMode] = useState<FitMode>('contain');
  const [stripMeta, setStripMeta] = useState(true);
  const [progressive, setProgressive] = useState(false);
  const [compareIdx, setCompareIdx] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const PRESETS = [
    { label: 'IG', w: 1080, h: 1080, title: 'Instagram 1:1' },
    { label: 'ST', w: 1080, h: 1920, title: 'Story 9:16' },
    { label: 'TW', w: 1200, h: 675, title: 'Twitter / X' },
    { label: 'FB', w: 1200, h: 630, title: 'Facebook' },
    { label: 'YT', w: 1280, h: 720, title: 'YouTube' },
    { label: 'LI', w: 1200, h: 627, title: 'LinkedIn' },
    { label: '4K', w: 3840, h: 2160, title: '4K UHD' },
    { label: 'HD', w: 1920, h: 1080, title: 'Full HD' },
  ];

  const TOOLS = [
    { id: 'convert' as ActiveTool, label: 'Convert', icon: '🔄', desc: 'Format' },
    { id: 'compress' as ActiveTool, label: 'Compress', icon: '⚡', desc: 'Size' },
    { id: 'resize' as ActiveTool, label: 'Resize', icon: '📐', desc: 'Dimensions' },
    { id: 'batch' as ActiveTool, label: 'Batch', icon: '📦', desc: 'Many' },
  ];

  const FMT: Record<OutputFormat, { label: string; desc: string; active: string }> = {
    webp: { label: 'WebP', desc: '30% smaller than JPEG', active: 'bg-blue-50 dark:bg-blue-500/10 border-blue-400 text-blue-700 dark:text-blue-300' },
    avif: { label: 'AVIF', desc: '50% smaller than WebP', active: 'bg-purple-50 dark:bg-purple-500/10 border-purple-400 text-purple-700 dark:text-purple-300' },
    jpeg: { label: 'JPEG', desc: 'Universal compatibility', active: 'bg-amber-50 dark:bg-amber-500/10 border-amber-400 text-amber-700 dark:text-amber-300' },
    png:  { label: 'PNG', desc: 'Lossless + transparency', active: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-400 text-emerald-700 dark:text-emerald-300' },
  };
  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const ingest = useCallback((raw: FileList | File[]) => {
    const arr = Array.from(raw).filter(f => f.type.startsWith('image/')).slice(0, 20);
    if (!arr.length) return;
    const next: ImageFile[] = arr.map(file => ({ id: genId(), file, previewUrl: URL.createObjectURL(file), width: 0, height: 0 }));
    next.forEach(img => {
      const el = new window.Image();
      el.onload = () => setImages(prev => prev.map(i => i.id === img.id ? { ...i, width: el.naturalWidth, height: el.naturalHeight } : i));
      el.src = img.previewUrl;
    });
    setImages(prev => [...prev, ...next]);
    showToast(`${arr.length} image${arr.length > 1 ? 's' : ''} added`);
  }, [showToast]);

  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragActive(false); ingest(e.dataTransfer.files); }, [ingest]);

  const removeImage = (id: string) => {
    setImages(prev => { const img = prev.find(i => i.id === id); if (img) URL.revokeObjectURL(img.previewUrl); return prev.filter(i => i.id !== id); });
    setResults(prev => { const m = new Map(prev); m.delete(id); return m; });
    setErrors(prev => { const m = new Map(prev); m.delete(id); return m; });
    if (compareIdx === id) setCompareIdx(null);
  };

  const clearAll = () => {
    images.forEach(i => URL.revokeObjectURL(i.previewUrl));
    setImages([]); setResults(new Map()); setErrors(new Map()); setProcessing(new Set()); setCompareIdx(null);
  };

  const buildFd = useCallback((file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    fd.append('format', outputFormat);
    fd.append('quality', String(quality));
    if (activeTool === 'resize' || activeTool === 'batch') {
      fd.append('width', String(targetWidth));
      fd.append('height', String(targetHeight));
      fd.append('fit', fitMode);
    }
    if (stripMeta) fd.append('stripMetadata', 'true');
    if (progressive) fd.append('progressive', 'true');
    return fd;
  }, [outputFormat, quality, activeTool, targetWidth, targetHeight, fitMode, stripMeta, progressive]);

  const processImage = useCallback(async (img: ImageFile) => {
    setProcessing(prev => new Set(prev).add(img.id));
    setErrors(prev => { const m = new Map(prev); m.delete(img.id); return m; });
    try {
      const res = await fetch(`${BACKEND_URL}/api/images/process`, { method: 'POST', body: buildFd(img.file) });
      if (!res.ok) { const e = await res.json().catch(() => ({ message: 'Error' })); throw new Error(e.message || `HTTP ${res.status}`); }
      const data = await res.json();
      const r: ProcessedResult = {
        id: img.id, filename: data.data?.filename || img.file.name,
        originalSizeBytes: data.data?.originalSizeBytes ?? img.file.size,
        outputSizeBytes: data.data?.outputSizeBytes ?? img.file.size,
        savingsPercent: data.data?.savingsPercent ?? 0,
        width: data.data?.width ?? img.width, height: data.data?.height ?? img.height,
        format: data.data?.format ?? outputFormat, processingTimeMs: data.data?.processingTimeMs ?? 0,
        dataBase64: data.data?.dataBase64 ?? '',
      };
      setResults(prev => new Map(prev).set(img.id, r));
      showToast(`Done: ${img.file.name}`);
    } catch (e: any) {
      setErrors(prev => new Map(prev).set(img.id, e.message));
      showToast(e.message, false);
    } finally {
      setProcessing(prev => { const s = new Set(prev); s.delete(img.id); return s; });
    }
  }, [buildFd, outputFormat, showToast]);

  const processAll = useCallback(async () => { for (const img of images) await processImage(img); }, [images, processImage]);

  const dl = (r: ProcessedResult) => { const a = document.createElement('a'); a.href = r.dataBase64; a.download = r.filename; a.click(); };
  const dlAll = () => { results.forEach(r => dl(r)); showToast(`Downloading ${results.size} files`); };

  const onW = (v: number) => { setTargetWidth(v); if (maintainRatio && images[0]?.width) setTargetHeight(Math.round((v / images[0].width) * images[0].height)); };
  const onH = (v: number) => { setTargetHeight(v); if (maintainRatio && images[0]?.height) setTargetWidth(Math.round((v / images[0].height) * images[0].width)); };

  const totalOrig = images.reduce((s, i) => s + i.file.size, 0);
  const totalOut = Array.from(results.values()).reduce((s, r) => s + r.outputSizeBytes, 0);
  const avgSav = results.size > 0 ? Math.round(Array.from(results.values()).reduce((s, r) => s + r.savingsPercent, 0) / results.size) : 0;
  const anyProc = processing.size > 0;
  const showDim = activeTool === 'resize' || activeTool === 'batch';
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors duration-200">

      {/* Hero */}
      <section className="relative pt-10 pb-8 border-b border-slate-200 dark:border-zinc-800 overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute -top-24 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse inline-block" />
            Professional Image Processing Suite
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent mb-3">
            Image Tools
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-base max-w-xl mx-auto">
            Convert, compress and resize images with professional quality. Drag and drop up to 20 images — download instantly.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Tool tabs */}
        <div className="flex gap-2 flex-wrap">
          {TOOLS.map(t => (
            <button key={t.id} onClick={() => setActiveTool(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${activeTool === t.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/25' : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-indigo-400 hover:text-indigo-700'}`}>
              <span>{t.icon}</span><span>{t.label}</span>
              <span className={`hidden sm:inline text-[10px] px-1.5 py-0.5 rounded font-mono ${activeTool === t.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'}`}>{t.desc}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

          {/* LEFT panel */}
          <aside className="xl:col-span-4 space-y-4">

            {/* Format */}
            <div className="bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">🎨 Output Format</h3>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(FMT) as OutputFormat[]).map(fmt => {
                  const info = FMT[fmt]; const isA = outputFormat === fmt;
                  return (
                    <button key={fmt} onClick={() => setOutputFormat(fmt)}
                      className={`relative p-3 rounded-xl border text-left transition-all ${isA ? info.active : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700'}`}>
                      {isA && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-current" />}
                      <div className="text-sm font-bold">{info.label}</div>
                      <div className="text-[10px] opacity-70 mt-0.5 leading-tight">{info.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quality */}
            <div className="bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">⚙️ Quality</h3>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xl font-extrabold font-mono ${quality >= 80 ? 'text-emerald-500' : quality >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>{quality}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">{quality >= 90 ? 'Max' : quality >= 75 ? 'Good' : quality >= 55 ? 'Med' : 'Low'}</span>
                </div>
              </div>
              <input type="range" min={10} max={100} value={quality} onChange={e => setQuality(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer accent-indigo-500 bg-slate-200 dark:bg-zinc-800" />
              <div className="grid grid-cols-4 gap-1.5">
                {[{ l: 'Tiny', v: 50 }, { l: 'Web', v: 75 }, { l: 'Print', v: 90 }, { l: 'Max', v: 100 }].map(p => (
                  <button key={p.l} onClick={() => setQuality(p.v)}
                    className={`py-1 rounded-lg text-[11px] font-semibold border transition-all ${quality === p.v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:border-indigo-400'}`}>
                    {p.l}
                  </button>
                ))}
              </div>
            </div>
            {/* Dimensions */}
            {showDim && (
              <div className="bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">📐 Dimensions</h3>
                <div className="grid grid-cols-4 gap-1.5">
                  {PRESETS.map(p => (
                    <button key={p.label} onClick={() => { setTargetWidth(p.w); setTargetHeight(p.h); }} title={p.title}
                      className={`py-1.5 rounded-lg text-[11px] font-bold border transition-all ${targetWidth === p.w && targetHeight === p.h ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-indigo-400'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-1">Width px</label>
                    <input type="number" value={targetWidth} onChange={e => onW(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-1">Height px</label>
                    <input type="number" value={targetHeight} onChange={e => onH(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
                <button onClick={() => setMaintainRatio(v => !v)}
                  className={`flex items-center gap-2 w-full rounded-xl px-3 py-2 border text-xs font-semibold transition-all ${maintainRatio ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400'}`}>
                  {maintainRatio ? '🔗 Ratio Locked' : '🔓 Ratio Free'}
                </button>
                <div className="flex flex-wrap gap-1.5">
                  {(['contain', 'cover', 'fill', 'inside', 'outside'] as FitMode[]).map(m => (
                    <button key={m} onClick={() => setFitMode(m)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border capitalize transition-all ${fitMode === m ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Advanced */}
            <div className="bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">🔧 Advanced</h3>
              {([
                { label: 'Strip Metadata', sub: 'Remove EXIF / GPS data', val: stripMeta, set: setStripMeta },
                { label: 'Progressive', sub: 'Faster perceived load', val: progressive, set: setProgressive },
              ] as const).map(o => (
                <button key={o.label} onClick={() => (o.set as any)((v: boolean) => !v)} className="flex items-center justify-between w-full">
                  <div className="text-left">
                    <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300">{o.label}</div>
                    <div className="text-[10px] text-slate-500 dark:text-zinc-500">{o.sub}</div>
                  </div>
                  <div className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ml-3 ${o.val ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-zinc-700'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${o.val ? 'translate-x-5' : ''}`} />
                  </div>
                </button>
              ))}
            </div>

            {/* Stats */}
            {images.length > 0 && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-5 space-y-2">
                <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-300">📊 Session Stats</h3>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-slate-500 dark:text-zinc-500">Images</span><span className="font-bold">{images.length}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 dark:text-zinc-500">Processed</span><span className="font-bold text-emerald-600 dark:text-emerald-400">{results.size}/{images.length}</span></div>
                  {results.size > 0 && <>
                    <div className="flex justify-between"><span className="text-slate-500 dark:text-zinc-500">Original</span><span className="font-mono font-bold">{formatBytes(totalOrig)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500 dark:text-zinc-500">Optimized</span><span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatBytes(totalOut)}</span></div>
                    <div className="pt-1">
                      <div className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.max(5, 100 - avgSav)}%` }} />
                      </div>
                      <p className="text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">Avg {avgSav}% smaller</p>
                    </div>
                  </>}
                </div>
              </div>
            )}
          </aside>
          {/* RIGHT panel */}
          <main className="xl:col-span-8 space-y-5">

            {/* Drop zone */}
            <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onClick={() => fileRef.current?.click()}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-10 text-center min-h-[200px] select-none transition-all duration-200 ${dragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 scale-[1.01]' : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/50 hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5'}`}>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) ingest(e.target.files); e.target.value = ''; }} />
              <div className={`text-5xl mb-3 transition-transform duration-200 ${dragActive ? 'scale-125' : ''}`}>{dragActive ? '🎯' : '🖼️'}</div>
              <p className="text-lg font-bold text-slate-800 dark:text-zinc-100">{dragActive ? 'Drop to upload!' : 'Drag & drop images here'}</p>
              <p className="text-sm text-slate-500 dark:text-zinc-500 mt-1">JPG, PNG, WebP, AVIF, TIFF, GIF · Up to 20 images · 50 MB each</p>
              <div className="mt-5 flex items-center gap-3" onClick={e => e.stopPropagation()}>
                <button onClick={() => fileRef.current?.click()} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow transition-all hover:scale-105">Browse Files</button>
                {images.length > 0 && (
                  <button onClick={clearAll} className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-sm font-semibold border border-slate-200 dark:border-zinc-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 transition-all">Clear All ({images.length})</button>
                )}
              </div>
            </div>

            {/* Action bar */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-3 items-center">
                <button onClick={processAll} disabled={anyProc}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-60 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.99]">
                  {anyProc ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Processing {processing.size}/{images.length}...</>
                  ) : <>⚡ Process {images.length > 1 ? `All ${images.length}` : 'Image'}</>}
                </button>
                {results.size > 0 && (
                  <button onClick={dlAll} className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]">
                    📥 Download All ({results.size})
                  </button>
                )}
                <span className="text-xs text-slate-400 dark:text-zinc-500 ml-auto">{results.size}/{images.length} done</span>
              </div>
            )}
            {/* Image cards */}
            {images.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map(img => {
                  const result = results.get(img.id);
                  const isProc = processing.has(img.id);
                  const error = errors.get(img.id);
                  const isCmp = compareIdx === img.id;
                  return (
                    <div key={img.id} className={`bg-white dark:bg-zinc-900 border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all ${result ? 'border-emerald-200 dark:border-emerald-500/30' : error ? 'border-rose-200 dark:border-rose-500/30' : 'border-slate-200 dark:border-zinc-800'}`}>
                      <div className="relative aspect-video bg-slate-100 dark:bg-zinc-950 overflow-hidden">
                        <img src={isCmp && result?.dataBase64 ? result.dataBase64 : img.previewUrl} alt={img.file.name} className="w-full h-full object-cover" />
                        {isProc && (
                          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            <span className="text-white text-xs font-semibold">Processing…</span>
                          </div>
                        )}
                        {error && !isProc && (
                          <div className="absolute inset-0 bg-rose-600/85 flex items-center justify-center p-3">
                            <p className="text-white text-xs font-semibold text-center">⚠️ {error}</p>
                          </div>
                        )}
                        {result && <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-extrabold shadow">-{Math.round(result.savingsPercent)}%</div>}
                        <div className="absolute top-2 right-2 flex gap-1">
                          {result && <span className="px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold uppercase">{result.format}</span>}
                          <button onClick={() => removeImage(img.id)} className="w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:bg-rose-600 transition-colors">×</button>
                        </div>
                        {result?.dataBase64 && !isProc && (
                          <button onClick={() => setCompareIdx(isCmp ? null : img.id)} className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold hover:bg-indigo-600 transition-colors">
                            {isCmp ? '← Original' : '✨ Preview'}
                          </button>
                        )}
                      </div>
                      <div className="p-3 space-y-2">
                        <p className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate" title={img.file.name}>{img.file.name}</p>
                        <div className="flex gap-1.5 flex-wrap text-[10px] font-mono text-slate-500 dark:text-zinc-500">
                          <span className="bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{formatBytes(img.file.size)}</span>
                          {img.width > 0 && <span className="bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{img.width}×{img.height}</span>}
                          {result && <span className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">→ {formatBytes(result.outputSizeBytes)}</span>}
                        </div>
                        {result && (
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-700" style={{ width: `${Math.max(5, 100 - result.savingsPercent)}%` }} />
                          </div>
                        )}
                        <div className="flex gap-2">
                          {!result && !isProc && (
                            <button onClick={() => processImage(img)} className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition-all hover:scale-[1.02]">⚡ Process</button>
                          )}
                          {result && (
                            <>
                              <button onClick={() => processImage(img)} title="Re-process" className="py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-[11px] font-semibold border border-slate-200 dark:border-zinc-700 transition-all">🔄</button>
                              <button onClick={() => dl(result)} className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all hover:scale-[1.02]">📥 Download</button>
                            </>
                          )}
                        </div>
                        {result && <div className="flex justify-between text-[10px] text-slate-400 dark:text-zinc-600"><span>⏱ {result.processingTimeMs}ms</span><span>{result.width}×{result.height}</span></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-2xl p-12 text-center">
                <div className="text-6xl mb-4">🖼️</div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No images loaded</h3>
                <p className="text-slate-500 dark:text-zinc-500 text-sm mb-6">Upload images above to convert, compress or resize them.</p>
                <div className="grid grid-cols-4 gap-3 max-w-xs mx-auto">
                  {[{ f: 'WebP', c: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20' },
                    { f: 'AVIF', c: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20' },
                    { f: 'JPEG', c: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' },
                    { f: 'PNG', c: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' }
                  ].map(x => <div key={x.f} className={`border rounded-xl p-2.5 text-xs font-bold text-center ${x.c}`}>{x.f}</div>)}
                </div>
              </div>
            )}

            {/* Feature pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[{ i: '🔄', t: 'Convert Formats', d: 'WebP, AVIF, JPEG, PNG' }, { i: '⚡', t: 'Smart Compress', d: 'Up to 80% smaller' }, { i: '📐', t: 'Resize & Fit', d: 'Social media presets' }, { i: '📦', t: 'Batch Process', d: 'Up to 20 at once' }].map(c => (
                <div key={c.t} className="bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-2">{c.i}</div>
                  <div className="text-[11px] font-bold text-slate-900 dark:text-white">{c.t}</div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-500 mt-0.5">{c.d}</div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold border ${toast.ok ? 'bg-white dark:bg-zinc-900 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-zinc-900 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
