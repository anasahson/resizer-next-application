'use client';

import { useCallback, useRef, useState } from 'react';
import JSZip from 'jszip';
import { FileText, Download, Loader2, Trash2, Upload } from 'lucide-react';
import { closePdf, isPasswordError, openPdf, renderPdfToImages, type PdfImageFormat, type PdfPageImage } from '../lib/pdfToImages';

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

const SCALE_PRESETS = [
  { label: 'Screen', scale: 1, hint: '72 DPI' },
  { label: 'Retina', scale: 2, hint: '144 DPI' },
  { label: 'Print', scale: 3, hint: '216 DPI' },
];

export default function PdfToImagesPanel() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageFrom, setPageFrom] = useState(1);
  const [pageTo, setPageTo] = useState(1);
  const [scale, setScale] = useState(2);
  const [format, setFormat] = useState<PdfImageFormat>('png');
  const [quality, setQuality] = useState(92);
  const [password, setPassword] = useState('');
  const [pages, setPages] = useState<PdfPageImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const resetOutput = () => {
    setPages([]);
    setError(null);
  };

  const takePdf = useCallback(async (next: File | undefined) => {
    if (!next) return;
    const isPdf = next.type === 'application/pdf' || next.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setError('Please drop a PDF file.');
      return;
    }
    setFile(next);
    setPages([]);
    setError(null);
    try {
      const pdf = await openPdf(next);
      try {
        setPageCount(pdf.numPages);
        setPageFrom(1);
        setPageTo(pdf.numPages);
      } finally {
        await closePdf(pdf);
      }
    } catch (err) {
      setPageCount(0);
      setError(isPasswordError(err)
        ? 'This PDF is password protected. Enter the password and convert again.'
        : (err instanceof Error ? err.message : 'Could not open this PDF.'));
    }
  }, []);

  const convert = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setPages([]);
    setProgress({ current: 0, total: Math.max(1, pageTo - pageFrom + 1) });
    try {
      const rendered = await renderPdfToImages(file, {
        scale,
        format,
        quality,
        pageFrom,
        pageTo,
        password: password || undefined,
        onProgress: (current, total) => setProgress({ current, total }),
      });
      setPages(rendered);
    } catch (err) {
      setError(isPasswordError(err)
        ? 'This PDF is password protected. Enter the correct password and convert again.'
        : (err instanceof Error ? err.message : 'Conversion failed.'));
    } finally {
      setBusy(false);
    }
  };

  const downloadOne = (page: PdfPageImage) => {
    const a = document.createElement('a');
    a.href = page.dataUrl;
    a.download = page.filename;
    a.click();
  };

  const downloadZip = async () => {
    if (!pages.length) return;
    const zip = new JSZip();
    pages.forEach((page) => {
      const comma = page.dataUrl.indexOf(',');
      zip.file(page.filename, page.dataUrl.slice(comma + 1), { base64: true });
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(file?.name || 'document').replace(/\.pdf$/i, '')}-pages.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      <aside className="xl:col-span-4 space-y-4">
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
          <label htmlFor="pdf-output-format" className="block text-sm font-bold">Output format</label>
          <select
            id="pdf-output-format"
            value={format}
            onChange={(event) => {
              const nextFormat = event.target.value;
              if (nextFormat === 'png' || nextFormat === 'jpeg' || nextFormat === 'webp') {
                setFormat(nextFormat);
                resetOutput();
              }
            }}
            className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm font-semibold text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:text-white"
          >
            <option value="png">PNG — sharp text and transparency</option>
            <option value="jpeg">JPEG — smaller photos</option>
            <option value="webp">WebP — modern web format</option>
          </select>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
          <h3 className="text-sm font-bold">Resolution</h3>
          <div className="grid grid-cols-3 gap-2">
            {SCALE_PRESETS.map((preset) => (
              <button
                key={preset.scale}
                type="button"
                onClick={() => { setScale(preset.scale); resetOutput(); }}
                className={`rounded-xl border py-2 text-center transition-all ${scale === preset.scale ? 'border-accent bg-accent/10 text-accent' : 'border-border hover:border-accent/50'}`}
              >
                <div className="text-xs font-bold">{preset.label}</div>
                <div className="text-[10px] text-muted">{preset.hint}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold">Quality</h3>
            <span className="font-mono text-lg font-bold text-accent">{quality}</span>
          </div>
          <input
            type="range"
            min={40}
            max={100}
            value={quality}
            onChange={(e) => { setQuality(Number(e.target.value)); resetOutput(); }}
            className="w-full accent-accent"
            disabled={format === 'png'}
          />
          {format === 'png' && <p className="text-[11px] text-muted">PNG is lossless; quality applies to JPEG and WebP.</p>}
        </div>

        {pageCount > 0 && (
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
            <h3 className="text-sm font-bold">Pages ({pageCount})</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-[10px] uppercase tracking-wider text-muted font-bold">
                From
                <input
                  type="number"
                  min={1}
                  max={pageCount}
                  value={pageFrom}
                  onChange={(e) => setPageFrom(Math.max(1, Number(e.target.value)))}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-sm"
                />
              </label>
              <label className="text-[10px] uppercase tracking-wider text-muted font-bold">
                To
                <input
                  type="number"
                  min={1}
                  max={pageCount}
                  value={pageTo}
                  onChange={(e) => setPageTo(Math.min(pageCount, Number(e.target.value)))}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-sm"
                />
              </label>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (if locked)"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        )}
      </aside>

      <main className="xl:col-span-8 space-y-5">
        <div
          onDrop={(e) => { e.preventDefault(); setDragActive(false); void takePdf(e.dataTransfer.files[0]); }}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onClick={() => fileRef.current?.click()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed min-h-[220px] flex flex-col items-center justify-center p-10 text-center transition-all ${dragActive ? 'border-accent bg-accent/10' : 'border-border bg-surface hover:border-accent/60'}`}
        >
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => { void takePdf(e.target.files?.[0]); e.target.value = ''; }}
          />
          <FileText className="w-12 h-12 text-accent mb-3" />
          <p className="text-lg font-bold">{file ? file.name : 'Drop a PDF to convert pages to images'}</p>
          <p className="text-sm text-muted mt-1">
            {file ? formatBytes(file.size) : 'Runs in your browser — the file is not uploaded to a server'}
          </p>
          <div className="mt-6 flex gap-3" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold">
              <Upload className="w-4 h-4" /> Choose PDF
            </button>
            {file && (
              <button
                type="button"
                onClick={() => { setFile(null); setPageCount(0); setPages([]); setError(null); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-sm font-semibold"
              >
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            )}
          </div>
        </div>

        {file && (
          <div className="flex flex-wrap gap-3 items-center">
            <button
              type="button"
              onClick={() => void convert()}
              disabled={busy}
              className="px-6 py-3 rounded-xl bg-accent text-white font-bold disabled:opacity-60 inline-flex items-center gap-2"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {busy ? `Rendering ${progress.current}/${progress.total}` : `Convert ${Math.max(1, pageTo - pageFrom + 1)} page${pageTo - pageFrom === 0 ? '' : 's'}`}
            </button>
            {pages.length > 0 && (
              <button type="button" onClick={() => void downloadZip()} className="px-6 py-3 rounded-xl bg-positive text-white font-bold inline-flex items-center gap-2">
                <Download className="w-4 h-4" /> Download ZIP ({pages.length})
              </button>
            )}
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-danger/30 bg-danger/10 text-danger px-4 py-3 text-sm font-semibold">{error}</p>
        )}

        {pages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pages.map((page) => (
              <article key={page.pageNumber} className="rounded-2xl border border-border bg-surface overflow-hidden">
                <div className="aspect-[3/4] bg-background">
                  <img src={page.dataUrl} alt={`Page ${page.pageNumber}`} className="w-full h-full object-contain" />
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-xs font-semibold truncate">{page.filename}</p>
                  <p className="text-[10px] font-mono text-muted">{page.width}×{page.height} · {formatBytes(page.sizeBytes)}</p>
                  <button type="button" onClick={() => downloadOne(page)} className="w-full py-2 rounded-xl bg-accent text-white text-xs font-bold">
                    Download page {page.pageNumber}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-10 text-center">
            <p className="font-bold">Each PDF page becomes a separate image</p>
            <p className="text-sm text-muted mt-2">Choose PNG for documents, JPEG for photos, or WebP for the web. Download pages one by one or as a ZIP.</p>
          </div>
        )}
      </main>
    </div>
  );
}
