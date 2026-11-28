'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { getPreset } from '../lib/presets';
import { getImageOutputFormat, type ImageOutputFormat } from '../lib/imageFormats';
import ToolDirectory from '../components/ToolDirectory';
import { TOOL_CATEGORIES, type ToolCategoryId } from '../data/tools';

// The PDF tool pulls in pdf.js (~1 MB), so it is loaded only when that tab is
// opened instead of on every visit to the tools page.
const PdfToImagesPanel = dynamic(() => import('./PdfToImagesPanel'), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted">
      Loading the PDF tools…
    </div>
  ),
});

const ImageToPdfPanel = dynamic(() => import('./ImageToPdfPanel'), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted">
      Loading the image-to-PDF tool…
    </div>
  ),
});

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '')
  || '';

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

type ActiveTool = 'convert' | 'compress' | 'resize' | 'batch' | 'pdf' | 'image-pdf';
type OutputFormat = ImageOutputFormat;
type FitMode = 'contain' | 'cover' | 'fill' | 'inside' | 'outside';

const CATEGORY_DEFAULT_TOOL: Record<ToolCategoryId, ActiveTool> = {
  optimize: 'compress',
  resize: 'resize',
  edit: 'convert',
  convert: 'convert',
  pdf: 'pdf',
  ai: 'convert',
};

function isOutputFormat(value: string | null): value is OutputFormat {
  return value === 'webp' || value === 'avif' || value === 'jpeg' || value === 'png';
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function genId() { return Math.random().toString(36).substring(2, 11); }

function getImageBaseName(filename: string): string {
  return filename.replace(/\.[^/.]+$/, '') || 'image';
}

function sanitizeFileName(value: string, fallback = 'image'): string {
  const sanitized = value
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/[. ]+$/g, '')
    .trim();
  return sanitized || fallback;
}

function getOutputFileName(
  originalName: string,
  format: OutputFormat,
  prefix: string,
  suffix: string,
  index: number,
  usedNames: Set<string>,
): string {
  const baseName = originalName.replace(/\.[^/.]+$/, '') || `image-${index + 1}`;
  const extension = format === 'jpeg' ? 'jpg' : format;
  const outputBase = sanitizeFileName(`${prefix}${baseName}${suffix}`, `image-${index + 1}`);
  let filename = `${outputBase}.${extension}`;
  let duplicate = 2;
  while (usedNames.has(filename.toLowerCase())) {
    filename = `${outputBase}-${duplicate}.${extension}`;
    duplicate += 1;
  }
  usedNames.add(filename.toLowerCase());
  return filename;
}

