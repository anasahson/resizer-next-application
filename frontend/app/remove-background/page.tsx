'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowDownToLine, ImagePlus, LoaderCircle, ShieldCheck, Sparkles } from 'lucide-react';

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export default function RemoveBackgroundPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const previewUrlRef = useRef('');
  const resultUrlRef = useRef('');

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  const selectFile = (selected: File | undefined) => {
    setError('');
    setStatus('');
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    previewUrlRef.current = '';
    resultUrlRef.current = '';
    setPreviewUrl('');
    setResultUrl('');

    if (!selected) {
      setFile(null);
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
      setFile(null);
      setError('Choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFile(null);
      setError('This tool accepts images up to 25 MB.');
      return;
    }

    previewUrlRef.current = URL.createObjectURL(selected);
    setPreviewUrl(previewUrlRef.current);
    setFile(selected);
  };

  const removeBackground = async () => {
    if (!file) return;

    setProcessing(true);
    setError('');
    setStatus('Loading the AI model…');
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = '';
    setResultUrl('');

    try {
      const { removeImageBackground } = await import('./localBackgroundRemoval');
      const output = await removeImageBackground(file, (progress) => {
        if (progress.status === 'fallback') {
          setStatus('WebGPU is unavailable. Switching to compatibility mode…');
        } else if (progress.status === 'progress' && typeof progress.progress === 'number') {
          setStatus(`Downloading AI model: ${Math.round(progress.progress)}%`);
        } else if (progress.status === 'ready') {
          setStatus('AI model ready. Removing the background…');
        }
      });
      resultUrlRef.current = URL.createObjectURL(output);
      setResultUrl(resultUrlRef.current);
      setStatus('');
    } catch (failure) {
      console.error('Local background removal failed:', failure);
      setError(failure instanceof Error ? failure.message : 'Background removal failed. Please try again.');
      setStatus('');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    previewUrlRef.current = '';
    resultUrlRef.current = '';
    setFile(null);
    setPreviewUrl('');
    setResultUrl('');
    setError('');
    setStatus('');
  };

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
          <Sparkles className="h-4 w-4" />
          Free browser-based AI
        </span>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Remove an image background</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
          Make a transparent PNG cutout in your browser. Your image is not uploaded; the AI model downloads the first time and is cached for future visits.
        </p>
      </header>

      <section className="mx-auto mt-10 grid gap-5 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-3xl border border-border bg-surface p-5 sm:p-7">
          <label
            htmlFor="background-image"
            className={`flex min-h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-accent/40 bg-accent/[0.03] p-6 text-center transition-colors hover:bg-accent/[0.07] ${processing ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}
          >
            <ImagePlus className="h-9 w-9 text-accent" />
            <span className="mt-3 font-bold">{file ? file.name : 'Choose an image'}</span>
            <span className="mt-1 text-xs text-muted">JPEG, PNG, or WebP · up to 25 MB</span>
            <input
              id="background-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={processing}
              onChange={(event) => {
                selectFile(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
          </label>

          {error && <p role="alert" className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p>}

          <button
            type="button"
            onClick={removeBackground}
            disabled={!file || processing}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing
              ? <><LoaderCircle className="h-4 w-4 animate-spin" />{status || 'Processing locally…'}</>
              : 'Remove background'}
          </button>

          {file && !processing && (
            <button type="button" onClick={reset} className="mt-3 w-full rounded-xl px-4 py-2 text-sm font-semibold text-muted hover:text-foreground">
              Start with a different image
            </button>
          )}
        </div>

        <div className="rounded-3xl border border-border bg-surface p-5 sm:p-7">
          <h2 className="font-bold">Preview</h2>
          {resultUrl ? (
            <div className="mt-4">
              <div
                className="flex min-h-56 items-center justify-center rounded-2xl p-4"
                style={{ backgroundImage: 'repeating-conic-gradient(#e2e8f0 0% 25%, #fff 0% 50%)', backgroundSize: '20px 20px' }}
              >
                <img src={resultUrl} alt="Image with background removed" className="max-h-80 max-w-full object-contain" />
              </div>
              <a
                href={resultUrl}
                download={`${file?.name.replace(/\.[^.]+$/, '') || 'image'}-transparent.png`}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-bold hover:border-accent hover:text-accent"
              >
                <ArrowDownToLine className="h-4 w-4" />
                Download transparent PNG
              </a>
            </div>
          ) : previewUrl ? (
            <div className="mt-4 flex min-h-56 items-center justify-center rounded-2xl bg-surface-elevated p-4">
              <img src={previewUrl} alt="Selected image before processing" className="max-h-80 max-w-full object-contain" />
            </div>
          ) : (
            <div className="mt-4 flex min-h-56 items-center justify-center rounded-2xl bg-surface-elevated text-sm text-muted">
              Your image preview will appear here.
            </div>
          )}
          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            Processing stays on this device. The first run downloads about 45 MB of AI model files; images over 2048 px are reduced before processing to help prevent memory issues.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Need other dimensions? <Link href="/tools?tool=resize" className="font-semibold text-accent hover:underline">Use standard resizing</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
