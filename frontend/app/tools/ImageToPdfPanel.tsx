'use client';

import { useRef, useState } from 'react';
import { Download, FileImage, FileText, Loader2, Trash2, Upload } from 'lucide-react';

type PageSize = 'image' | 'a4' | 'letter';

const MAX_IMAGES = 20;
const PAGE_DIMENSIONS: Record<Exclude<PageSize, 'image'>, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
};

async function convertToPng(file: File): Promise<Uint8Array> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error(`Could not read ${file.name} in this browser.`));
      image.src = objectUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable in this browser.');
    context.drawImage(image, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error(`Could not prepare ${file.name} for the PDF.`));
      }, 'image/png');
    });
    return new Uint8Array(await blob.arrayBuffer());
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function safePdfName(name: string): string {
  const cleaned = name.trim()
    .replace(/\.pdf$/i, '')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '-');
  return `${cleaned || 'images'}.pdf`;
}

export default function ImageToPdfPanel() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>('image');
  const [filename, setFilename] = useState('images');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const addFiles = (incoming: FileList | File[]) => {
    const selected = Array.from(incoming);
    const images = selected.filter((file) => file.type.startsWith('image/'));
    const remaining = MAX_IMAGES - files.length;

    if (images.length < selected.length) {
      setError('Only image files can be added.');
    } else if (images.length > remaining) {
      setError(`You can add up to ${MAX_IMAGES} images per PDF.`);
    } else if (images.length > 0) {
      setError(null);
      setFiles((current) => [...current, ...images]);
    }
  };

  const createPdf = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdf = await PDFDocument.create();

      for (const file of files) {
        const isJpeg = file.type === 'image/jpeg' || /\.jpe?g$/i.test(file.name);
        const bytes = isJpeg ? new Uint8Array(await file.arrayBuffer()) : await convertToPng(file);
        const image = isJpeg ? await pdf.embedJpg(bytes) : await pdf.embedPng(bytes);

        let pageWidth = image.width * 0.75;
        let pageHeight = image.height * 0.75;
        if (pageSize !== 'image') {
          const [portraitWidth, portraitHeight] = PAGE_DIMENSIONS[pageSize];
          const landscape = image.width > image.height;
          pageWidth = landscape ? portraitHeight : portraitWidth;
          pageHeight = landscape ? portraitWidth : portraitHeight;
        }

        const page = pdf.addPage([pageWidth, pageHeight]);
        const margin = pageSize === 'image' ? 0 : 24;
        const dimensions = image.scaleToFit(pageWidth - margin * 2, pageHeight - margin * 2);
        page.drawImage(image, {
          x: (pageWidth - dimensions.width) / 2,
          y: (pageHeight - dimensions.height) / 2,
          width: dimensions.width,
          height: dimensions.height,
        });
      }

      const bytes = await pdf.save();
      const buffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(buffer).set(bytes);
      const url = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = safePdfName(filename);
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (conversionError) {
      setError(conversionError instanceof Error ? conversionError.message : 'Could not create the PDF.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <section className="space-y-4 xl:col-span-7">
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold">Combine images into a PDF</h2>
            <p className="mt-1 text-sm text-muted">Each image becomes one page. Your files stay in this browser.</p>
          </div>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              addFiles(event.dataTransfer.files);
            }}
            className={`flex min-h-44 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition-colors ${dragActive ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/60 hover:bg-accent/5'}`}
          >
            <Upload className="mb-3 h-7 w-7 text-accent" aria-hidden="true" />
            <span className="font-semibold">Choose images or drop them here</span>
            <span className="mt-1 text-xs text-muted">PNG, JPEG, WebP, AVIF and browser-supported image formats · up to {MAX_IMAGES} files</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => {
              if (event.currentTarget.files) addFiles(event.currentTarget.files);
              event.currentTarget.value = '';
            }}
          />

          {files.length > 0 && (
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold">{files.length} image{files.length === 1 ? '' : 's'} selected</h3>
                <button
                  type="button"
                  onClick={() => { setFiles([]); setError(null); }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Clear all
                </button>
              </div>
              <ul className="max-h-64 space-y-2 overflow-y-auto">
                {files.map((file, index) => (
                  <li key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
                    <FileImage className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
                    <span className="shrink-0 text-xs text-muted">
                      {file.size < 1024 ? `${file.size} B` : `${(file.size / 1024).toFixed(1)} KB`}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => {
                        setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
                        setError(null);
                      }}
                      className="rounded-lg p-1.5 text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-4 xl:col-span-5">
        <div className="space-y-4 rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div>
            <label htmlFor="image-pdf-page-size" className="mb-2 block text-sm font-bold">PDF page size</label>
            <select
              id="image-pdf-page-size"
              value={pageSize}
              onChange={(event) => {
                const next = event.target.value;
                if (next === 'image' || next === 'a4' || next === 'letter') setPageSize(next);
              }}
              className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm font-semibold text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:text-white"
            >
              <option value="image">Fit each image</option>
              <option value="a4">A4 — fit with margins</option>
              <option value="letter">US Letter — fit with margins</option>
            </select>
          </div>

          <div>
            <label htmlFor="image-pdf-filename" className="mb-2 block text-sm font-bold">PDF filename</label>
            <div className="flex items-center rounded-xl border border-border bg-background px-3 focus-within:border-accent">
              <input
                id="image-pdf-filename"
                value={filename}
                onChange={(event) => setFilename(event.target.value)}
                maxLength={100}
                className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
              />
              <span className="text-sm text-muted">.pdf</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-3 text-xs leading-relaxed text-muted">
            <FileText className="mr-2 inline h-4 w-4 text-accent" aria-hidden="true" />
            Images are processed locally. The selected order is used for the PDF pages.
          </div>

          {error && <p role="alert" className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="button"
            onClick={createPdf}
            disabled={!files.length || busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
            {busy ? 'Creating PDF…' : `Create PDF${files.length ? ` (${files.length} page${files.length === 1 ? '' : 's'})` : ''}`}
          </button>
        </div>
      </aside>
    </div>
  );
}
