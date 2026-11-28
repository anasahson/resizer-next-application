// app/page.tsx
"use client";

import { useState, useRef, useEffect, useMemo, useCallback, useSyncExternalStore, type ChangeEvent, type DragEvent } from 'react';
import Link from 'next/link';
import JSZip from 'jszip';
import { uploadQueue, type QueueSnapshot } from './lib/uploadQueue';
import { getImageOutputFormat } from './lib/imageFormats';
import ToolDirectory from './components/ToolDirectory';
import {
  Upload,
  Download,
  Image as ImageIcon,
  Copy,
  Check,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Sliders,
  Eye,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Layers,
  FileArchive,
  Link as LinkIcon,
  Camera,
  Trash2,
  Share2,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  Zap,
  ChevronDown,
  Clock,
  ShieldCheck,
  ArrowRight,
  Plus,
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '')
  || '';

// Canonical public origin — used for structured data so schema.org URLs match
// the real domain (they previously claimed resizer.io, a different site).
const SITE_URL = (process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://resizer-ai.com').replace(/\/+$/, '');

// Fallback dimensions used before any image has been probed (and after a reset).
const INITIAL_ORIGINAL_WIDTH = 1920;
const INITIAL_ORIGINAL_HEIGHT = 1080;

// No-op subscription for the one-shot camera-capability probe below.
const subscribeNoop = () => () => {};

/** Client-only probe for real camera support — never evaluated during SSR. */
function detectCameraSupport(): boolean {
  const input = document.createElement('input');
  const hasCapture = 'capture' in input;
  const hasCameraApi = Boolean(navigator.mediaDevices?.getUserMedia);
  const secure = window.isSecureContext || location.hostname === 'localhost';
  return hasCapture && (hasCameraApi || secure);
}

interface ProcessedResult {
  filename: string;
  originalName: string;
  originalSizeBytes: number;
  outputSizeBytes: number;
  savingsPercent: number;
  width: number;
  height: number;
  format: string;
  processingTimeMs: number;
  dataBase64: string;
}

// Small helper to safely display image file previews
function FileImage({ file, className }: { file: File; className?: string }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    // Object URLs only exist in the browser, so the state has to be set here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return <img src={url || undefined} className={className} alt={file.name} />;
}

function FileThumb({
  file,
  isSelected,
  onSelect,
  onRemove,
  result,
  isProcessing,
  onDownload,
  onCopy,
}: {
  file: File;
  isSelected?: boolean;
  onSelect?: () => void;
  onRemove: () => void;
  result?: ProcessedResult;
  isProcessing: boolean;
  onDownload?: () => void;
  onCopy?: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`relative group rounded-2xl p-1.5 transition-all cursor-pointer border ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/50 dark:bg-blue-500/10'
          : 'border-border hover:border-blue-400 bg-surface dark:bg-zinc-900'
      }`}
    >
      <div className="relative">
        <FileImage file={file} className="w-full h-24 object-cover rounded-xl border border-border/60" />

        {/* Processing / result status overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
            <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
        {result && (
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-extrabold shadow">
            -{Math.max(0, result.savingsPercent)}%
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          disabled={isProcessing}
          className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/70 hover:bg-rose-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30 flex items-center justify-center"
          aria-label="Remove file"
        >
          ×
        </button>
      </div>

      <div className="mt-1.5 flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <p className="text-xs truncate font-medium text-primary dark:text-zinc-200">{file.name}</p>
          <div className="flex items-center gap-1 text-[11px] text-muted font-mono truncate mt-0.5">
            <span>{formatFileSize(file.size)}</span>
            {result && (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                → {formatFileSize(result.outputSizeBytes)}
              </span>
            )}
          </div>
        </div>

        {result && (
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {onCopy && (
              <button
                onClick={onCopy}
                className="p-1 rounded-lg border border-border hover:border-blue-400 text-muted hover:text-blue-500 transition-colors"
                title="Copy to clipboard"
              >
                <Copy className="w-3 h-3" />
              </button>
            )}
            {onDownload && (
              <button
                onClick={onDownload}
                className="p-1 rounded-lg border border-border text-muted hover:text-primary hover:border-primary transition-colors"
                title="Download optimized file"
              >
                <Download className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function getFileNameParts(filename: string): { base: string; extension: string } {
  const match = filename.match(/^(.*?)(\.[^.]+)?$/);
  return { base: match?.[1] || '', extension: match?.[2] || '' };
}

function sanitizeFileName(value: string, fallback: string): string {
  const safe = value
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '-')
    .replace(/^[. ]+|[. ]+$/g, '')
    .trim();
  return safe || fallback;
}

function slugifyFilenamePart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function getProcessingFilenamePrefix(
  currentPreset: string | null,
  presets: Record<string, PresetItem>,
  savedPresets: SavedEditorPreset[]
): string {
  const presetName = currentPreset?.startsWith('saved-')
    ? savedPresets.find((preset) => `saved-${preset.id}` === currentPreset)?.name
    : currentPreset
      ? presets[currentPreset]?.name
      : undefined;
  const parts = ['resizer-ai'];
  if (presetName) parts.push(slugifyFilenamePart(presetName));
  return `${parts.filter(Boolean).join('-')}-`;
}

interface PresetItem {
  w: number;
  h: number;
  name: string;
  category: 'social' | 'ecommerce' | 'devices' | 'print';
  badge?: string;
}

type EditorFitMode = 'fit' | 'fill' | 'stretch' | 'contain';

interface SavedEditorPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  format: string;
  quality: number;
  fitMode: EditorFitMode;
}

const SAVED_PRESETS_STORAGE_KEY = 'resizer-saved-editor-presets';
const MAX_SAVED_PRESETS = 20;

function isSavedEditorPreset(value: unknown): value is SavedEditorPreset {
  if (!value || typeof value !== 'object') return false;
  const preset = value as Record<string, unknown>;
  return typeof preset.id === 'string'
    && typeof preset.name === 'string'
    && preset.name.trim().length > 0
    && preset.name.length <= 40
    && Number.isInteger(preset.width)
    && Number(preset.width) > 0
    && Number(preset.width) <= 20000
    && Number.isInteger(preset.height)
    && Number(preset.height) > 0
    && Number(preset.height) <= 20000
    && ['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(String(preset.format))
    && Number.isInteger(preset.quality)
    && Number(preset.quality) >= 10
    && Number(preset.quality) <= 100
    && ['fit', 'fill', 'stretch', 'contain'].includes(String(preset.fitMode));
}

export default function Resizer() {
  // ===== STATE =====
  const [files, setFiles] = useState<File[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [currentPreset, setCurrentPreset] = useState<string | null>(null);
  const [presetCategory, setPresetCategory] = useState<'social' | 'ecommerce' | 'devices' | 'print'>('social');
  const [savedPresets, setSavedPresets] = useState<SavedEditorPreset[]>([]);
  const [savedPresetsReady, setSavedPresetsReady] = useState(false);
  const [showSavePresetForm, setShowSavePresetForm] = useState(false);
  const [savedPresetName, setSavedPresetName] = useState('');
  const [maintainRatio, setMaintainRatio] = useState(true);
  const [fitMode, setFitMode] = useState<EditorFitMode>('fit');
  const [aiCrop, setAiCrop] = useState(false);
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(1080);
  const [scale, setScale] = useState(100);
  const [sizeMode, setSizeMode] = useState<'pixels' | 'percentage'>('pixels');
  const [darkMode, setDarkMode] = useState(false);
  const [format, setFormat] = useState('webp');
  const [quality, setQuality] = useState(82);
  const [dragActive, setDragActive] = useState(false);
  const [downloadState, setDownloadState] = useState<'idle' | 'processing' | 'done'>('idle');
  const [originalDims, setOriginalDims] = useState<{ w: number; h: number } | null>(null);
  const [pendingPreset, setPendingPreset] = useState<string | null>(null);
  const [results, setResults] = useState<ProcessedResult[]>([]);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [targetMaxKb, setTargetMaxKb] = useState<number | null>(null);
  const [filenameSuffix, setFilenameSuffix] = useState<string>('_optimized');
  const [filenamePrefix, setFilenamePrefix] = useState<string>('');
  const [imageNames, setImageNames] = useState<Map<File, string>>(new Map());
  const [dimCategory, setDimCategory] = useState<'all' | 'social' | 'web' | 'ecommerce' | 'print'>('all');
  const [dimSearch, setDimSearch] = useState<string>('');
  // Camera capture is only offered when the device can actually take a photo.
  // Desktop browsers expose the `capture` attribute but just open a file
  // dialog, so the button is hidden when there is no camera API available.
  // useSyncExternalStore keeps this SSR-safe: the server snapshot is false and
  // the capability is re-read client-side without a cascading setState.
  const cameraSupported = useSyncExternalStore(subscribeNoop, detectCameraSupport, () => false);

const [hostQueue, setHostQueue] = useState<QueueSnapshot>({
    jobs: [], total: 0, queued: 0, uploading: 0, done: 0, failed: 0, busy: false,
  });

  // ===== TRANSFORMATIONS (ROTATE, FLIP, ADJUSTMENTS) =====
  const [rotate, setRotate] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [blurVal, setBlurVal] = useState<number>(0);
  const [filterPreset, setFilterPreset] = useState<'none' | 'grayscale' | 'sepia' | 'invert' | 'vivid'>('none');
  const [sharpen, setSharpen] = useState<boolean>(false);
  const [padColor, setPadColor] = useState<string>('#ffffff');
  const [usePadColor, setUsePadColor] = useState<boolean>(false);
  const [allowUpscale, setAllowUpscale] = useState<boolean>(false);

  // ===== PREVIEW & COMPARE CONTROLS =====
  const [compareMode, setCompareMode] = useState<'split' | 'side' | 'result'>('split');
  const [splitPos, setSplitPos] = useState<number>(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // ===== MODALS & TOASTS =====
  const [showUrlModal, setShowUrlModal] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>('');
  const [urlLoading, setUrlLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'filters' | 'export'>('presets');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [rightPanelMode, setRightPanelMode] = useState<'settings' | 'results'>('settings');

  const originalWidthRef = useRef(INITIAL_ORIGINAL_WIDTH);
  const originalHeightRef = useRef(INITIAL_ORIGINAL_HEIGHT);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const afterPreviewRef = useRef<HTMLDivElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const userSetSizeRef = useRef(false);

  // ===== PRESETS =====
  const presets = useMemo<Record<string, PresetItem>>(() => ({
    // Social Media
    'instagram-post': { w: 1080, h: 1080, name: 'Instagram Square', category: 'social', badge: '1:1' },
    'instagram-story': { w: 1080, h: 1920, name: 'Instagram Story / Reel', category: 'social', badge: '9:16' },
    'instagram-portrait': { w: 1080, h: 1350, name: 'Instagram Portrait', category: 'social', badge: '4:5' },
    youtube: { w: 1280, h: 720, name: 'YouTube Thumbnail', category: 'social', badge: '16:9' },
    'youtube-banner': { w: 2560, h: 1440, name: 'YouTube Channel Banner', category: 'social', badge: '16:9' },
    tiktok: { w: 1080, h: 1920, name: 'TikTok Video / Story', category: 'social', badge: '9:16' },
    facebook: { w: 1200, h: 630, name: 'Facebook Post / Landscape', category: 'social', badge: '1.9:1' },
    'facebook-cover': { w: 820, h: 312, name: 'Facebook Cover Photo', category: 'social', badge: 'Cover' },
    twitter: { w: 1200, h: 675, name: 'X / Twitter Post', category: 'social', badge: '16:9' },
    'twitter-header': { w: 1500, h: 500, name: 'X / Twitter Header Banner', category: 'social', badge: '3:1' },
    linkedin: { w: 1200, h: 627, name: 'LinkedIn Post / Share', category: 'social', badge: '1.9:1' },
    'linkedin-banner': { w: 1584, h: 396, name: 'LinkedIn Company Banner', category: 'social', badge: '4:1' },
    pinterest: { w: 1000, h: 1500, name: 'Pinterest Standard Pin', category: 'social', badge: '2:3' },

    // E-Commerce & Web
    amazon: { w: 2000, h: 2000, name: 'Amazon Product (Hi-Res)', category: 'ecommerce', badge: '1:1' },
    shopify: { w: 2048, h: 2048, name: 'Shopify Product Square', category: 'ecommerce', badge: '1:1' },
    etsy: { w: 2000, h: 1500, name: 'Etsy Item Listing', category: 'ecommerce', badge: '4:3' },
    ebay: { w: 1600, h: 1600, name: 'eBay Gallery Photo', category: 'ecommerce', badge: '1:1' },
    banner: { w: 1920, h: 600, name: 'Hero Web Banner', category: 'ecommerce', badge: '3.2:1' },
    'blog-featured': { w: 1200, h: 630, name: 'Blog Featured Image', category: 'ecommerce', badge: '16:9' },

    // Screens & Devices
    'screen-4k': { w: 3840, h: 2160, name: '4K Ultra HD Display', category: 'devices', badge: '4K' },
    'screen-fhd': { w: 1920, h: 1080, name: 'Full HD 1080p Standard', category: 'devices', badge: '1080p' },
    'screen-2k': { w: 2560, h: 1440, name: '2K QHD Display', category: 'devices', badge: '1440p' },
    'screen-hd': { w: 1280, h: 720, name: '720p HD Standard', category: 'devices', badge: '720p' },
    avatar: { w: 512, h: 512, name: 'Avatar / Profile / App Icon', category: 'devices', badge: 'Icon' },
    favicon: { w: 32, h: 32, name: 'Favicon 32×32 Icon', category: 'devices', badge: 'Favicon' },

    // Passport & Print
    'passport-us': { w: 600, h: 600, name: 'US Passport Photo (2×2")', category: 'print', badge: 'Passport' },
    'passport-schengen': { w: 413, h: 531, name: 'Schengen / EU / UK Passport', category: 'print', badge: 'Passport' },
    'print-a4': { w: 2480, h: 3508, name: 'A4 Document (300 DPI)', category: 'print', badge: 'A4' },
    'print-4x6': { w: 1200, h: 1800, name: 'Photo Print 4×6" (300 DPI)', category: 'print', badge: '4×6' },
    'print-5x7': { w: 1500, h: 2100, name: 'Photo Print 5×7" (300 DPI)', category: 'print', badge: '5×7' },
  }), []);

  // ===== TOAST HELPER =====
  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_PRESETS_STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          /* eslint-disable react-hooks/set-state-in-effect */
          setSavedPresets(parsed.filter(isSavedEditorPreset).slice(0, MAX_SAVED_PRESETS));
          /* eslint-enable react-hooks/set-state-in-effect */
        }
      }
    } catch (error) {
      console.error('Could not load saved image presets.', error);
      showToast('Saved presets could not be loaded from this browser.', 'error');
    } finally {
      setSavedPresetsReady(true);
    }
  }, [showToast]);

  const persistSavedPresets = (nextPresets: SavedEditorPreset[]) => {
    try {
      localStorage.setItem(SAVED_PRESETS_STORAGE_KEY, JSON.stringify(nextPresets));
      return true;
    } catch (error) {
      console.error('Could not persist saved image presets.', error);
      showToast('Could not save your preset in this browser.', 'error');
      return false;
    }
  };

  // ===== FILE HANDLING =====
  const processFiles = (newFiles: File[]) => {
    const imageFiles = newFiles.filter((f) => f.type.startsWith('image/')).slice(0, 50);
    if (imageFiles.length === 0) return;

    const suggestedFormat = getImageOutputFormat(imageFiles[0]);
    setFormat(suggestedFormat === 'jpeg' ? 'jpg' : suggestedFormat);
    setFiles((prev) => [...prev, ...imageFiles]);
    setPendingPreset(null);

    const activeFile = imageFiles[0];
    if (activeFile) {
      const img = new Image();
      img.onload = () => {
        originalWidthRef.current = img.naturalWidth;
        originalHeightRef.current = img.naturalHeight;
        setOriginalDims({ w: img.naturalWidth, h: img.naturalHeight });
        if (!userSetSizeRef.current && files.length === 0) {
          setWidth(Math.max(1, img.naturalWidth));
          setHeight(Math.max(1, img.naturalHeight));
          setScale(100);
          setCurrentPreset(null);
        }
      };
      img.src = URL.createObjectURL(activeFile);
    }
  };

  const handleFiles = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const clearAll = () => {
    // Clear processed results and reset state WITHOUT closing the canvas
    setResults([]);
    setDownloadState('idle');
    setProcessingError(null);
    setRightPanelMode('settings');
    showToast('Results cleared');
  };

  // Keep originalDims in sync with the currently selected file
  useEffect(() => {
    const currentFile = files[selectedIndex];
    if (!currentFile) return;
    const img = new Image();
    const url = URL.createObjectURL(currentFile);
    img.onload = () => {
      const w = Math.max(1, img.naturalWidth);
      const h = Math.max(1, img.naturalHeight);
      originalWidthRef.current = w;
      originalHeightRef.current = h;
      setOriginalDims({ w, h });
      // Keep the target at the source size unless the user already picked a
      // preset or typed custom dimensions — otherwise tiny rasters and SVGs
      // inherit the leftover 1080×1080 / 1280×720 defaults and get upscaled.
      if (!userSetSizeRef.current) {
        setWidth(w);
        setHeight(h);
        setScale(100);
        setCurrentPreset(null);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [files, selectedIndex]);

  // ===== CLIPBOARD PASTE SUPPORT (Ctrl + V) =====
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        const pastedFiles = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith('image/'));
        if (pastedFiles.length > 0) {
          processFiles(pastedFiles);
          showToast(`Pasted ${pastedFiles.length} image(s) from clipboard!`);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [showToast]);

  // Rotation & Flip Handlers
  const handleRotateCw = () => setRotate((prev) => (prev + 90) % 360);
  const handleRotateCcw = () => setRotate((prev) => (prev - 90 + 360) % 360);
  const handleFlipH = () => setFlipH((prev) => !prev);
  const handleFlipV = () => setFlipV((prev) => !prev);

  // Target size optimizer
  const handleTargetSize = (maxKb: number) => {
    setTargetMaxKb(maxKb);
    if (maxKb <= 100) {
      setFormat('webp');
      setQuality(60);
    } else if (maxKb <= 250) {
      setFormat('webp');
      setQuality(75);
    } else if (maxKb <= 500) {
      setFormat('webp');
      setQuality(85);
    } else {
      setQuality(90);
    }
    showToast(`Target size: < ${maxKb} KB. Optimal settings applied.`);
  };

  // Import Image from URL
  // Fetched through the backend proxy: a direct browser fetch fails with
  // "Failed to fetch" for most hosts because they send no CORS headers.
  const handleImportUrl = async () => {
    const target = urlInput.trim();
    if (!target) return;
    setUrlLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/images/fetch-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Import failed (HTTP ${res.status}).`);
      }

      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) throw new Error('URL does not point to a valid image.');
      const ext = (blob.type.split('/')[1] || 'jpg').replace('+xml', '');
      const file = new File([blob], `imported_${Date.now()}.${ext}`, { type: blob.type });
      processFiles([file]);
      // Save the imported image straight away — it should not have to wait for
      // the Process button to be hosted.
      uploadQueue.enqueue({ id: `url-import-${Date.now()}`, filename: file.name, blob, source: 'url-import' });
      setShowUrlModal(false);
      setUrlInput('');
      showToast('Image imported — hosting it now…');
    } catch (err) {
      showToast(err instanceof Error && err.message ? err.message : 'Could not import that URL.', 'error');
    } finally {
      setUrlLoading(false);
    }
  };

  // Split-Screen Dragging
  const handleSplitMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingSplit || !splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSplitPos(Math.round((x / rect.width) * 100));
  };

  const handleSplitTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!splitContainerRef.current) return;
    const touch = e.touches[0];
    const rect = splitContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    setSplitPos(Math.round((x / rect.width) * 100));
  };

  // Live CSS Filter style for preview
  const livePreviewFilterStyle = useMemo(() => {
    const filters: string[] = [];
    if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
    if (contrast !== 100) filters.push(`contrast(${contrast}%)`);
    if (saturation !== 100) filters.push(`saturate(${saturation}%)`);
    if (blurVal > 0) filters.push(`blur(${blurVal}px)`);

    if (filterPreset === 'grayscale') filters.push('grayscale(100%)');
    if (filterPreset === 'sepia') filters.push('sepia(100%)');
    if (filterPreset === 'invert') filters.push('invert(100%)');
    if (filterPreset === 'vivid') filters.push('saturate(160%) contrast(110%)');

    const transforms: string[] = [];
    if (rotate !== 0) transforms.push(`rotate(${rotate}deg)`);
    if (flipH) transforms.push('scaleX(-1)');
    if (flipV) transforms.push('scaleY(-1)');

    return {
      filter: filters.join(' ') || 'none',
      transform: transforms.join(' ') || 'none',
      transition: 'all 0.15s ease',
    };
  }, [brightness, contrast, saturation, blurVal, filterPreset, rotate, flipH, flipV]);

  // ===== PRESET + DIMENSION HANDLERS =====
  const selectPreset = (presetKey: string) => {
    setCurrentPreset(presetKey);
    setPendingPreset(presetKey);
    setSizeMode('pixels');
    const p = presets[presetKey];
    if (p) {
      userSetSizeRef.current = true;
      setWidth(p.w);
      setHeight(p.h);
      setScale(Math.round((p.w / (originalDims?.w || originalWidthRef.current)) * 100));
      showToast(`Applied preset: ${p.name} (${p.w} × ${p.h})`);
    }
  };

  const applySavedPreset = (preset: SavedEditorPreset) => {
    userSetSizeRef.current = true;
    setSizeMode('pixels');
    setCurrentPreset(`saved-${preset.id}`);
    setPendingPreset(null);
    setWidth(preset.width);
    setHeight(preset.height);
    setScale(Math.round((preset.width / (originalDims?.w || originalWidthRef.current)) * 100));
    setMaintainRatio(false);
    setFormat(preset.format);
    setQuality(preset.quality);
    setFitMode(preset.fitMode);
    showToast(`Applied ${preset.name} (${preset.width} × ${preset.height})`);
  };

  const saveCurrentPreset = () => {
    if (!savedPresetsReady) {
      showToast('Saved presets are still loading. Try again in a moment.', 'error');
      return;
    }
    const name = savedPresetName.trim();
    if (!name) {
      showToast('Enter a name for this preset.', 'error');
      return;
    }
    if (savedPresets.length >= MAX_SAVED_PRESETS) {
      showToast(`You can save up to ${MAX_SAVED_PRESETS} presets.`, 'error');
      return;
    }
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 20000 || height > 20000) {
      showToast('Preset dimensions must be whole numbers from 1 to 20,000 pixels.', 'error');
      return;
    }

    const preset: SavedEditorPreset = {
      id: globalThis.crypto.randomUUID(),
      name: name.slice(0, 40),
      width,
      height,
      format,
      quality,
      fitMode,
    };
    const nextPresets = [...savedPresets, preset];
    if (!persistSavedPresets(nextPresets)) return;
    setSavedPresets(nextPresets);
    setCurrentPreset(`saved-${preset.id}`);
    setSavedPresetName('');
    setShowSavePresetForm(false);
    showToast(`Saved ${preset.name}`);
  };

  const deleteSavedPreset = (presetId: string) => {
    const nextPresets = savedPresets.filter((preset) => preset.id !== presetId);
    if (!persistSavedPresets(nextPresets)) return;
    setSavedPresets(nextPresets);
    if (currentPreset === `saved-${presetId}`) setCurrentPreset(null);
  };

  const toggleRatio = () => {
    setMaintainRatio((prev) => !prev);
  };

  // Keep height in sync when ratio is enabled. The width/height handlers keep
  // the pair consistent during edits; this effect covers toggling the lock and
  // the original dimensions arriving after an image probe.
  useEffect(() => {
    if (maintainRatio && originalDims && originalDims.h > 0) {
      const ratio = originalDims.w / originalDims.h;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHeight(Math.max(1, Math.round(width / ratio)));
    }
  }, [maintainRatio, originalDims, width]);

  const handleWidthChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value || '0', 10);
    if (isNaN(val)) return;

    const w = Math.max(1, val);
    userSetSizeRef.current = true;
    setWidth(w);

    const origW = originalDims?.w || originalWidthRef.current;
    const origH = originalDims?.h || originalHeightRef.current;

    if (maintainRatio && origH) {
      const ratio = origW / origH;
      setHeight(Math.max(1, Math.round(w / ratio)));
    }

    setScale(Math.min(200, Math.max(1, Math.round((w / origW) * 100))));
    setCurrentPreset(null);
  };

  const handleHeightChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value || '0', 10);
    if (isNaN(val)) return;

    const h = Math.max(1, val);
    userSetSizeRef.current = true;
    setHeight(h);

    const origW = originalDims?.w || originalWidthRef.current;
    const origH = originalDims?.h || originalHeightRef.current;

    let newWidth = width;
    if (maintainRatio && origW) {
      const ratio = origW / origH;
      newWidth = Math.max(1, Math.round(h * ratio));
      setWidth(newWidth);
    }

    setScale(Math.min(200, Math.max(1, Math.round((newWidth / origW) * 100))));
    setCurrentPreset(null);
  };

  const handleScaleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value || '100', 10);
    updateScale(val);
  };

  const updateScale = (val: number) => {
    const clampedScale = Math.min(200, Math.max(10, val));
    userSetSizeRef.current = true;
    setScale(clampedScale);
    const origW = originalDims?.w || originalWidthRef.current;
    const origH = originalDims?.h || originalHeightRef.current;
    setWidth(Math.max(1, Math.round((origW * clampedScale) / 100)));
    setHeight(Math.max(1, Math.round((origH * clampedScale) / 100)));
    setCurrentPreset(null);
  };

  const resetAllSettings = () => {
    userSetSizeRef.current = false;
    setAllowUpscale(false);
    const nativeW = originalDims?.w || originalWidthRef.current;
    const nativeH = originalDims?.h || originalHeightRef.current;
    setWidth(nativeW);
    setHeight(nativeH);
    setScale(100);
    setSizeMode('pixels');
    setCurrentPreset(null);
    setMaintainRatio(true);
    setFitMode('fit');
    setFormat('webp');
    setQuality(82);
    setAiCrop(false);
    setRotate(0);
    setFlipH(false);
    setFlipV(false);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlurVal(0);
    setFilterPreset('none');
    setSharpen(false);
    setUsePadColor(false);
    setTargetMaxKb(null);
    showToast('Settings reset to defaults');
  };

  const removeFile = (index: number) => {
    const nextFiles = files.filter((_, i) => i !== index);
    const remaining = new Set(nextFiles);
    setImageNames((current) => new Map(Array.from(current).filter(([file]) => remaining.has(file))));
    setFiles(nextFiles);
    if (selectedIndex >= nextFiles.length) {
      setSelectedIndex(Math.max(0, nextFiles.length - 1));
    }
    setResults([]);
    setDownloadState('idle');
    if (nextFiles.length === 0) {
      backToUpload();
    }
  };

  const getImageBaseName = (file: File) => {
    const originalBase = getFileNameParts(file.name).base;
    return imageNames.has(file) ? imageNames.get(file) || '' : originalBase;
  };

  const getImageDisplayName = (file: File) => `${getImageBaseName(file)}${getFileNameParts(file.name).extension}`;

  const renameImage = (file: File, name: string) => {
    setImageNames((current) => {
      const next = new Map(current);
      next.set(file, name);
      return next;
    });
  };

  const getOutputFilename = (
    result: ProcessedResult,
    index: number,
    usedNames = new Set<string>()
  ) => {
    const file = files[index];
    const baseName = file ? getImageBaseName(file) : getFileNameParts(result.originalName).base;
    const outputBase = sanitizeFileName(
      `${getProcessingFilenamePrefix(currentPreset, presets, savedPresets)}${filenamePrefix}${baseName}${filenameSuffix}`,
      `resizer-ai-image-${index + 1}`
    );
    const extension = sanitizeFileName(result.format || format, 'webp').replace(/^\.+/, '');
    let filename = `${outputBase}.${extension}`;
    let duplicate = 2;
    while (usedNames.has(filename.toLowerCase())) {
      filename = `${outputBase}-${duplicate}.${extension}`;
      duplicate += 1;
    }
    usedNames.add(filename.toLowerCase());
    return filename;
  };

  // ===== PROCESSING (Real Sharp engine via backend batch API) =====
  const processImages = useCallback(async () => {
    if (downloadState !== 'idle' || files.length === 0) return;
    if (!originalDims) {
      showToast('Reading image dimensions. Please try again in a moment.', 'info');
      return;
    }
    if (
      (width > originalDims.w || height > originalDims.h) &&
      !allowUpscale
    ) {
      showToast(
        `This would upscale ${originalDims.w}×${originalDims.h} to ${width}×${height}. Enable “Allow upscaling” to continue.`,
        'error'
      );
      return;
    }
    setDownloadState('processing');
    setProcessingError(null);
    setResults([]);

    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    formData.append('width', String(width));
    formData.append('height', String(height));
    formData.append('format', format === 'jpg' ? 'jpeg' : format);
    formData.append('quality', String(quality));
    formData.append('fit', fitMode);
    formData.append('maintainRatio', String(maintainRatio));
    if (aiCrop) formData.append('aiCrop', 'true');
    if (rotate !== 0) formData.append('rotate', String(rotate));
    if (flipH) formData.append('flop', 'true');
    if (flipV) formData.append('flip', 'true');
    if (filterPreset === 'grayscale') formData.append('grayscale', 'true');
    if (blurVal > 0) formData.append('blur', String(Math.max(0.3, blurVal)));
    if (sharpen) formData.append('sharpen', 'true');
    if (usePadColor && padColor) formData.append('background', padColor);
    if (allowUpscale) formData.append('allowUpscale', 'true');
     // Send adjustment filters
     if (saturation !== 100) formData.append('saturation', String(saturation));
     if (brightness !== 100) formData.append('brightness', String(brightness));
     if (contrast !== 100) formData.append('contrast', String(contrast));

    try {
      const res = await fetch(`${BACKEND_URL}/api/images/batch?responseType=json`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Image processing failed.');
      }

      const successful = (data.results || []).filter(
        (r: ProcessedResult | { error?: string }) => r && !('error' in r)
      ) as ProcessedResult[];

      if (successful.length === 0) {
        throw new Error('No images could be processed. Please check the files and try again.');
      }

      setResults(successful);
      setDownloadState('done');
      setRightPanelMode('results');
      showToast(`Optimization complete! ${successful.length} image(s) processed.`);

      // Host every processed image automatically — the queue keeps only a
      // couple of uploads in flight so bursts of traffic don't overwhelm the
      // image API, and retries transient failures with backoff.
      successful.forEach((r, i) => {
        const sourceFile = files[i];
        const base = sourceFile
          ? (imageNames.has(sourceFile) ? imageNames.get(sourceFile) || '' : getFileNameParts(sourceFile.name).base)
          : getFileNameParts(r.originalName).base;
        const safeBase = sanitizeFileName(
          `${getProcessingFilenamePrefix(currentPreset, presets, savedPresets)}${filenamePrefix}${base}${filenameSuffix}`,
          `resizer-ai-image-${i + 1}`
        );
        uploadQueue.enqueue({
          id: `${Date.now()}-${selectedIndex}-${i}-${base}`,
          filename: `${safeBase}.${r.format || format}`,
          dataUrl: r.dataBase64,
          source: 'system-file',
        });
      });

      // Auto-scroll to preview after processing
      requestAnimationFrame(() => {
        afterPreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : '';
      setProcessingError(message || 'Failed to process images. Is the backend running on port 5000?');
      setDownloadState('idle');
      showToast(message || 'Processing error', 'error');
    }
  }, [downloadState, files, width, height, format, quality, fitMode, maintainRatio, aiCrop, rotate, flipH, flipV, filterPreset, blurVal, sharpen, usePadColor, padColor, showToast, selectedIndex, filenamePrefix, filenameSuffix, imageNames, originalDims, allowUpscale, saturation, brightness, contrast, currentPreset, presets, savedPresets]);

  // Live view of the auto-upload queue.
  useEffect(() => uploadQueue.subscribe(setHostQueue), []);

  const downloadSingle = (result: ProcessedResult, fileIndex?: number) => {
    const resultIndex = fileIndex ?? results.indexOf(result);
    const cleanFilename = getOutputFilename(result, Math.max(0, resultIndex));
    const a = document.createElement('a');
    a.href = result.dataBase64;
    a.download = cleanFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Downloaded ${cleanFilename}`);
  };

  // Remove a single image from the queue AND its result after download/discard
  const removeImageAndResult = (index: number) => {
    const nextFiles = files.filter((_, i) => i !== index);
    const nextResults = results.filter((_, i) => i !== index);
    const remaining = new Set(nextFiles);
    setImageNames((current) => new Map(Array.from(current).filter(([file]) => remaining.has(file))));
    setFiles(nextFiles);
    setResults(nextResults);
    if (selectedIndex >= nextFiles.length) {
      setSelectedIndex(Math.max(0, nextFiles.length - 1));
    }
    if (nextFiles.length === 0) {
      setDownloadState('idle');
      backToUpload();
    }
    showToast('Image removed from queue');
  };

  const downloadAndRemove = (result: ProcessedResult, index: number) => {
    downloadSingle(result, index);
    removeImageAndResult(index);
  };

  const downloadAllResults = () => {
    results.forEach(downloadSingle);
  };

  // Download All as ZIP using JSZip
  const downloadAllAsZip = async () => {
    if (results.length === 0) return;
    try {
      showToast('Building ZIP archive...', 'info');
      const zip = new JSZip();

      const usedNames = new Set<string>();
      results.forEach((res, idx) => {
        const filename = getOutputFilename(res, idx, usedNames);
        const base64Data = res.dataBase64.split(',')[1];
        if (base64Data) {
          zip.file(filename, base64Data, { base64: true });
        }
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `optimized_images_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      showToast('ZIP archive downloaded successfully!');
    } catch (err) {
      showToast(`Failed to create ZIP: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  // Copy Image to Clipboard
  const copyImageToClipboard = async (dataBase64: string) => {
    try {
      if (!dataBase64) {
        showToast('No image data to copy', 'error');
        return;
      }
      const res = await fetch(dataBase64);
      const blob = await res.blob();
      let pngBlob: Blob = blob;
      if (blob.type !== 'image/png') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = dataBase64;
        await new Promise((resolve, reject) => {
          img.onload = () => resolve(null);
          img.onerror = () => reject(new Error('Failed to load image for canvas'));
        });
        const w = Math.max(1, img.naturalWidth || img.width || 100);
        const h = Math.max(1, img.naturalHeight || img.height || 100);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2D canvas context');
        ctx.drawImage(img, 0, 0, w, h);
        const generatedBlob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/png');
        });
        if (!generatedBlob) throw new Error('Canvas conversion to PNG blob returned null');
        pngBlob = generatedBlob;
      }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
      showToast('Copied optimized image to clipboard!');
    } catch (err) {
      console.warn('Clipboard copy error:', err);
      showToast('Could not copy image directly. (Browser permission)', 'error');
    }
  };

  // Copy Base64 Data URL
  const copyDataUrl = (dataBase64: string) => {
    navigator.clipboard.writeText(dataBase64);
    showToast('Base64 Data URL copied to clipboard!');
  };

  // Web Share API with viral share card creation
  const handleWebShare = async (result: ProcessedResult) => {
    try {
      let shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://resizer.io';
      try {
        const token = localStorage.getItem('resizer_user_auth_token');
        const shareRes = await fetch(`${BACKEND_URL}/api/share/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            imageData: {
              originalSize: result.originalSizeBytes,
              outputSize: result.outputSizeBytes,
              savingsPercent: result.savingsPercent,
              format: result.format,
              width: result.width,
              height: result.height,
              processingTime: result.processingTimeMs || 120,
            },
          }),
        });
        const shareData = await shareRes.json();
        if (shareData.success && shareData.shareId) {
          shareUrl = `${window.location.origin}/share/${shareData.shareId}`;
        }
      } catch (err) {
        console.warn('Could not register share card:', err);
      }

      const shareText = `Reduced this image by -${Math.max(0, result.savingsPercent)}% (${formatFileSize(result.outputSizeBytes)}) with Resizer! Check it out:`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Image Optimized with Resizer',
            text: shareText,
            url: shareUrl,
          });
          showToast('Shared successfully!');
          return;
        } catch {
          // User closed share dialog
          return;
        }
      }

      // Desktop / fallback: copy share URL to clipboard
      await navigator.clipboard.writeText(shareUrl);
      showToast('✨ Share link copied to clipboard!');
    } catch {
      showToast('Could not share image.', 'error');
    }
  };

  const backToUpload = () => {
    setFiles([]);
    setImageNames(new Map());
    setSelectedIndex(0);
    setOriginalDims(null);
    originalWidthRef.current = INITIAL_ORIGINAL_WIDTH;
    originalHeightRef.current = INITIAL_ORIGINAL_HEIGHT;
    setCurrentPreset(null);
    setPendingPreset(null);
    setResults([]);
    setProcessingError(null);
    userSetSizeRef.current = false;
    setAllowUpscale(false);
    setWidth(1080);
    setHeight(1080);
    setScale(100);
    setSizeMode('pixels');
    setFormat('webp');
    setQuality(82);
    setFitMode('fit');
    setAiCrop(false);
    setDownloadState('idle');
    setRotate(0);
    setFlipH(false);
    setFlipV(false);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlurVal(0);
    setFilterPreset('none');
    setSharpen(false);
    setUsePadColor(false);
    setTargetMaxKb(null);
  };

  // ===== DERIVED VALUES =====
  const formatSize = (kb: number) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);

  const previewDisplay = useMemo(() => {
    const maxDim = Math.max(width, height);
    const displayW = Math.max(48, Math.round((180 * width) / maxDim));
    const displayH = Math.max(48, Math.round((180 * height) / maxDim));
    return { displayW, displayH };
  }, [width, height]);

  const isUpscaling = Boolean(
    originalDims && (width > originalDims.w || height > originalDims.h)
  );

  const estimated = useMemo(() => {
    // Refs mirror these dimensions but may only be read from event handlers,
    // so render uses the same fallback constants the refs are initialised with.
    const origW = originalDims?.w || INITIAL_ORIGINAL_WIDTH;
    const origH = originalDims?.h || INITIAL_ORIGINAL_HEIGHT;
    const origPx = origW * origH;
    const newPx = width * height;
    const pixelRatio = newPx / origPx;

    const formatMult = format === 'avif' ? 0.45 : format === 'webp' ? 0.65 : format === 'jpg' ? 0.8 : 1.0;
    const qualityMult = quality / 100;
    const origSize = 2400;

    const est = Math.round(origSize * pixelRatio * formatMult * qualityMult);
    const saved = Math.round((1 - est / origSize) * 100);

    return {
      est,
      saved,
      formatted: formatSize(est),
    };
  }, [originalDims, width, height, format, quality]);

  const sizePercent = estimated.saved > 0 ? `-${estimated.saved}%` : `+${Math.abs(estimated.saved)}%`;
  const estimateText = `~${estimated.formatted} (${sizePercent})`;

  // ===== RENDER =====
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'WebApplication',
                '@id': `${SITE_URL}/#app`,
                name: 'Resizer AI Image Studio',
                url: `${SITE_URL}/`,
                description:
                  'Free online image resizer, compressor and converter. Core image jobs use the configured processing API with a browser fallback; image files are not permanently stored.',
                applicationCategory: 'MultimediaApplication',
                operatingSystem: 'Any',
                browserRequirements: 'Requires JavaScript',
                inLanguage: 'en-US',
                isAccessibleForFree: true,
                publisher: { '@id': `${SITE_URL}/#org` },
                offers: {
                  '@type': 'Offer',
                  price: '0',
                  priceCurrency: 'USD',
                },
                featureList: [
                  'Batch resize up to 50 images',
                  'Convert to WebP, AVIF, JPG, PNG',
                  'Adjust compression quality and output size',
                  'API image processing with browser fallback',
                  'Before/after split-screen comparison',
                  'Social media preset sizes',
                ],
              },
              {
                '@type': 'Organization',
                '@id': `${SITE_URL}/#org`,
                name: 'Resizer AI',
                url: `${SITE_URL}/`,
              },
              {
                '@type': 'WebSite',
                '@id': `${SITE_URL}/#website`,
                url: `${SITE_URL}/`,
                name: 'Resizer AI',
                publisher: { '@id': `${SITE_URL}/#org` },
                inLanguage: 'en-US',
              },
            ],
          }),
        }}
      />
      <div id="resizer-studio" data-track-section="resizer-studio" className="scroll-mt-24">
      {files.length === 0 && (
        <section className="mb-6 overflow-hidden rounded-[28px] border border-border/70 bg-gradient-to-br from-slate-50 via-white to-blue-50/70 p-4 shadow-[0_18px_60px_-30px_rgba(37,99,235,0.45)] dark:from-zinc-950 dark:via-zinc-900 dark:to-blue-950/40 sm:p-6 lg:p-8">
          <div className="grid gap-7 md:grid-cols-[1.05fr_0.95fr] md:items-center lg:gap-10">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
                Product photos, ready to publish
              </div>

              <h1 className="max-w-2xl text-3xl font-black tracking-[-0.04em] text-primary dark:text-white sm:text-4xl sm:tracking-[-0.05em] lg:text-5xl lg:leading-[1.05]">
                Resize product images for every storefront.
              </h1>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                Turn product photos into consistent, lightweight assets for your store, marketplace,
                ads, and website. Resize, crop, compress, and convert a whole batch in one workflow.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-muted">
                <span>Exact pixel sizing</span>
                <span>WebP and AVIF export</span>
                <span>Batch up to 50 images</span>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/presets"
                  className="rounded-2xl border border-border bg-white/70 px-5 py-3 text-sm font-semibold text-primary transition-colors hover:border-blue-400 hover:text-blue-600 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  Browse store image presets
                </Link>
              </div>
            </div>

            <div
              role="region"
              aria-label="Upload product images"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`group flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed p-6 text-center transition-all sm:min-h-72 ${
                dragActive
                  ? 'scale-[1.01] border-blue-500 bg-blue-500/10'
                  : 'border-blue-300/80 bg-white/80 hover:border-blue-500 hover:bg-blue-50/70 dark:border-blue-500/30 dark:bg-zinc-950/60 dark:hover:bg-blue-950/20'
              }`}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-105">
                <Upload className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-lg font-bold text-primary dark:text-white">Start with your product photos</h2>
              <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
                Drop images here or choose files to open the editor. Apply store-ready dimensions, formats, and compression.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-colors hover:bg-blue-500"
                >
                  Choose product images
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-primary transition-colors hover:border-blue-400 dark:text-white"
                >
                  <LinkIcon className="h-4 w-4 text-blue-500" />
                  Import URL
                </button>
                {cameraSupported && (
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-primary transition-colors hover:border-blue-400 dark:text-white"
                  >
                    <Camera className="h-4 w-4 text-blue-500" />
                    Camera
                  </button>
                )}
              </div>
              <span className="mt-3 text-xs text-muted">JPG, PNG, WebP, AVIF · Up to 50 images per batch</span>
            </div>
          </div>
        </section>
      )}

      {/* ===== UPLOAD / EDITOR SECTION ===== */}
      <div data-track-section="resizer-studio">
        {/* Persistent file inputs mounted at all times for both dropzone & studio */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFiles}
        />
        {/* Camera capture — only rendered when the device actually supports it */}
        {cameraSupported && (
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              handleFiles(e);
              // Reset so re-opening the camera fires another change event.
              e.target.value = '';
            }}
          />
        )}

        {files.length === 0 ? (
          <div id="uploadState" className="transition-all space-y-5">
            {/* Pending preset confirmation banner */}
            {pendingPreset && presets[pendingPreset] && (
              <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 animate-in fade-in slide-in-from-top-2">
                <span className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {presets[pendingPreset].name} preset applied ({presets[pendingPreset].w} × {presets[pendingPreset].h}) — now drop your image
                  </span>
                </span>
                <button
                  onClick={() => setPendingPreset(null)}
                  className="text-muted hover:text-primary transition-colors text-lg leading-none"
                  aria-label="Dismiss preset"
                >
                  ×
                </button>
              </div>
            )}

            {/* Popular preset sizes pills */}
            <div className="mt-8">
              <h3 className="text-base font-semibold mb-3 text-primary dark:text-white">Popular sizes</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(Object.entries(presets) as [string, PresetItem][]).slice(0, 8).map(([key, p]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectPreset(key)}
                    className={`bg-surface-elevated dark:bg-zinc-900 border rounded-2xl p-4 transition-all text-left hover:shadow-md hover:-translate-y-0.5 ${
                      pendingPreset === key
                        ? 'border-blue-500 ring-1 ring-blue-500/40 bg-blue-50/20 dark:bg-blue-500/10'
                        : 'border-border hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-primary dark:text-white">{p.name}</span>
                      {p.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono">
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted font-mono">{p.w} × {p.h} px</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Benefits strip */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  title: 'Privacy First',
                  desc: 'Core processing uses the configured API or browser fallback; hosting is always an explicit action.',
                  icon: <Sparkles className="w-5 h-5 text-blue-500" />,
                },
                {
                  title: 'Instant Processing',
                  desc: 'Native Sharp engine delivers resized results in milliseconds.',
                  icon: <Zap className="w-5 h-5 text-blue-500" />,
                },
                {
                  title: 'Batch & Modern Formats',
                  desc: 'WebP, AVIF, JPG, PNG with one-click ZIP archive packaging.',
                  icon: <FileArchive className="w-5 h-5 text-blue-500" />,
                },
              ].map((benefit) => (
                <div
                  key={benefit.title}
                  className="flex items-start gap-3.5 p-5 bg-surface-elevated dark:bg-zinc-900/60 rounded-2xl border border-border/50"
                >
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    {benefit.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold mb-1">{benefit.title}</h4>
                    <p className="text-xs text-muted leading-relaxed">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* ACTIVE STUDIO INTERFACE (QUEUE, PREVIEW & CONTROLS)                       */
          /* ========================================================================= */
          <div id="editorState" className="transition-all space-y-6">
            {/* Editor top bar — navigation & queue controls only */}
            <div className="flex items-center justify-between flex-wrap gap-3 rounded-[22px] border border-border/80 bg-gradient-to-r from-surface-elevated to-surface p-3.5 shadow-sm dark:from-zinc-900 dark:to-zinc-950">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={backToUpload}
                  className="px-3.5 py-2 rounded-xl border border-border hover:border-primary transition-colors text-xs font-semibold flex items-center gap-1.5"
                >
                  ← Back
                </button>
                <button
                  onClick={clearAll}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-muted hover:text-rose-600 transition-colors flex items-center gap-1.5"
                  title="Clear processed results without closing canvas"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear Results</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-primary dark:text-zinc-200 border border-border transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add Images</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-muted">
                <span>{files.length} image{files.length > 1 ? 's' : ''} loaded</span>
                {results.length > 0 && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold font-sans">
                    · {results.length} optimized ✓
                  </span>
                )}
              </div>

              {results.length > 0 && (
                <button
                  onClick={downloadAllAsZip}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-105 flex items-center gap-1.5"
                  title="Download all processed images inside a .zip file"
                >
                  <FileArchive className="w-4 h-4" />
                  <span>Download ZIP</span>
                </button>
              )}
            </div>

            {/* Processing error banner */}
            {processingError && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="flex-1">{processingError}</span>
                <button
                  onClick={() => setProcessingError(null)}
                  className="text-muted hover:text-primary transition-colors text-lg leading-none"
                  aria-label="Dismiss error"
                >
                  ×
                </button>
              </div>
            )}

            {/* Queue Carousel */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin px-1">
              {files.map((file, idx) => {
                const isSelected = idx === selectedIndex;
                const result = results[idx];
                return (
                  <div
                    key={`${file.name}-${idx}`}
                    onClick={() => setSelectedIndex(idx)}
                    className={`relative shrink-0 w-28 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all group ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-500/30 scale-105 shadow-md'
                        : 'border-border hover:border-slate-400 bg-surface dark:bg-zinc-900'
                    }`}
                  >
                    <div className="h-16 w-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                      <FileImage file={file} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-1.5 bg-surface-elevated dark:bg-zinc-900 text-[10px]">
                      <p className="truncate font-medium text-primary dark:text-zinc-200">{getImageDisplayName(file)}</p>
                      <div className="flex items-center justify-between text-muted">
                        <span>{formatFileSize(file.size)}</span>
                        {result && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            -{Math.max(0, result.savingsPercent)}%
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(idx);
                      }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                );
              })}

              {/* Add More card inside the queue carousel */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 w-24 h-[106px] rounded-2xl border-2 border-dashed border-border hover:border-blue-500 hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center gap-1.5 text-muted hover:text-blue-500 group"
                title="Add more images"
              >
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 group-hover:bg-blue-500/10 flex items-center justify-center transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold">Add More</span>
              </button>
            </div>

            {/* MAIN TWO-COLUMN STUDIO AREA */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" ref={afterPreviewRef}>
              {/* ===================================================================== */}
              {/* LEFT: INTERACTIVE BEFORE / AFTER PREVIEW CANVAS                       */}
              {/* ===================================================================== */}
              <div className="lg:col-span-7 space-y-4">
                <div className="overflow-hidden rounded-[28px] border border-border/80 bg-surface-elevated/95 shadow-xl shadow-slate-900/5 dark:bg-zinc-900/95 dark:shadow-black/20">
                  {/* Canvas Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-3.5 sm:px-5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                          <Eye className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-primary dark:text-zinc-100">
                            {files[selectedIndex] ? getImageDisplayName(files[selectedIndex]) : 'Preview canvas'}
                          </p>
                          <p className="text-[10px] font-medium text-muted">
                            {compareMode === 'split'
                              ? 'Before / after slider'
                              : compareMode === 'side'
                                ? 'Side-by-side comparison'
                                : 'Optimized preview'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {results[selectedIndex] && (
                        <span className="hidden rounded-lg bg-emerald-500/10 px-2 py-1 text-[10px] font-extrabold text-emerald-600 sm:inline dark:text-emerald-400">
                          -{Math.max(0, results[selectedIndex].savingsPercent)}% ({formatFileSize(results[selectedIndex].outputSizeBytes)})
                        </span>
                      )}
                      {results[selectedIndex] && (
                        <div className="flex items-center rounded-xl border border-border bg-surface p-1 text-[11px] font-semibold dark:bg-zinc-800">
                          <button
                            onClick={() => setCompareMode('split')}
                            aria-pressed={compareMode === 'split'}
                            title="Compare with a draggable split slider"
                            className={`rounded-lg px-2.5 py-1.5 transition-all ${
                              compareMode === 'split' ? 'bg-primary text-white dark:bg-white dark:text-primary shadow-sm' : 'text-muted'
                            }`}
                          >
                            Split
                          </button>
                          <button
                            onClick={() => setCompareMode('side')}
                            aria-pressed={compareMode === 'side'}
                            title="View the original and optimized image side by side"
                            className={`rounded-lg px-2.5 py-1.5 transition-all ${
                              compareMode === 'side' ? 'bg-primary text-white dark:bg-white dark:text-primary shadow-sm' : 'text-muted'
                            }`}
                          >
                            Side by side
                          </button>
                          <button
                            onClick={() => setCompareMode('result')}
                            aria-pressed={compareMode === 'result'}
                            title="View only the optimized image"
                            className={`rounded-lg px-2.5 py-1.5 transition-all ${
                              compareMode === 'result' ? 'bg-primary text-white dark:bg-white dark:text-primary shadow-sm' : 'text-muted'
                            }`}
                          >
                            Result
                          </button>
                        </div>
                      )}

                      {/* Zoom Controls */}
                      <div className="flex items-center rounded-xl border border-border bg-surface p-1 dark:bg-zinc-800">
                        <button
                          onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-elevated hover:text-blue-500"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setZoomLevel(1)}
                          className="min-w-12 rounded-lg px-1 py-1 text-[10px] font-mono text-primary transition-colors hover:bg-surface-elevated dark:text-zinc-200"
                          title="Reset zoom"
                        >
                          {Math.round(zoomLevel * 100)}%
                        </button>
                        <button
                          onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-elevated hover:text-blue-500"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Canvas Container */}
                  <div
                    ref={splitContainerRef}
                    onMouseMove={handleSplitMouseMove}
                    onMouseUp={() => setIsDraggingSplit(false)}
                    onTouchMove={handleSplitTouchMove}
                    className="relative mx-3 h-[380px] overflow-hidden rounded-2xl border border-slate-200/80 bg-[radial-gradient(circle,#d9e2ef_1px,transparent_1px)] bg-surface [background-size:18px_18px] select-none sm:mx-4 sm:h-[470px] dark:border-zinc-800 dark:bg-[radial-gradient(circle,#34343a_1px,transparent_1px)] dark:bg-zinc-950"
                    style={{ backgroundColor: usePadColor ? padColor : undefined }}
                  >
                    <div
                      className="w-full h-full flex items-center justify-center p-4 transition-transform duration-150"
                      style={{ transform: `scale(${zoomLevel})` }}
                    >
                      {files[selectedIndex] ? (
                        <div className={`relative flex max-h-full items-center justify-center ${compareMode === 'side' && results[selectedIndex] ? 'h-full w-full max-w-none' : 'max-w-full'}`}>
                          {compareMode === 'side' && results[selectedIndex] ? (
                            <div className="grid h-full w-full grid-cols-2 gap-3 sm:gap-5">
                              <figure className="flex min-w-0 flex-col items-center justify-center gap-3 rounded-2xl border border-border/70 bg-white/55 p-2.5 sm:p-4 dark:bg-zinc-900/45">
                                <figcaption className="text-center text-[10px] font-bold uppercase tracking-wider text-muted">
                                  Original · {originalDims ? `${originalDims.w}×${originalDims.h}` : ''}
                                </figcaption>
                                <FileImage
                                  file={files[selectedIndex]}
                                  className="max-h-[300px] w-full object-contain pointer-events-none rounded-lg shadow-lg sm:max-h-[360px]"
                                />
                              </figure>
                              <figure className="flex min-w-0 flex-col items-center justify-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] p-2.5 sm:p-4">
                                <figcaption className="text-center text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                  Optimized · {results[selectedIndex].width}×{results[selectedIndex].height}
                                </figcaption>
                                <img
                                  src={results[selectedIndex].dataBase64}
                                  alt={`Optimized version of ${files[selectedIndex].name}`}
                                  className="max-h-[300px] w-full object-contain pointer-events-none rounded-lg shadow-lg sm:max-h-[360px]"
                                />
                              </figure>
                            </div>
                          ) : (
                            <>
                              {/* Original stays unfiltered so split compare is honest. */}
                              <FileImage
                                file={files[selectedIndex]}
                                className="max-w-full max-h-[320px] sm:max-h-[380px] object-contain pointer-events-none rounded-lg shadow-lg"
                              />

                              {/* Optimized overlay: processed output, or a live filter preview of the source. */}
                              {compareMode === 'split' && (
                                <div
                                  className="absolute inset-0 overflow-hidden flex items-center justify-center"
                                  style={{ clipPath: `inset(0 0 0 ${splitPos}%)` }}
                                >
                                  <div style={livePreviewFilterStyle}>
                                    {results[selectedIndex] ? (
                                      <img
                                        src={results[selectedIndex].dataBase64}
                                        alt="Optimized Image"
                                        className="max-w-full max-h-[320px] sm:max-h-[380px] object-contain pointer-events-none rounded-lg shadow-lg"
                                      />
                                    ) : (
                                      <FileImage
                                        file={files[selectedIndex]}
                                        className="max-w-full max-h-[320px] sm:max-h-[380px] object-contain pointer-events-none rounded-lg shadow-lg"
                                      />
                                    )}
                                  </div>
                                </div>
                              )}

                              {results[selectedIndex] && compareMode === 'result' && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div style={livePreviewFilterStyle}>
                                    <img
                                      src={results[selectedIndex].dataBase64}
                                      alt="Optimized Image"
                                      className="max-w-full max-h-[320px] sm:max-h-[380px] object-contain pointer-events-none rounded-lg shadow-lg"
                                    />
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-muted">No Image Selected</div>
                      )}
                    </div>

                    {/* Split Divider Handle */}
                    {files[selectedIndex] && compareMode === 'split' && (
                      <div
                        onMouseDown={() => setIsDraggingSplit(true)}
                        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-2xl z-20"
                        style={{ left: `${splitPos}%` }}
                      >
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-800 shadow-xl flex items-center justify-center text-xs font-bold border border-slate-200">
                          ↔
                        </div>
                      </div>
                    )}

                    {/* Badges for Comparison */}
                    {compareMode !== 'side' && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-bold shadow">
                      Original: {originalDims ? `${originalDims.w}×${originalDims.h}` : ''} ({formatFileSize(files[selectedIndex]?.size || 0)})
                    </div>
                    )}

                    {results[selectedIndex] && compareMode !== 'side' && (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold shadow">
                        Optimized: {results[selectedIndex].width}×{results[selectedIndex].height} ({formatFileSize(results[selectedIndex].outputSizeBytes)})
                      </div>
                    )}
                  </div>

                  {/* Rotation & Flip Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRotateCcw}
                        className="p-2 rounded-xl bg-surface dark:bg-zinc-800 hover:bg-surface-elevated text-muted hover:text-primary transition-colors border border-border"
                        title="Rotate Counter-Clockwise"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleRotateCw}
                        className="p-2 rounded-xl bg-surface dark:bg-zinc-800 hover:bg-surface-elevated text-muted hover:text-primary transition-colors border border-border"
                        title="Rotate Clockwise"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleFlipH}
                        className={`p-2 rounded-xl border transition-colors ${
                          flipH ? 'bg-blue-600 text-white border-blue-600' : 'bg-surface dark:bg-zinc-800 text-muted hover:text-primary border-border'
                        }`}
                        title="Flip Horizontal"
                      >
                        <FlipHorizontal className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleFlipV}
                        className={`p-2 rounded-xl border transition-colors ${
                          flipV ? 'bg-blue-600 text-white border-blue-600' : 'bg-surface dark:bg-zinc-800 text-muted hover:text-primary border-border'
                        }`}
                        title="Flip Vertical"
                      >
                        <FlipVertical className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Per-image result actions. The wrapper also stays open when there is no
                        selected result but images are still being hosted, so URL
                        imports show their progress before processing. */}
                    {(results[selectedIndex] || hostQueue.total > 0) && (
                      <>
                      {results[selectedIndex] && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyImageToClipboard(results[selectedIndex].dataBase64)}
                          className="p-2 rounded-xl bg-surface dark:bg-zinc-800 hover:bg-surface-elevated text-muted hover:text-primary transition-colors border border-border"
                          title="Copy image to clipboard"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleWebShare(results[selectedIndex])}
                          className="p-2 rounded-xl bg-surface dark:bg-zinc-800 hover:bg-surface-elevated text-muted hover:text-primary transition-colors border border-border"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        {/* Discard / Remove from queue */}
                        <button
                          onClick={() => removeImageAndResult(selectedIndex)}
                          className="p-2 rounded-xl bg-surface dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-muted hover:text-rose-500 transition-colors border border-border"
                          title="Remove this image from queue"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadSingle(results[selectedIndex])}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all hover:scale-105"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                      )}


                      </>
                    )}
                  </div>

                  {/* ===== BIG PROCESS BUTTON — at the bottom of the preview panel ===== */}
                  <button
                    id="process-image-btn"
                    onClick={processImages}
                    disabled={downloadState === 'processing'}
                    className="w-full mt-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-blue-800 disabled:to-indigo-800 text-white font-extrabold text-base shadow-xl shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {downloadState === 'processing' ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Optimizing {files.length} image{files.length > 1 ? 's' : ''}…</span>
                      </>
                    ) : downloadState === 'done' ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Re-Process {files.length > 1 ? `All ${files.length} Images` : 'Image'}</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        <span>Process &amp; Optimize {files.length > 1 ? `${files.length} Images` : 'Image'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* ===================================================================== */}
              {/* RIGHT: SETTINGS, RESIZE PRESETS, FILTERS & EXPORT TABBED PANEL        */}
              {/* ===================================================================== */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-surface-elevated dark:bg-zinc-900/90 rounded-3xl border border-border shadow-xl overflow-hidden">

                  {/* Panel header — toggle between Settings and Results */}
                  {results.length > 0 ? (
                    <div className="flex bg-surface dark:bg-zinc-800/80 border-b border-border">
                      <button
                        onClick={() => setRightPanelMode('results')}
                        className={`flex-1 py-3 text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all border-b-2 ${
                          rightPanelMode === 'results'
                            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white/50 dark:bg-zinc-900/60'
                            : 'border-transparent text-muted hover:text-primary'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Results ({results.length})
                      </button>
                      <button
                        onClick={() => setRightPanelMode('settings')}
                        className={`flex-1 py-3 text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all border-b-2 ${
                          rightPanelMode === 'settings'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white/50 dark:bg-zinc-900/60'
                            : 'border-transparent text-muted hover:text-primary'
                        }`}
                      >
                        <Sliders className="w-4 h-4" />
                        Settings
                      </button>
                    </div>
                  ) : (
                    <div className="flex bg-surface dark:bg-zinc-800/80 border-b border-border">
                      {([
                        { id: 'presets', short: 'Size', icon: '⊞' },
                        { id: 'filters', short: 'Filters', icon: '✦' },
                        { id: 'export',  short: 'Export',  icon: '⚡' },
                      ] as const).map((tab) => {
                        const isCurrent = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-3 text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all border-b-2 whitespace-nowrap ${
                              isCurrent
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white/50 dark:bg-zinc-900/60'
                                : 'border-transparent text-muted hover:text-primary hover:bg-white/30 dark:hover:bg-zinc-700/30'
                            }`}
                          >
                            <span className="text-base leading-none">{tab.icon}</span>
                            <span>{tab.short}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="p-5 space-y-5">

                  {/* ── RESULTS PANEL (shown right next to the canvas) ── */}
                  {rightPanelMode === 'results' && results.length > 0 && (
                    <div className="space-y-3">
                      {/* Bulk actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={downloadAllAsZip}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
                        >
                          <FileArchive className="w-3.5 h-3.5" />
                          Download All ZIP
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="py-2 px-3 rounded-xl bg-surface dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-primary dark:text-white text-xs font-bold border border-border transition-colors flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Add More
                        </button>
                        <button
                          onClick={clearAll}
                          className="py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 text-rose-500 text-xs font-bold border border-rose-200 dark:border-rose-500/30 transition-colors"
                          title="Clear results (keeps images on canvas)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Per-image result rows */}
                      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                        {results.map((result, index) => {
                          const originalFile = files[index];
                          if (!originalFile) return null;
                          return (
                            <div
                              key={`inline-result-${index}`}
                              className={`group flex items-center gap-3 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                                index === selectedIndex
                                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 ring-1 ring-blue-500/30'
                                  : 'border-border bg-surface dark:bg-zinc-950 hover:border-blue-400/60'
                              }`}
                              onClick={() => setSelectedIndex(index)}
                            >
                              {/* Thumbnail */}
                              <div className="relative shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800">
                                <img
                                  src={result.dataBase64}
                                  alt={result.originalName}
                                  className="w-full h-full object-cover"
                                />
                                <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] bg-emerald-600/90 text-white font-extrabold py-0.5">
                                  -{Math.max(0, result.savingsPercent)}%
                                </span>
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold text-primary dark:text-white truncate">
                                  {files[index] ? getImageDisplayName(files[index]) : result.originalName}
                                </p>
                                <p className="text-[10px] font-mono text-muted">
                                  {formatFileSize(result.originalSizeBytes)} → <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatFileSize(result.outputSizeBytes)}</span>
                                </p>
                                <p className="text-[10px] text-muted">{result.width}×{result.height} · {result.format.toUpperCase()}</p>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => downloadSingle(result)}
                                  className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                                  title="Download"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => copyImageToClipboard(result.dataBase64)}
                                  className="p-1.5 rounded-lg bg-surface dark:bg-zinc-800 border border-border hover:border-blue-400 text-muted hover:text-blue-500 transition-colors"
                                  title="Copy"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => removeImageAndResult(index)}
                                  className="p-1.5 rounded-lg bg-surface dark:bg-zinc-800 border border-border hover:border-rose-400 text-muted hover:text-rose-500 transition-colors"
                                  title="Remove"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── SETTINGS TABS (shown when rightPanelMode === 'settings' OR no results yet) ── */}
                  {(rightPanelMode === 'settings' || results.length === 0) && (<>

                  {/* Show the old tab bar when results exist and settings mode is active */}
                  {results.length > 0 && (
                    <div className="flex gap-1.5 p-1 bg-surface dark:bg-zinc-800 rounded-2xl border border-border -mt-1 mb-1">
                      {([
                        { id: 'presets', short: 'Size', icon: '⊞' },
                        { id: 'filters', short: 'Filters', icon: '✦' },
                        { id: 'export', short: 'Export', icon: '⚡' },
                      ] as const).map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                            activeTab === tab.id
                              ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                              : 'text-muted hover:text-primary'
                          }`}
                        >
                          <span>{tab.icon}</span>
                          <span>{tab.short}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {activeTab === 'presets' && (
                    <div className="space-y-4">

                      {/* Preset category pills */}
                      <div className="flex gap-1.5 p-1 bg-surface dark:bg-zinc-800 rounded-2xl border border-border">
                        {(['social', 'ecommerce', 'devices', 'print'] as const).map((cat) => {
                          const icons = { social: '📱', ecommerce: '🛒', devices: '🖥️', print: '📄' };
                          const labels = { social: 'Social', ecommerce: 'Shop', devices: 'Screen', print: 'Print' };
                          return (
                            <button
                              key={cat}
                              onClick={() => setPresetCategory(cat)}
                              className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold capitalize transition-all flex items-center justify-center gap-1 ${
                                presetCategory === cat
                                  ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                                  : 'text-muted hover:text-primary'
                              }`}
                            >
                              <span>{icons[cat]}</span>
                              <span>{labels[cat]}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Preset Grid — taller cards, cleaner layout */}
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.entries(presets) as [string, PresetItem][])
                          .filter(([_, p]) => p.category === presetCategory)
                          .map(([key, p]) => {
                            const isActive = currentPreset === key;
                            return (
                              <button
                                key={key}
                                onClick={() => selectPreset(key)}
                                className={`group relative p-3 rounded-2xl text-left border-2 transition-all duration-200 ${
                                  isActive
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-md shadow-blue-500/10'
                                    : 'border-border bg-surface dark:bg-zinc-950 hover:border-blue-400/60 hover:shadow-sm hover:-translate-y-0.5'
                                }`}
                              >
                                {isActive && (
                                  <span className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold">✓</span>
                                )}
                                <div className={`text-xs font-bold leading-tight mb-1 pr-4 ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-primary dark:text-white'}`}>
                                  {p.name}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-mono text-muted">{p.w}×{p.h}</span>
                                  {p.badge && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold font-mono ${
                                      isActive ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-surface-elevated dark:bg-zinc-800 text-muted'
                                    }`}>
                                      {p.badge}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                      </div>

                      {/* Divider */}
                      <div className="border-t border-dashed border-border/60" />

                      {/* Saved presets */}
                      <section aria-labelledby="saved-presets-heading" className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <h3 id="saved-presets-heading" className="text-[10px] font-bold uppercase tracking-widest text-muted">
                              My presets
                            </h3>
                            <p className="mt-0.5 text-[10px] text-muted">Saved on this device</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowSavePresetForm((open) => !open)}
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-500/25 bg-blue-500/5 px-2.5 py-1.5 text-[10px] font-bold text-blue-700 transition-colors hover:bg-blue-500/10 dark:text-blue-300"
                          >
                            <Plus className="h-3 w-3" />
                            Save current
                          </button>
                        </div>

                        {showSavePresetForm && (
                          <form
                            onSubmit={(event) => {
                              event.preventDefault();
                              saveCurrentPreset();
                            }}
                            className="flex gap-2 rounded-xl border border-border bg-surface-elevated/70 p-2 dark:bg-zinc-950"
                          >
                            <label htmlFor="saved-preset-name" className="sr-only">Preset name</label>
                            <input
                              id="saved-preset-name"
                              autoFocus
                              maxLength={40}
                              value={savedPresetName}
                              onChange={(event) => setSavedPresetName(event.target.value)}
                              placeholder="e.g. Product listing"
                              className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2.5 py-2 text-xs text-primary outline-none transition focus:border-blue-500 dark:bg-zinc-900 dark:text-white"
                            />
                            <button
                              type="submit"
                              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-500"
                            >
                              Save
                            </button>
                          </form>
                        )}

                        {savedPresets.length > 0 ? (
                          <div className="grid gap-1.5">
                            {savedPresets.map((preset) => (
                              <div
                                key={preset.id}
                                className={`flex items-center gap-2 rounded-xl border p-2 transition-colors ${
                                  currentPreset === `saved-${preset.id}`
                                    ? 'border-blue-500/40 bg-blue-500/5'
                                    : 'border-border bg-surface dark:bg-zinc-950'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => applySavedPreset(preset)}
                                  className="min-w-0 flex-1 text-left"
                                  aria-label={`Apply preset ${preset.name}`}
                                >
                                  <span className="block truncate text-xs font-bold text-primary dark:text-white">{preset.name}</span>
                                  <span className="mt-0.5 block text-[10px] font-mono text-muted">
                                    {preset.width} × {preset.height} · {preset.format.toUpperCase()} · Q{preset.quality}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteSavedPreset(preset.id)}
                                  className="rounded-lg p-1.5 text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-600"
                                  aria-label={`Delete preset ${preset.name}`}
                                  title={`Delete ${preset.name}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="rounded-xl border border-dashed border-border px-3 py-2.5 text-[11px] leading-relaxed text-muted">
                            Save your dimensions, format, quality, and fit settings to reuse them later.
                          </p>
                        )}
                      </section>

                      {/* Divider */}
                      <div className="border-t border-dashed border-border/60" />

                      {/* Custom dimensions in pixels or percentage */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Enter size</span>
                          <div className="flex rounded-xl border border-border bg-surface p-1 dark:bg-zinc-950">
                            {([
                              { id: 'pixels', label: 'Pixels' },
                              { id: 'percentage', label: 'Percentage' },
                            ] as const).map((mode) => (
                              <button
                                type="button"
                                key={mode.id}
                                onClick={() => setSizeMode(mode.id)}
                                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                                  sizeMode === mode.id
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-muted hover:text-primary'
                                }`}
                              >
                                {mode.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {sizeMode === 'pixels' ? (
                          <>
                            <div className="flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => setMaintainRatio((r) => !r)}
                                className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg border transition-all ${
                                  maintainRatio
                                    ? 'border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
                                    : 'border-border text-muted hover:text-primary'
                                }`}
                                title="Toggle aspect ratio lock"
                              >
                                {maintainRatio ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                <span>{maintainRatio ? 'Keep proportions' : 'Free size'}</span>
                              </button>
                            </div>
                            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                              <div>
                                <label htmlFor="custom-width" className="block text-[10px] font-semibold text-muted mb-1.5">Width (px)</label>
                                <input
                                  id="custom-width"
                                  type="number"
                                  value={width}
                                  onChange={handleWidthChange}
                                  min={1}
                                  max={20000}
                                  className="w-full bg-surface dark:bg-zinc-950 border border-border rounded-xl px-3 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-primary dark:text-white transition-all"
                                />
                              </div>
                              <span className="pb-3 text-xs font-bold text-muted">×</span>
                              <div>
                                <label htmlFor="custom-height" className="block text-[10px] font-semibold text-muted mb-1.5">Height (px)</label>
                                <input
                                  id="custom-height"
                                  type="number"
                                  value={height}
                                  onChange={handleHeightChange}
                                  min={1}
                                  max={20000}
                                  className="w-full bg-surface dark:bg-zinc-950 border border-border rounded-xl px-3 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-primary dark:text-white transition-all"
                                />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-2 rounded-2xl border border-border bg-surface p-3 dark:bg-zinc-950">
                            <div>
                              <label htmlFor="custom-percentage" className="block text-[10px] font-semibold text-muted mb-1.5">Resize percentage</label>
                              <div className="flex items-center gap-2">
                                <input
                                  id="custom-percentage"
                                  type="number"
                                  min={10}
                                  max={200}
                                  value={scale}
                                  onChange={handleScaleChange}
                                  className="w-24 bg-background dark:bg-zinc-900 border border-border rounded-xl px-3 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 text-primary dark:text-white"
                                />
                                <span className="text-sm font-bold text-muted">%</span>
                                <span className="ml-auto text-[10px] font-mono text-muted">
                                  {originalDims ? `${width} × ${height} px` : 'Enter a size'}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {[25, 50, 75, 100, 150, 200].map((value) => (
                                <button
                                  type="button"
                                  key={value}
                                  onClick={() => updateScale(value)}
                                  className={`rounded-lg border px-2 py-1 text-[10px] font-bold transition-all ${
                                    scale === value
                                      ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                      : 'border-border text-muted hover:border-blue-400 hover:text-blue-600'
                                  }`}
                                >
                                  {value}%
                                </button>
                              ))}
                            </div>
                            <input
                              type="range"
                              aria-label="Resize percentage"
                              min={10}
                              max={200}
                              value={scale}
                              onChange={handleScaleChange}
                              className="w-full accent-blue-600 h-1.5"
                            />
                          </div>
                        )}
                        {isUpscaling && originalDims && (
                          <div className="mt-2 p-2.5 rounded-xl border border-amber-400/50 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200 space-y-2">
                            <p className="text-[11px] leading-snug">
                              Upscaling {originalDims.w}×{originalDims.h} to {width}×{height}. Extra pixels are invented, so small rasters and SVGs usually look blurry.
                            </p>
                            <label className="flex items-start gap-2 text-[11px] font-semibold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={allowUpscale}
                                onChange={(e) => setAllowUpscale(e.target.checked)}
                                className="mt-0.5 accent-amber-600"
                              />
                              <span>Allow upscaling anyway</span>
                            </label>
                          </div>
                        )}
                      </div>

                      {/* Fit Mode */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Fit Mode</label>
                        <div className="grid grid-cols-3 gap-2">
                          {([
                            { id: 'fit',     label: 'Contain', desc: 'Keeps ratio', emoji: '⬜' },
                            { id: 'fill',    label: 'Cover',   desc: 'Smart crop',  emoji: '⬛' },
                            { id: 'stretch', label: 'Stretch', desc: 'Exact dims',  emoji: '↔' },
                          ] as const).map((m) => (
                            <button
                              key={m.id}
                              onClick={() => setFitMode(m.id)}
                              className={`p-2.5 rounded-xl text-center border-2 transition-all ${
                                fitMode === m.id
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                                  : 'bg-surface dark:bg-zinc-950 border-border text-muted hover:border-blue-400 hover:text-primary'
                              }`}
                            >
                              <div className="text-base mb-0.5">{m.emoji}</div>
                              <div className="text-[11px] font-bold">{m.label}</div>
                              <div className="text-[9px] opacity-70">{m.desc}</div>
                            </button>
                          ))}
                        </div>
                        <p className="mt-2 text-[10px] text-muted">
                          Matches the first uploaded image when supported; other image types default to WebP. You can change it anytime.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: FILTERS & COLOR ADJUSTMENTS */}
                  {activeTab === 'filters' && (
                    <div className="space-y-5">

                      {/* Filter Presets */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Style Preset</label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {([
                            { id: 'none',      label: 'Normal',  emoji: '🌈' },
                            { id: 'grayscale', label: 'B&W',     emoji: '⬜' },
                            { id: 'sepia',     label: 'Sepia',   emoji: '🟤' },
                            { id: 'vivid',     label: 'Vivid',   emoji: '⚡' },
                            { id: 'invert',    label: 'Invert',  emoji: '🔁' },
                          ] as const).map((f) => (
                            <button
                              key={f.id}
                              onClick={() => setFilterPreset(f.id)}
                              className={`py-2 px-1 rounded-xl text-center border-2 transition-all ${
                                filterPreset === f.id
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                  : 'bg-surface dark:bg-zinc-950 border-border text-muted hover:border-blue-400 hover:text-primary'
                              }`}
                            >
                              <div className="text-base mb-0.5">{f.emoji}</div>
                              <div className="text-[9px] font-bold leading-tight">{f.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Adjustment Sliders */}
                      {[
                        { label: 'Brightness', value: brightness, set: setBrightness, min: 50, max: 150, neutral: 100, color: 'text-yellow-500' },
                        { label: 'Contrast',   value: contrast,   set: setContrast,   min: 50, max: 150, neutral: 100, color: 'text-blue-500' },
                        { label: 'Saturation', value: saturation, set: setSaturation, min: 0,  max: 200, neutral: 100, color: 'text-pink-500' },
                        { label: 'Blur',       value: blurVal * 10, set: (v: number) => setBlurVal(v / 10), min: 0, max: 100, neutral: 0, color: 'text-indigo-500' },
                      ].map((s) => (
                        <div key={s.label} className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className={`text-xs font-semibold ${s.color}`}>{s.label}</span>
                            <span className="text-xs font-mono font-bold text-primary dark:text-white">
                              {s.label === 'Blur' ? `${(s.value / 10).toFixed(1)}px` : `${s.value}%`}
                            </span>
                          </div>
                          <div className="relative">
                            <input
                              type="range"
                              min={s.min}
                              max={s.max}
                              value={s.value}
                              onChange={(e) => s.set(Number(e.target.value))}
                              className="w-full accent-blue-600"
                            />
                          </div>
                        </div>
                      ))}

                      {/* Sharpen Toggle & Pad Color */}
                      <div className="space-y-3 p-3 rounded-2xl bg-surface dark:bg-zinc-950 border border-border">
                        <label className="flex items-center justify-between cursor-pointer group">
                          <span className="text-xs font-semibold text-primary dark:text-zinc-200 group-hover:text-blue-600 transition-colors">
                            🔪 Sharpen Filter
                          </span>
                          <button
                            onClick={() => setSharpen(v => !v)}
                            className={`relative w-10 h-5 rounded-full transition-colors ${sharpen ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${sharpen ? 'translate-x-5' : 'translate-x-0.5'}`} />
                          </button>
                        </label>

                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-primary dark:text-zinc-200">🎨 Background Color</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={padColor}
                              onChange={(e) => { setPadColor(e.target.value); setUsePadColor(true); }}
                              className="w-7 h-7 rounded-lg cursor-pointer border border-border bg-transparent"
                            />
                            <button
                              onClick={() => setUsePadColor((p) => !p)}
                              className={`text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all ${
                                usePadColor ? 'bg-blue-600 text-white' : 'bg-surface-elevated dark:bg-zinc-800 text-muted hover:text-primary'
                              }`}
                            >
                              {usePadColor ? '✓ ON' : 'OFF'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: FORMAT, QUALITY & TARGET SIZE */}
                  {activeTab === 'export' && (
                    <div className="space-y-5">

                      {/* Format Cards */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Output Format</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'webp', name: 'WebP',  desc: 'Best compression',   savings: '-35%', badge: '🏆' },
                            { id: 'avif', name: 'AVIF',  desc: 'Next-gen format',    savings: '-50%', badge: '🚀' },
                            { id: 'jpg',  name: 'JPG',   desc: 'Universal compat.',  savings: '-20%', badge: '📷' },
                            { id: 'png',  name: 'PNG',   desc: 'Lossless quality',   savings: '0%',   badge: '🖼' },
                          ].map((fmt) => (
                            <button
                              key={fmt.id}
                              onClick={() => setFormat(fmt.id)}
                              className={`p-3 rounded-2xl text-left border-2 transition-all ${
                                format === fmt.id
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/25'
                                  : 'bg-surface dark:bg-zinc-950 border-border hover:border-blue-400/60 hover:-translate-y-0.5 hover:shadow-sm'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-extrabold">{fmt.name}</span>
                                <span className="text-base">{fmt.badge}</span>
                              </div>
                              <div className={`text-[10px] leading-tight ${format === fmt.id ? 'text-blue-100' : 'text-muted'}`}>{fmt.desc}</div>
                              <div className={`text-[11px] font-bold font-mono mt-1 ${format === fmt.id ? 'text-blue-200' : 'text-emerald-600 dark:text-emerald-400'}`}>{fmt.savings}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quality Slider */}
                      <div className="p-3 rounded-2xl bg-surface dark:bg-zinc-950 border border-border space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-muted">Quality</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-extrabold font-mono ${
                              quality >= 90 ? 'text-emerald-500' : quality >= 70 ? 'text-blue-500' : quality >= 50 ? 'text-yellow-500' : 'text-rose-500'
                            }`}>{quality}%</span>
                            <span className="text-[10px] text-muted px-1.5 py-0.5 rounded-md bg-surface-elevated dark:bg-zinc-800 font-medium">
                              {quality >= 90 ? 'Best' : quality >= 70 ? 'Good' : quality >= 50 ? 'Fair' : 'Low'}
                            </span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={100}
                          value={quality}
                          onChange={(e) => { setQuality(Number(e.target.value)); setTargetMaxKb(null); }}
                          className="w-full accent-blue-600"
                        />
                        <div className="flex justify-between text-[9px] text-muted">
                          <span>20% Tiny</span><span>82% Balanced</span><span>100% Max</span>
                        </div>
                      </div>

                      {/* Target Size Quick Presets */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Target Max File Size</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[100, 250, 500, 1024].map((kb) => (
                            <button
                              key={kb}
                              onClick={() => handleTargetSize(kb)}
                              className={`py-2 rounded-xl text-[11px] font-bold border-2 transition-all ${
                                targetMaxKb === kb
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                                  : 'bg-surface dark:bg-zinc-950 border-border text-muted hover:border-emerald-400 hover:text-emerald-600'
                              }`}
                            >
                              {kb >= 1024 ? '1 MB' : `${kb}K`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Output filename controls */}
                      <div className="space-y-3 rounded-2xl border border-border bg-surface-elevated/60 p-3 dark:bg-zinc-950">
                        <div>
                          <label htmlFor="filename-prefix" className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-muted">Filename Prefix</label>
                          <input
                            id="filename-prefix"
                            type="text"
                            value={filenamePrefix}
                            onChange={(e) => setFilenamePrefix(e.target.value)}
                            placeholder="e.g. summer_"
                            maxLength={40}
                            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-mono font-bold text-primary transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 dark:bg-zinc-950 dark:text-white"
                          />
                        </div>
                        <label htmlFor="filename-suffix" className="block text-[10px] font-bold uppercase tracking-widest text-muted mb-1.5">Filename Suffix</label>
                        <input
                          id="filename-suffix"
                          type="text"
                          value={filenameSuffix}
                          onChange={(e) => setFilenameSuffix(e.target.value)}
                          placeholder="_optimized"
                          maxLength={40}
                          aria-label="Filename suffix"
                          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-mono font-bold text-primary transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/30 dark:bg-zinc-950 dark:text-white"
                        />

                        <div className="border-t border-border/70 pt-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Rename images</span>
                            <button
                              type="button"
                              onClick={() => setImageNames(new Map())}
                              disabled={imageNames.size === 0}
                              className="text-[10px] font-semibold text-muted transition-colors hover:text-blue-600 disabled:cursor-default disabled:opacity-40"
                            >
                              Reset names
                            </button>
                          </div>
                          <p className="mb-2 text-[10px] leading-relaxed text-muted">
                            Set a custom base name for each image. Prefix, suffix, and the selected output extension are added on download.
                          </p>
                          <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                            {files.map((file, index) => {
                              const originalExtension = getFileNameParts(file.name).extension;
                              return (
                                <div key={`${file.name}-${index}`} className="rounded-xl border border-border bg-surface p-2 dark:bg-zinc-900">
                                  <label htmlFor={`image-name-${index}`} className="mb-1.5 block text-[10px] font-semibold text-muted">
                                    Image {index + 1} · {originalExtension || 'no extension'}
                                  </label>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      id={`image-name-${index}`}
                                      type="text"
                                      value={getImageBaseName(file)}
                                      onChange={(event) => renameImage(file, event.target.value)}
                                      maxLength={80}
                                      className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 py-2 text-xs font-medium text-primary outline-none transition focus:border-blue-500 dark:text-white"
                                    />
                                    <span className="shrink-0 text-[10px] font-mono text-muted">.{format === 'jpg' ? 'jpg' : format}</span>
                                  </div>
                                  <p className="mt-1 truncate text-[9px] text-muted">
                                    Download as {sanitizeFileName(`${getProcessingFilenamePrefix(currentPreset, presets, savedPresets)}${filenamePrefix}${getImageBaseName(file)}${filenameSuffix}`, `resizer-ai-image-${index + 1}`)}.{format === 'jpg' ? 'jpg' : format}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer: Reset + Output Summary */}
                  <div className="pt-3 mt-2 border-t border-border flex justify-between items-center">
                    <button
                      onClick={resetAllSettings}
                      className="text-[11px] text-muted hover:text-rose-500 flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reset Defaults</span>
                    </button>
                    <div className="text-right">
                      <span className="text-[10px] text-muted font-mono block">
                        {format.toUpperCase()} · {width}×{height}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{estimateText}</span>
                    </div>
                  </div>

                  </>)}

                  </div>
                </div>
              </div>
            </div>

            {/* Compact queue strip — only visible when NO results yet (before processing) */}
            {results.length === 0 && files.length > 1 && (
              <div className="bg-surface-elevated dark:bg-zinc-900 rounded-2xl p-4 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-primary dark:text-white">Image Queue ({files.length})</h3>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {files.map((file, index) => (
                    <FileThumb
                      key={`${file.name}-${index}`}
                      file={file}
                      isSelected={index === selectedIndex}
                      onSelect={() => setSelectedIndex(index)}
                      onRemove={() => removeImageAndResult(index)}
                      result={undefined}
                      isProcessing={downloadState === 'processing'}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

      </div>

        {/* PRODUCT TOOLKIT */}
        <section aria-labelledby="toolkit-heading" className="mt-16 sm:mt-24">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
              The product
            </span>
            <h2 id="toolkit-heading" className="mt-2 text-2xl font-extrabold tracking-tight text-primary dark:text-white sm:text-4xl">
            Core image jobs, one workspace
            </h2>
            <p className="mt-3 text-xs text-muted sm:text-sm">
              Core image tools share one queue and consistent controls. Optional AI and markup analysis are separate workflows.
              Pick a job — the studio below adapts to it.
            </p>
          </div>

          <ToolDirectory compact />

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { title: 'Ecommerce & catalogs', text: 'Square, zoom-ready product images that stay sharp and light.' },
              { title: 'Marketing & social', text: 'Channel-correct crops and banners exported in minutes, not days.' },
              { title: 'Engineering & docs', text: 'PDF pages to screenshots, assets to WebP, without a design detour.' },
            ].map((audience) => (
              <div key={audience.title} className="rounded-2xl border border-border/70 bg-surface/50 p-5">
                <h3 className="text-sm font-bold text-primary dark:text-white">{audience.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{audience.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* TOP LEVEL SEO CONTENT: GUIDES, DIMENSION PRESETS, BENEFITS & FAQS         */}
        {/* ========================================================================= */}
        <section data-track-section="guides-and-tools" aria-label="Image Resizer Guides & Tools" className="mt-16 sm:mt-24 space-y-16 sm:space-y-24">

          {/* 1. HOW TO RESIZE IMAGES ONLINE (3 EASY STEPS) */}
          <div className="bg-surface-elevated/60 dark:bg-zinc-900/60 border border-border/80 rounded-3xl p-6 sm:p-10 backdrop-blur-xl">
            <div className="max-w-2xl mx-auto text-center mb-10 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Step-by-Step Guide
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-primary dark:text-white tracking-tight">
                How to Resize Images Online for Free
              </h2>
              <p className="text-xs sm:text-sm text-muted">
                Resize, crop, and optimize photos to exact pixel dimensions in three effortless steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-surface dark:bg-zinc-950 border border-border/60 space-y-3 relative group hover:border-blue-500/50 transition-all">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold text-lg flex items-center justify-center">
                  1
                </div>
                <h3 className="font-bold text-base text-primary dark:text-white">
                  Upload or Drop Photos
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  Drop your image file into the studio or paste directly from clipboard (<kbd className="px-1 py-0.5 rounded bg-surface-elevated text-[10px] font-mono">Ctrl+V</kbd>). Supports JPG, PNG, WebP, AVIF, and HEIC up to 50 photos.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-surface dark:bg-zinc-950 border border-border/60 space-y-3 relative group hover:border-indigo-500/50 transition-all">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold text-lg flex items-center justify-center">
                  2
                </div>
                <h3 className="font-bold text-base text-primary dark:text-white">
                  Set Width, Height or Scale
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  Input custom width and height in pixels with aspect ratio lock enabled, pick a percentage scale (25%, 50%, 75%), or select a social media preset.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-surface dark:bg-zinc-950 border border-border/60 space-y-3 relative group hover:border-emerald-500/50 transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-lg flex items-center justify-center">
                  3
                </div>
                <h3 className="font-bold text-base text-primary dark:text-white">
                  Compress & Download
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  Choose modern output formats like WebP or AVIF, adjust compression quality to reach your target KB, and download single files or a ZIP archive instantly.
                </p>
              </div>
            </div>
          </div>

          {/* 2. SOCIAL MEDIA & WEB IMAGE RESIZE PRESET SIZES TABLE */}
          <div className="space-y-6">
            <div className="max-w-3xl mx-auto text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                <span>⚡ Instant Dimensions Guide</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-primary dark:text-white tracking-tight">
                Recommended Dimensions for Social Media &amp; Web
              </h2>
              <p className="text-xs sm:text-sm text-muted max-w-2xl mx-auto leading-relaxed">
                Browse our verified catalog of <strong>Popular Presets &amp; Dimensions</strong> and <strong>Popular sizes</strong>. Click any row to automatically set pixel dimensions, maintain ratio, and jump straight into editing.
              </p>
            </div>

            {/* Category Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 max-w-5xl mx-auto">
              <div className="flex items-center gap-1.5 p-1 bg-surface dark:bg-zinc-900 border border-border rounded-2xl overflow-x-auto">
                {[
                  { id: 'all' as const, label: 'All Presets', icon: '⊞' },
                  { id: 'social' as const, label: 'Social Media', icon: '📱' },
                  { id: 'web' as const, label: 'Web & Screens', icon: '🖥️' },
                  { id: 'ecommerce' as const, label: 'E-Commerce', icon: '🛒' },
                  { id: 'print' as const, label: 'Passport & Print', icon: '📄' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setDimCategory(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      dimCategory === tab.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-muted hover:text-primary dark:hover:text-white'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Instant Search Bar */}
              <div className="relative min-w-[240px]">
                <input
                  type="text"
                  placeholder="Filter dimensions (e.g. Instagram, 4K)..."
                  value={dimSearch}
                  onChange={(e) => setDimSearch(e.target.value)}
                  className="w-full bg-surface dark:bg-zinc-900 border border-border rounded-2xl px-3.5 py-2 text-xs text-primary dark:text-white placeholder:text-muted focus:outline-none focus:border-blue-500 shadow-sm"
                />
                {dimSearch && (
                  <button
                    onClick={() => setDimSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Responsive Preset Table */}
            <div className="overflow-x-auto rounded-3xl border border-border/80 bg-surface-elevated/50 dark:bg-zinc-900/50 backdrop-blur-xl">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-border/80 bg-surface dark:bg-zinc-950/70 text-muted font-bold uppercase text-[11px] tracking-wider">
                    <th className="py-4 px-6">Platform / Use Case</th>
                    <th className="py-4 px-6">Dimensions (Pixels)</th>
                    <th className="py-4 px-6">Aspect Ratio</th>
                    <th className="py-4 px-6">Optimal Format</th>
                    <th className="py-4 px-6">Recommended Size</th>
                    <th className="py-4 px-6 text-right">Quick Apply</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-secondary dark:text-zinc-300">
                  {[
                    // Social Media
                    { cat: 'social', platform: 'Instagram Square Post', dims: '1080 × 1080 px', ratio: '1:1', format: 'WebP / JPG', rec: '< 4 MB', preset: 'instagram-post' },
                    { cat: 'social', platform: 'Instagram Story / Reel / TikTok', dims: '1080 × 1920 px', ratio: '9:16', format: 'WebP / JPG', rec: '< 4 MB', preset: 'instagram-story' },
                    { cat: 'social', platform: 'Instagram Portrait Post', dims: '1080 × 1350 px', ratio: '4:5', format: 'WebP / JPG', rec: '< 4 MB', preset: 'instagram-portrait' },
                    { cat: 'social', platform: 'YouTube Video Thumbnail', dims: '1280 × 720 px', ratio: '16:9', format: 'WebP / JPG', rec: '< 2 MB', preset: 'youtube' },
                    { cat: 'social', platform: 'YouTube Channel Banner', dims: '2560 × 1440 px', ratio: '16:9', format: 'PNG / WebP', rec: '< 6 MB', preset: 'youtube-banner' },
                    { cat: 'social', platform: 'TikTok Video / Story Cover', dims: '1080 × 1920 px', ratio: '9:16', format: 'WebP / JPG', rec: '< 4 MB', preset: 'tiktok' },
                    { cat: 'social', platform: 'Facebook Post (Landscape)', dims: '1200 × 630 px', ratio: '1.91:1', format: 'PNG / JPG', rec: '< 5 MB', preset: 'facebook' },
                    { cat: 'social', platform: 'Facebook Page Cover Photo', dims: '820 × 312 px', ratio: '2.6:1', format: 'PNG / JPG', rec: '< 2 MB', preset: 'facebook-cover' },
                    { cat: 'social', platform: 'X / Twitter In-Stream Post', dims: '1200 × 675 px', ratio: '16:9', format: 'JPG / WebP', rec: '< 5 MB', preset: 'twitter' },
                    { cat: 'social', platform: 'X / Twitter Header Banner', dims: '1500 × 500 px', ratio: '3:1', format: 'JPG / PNG', rec: '< 5 MB', preset: 'twitter-header' },
                    { cat: 'social', platform: 'LinkedIn Post & Feed Image', dims: '1200 × 627 px', ratio: '1.91:1', format: 'PNG / JPG', rec: '< 5 MB', preset: 'linkedin' },
                    { cat: 'social', platform: 'LinkedIn Company Banner', dims: '1584 × 396 px', ratio: '4:1', format: 'PNG / JPG', rec: '< 4 MB', preset: 'linkedin-banner' },
                    { cat: 'social', platform: 'Pinterest Standard Pin', dims: '1000 × 1500 px', ratio: '2:3', format: 'JPG / PNG', rec: '< 10 MB', preset: 'pinterest' },

                    // Web & Displays
                    { cat: 'web', platform: '4K Ultra HD Display Wallpaper', dims: '3840 × 2160 px', ratio: '16:9', format: 'AVIF / WebP', rec: 'HQ Wallpaper', preset: 'screen-4k' },
                    { cat: 'web', platform: 'Full HD 1080p Standard Display', dims: '1920 × 1080 px', ratio: '16:9', format: 'AVIF / WebP', rec: 'Universal', preset: 'screen-fhd' },
                    { cat: 'web', platform: '2K QHD Display Wallpaper', dims: '2560 × 1440 px', ratio: '16:9', format: 'AVIF / WebP', rec: 'Monitor', preset: 'screen-2k' },
                    { cat: 'web', platform: '720p HD Standard Web Banner', dims: '1280 × 720 px', ratio: '16:9', format: 'WebP / JPG', rec: '< 300 KB', preset: 'screen-hd' },
                    { cat: 'web', platform: 'Hero Website Header Banner', dims: '1920 × 600 px', ratio: '3.2:1', format: 'AVIF / WebP', rec: '< 250 KB', preset: 'banner' },
                    { cat: 'web', platform: 'Blog Featured Image (OpenGraph)', dims: '1200 × 630 px', ratio: '1.91:1', format: 'WebP / AVIF', rec: '< 200 KB', preset: 'blog-featured' },
                    { cat: 'web', platform: 'High-Res App / Profile Icon', dims: '512 × 512 px', ratio: '1:1', format: 'PNG', rec: 'Lossless', preset: 'avatar' },
                    { cat: 'web', platform: 'Favicon & Browser Tab Icon', dims: '32 × 32 px', ratio: '1:1', format: 'PNG / ICO', rec: '< 10 KB', preset: 'favicon' },

                    // E-Commerce
                    { cat: 'ecommerce', platform: 'Amazon Product Image (Hi-Res)', dims: '2000 × 2000 px', ratio: '1:1', format: 'WebP / JPG', rec: '< 10 MB', preset: 'amazon' },
                    { cat: 'ecommerce', platform: 'Shopify Square Product Listing', dims: '2048 × 2048 px', ratio: '1:1', format: 'WebP / PNG', rec: '< 5 MB', preset: 'shopify' },
                    { cat: 'ecommerce', platform: 'Etsy Marketplace Item Photo', dims: '2000 × 1500 px', ratio: '4:3', format: 'WebP / JPG', rec: '< 8 MB', preset: 'etsy' },
                    { cat: 'ecommerce', platform: 'eBay Product Gallery Photo', dims: '1600 × 1600 px', ratio: '1:1', format: 'WebP / JPG', rec: '< 7 MB', preset: 'ebay' },

                    // Passport & Print
                    { cat: 'print', platform: 'US Official Passport Photo (2×2")', dims: '600 × 600 px', ratio: '1:1', format: 'JPG', rec: '300 DPI', preset: 'passport-us' },
                    { cat: 'print', platform: 'Schengen / EU / UK Passport Photo', dims: '413 × 531 px', ratio: '35×45mm', format: 'JPG', rec: '300 DPI', preset: 'passport-schengen' },
                    { cat: 'print', platform: 'Standard A4 Document Printout', dims: '2480 × 3508 px', ratio: '1:1.41', format: 'PNG / PDF', rec: '300 DPI', preset: 'print-a4' },
                    { cat: 'print', platform: 'Standard 4×6" Photo Printout', dims: '1200 × 1800 px', ratio: '2:3', format: 'JPG / PNG', rec: '300 DPI', preset: 'print-4x6' },
                    { cat: 'print', platform: 'Standard 5×7" Photo Printout', dims: '1500 × 2100 px', ratio: '5:7', format: 'JPG / PNG', rec: '300 DPI', preset: 'print-5x7' },
                  ]
                    .filter((row) => {
                      if (dimCategory !== 'all' && row.cat !== dimCategory) return false;
                      if (dimSearch.trim()) {
                        const q = dimSearch.toLowerCase();
                        return (
                          row.platform.toLowerCase().includes(q) ||
                          row.dims.toLowerCase().includes(q) ||
                          row.ratio.toLowerCase().includes(q) ||
                          row.preset.toLowerCase().includes(q)
                        );
                      }
                      return true;
                    })
                    .map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-500/5 transition-colors">
                        <td className="py-3.5 px-6 font-semibold text-primary dark:text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          <span>{row.platform}</span>
                        </td>
                        <td className="py-3.5 px-6 font-mono font-bold text-blue-600 dark:text-blue-400">{row.dims}</td>
                        <td className="py-3.5 px-6 font-mono text-muted">{row.ratio}</td>
                        <td className="py-3.5 px-6">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface border border-border">
                            {row.format}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 font-mono text-[11px] text-muted">{row.rec}</td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            onClick={() => {
                              selectPreset(row.preset);
                              document.getElementById('resizer-studio')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white dark:text-blue-400 dark:hover:text-white text-xs font-semibold transition-all inline-flex items-center gap-1 hover:scale-105 active:scale-95"
                          >
                            <span>Apply</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Keyword-Rich Dimension & Aspect Ratio Explanation Guide */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 text-xs text-muted leading-relaxed">
              <div className="p-5 rounded-2xl bg-surface dark:bg-zinc-950 border border-border/60 space-y-2">
                <h3 className="font-bold text-primary dark:text-white text-sm">
                  Popular Presets &amp; Dimensions for Social Media
                </h3>
                <p>
                  To avoid automatic compression and blurriness, always upload images at recommended resolutions: <strong>1080×1080 px</strong> for Instagram posts, <strong>1080×1920 px</strong> for vertical Stories, Reels, and TikTok, and <strong>1280×720 px</strong> for high-CTR YouTube thumbnails.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-surface dark:bg-zinc-950 border border-border/60 space-y-2">
                <h3 className="font-bold text-primary dark:text-white text-sm">
                  Recommended Dimensions for Web &amp; E-Commerce
                </h3>
                <p>
                  E-commerce platforms like Amazon and Shopify require high-resolution square images (<strong>2000×2000 px</strong> or <strong>2048×2048 px</strong>) to activate customer zoom features while keeping WebP file sizes lightweight for fast mobile page speed.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-surface dark:bg-zinc-950 border border-border/60 space-y-2">
                <h3 className="font-bold text-primary dark:text-white text-sm">
                  Popular Sizes for Print &amp; Passport Photos
                </h3>
                <p>
                  For physical photo prints and government documents, precise DPI and aspect ratio matter: standard US passport photos need exactly <strong>600×600 px (2×2 inches at 300 DPI)</strong>, while Schengen visas require <strong>413×531 px (35×45mm)</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* 3. WHY CHOOSE RESIZER AI (CORE VALUE PILLARS) */}
          <div className="space-y-6">
            <div className="max-w-2xl mx-auto text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                Performance & Privacy
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-primary dark:text-white tracking-tight">
                Why Choose Resizer AI Online Image Resizer?
              </h2>
              <p className="text-xs sm:text-sm text-muted">
                Built for store owners and creative teams who need consistent product imagery and clear processing choices.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <ShieldCheck className="w-6 h-6 text-blue-500" />,
                  title: 'No Permanent Image Storage',
                  desc: 'Core image jobs use the configured processor with a browser fallback. Optional AI actions send the chosen image to their provider when submitted.',
                },
                {
                  icon: <Zap className="w-6 h-6 text-amber-500" />,
                  title: 'Instant Next-Gen Formats',
                  desc: 'Export product photos as WebP or AVIF and compare output size before downloading. Results depend on the source image and quality settings.',
                },
                {
                  icon: <Layers className="w-6 h-6 text-indigo-500" />,
                  title: 'Batch Image Processing',
                  desc: 'Resize up to 50 images at once. Apply consistent dimensions, aspect ratio constraints, and compression levels, then download all files in one click as a ZIP.',
                },
                {
                  icon: <Eye className="w-6 h-6 text-cyan-500" />,
                  title: 'Interactive Split Comparison',
                  desc: 'Inspect image quality before downloading. Slide the interactive split-screen divider to compare original vs processed results down to the pixel.',
                },
                {
                  icon: <Sparkles className="w-6 h-6 text-purple-500" />,
                  title: 'Quality-focused resizing',
                  desc: 'Use fit modes, aspect-ratio controls, and image previews to choose the right dimensions before export.',
                },
                {
                  icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
                  title: 'Start without mandatory sign-in',
                  desc: 'Use the core image workflow without creating an account. Check the pricing page for current limits and plan details.',
                },
              ].map((feat, idx) => (
                <div key={idx} className="p-6 rounded-3xl bg-surface-elevated dark:bg-zinc-900 border border-border/80 hover:border-blue-500/40 transition-all space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-surface dark:bg-zinc-950 border border-border flex items-center justify-center">
                    {feat.icon}
                  </div>
                  <h3 className="font-bold text-base text-primary dark:text-white">{feat.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 4. COMPREHENSIVE SEO FAQ ACCORDION (JSON-LD ALIGNED) */}
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Frequently Asked Questions
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-primary dark:text-white tracking-tight">
                Everything You Need to Know About Image Resizing
              </h2>
              <p className="text-xs sm:text-sm text-muted">
                Answers to the most common questions about online image resizing, compression, and format conversions.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  q: 'How do I resize an image online for free?',
                  a: 'Simply drag and drop your photo into the Resizer AI studio above. Enter your desired width and height in pixels (or scale by percentage), choose your preferred format like WebP or JPG, and click "Download" to save your resized image instantly.',
                },
                {
                  q: 'Will resizing an image reduce its sharpness or visual quality?',
                  a: 'Resizing can affect detail, especially when enlarging an image or using lossy compression. Preview the result and adjust dimensions and quality before downloading.',
                },
                {
                  q: 'How can I reduce an image file size to under 100KB or 200KB?',
                  a: 'Start by resizing to the dimensions required by the form, then try WebP or AVIF and lower quality in small steps. File size and visible quality depend on the original image, dimensions, format, and selected quality.',
                },
                {
                  q: 'Can I resize multiple images at once (batch resize)?',
                  a: 'Yes! Resizer AI supports bulk batch resizing for up to 50 images simultaneously. You can apply uniform pixel dimensions or scale factors across all photos and download them packaged in a single ZIP file.',
                },
                {
                  q: 'Are my uploaded photos safe, private, and confidential?',
                  a: 'Core image processing uses the configured backend with a browser fallback. The app does not permanently store image files, though processing metadata may be recorded. Optional AI background removal sends the selected image to its provider only after you submit it.',
                },
                {
                  q: 'What is the difference between WebP, AVIF, and JPG formats?',
                  a: 'JPEG is widely compatible. WebP supports transparency and is commonly used for web images; AVIF is a newer format with broadening browser support. The smallest format depends on the image and quality settings.',
                },
                {
                  q: 'How do I resize an image to exact pixel dimensions (width × height)?',
                  a: 'In the Resizer AI studio, select the "Pixels" mode. Enter your exact target width and height in the input boxes. To keep the original proportions without distortion, ensure the "Lock Aspect Ratio" toggle is active.',
                },
              ].map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-border/80 bg-surface-elevated/70 dark:bg-zinc-900/70 overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full py-4 px-6 text-left flex items-center justify-between gap-4 font-semibold text-sm text-primary dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-muted shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-blue-500' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-4 pt-1 text-xs sm:text-sm text-muted leading-relaxed border-t border-border/40 animate-in fade-in duration-150">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </section>

        {/* URL Import Modal */}
        {showUrlModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface-elevated dark:bg-zinc-900 border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-primary dark:text-white flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-blue-500" />
                  <span>Import Image via URL</span>
                </h3>
                <button
                  onClick={() => setShowUrlModal(false)}
                  className="w-7 h-7 rounded-full bg-surface dark:bg-zinc-800 text-muted hover:text-primary flex items-center justify-center text-sm"
                >
                  ×
                </button>
              </div>

              <p className="text-xs text-muted">
                Paste any publicly accessible image link (Unsplash, Wikipedia, CDN, etc.):
              </p>

              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full bg-surface dark:bg-zinc-950 border border-border rounded-xl px-3 py-2.5 text-xs text-primary dark:text-white focus:outline-none focus:border-blue-500"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowUrlModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportUrl}
                  disabled={urlLoading || !urlInput.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
                >
                  {urlLoading ? 'Fetching...' : 'Import Image'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Toast Notification */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-xs sm:text-sm font-semibold border backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-200 ${
              toast.type === 'success'
                ? 'bg-surface-elevated/95 dark:bg-zinc-900/95 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/10'
                : toast.type === 'error'
                ? 'bg-surface-elevated/95 dark:bg-zinc-900/95 border-rose-500/30 text-rose-600 dark:text-rose-400 shadow-rose-500/10'
                : 'bg-surface-elevated/95 dark:bg-zinc-900/95 border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-blue-500/10'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{toast.msg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