export default function ToolsPage() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [results, setResults] = useState<Map<string, ProcessedResult>>(new Map());
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const [dragActive, setDragActive] = useState(false);
  const [activeTool, setActiveTool] = useState<ActiveTool>('convert');
  const [activeCategory, setActiveCategory] = useState<ToolCategoryId>('optimize');
  const [showProcessedPreview, setShowProcessedPreview] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('webp');
  const [quality, setQuality] = useState(82);
  const [maintainRatio, setMaintainRatio] = useState(true);
  const [targetWidth, setTargetWidth] = useState(1280);
  const [targetHeight, setTargetHeight] = useState(720);
  const [fitMode, setFitMode] = useState<FitMode>('contain');
  const [stripMeta, setStripMeta] = useState(true);
  const [progressive, setProgressive] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [filter, setFilter] = useState<'none' | 'grayscale' | 'sepia' | 'blur'>('none');
  const [watermark, setWatermark] = useState('');
  const [filenamePrefix, setFilenamePrefix] = useState('');
  const [filenameSuffix, setFilenameSuffix] = useState('_optimized');
  const [imageNames, setImageNames] = useState<Map<string, string>>(new Map());
  const [compareIdx, setCompareIdx] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [imgUrl, setImgUrl] = useState('');
  const [loadingUrl, setLoadingUrl] = useState(false);

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
    { id: 'pdf' as ActiveTool, label: 'PDF → Images', icon: '📄', desc: 'Pages' },
    { id: 'image-pdf' as ActiveTool, label: 'Images → PDF', icon: '🖼️', desc: 'Document' },
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
    setOutputFormat(getImageOutputFormat(arr[0]));
    const next: ImageFile[] = arr.map(file => ({ id: genId(), file, previewUrl: URL.createObjectURL(file), width: 0, height: 0 }));
    next.forEach(img => {
      const el = new window.Image();
      el.onload = () => setImages(prev => prev.map(i => i.id === img.id ? { ...i, width: el.naturalWidth, height: el.naturalHeight } : i));
      el.src = img.previewUrl;
    });
    setImageNames(prev => {
      const names = new Map(prev);
      next.forEach((img, index) => names.set(img.id, getImageBaseName(arr[index].name)));
      return names;
    });
    setSelectedImageId(current => current || next[0]?.id || null);
    setImages(prev => [...prev, ...next]);
    showToast(`${arr.length} image${arr.length > 1 ? 's' : ''} added`);
  }, [showToast]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preset = getPreset(params.get('preset') || '');

    if (preset) {
      // A preset link (/presets/<slug>) opens the studio fully configured, so a
      // visitor arriving from search never has to set dimensions or format.
      const requestedFormat = params.get('format');
      /* eslint-disable react-hooks/set-state-in-effect */
      setActiveTool(preset.tool);
      setActiveCategory(preset.tool === 'resize' ? 'resize' : preset.tool === 'compress' ? 'optimize' : preset.tool === 'pdf' ? 'pdf' : 'convert');
      setOutputFormat(isOutputFormat(requestedFormat) ? requestedFormat : preset.format);
      setQuality(preset.quality);
      if (preset.width) setTargetWidth(preset.width);
      if (preset.height) setTargetHeight(preset.height);
      if (preset.fit) setFitMode(preset.fit);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }

    const tool = params.get('tool');
    if (tool === 'pdf' || tool === 'image-pdf' || tool === 'compress' || tool === 'resize' || tool === 'batch' || tool === 'convert') {
      // The query string is only readable after mount, and deriving the initial
      // state from it during render would break hydration of the prerendered page.
      setActiveTool(tool);
      setActiveCategory(
        tool === 'compress' ? 'optimize'
          : tool === 'resize' || tool === 'batch' ? 'resize'
            : tool === 'pdf' || tool === 'image-pdf' ? 'pdf'
              : 'convert',
      );
    }
  }, []);

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        ingest(files);
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [ingest]);

  const fetchFromUrl = async (url: string) => {
    if (!url) return;
    setLoadingUrl(true);
    try {
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url.trim());
      } catch {
        throw new Error('Enter a complete image URL starting with http:// or https://');
      }
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Only http:// and https:// image URLs are supported');
      }

      const res = await fetch(`${BACKEND_URL}/api/images/fetch-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: parsedUrl.toString() }),
      });
      if (!res.ok) {
        let message = 'Could not load that image';
        try {
          const payload = await res.json();
          message = payload.error || payload.message || message;
        } catch {
          // Keep the generic message when the proxy does not return JSON.
        }
        throw new Error(message);
      }
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) throw new Error('Not an image');
      let ext = blob.type.split('/')[1] || 'jpg';
      if (ext === 'jpeg') ext = 'jpg';
      const filename = url.split('/').pop()?.split('?')[0] || `image.${ext}`;
      const file = new File([blob], filename, { type: blob.type });
      ingest([file]);
      setImgUrl('');
      showToast('Image loaded from URL');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Could not load image', false);
    } finally {
      setLoadingUrl(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragActive(false); ingest(e.dataTransfer.files); }, [ingest]);

  const removeImage = (id: string) => {
    setImages(prev => { const img = prev.find(i => i.id === id); if (img) URL.revokeObjectURL(img.previewUrl); return prev.filter(i => i.id !== id); });
    if (selectedImageId === id) setSelectedImageId(null);
    setImageNames(prev => { const m = new Map(prev); m.delete(id); return m; });
    setResults(prev => { const m = new Map(prev); m.delete(id); return m; });
    setErrors(prev => { const m = new Map(prev); m.delete(id); return m; });
    if (compareIdx === id) setCompareIdx(null);
  };

  const clearAll = () => {
    images.forEach(i => URL.revokeObjectURL(i.previewUrl));
    setImages([]); setResults(new Map()); setErrors(new Map()); setProcessing(new Set()); setCompareIdx(null); setImageNames(new Map()); setSelectedImageId(null);
  };

  const buildFd = useCallback((file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    fd.append('format', outputFormat);
    fd.append('quality', String(quality));
    fd.append('filenamePrefix', filenamePrefix);
    fd.append('filenameSuffix', filenameSuffix);
    if (activeTool === 'resize' || activeTool === 'batch') {
      fd.append('width', String(targetWidth));
      fd.append('height', String(targetHeight));
      fd.append('fit', fitMode);
    }
    if (stripMeta) fd.append('stripMetadata', 'true');
    if (progressive) fd.append('progressive', 'true');
    return fd;
  }, [outputFormat, quality, activeTool, targetWidth, targetHeight, fitMode, stripMeta, progressive, filenamePrefix, filenameSuffix]);

  const processWithCanvas = useCallback(
    async (img: ImageFile): Promise<ProcessedResult> => {
      const startTime = performance.now();
      return new Promise((resolve, reject) => {
        const imageElement = new window.Image();
        imageElement.crossOrigin = 'anonymous';

        imageElement.onload = () => {
          try {
            const natW = Math.max(1, imageElement.naturalWidth || img.width || 100);
            const natH = Math.max(1, imageElement.naturalHeight || img.height || 100);

            let dstW = natW;
            let dstH = natH;

            if (activeTool === 'resize' || activeTool === 'batch') {
              dstW = Math.max(1, Math.round(targetWidth || natW));
              dstH = Math.max(1, Math.round(targetHeight || natH));

              if (maintainRatio) {
                const ratio = natW / natH;
                if (fitMode === 'contain' || fitMode === 'inside') {
                  if (dstW / dstH > ratio) {
                    dstW = Math.max(1, Math.round(dstH * ratio));
                  } else {
                    dstH = Math.max(1, Math.round(dstW / ratio));
                  }
                } else if (fitMode === 'cover' || fitMode === 'outside') {
                  if (dstW / dstH < ratio) {
                    dstW = Math.max(1, Math.round(dstH * ratio));
                  } else {
                    dstH = Math.max(1, Math.round(dstW / ratio));
                  }
                }
              }
            }

            const canvas = document.createElement('canvas');
            const isRotated = rotation === 90 || rotation === 270;
            canvas.width = Math.max(1, isRotated ? dstH : dstW);
            canvas.height = Math.max(1, isRotated ? dstW : dstH);

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              throw new Error('Canvas 2D context is unavailable in your browser.');
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            let filterStr = 'none';
            if (filter === 'grayscale') filterStr = 'grayscale(100%)';
            else if (filter === 'sepia') filterStr = 'sepia(100%)';
            else if (filter === 'blur') filterStr = 'blur(4px)';
            ctx.filter = filterStr;

            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);

            if (fitMode === 'cover') {
              const srcRatio = natW / natH;
              const dstRatio = dstW / dstH;
              let sW = natW;
              let sH = natH;
              let sX = 0;
              let sY = 0;
              if (srcRatio > dstRatio) {
                sW = natH * dstRatio;
                sX = (natW - sW) / 2;
              } else {
                sH = natW / dstRatio;
                sY = (natH - sH) / 2;
              }
              ctx.drawImage(imageElement, sX, sY, sW, sH, -dstW / 2, -dstH / 2, dstW, dstH);
            } else {
              ctx.drawImage(imageElement, -dstW / 2, -dstH / 2, dstW, dstH);
            }

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.filter = 'none';

            if (watermark) {
              const fontSize = Math.max(20, Math.floor(canvas.width / 15));
              ctx.font = `bold ${fontSize}px sans-serif`;
              ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
              ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
              ctx.lineWidth = Math.max(2, fontSize / 10);
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.strokeText(watermark, canvas.width / 2, canvas.height / 2);
              ctx.fillText(watermark, canvas.width / 2, canvas.height / 2);
            }

            const mimeMap: Record<OutputFormat, string> = {
              webp: 'image/webp',
              avif: 'image/webp', // Fallback to webp if canvas encoder lacks AVIF support
              jpeg: 'image/jpeg',
              png: 'image/png',
            };
            const mime = mimeMap[outputFormat] || 'image/webp';
            const q = Math.min(1, Math.max(0.1, quality / 100));

            let dataUrl = '';
            try {
              dataUrl = canvas.toDataURL(mime, q);
            } catch {
              dataUrl = canvas.toDataURL('image/png');
            }

            const base64Index = dataUrl.indexOf(',');
            const base64String = base64Index >= 0 ? dataUrl.substring(base64Index + 1) : dataUrl;
            const outputSizeBytes = Math.round((base64String.length * 3) / 4);
            const savingsPercent = Math.max(0, Math.min(100, Math.round((1 - outputSizeBytes / img.file.size) * 100)));
            const filename = getOutputFileName(
              `${imageNames.get(img.id) || getImageBaseName(img.file.name)}.${outputFormat}`,
              outputFormat,
              filenamePrefix,
              filenameSuffix,
              0,
              new Set<string>(),
            );
            const processingTimeMs = Math.round(performance.now() - startTime);

            resolve({
              id: img.id,
              filename,
              originalSizeBytes: img.file.size,
              outputSizeBytes,
              savingsPercent,
              width: dstW,
              height: dstH,
              format: outputFormat,
              processingTimeMs,
              dataBase64: dataUrl,
            });
          } catch (canvasErr) {
            reject(canvasErr);
          }
        };

        imageElement.onerror = () => {
          reject(new Error(`Failed to decode image: ${img.file.name}`));
        };

        imageElement.src = img.previewUrl;
      });
    },
    [activeTool, targetWidth, targetHeight, maintainRatio, fitMode, outputFormat, quality, rotation, flipX, flipY, filter, watermark, filenamePrefix, filenameSuffix, imageNames]
  );

  const processImage = useCallback(async (img: ImageFile) => {
    setProcessing(prev => new Set(prev).add(img.id));
    setErrors(prev => { const m = new Map(prev); m.delete(img.id); return m; });
    try {
      let r: ProcessedResult | null = null;
      const advancedActive = rotation !== 0 || flipX || flipY || filter !== 'none' || watermark !== '';
      
      // 1. Try backend processing first with ?responseType=json
      if (!advancedActive) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/images/process?responseType=json`, {
            method: 'POST',
            body: buildFd(img.file),
          });
          if (res.ok) {
            const data = await res.json();
            const base64 = data.dataBase64 || data.data?.dataBase64;
            if (base64) {
              r = {
                id: img.id,
                filename: getOutputFileName(
                  `${imageNames.get(img.id) || getImageBaseName(img.file.name)}.${outputFormat}`,
                  outputFormat,
                  filenamePrefix,
                  filenameSuffix,
                  0,
                  new Set<string>(),
                ),
                originalSizeBytes: data.originalSizeBytes ?? data.data?.originalSizeBytes ?? img.file.size,
                outputSizeBytes: data.outputSizeBytes ?? data.data?.outputSizeBytes ?? img.file.size,
                savingsPercent: data.savingsPercent ?? data.data?.savingsPercent ?? 0,
                width: data.width ?? data.data?.width ?? img.width,
                height: data.height ?? data.data?.height ?? img.height,
                format: data.format ?? data.data?.format ?? outputFormat,
                processingTimeMs: data.processingTimeMs ?? data.data?.processingTimeMs ?? 0,
                dataBase64: base64,
              };
            }
          }
        } catch (backendErr) {
          console.warn('Backend unavailable, falling back to browser canvas engine:', backendErr);
        }
      }

      // 2. Fallback to client-side HTML5 canvas if backend is unavailable or failed
      if (!r) {
        r = await processWithCanvas(img);
      }

      setResults(prev => new Map(prev).set(img.id, r!));
      showToast(`Done: ${img.file.name}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Processing failed';
      setErrors(prev => new Map(prev).set(img.id, msg));
      showToast(msg, false);
    } finally {
      setProcessing(prev => { const s = new Set(prev); s.delete(img.id); return s; });
    }
  }, [buildFd, outputFormat, showToast, processWithCanvas, rotation, flipX, flipY, filter, watermark, filenamePrefix, filenameSuffix, imageNames]);

  const processAll = useCallback(async () => { for (const img of images) await processImage(img); }, [images, processImage]);

  const dl = (r: ProcessedResult) => { const a = document.createElement('a'); a.href = r.dataBase64; a.download = r.filename; a.click(); };
  const dlAll = () => {
    const usedNames = new Set<string>();
    results.forEach((r) => {
      const extensionMatch = r.filename.match(/(\.[^/.]+)$/);
      const extension = extensionMatch?.[1] || `.${r.format === 'jpeg' ? 'jpg' : r.format}`;
      const baseName = r.filename.replace(/\.[^/.]+$/, '') || 'image';
      let filename = `${baseName}${extension}`;
      let duplicate = 2;
      while (usedNames.has(filename.toLowerCase())) {
        filename = `${baseName}-${duplicate}${extension}`;
        duplicate += 1;
      }
      usedNames.add(filename.toLowerCase());
      dl({ ...r, filename });
    });
    showToast(`Downloading ${results.size} files`);
  };

  const onW = (v: number) => { setTargetWidth(v); if (maintainRatio && images[0]?.width) setTargetHeight(Math.round((v / images[0].width) * images[0].height)); };
  const onH = (v: number) => { setTargetHeight(v); if (maintainRatio && images[0]?.height) setTargetWidth(Math.round((v / images[0].height) * images[0].width)); };

  const totalOrig = images.reduce((s, i) => s + i.file.size, 0);
  const totalOut = Array.from(results.values()).reduce((s, r) => s + r.outputSizeBytes, 0);
  const avgSav = results.size > 0 ? Math.round(Array.from(results.values()).reduce((s, r) => s + r.savingsPercent, 0) / results.size) : 0;
  const anyProc = processing.size > 0;
  const showDim = activeTool === 'resize' || activeTool === 'batch';
  const activeImage = images.find((image) => image.id === selectedImageId) || images[0];
  const activeResult = activeImage ? results.get(activeImage.id) : undefined;
  const canvasFilter = [
    filter === 'grayscale' ? 'grayscale(1)' : '',
    filter === 'sepia' ? 'sepia(1)' : '',
    filter === 'blur' ? 'blur(3px)' : '',
  ].filter(Boolean).join(' ');
  const selectCategory = (category: ToolCategoryId) => {
    setActiveCategory(category);
    const tool = CATEGORY_DEFAULT_TOOL[category];
    setActiveTool(tool);
    const url = new URL(window.location.href);
    url.searchParams.delete('preset');
    url.searchParams.set('tool', tool);
    window.history.replaceState({}, '', url);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">

      {/* Hero */}
      <section className="relative pt-10 pb-8 border-b border-border overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute -top-24 left-1/3 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse inline-block" />
            Core processing API with browser fallback
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent mb-3">
            Creative tools
          </h1>
          <p className="text-muted text-base max-w-xl mx-auto">
            Convert, compress and resize images, or convert between images and PDF — then download instantly.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="rounded-2xl border border-border bg-surface p-2 dark:bg-zinc-900">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" role="tablist" aria-label="Editing categories">
            {TOOL_CATEGORIES.map((category) => {
              const selected = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => selectCategory(category.id)}
                  className={`min-h-11 rounded-xl border px-3 py-2 text-left text-xs font-bold transition sm:text-sm ${
                    selected ? 'shadow-sm' : 'border-transparent text-muted hover:bg-surface-elevated hover:text-primary'
                  }`}
                  style={selected ? {
                    borderColor: `${category.color}80`,
                    backgroundColor: `${category.color}16`,
                    color: category.color,
                  } : undefined}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tool tabs */}
        <div className="flex gap-2 flex-wrap">
          {TOOLS.map(t => (
            <button key={t.id} onClick={() => {
              setActiveTool(t.id);
              setActiveCategory(
                t.id === 'compress' ? 'optimize'
                  : t.id === 'resize' || t.id === 'batch' ? 'resize'
                    : t.id === 'pdf' || t.id === 'image-pdf' ? 'pdf'
                      : 'convert',
              );
              const url = new URL(window.location.href);
              url.searchParams.delete('preset');
              url.searchParams.set('tool', t.id);
              window.history.replaceState({}, '', url);
            }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${activeTool === t.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/25' : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-indigo-400 hover:text-indigo-700'}`}>
              <span>{t.icon}</span><span>{t.label}</span>
              <span className={`hidden sm:inline text-[10px] px-1.5 py-0.5 rounded font-mono ${activeTool === t.id ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'}`}>{t.desc}</span>
            </button>
          ))}
        </div>

        {activeTool === 'pdf' ? (
          <PdfToImagesPanel />
        ) : activeTool === 'image-pdf' ? (
          <ImageToPdfPanel />
        ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

          {/* LEFT panel */}
          <aside className="xl:col-span-4 space-y-4">

            {/* Format */}
            <div className="bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
              <label htmlFor="image-output-format" className="block text-sm font-bold text-slate-900 dark:text-white">
                🎨 Output format
              </label>
              <select
                id="image-output-format"
                value={outputFormat}
                onChange={(event) => {
                  const nextFormat = event.target.value;
                  if (isOutputFormat(nextFormat)) setOutputFormat(nextFormat);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
              >
                {(Object.keys(FMT) as OutputFormat[]).map((format) => (
                  <option key={format} value={format}>
                    {FMT[format].label} — {FMT[format].desc}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Matches the first uploaded image when supported; other image types default to WebP.</p>
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

            {/* Effects & Edits */}
            <div className="bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">✨ Effects & Edits</h3>
              
              {/* Rotate & Flip */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-2">Transform</label>
                <div className="flex gap-2">
                  <button onClick={() => setRotation(r => (r + 90) % 360)} className="flex-1 py-1.5 rounded-lg text-xs font-semibold border bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 hover:border-indigo-400">↻ Rotate {rotation}°</button>
                  <button onClick={() => setFlipX(x => !x)} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${flipX ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 hover:border-indigo-400'}`}>↔ Flip X</button>
                  <button onClick={() => setFlipY(y => !y)} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${flipY ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 hover:border-indigo-400'}`}>↕ Flip Y</button>
                </div>
              </div>

              {/* Filters */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-2">Filters</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['none', 'grayscale', 'sepia', 'blur'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)} className={`py-1.5 rounded-lg text-[11px] font-semibold border capitalize ${filter === f ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-700 hover:border-indigo-400'}`}>{f}</button>
                  ))}
                </div>
              </div>

              {/* Watermark */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-1">Watermark Text</label>
                <input type="text" value={watermark} onChange={e => setWatermark(e.target.value)} placeholder="e.g. MyBrand ©" className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white" />
              </div>
            </div>

            {/* Advanced */}
            <div className="bg-white dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">🔧 Advanced</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="output-filename-prefix" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-1">
                    Filename Prefix
                  </label>
                  <input
                    id="output-filename-prefix"
                    type="text"
                    value={filenamePrefix}
                    onChange={(event) => setFilenamePrefix(event.target.value)}
                    maxLength={40}
                    placeholder="e.g. final-"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </div>
                <div>
                  <label htmlFor="output-filename-suffix" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-1">
                    Filename Suffix
                  </label>
                  <input
                    id="output-filename-suffix"
                    type="text"
                    value={filenameSuffix}
                    onChange={(event) => setFilenameSuffix(event.target.value)}
                    maxLength={40}
                    placeholder="_optimized"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </div>
              </div>
              {images.length > 0 && (
                <p className="text-[10px] text-slate-500 dark:text-zinc-500">
                  Example: {sanitizeFileName(`${filenamePrefix}${imageNames.get(images[0].id) || getImageBaseName(images[0].file.name)}${filenameSuffix}`, 'image')}.{outputFormat === 'jpeg' ? 'jpg' : outputFormat}
                </p>
              )}
              {images.length > 0 && (
                <div className="border-t border-border/70 pt-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Rename images</span>
                    <button
                      type="button"
                      onClick={() => setImageNames(prev => {
                        const names = new Map(prev);
                        images.forEach(img => names.set(img.id, getImageBaseName(img.file.name)));
                        return names;
                      })}
                      className="text-[10px] font-semibold text-muted hover:text-indigo-600"
                    >
                      Reset names
                    </button>
                  </div>
                  <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                    {images.map((img, index) => (
                      <div key={img.id} className="rounded-xl border border-slate-200 p-2 dark:border-zinc-700">
                        <label htmlFor={`tool-image-name-${img.id}`} className="mb-1 block text-[10px] font-semibold text-muted">
                          Image {index + 1}
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            id={`tool-image-name-${img.id}`}
                            type="text"
                            value={imageNames.get(img.id) || getImageBaseName(img.file.name)}
                            onChange={(event) => setImageNames(prev => new Map(prev).set(img.id, event.target.value))}
                            maxLength={80}
                            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-2 text-xs font-medium outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950"
                          />
                          <span className="text-[10px] font-mono text-muted">.{outputFormat === 'jpeg' ? 'jpg' : outputFormat}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {([
                { label: 'Strip Metadata', sub: 'Remove EXIF / GPS data', val: stripMeta, set: setStripMeta },
                { label: 'Progressive', sub: 'Faster perceived load', val: progressive, set: setProgressive },
              ] as const).map(o => (
                <button key={o.label} onClick={() => o.set((v: boolean) => !v as unknown as any)} className="flex items-center justify-between w-full">
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
              <p className="text-sm text-slate-500 dark:text-zinc-500 mt-1">JPG, PNG, WebP, AVIF, TIFF, GIF · Up to 20 images · 50 MB each · <span className="font-bold text-indigo-500">Ctrl+V to paste</span></p>
              
              <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full max-w-2xl mx-auto" onClick={e => e.stopPropagation()}>
                <button onClick={() => fileRef.current?.click()} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow transition-all hover:scale-105 whitespace-nowrap">
                  Browse Files
                </button>
                
                <div className="flex-1 w-full flex bg-white dark:bg-zinc-800 rounded-xl border border-slate-300 dark:border-zinc-700 overflow-hidden shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                  <input 
                    type="url" 
                    value={imgUrl} 
                    onChange={e => setImgUrl(e.target.value)} 
                    placeholder="Paste image URL here..." 
                    className="w-full px-4 py-2 bg-transparent text-sm focus:outline-none dark:text-white" 
                    onKeyDown={e => e.key === 'Enter' && fetchFromUrl(imgUrl)} 
                  />
                  <button 
                    onClick={() => fetchFromUrl(imgUrl)} 
                    disabled={loadingUrl || !imgUrl} 
                    className="px-4 py-2 bg-slate-100 dark:bg-zinc-700/50 hover:bg-slate-200 dark:hover:bg-zinc-600 text-xs font-bold text-slate-700 dark:text-zinc-300 transition-colors border-l border-slate-300 dark:border-zinc-700 disabled:opacity-50 whitespace-nowrap"
                  >
                    {loadingUrl ? 'Loading...' : 'Add URL'}
                  </button>
                </div>

                {images.length > 0 && (
                  <button onClick={clearAll} className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-sm font-semibold border border-slate-200 dark:border-zinc-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 transition-all whitespace-nowrap">
                    Clear All ({images.length})
                  </button>
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

            {activeCategory === 'ai' && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-violet-300/60 bg-violet-50 p-4 dark:border-violet-500/30 dark:bg-violet-500/10">
                <div>
                  <h2 className="text-sm font-bold text-violet-900 dark:text-violet-200">AI editing tools</h2>
                  <p className="mt-1 text-xs text-violet-800/80 dark:text-violet-300/80">
                    Remove image backgrounds in the dedicated AI studio. Your current canvas stays available here.
                  </p>
                </div>
                <Link href="/remove-background" className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-500">
                  Open background remover
                </Link>
              </div>
            )}

            {activeImage && (
              <section aria-label="Image editing canvas" className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-zinc-800 sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                      {imageNames.get(activeImage.id) || getImageBaseName(activeImage.file.name)}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      {activeImage.width ? `${activeImage.width} × ${activeImage.height} px` : formatBytes(activeImage.file.size)}
                      {activeResult ? ` · Output ${formatBytes(activeResult.outputSizeBytes)}` : ' · Live canvas preview'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeResult && (
                      <button
                        type="button"
                        aria-pressed={showProcessedPreview}
                        onClick={() => setShowProcessedPreview((shown) => !shown)}
                        className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted transition hover:text-primary"
                      >
                        {showProcessedPreview ? 'Show edits' : 'Show result'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setRotation((current) => (current + 90) % 360)}
                      className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted transition hover:text-primary"
                    >
                      Rotate
                    </button>
                  </div>
                </div>

                <div className="relative flex h-[min(58vh,560px)] min-h-[300px] items-center justify-center overflow-hidden bg-[radial-gradient(circle,#d9e2ef_1px,transparent_1px)] bg-slate-50 p-6 [background-size:18px_18px] dark:bg-[radial-gradient(circle,#34343a_1px,transparent_1px)] dark:bg-zinc-950">
                  <img
                    src={showProcessedPreview && activeResult ? activeResult.dataBase64 : activeImage.previewUrl}
                    alt={`Canvas preview of ${activeImage.file.name}`}
                    className="max-h-full max-w-full rounded-lg object-contain shadow-xl transition-transform duration-200"
                    style={{
                      objectFit: fitMode === 'cover' ? 'cover' : fitMode === 'fill' ? 'fill' : 'contain',
                      filter: showProcessedPreview && activeResult ? undefined : canvasFilter,
                      transform: showProcessedPreview && activeResult
                        ? undefined
                        : `rotate(${rotation}deg) scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
                    }}
                  />
                  {!showProcessedPreview && watermark && (
                    <span className="pointer-events-none absolute bottom-8 right-8 rounded bg-black/35 px-3 py-1.5 text-lg font-bold text-white drop-shadow">
                      {watermark}
                    </span>
                  )}
                  {activeResult && !showProcessedPreview && (
                    <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold text-slate-700 shadow dark:bg-zinc-900/90 dark:text-zinc-200">
                      Edited preview · process to refresh result
                    </span>
                  )}
                </div>

                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto border-t border-slate-200 p-3 dark:border-zinc-800">
                    {images.map((image, index) => (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => setSelectedImageId(image.id)}
                        aria-pressed={image.id === activeImage.id}
                        className={`flex w-28 shrink-0 items-center gap-2 rounded-xl border p-2 text-left transition ${
                          image.id === activeImage.id
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                            : 'border-border hover:border-indigo-300'
                        }`}
                      >
                        <img src={image.previewUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        <span className="min-w-0">
                          <span className="block text-[10px] font-bold text-primary dark:text-white">Image {index + 1}</span>
                          <span className="block truncate text-[9px] text-muted">{image.file.name}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
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
              {[{ i: '🔄', t: 'Convert Formats', d: 'WebP, AVIF, JPEG, PNG' }, { i: '⚡', t: 'Smart Compress', d: 'Up to 80% smaller' }, { i: '📐', t: 'Resize & Fit', d: 'Social media presets' }, { i: '📄', t: 'PDF to Images', d: 'Every page as a file' }].map(c => (
                <div key={c.t} className="bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-2">{c.i}</div>
                  <div className="text-[11px] font-bold text-slate-900 dark:text-white">{c.t}</div>
                  <div className="text-[10px] text-slate-500 dark:text-zinc-500 mt-0.5">{c.d}</div>
                </div>
              ))}
            </div>
          </main>
        </div>
        )}

        <section aria-labelledby="more-tools-heading" className="space-y-4 border-t border-border pt-8">
          <div>
            <h2 id="more-tools-heading" className="text-xl font-black tracking-tight text-primary dark:text-white">
              Explore all tools
            </h2>
            <p className="mt-1 text-sm text-muted">Browse image and document tools by category.</p>
          </div>
          <ToolDirectory compact />
        </section>
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
