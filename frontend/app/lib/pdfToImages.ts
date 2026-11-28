import type { PDFDocumentProxy } from 'pdfjs-dist';

export type PdfImageFormat = 'png' | 'jpeg' | 'webp';

export interface PdfPageImage {
  pageNumber: number;
  filename: string;
  width: number;
  height: number;
  dataUrl: string;
  sizeBytes: number;
}

export interface RenderPdfOptions {
  scale: number;
  format: PdfImageFormat;
  quality: number;
  pageFrom: number;
  pageTo: number;
  password?: string;
  onProgress?: (current: number, total: number) => void;
}

/**
 * pdf.js worker, CMap, font and wasm assets are served from our own origin.
 * `scripts/copy-pdf-assets.mjs` copies them out of node_modules on install, so
 * the tool keeps working offline, behind a strict CSP, and always uses assets
 * that match the installed pdfjs-dist version.
 */
const PDF_ASSET_BASE = '/pdfjs';

type PdfjsModule = typeof import('pdfjs-dist');

let pdfjsPromise: Promise<PdfjsModule> | null = null;

/**
 * pdf.js is large, so it is imported only when the PDF tool is actually used
 * instead of on every visit to the tools page.
 */
async function loadPdfjs(): Promise<PdfjsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').catch((error: unknown) => {
      pdfjsPromise = null;
      throw error;
    });
  }

  const pdfjs = await pdfjsPromise;
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `${PDF_ASSET_BASE}/pdf.worker.min.mjs`;
  }
  return pdfjs;
}

/** True when pdf.js rejected the document because it needs a password. */
export function isPasswordError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const { name, message } = error as { name?: string; message?: string };
  if (name === 'PasswordException') return true;
  // Newer pdf.js releases surface the same states through PasswordResponses.
  return Boolean(message && /password/i.test(message));
}

/** Opens a PDF and returns the document so callers can read `numPages`. */
export async function openPdf(file: File, password?: string): Promise<PDFDocumentProxy> {
  const pdfjs = await loadPdfjs();
  const data = new Uint8Array(await file.arrayBuffer());

  return pdfjs.getDocument({
    data,
    password: password || undefined,
    cMapUrl: `${PDF_ASSET_BASE}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${PDF_ASSET_BASE}/standard_fonts/`,
    wasmUrl: `${PDF_ASSET_BASE}/wasm/`,
  }).promise;
}

/**
 * Releases the worker and cached page data for an open document. pdf.js exposes
 * `destroy()` on the loading task rather than on the document proxy.
 */
export async function closePdf(pdf: PDFDocumentProxy): Promise<void> {
  await pdf.loadingTask.destroy();
}

function mimeFor(format: PdfImageFormat): string {
  if (format === 'jpeg') return 'image/jpeg';
  if (format === 'webp') return 'image/webp';
  return 'image/png';
}

function extensionFor(format: PdfImageFormat): string {
  return format === 'jpeg' ? 'jpg' : format;
}

function dataUrlSize(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.round((base64.length * 3) / 4);
}

export async function renderPdfToImages(
  file: File,
  options: RenderPdfOptions,
): Promise<PdfPageImage[]> {
  const pdf = await openPdf(file, options.password);

  try {
    const from = Math.max(1, Math.min(options.pageFrom, pdf.numPages));
    const to = Math.max(from, Math.min(options.pageTo, pdf.numPages));
    const total = to - from + 1;
    const baseName = file.name.replace(/\.pdf$/i, '') || 'document';
    const scale = Math.min(4, Math.max(0.5, options.scale));
    const quality = Math.min(1, Math.max(0.1, options.quality / 100));
    const requestedMime = mimeFor(options.format);
    const pages: PdfPageImage[] = [];

    for (let pageNumber = from; pageNumber <= to; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      let canvas: HTMLCanvasElement | null = null;

      try {
        const viewport = page.getViewport({ scale });
        canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.ceil(viewport.width));
        canvas.height = Math.max(1, Math.ceil(viewport.height));

        // Rendering with an explicit white background keeps JPEG/WebP output
        // opaque for pages that would otherwise be transparent.
        await page.render({ canvas, viewport, background: '#ffffff' }).promise;

        let dataUrl = canvas.toDataURL(requestedMime, quality);
        let format = options.format;

        // Safari cannot encode WebP from a canvas; it silently returns PNG.
        if (!dataUrl.startsWith(`data:${requestedMime}`)) {
          format = 'png';
          dataUrl = canvas.toDataURL('image/png');
        }

        pages.push({
          pageNumber,
          filename: `${baseName}-page-${String(pageNumber).padStart(3, '0')}.${extensionFor(format)}`,
          width: canvas.width,
          height: canvas.height,
          dataUrl,
          sizeBytes: dataUrlSize(dataUrl),
        });
      } finally {
        // Release the page's worker resources and the bitmap as soon as the
        // image data is extracted; large documents otherwise exhaust memory.
        page.cleanup();
        if (canvas) {
          canvas.width = 0;
          canvas.height = 0;
        }
      }

      options.onProgress?.(pageNumber - from + 1, total);
    }

    return pages;
  } finally {
    await closePdf(pdf);
  }
}
