'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowDownToLine, ImagePlus, LoaderCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { getActiveAuthToken, useAuth } from '../context/AuthContext';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '')
  || '';

type ServiceStatus = {
  available: boolean;
  configured: boolean;
};

export default function RemoveBackgroundPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [statusError, setStatusError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const previewUrlRef = useRef('');
  const [resultUrl, setResultUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  useEffect(() => {
    if (!resultUrl) return;
    return () => URL.revokeObjectURL(resultUrl);
  }, [resultUrl]);

  useEffect(() => {
    if (authLoading || !user) return;

    let active = true;
    const loadStatus = async () => {
      const activeToken = getActiveAuthToken();
      if (!activeToken) return;

      try {
        const response = await fetch(`${BACKEND_URL}/api/images/remove-background/status`, {
          headers: { Authorization: `Bearer ${activeToken.token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not check background removal availability.');
        if (active) setServiceStatus(data);
      } catch (statusFailure) {
        if (active) {
          setStatusError(statusFailure instanceof Error ? statusFailure.message : 'Could not check service status.');
        }
      }
    };

    void loadStatus();
    return () => {
      active = false;
    };
  }, [authLoading, user]);

  const selectFile = (selected: File | undefined) => {
    setError('');
    setResultUrl('');
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = '';
    }
    if (!selected) {
      setFile(null);
      setPreviewUrl('');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
      setFile(null);
      setPreviewUrl('');
      setError('Choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setFile(null);
      setPreviewUrl('');
      setError('This tool accepts images up to 10 MB.');
      return;
    }
    previewUrlRef.current = URL.createObjectURL(selected);
    setPreviewUrl(previewUrlRef.current);
    setFile(selected);
  };

  const removeBackground = async () => {
    if (!file) return;
    const activeToken = getActiveAuthToken();
    if (!activeToken) {
      setError('Please sign in again to use background removal.');
      return;
    }

    setProcessing(true);
    setError('');
    setResultUrl('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch(`${BACKEND_URL}/api/images/remove-background`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${activeToken.token}` },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || `Background removal failed (HTTP ${response.status}).`);
      }

      const output = await response.blob();
      if (!output.type.startsWith('image/')) {
        throw new Error('The image service returned an unsupported result.');
      }
      setResultUrl(URL.createObjectURL(output));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Background removal failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
          <Sparkles className="h-4 w-4" />
          AI Studio
        </span>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">Remove an image background</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
          Upload a JPEG, PNG, or WebP to create a transparent PNG cutout. The image is sent to our
          configured background-removal provider only after you choose to process it.
        </p>
      </header>

      {!authLoading && !user ? (
        <section className="mx-auto mt-10 max-w-xl rounded-3xl border border-border bg-surface p-7 text-center">
          <ShieldCheck className="mx-auto h-8 w-8 text-accent" />
          <h2 className="mt-3 text-lg font-bold">Sign in to use AI processing</h2>
          <p className="mt-2 text-sm text-muted">This provider-backed tool is restricted to approved accounts.</p>
          <Link href="/login" className="mt-5 inline-flex rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white">
            Sign in
          </Link>
        </section>
      ) : (
        <section className="mx-auto mt-10 grid gap-5 lg:grid-cols-[1fr_0.85fr]">
          <div className="rounded-3xl border border-border bg-surface p-5 sm:p-7">
            <label
              htmlFor="background-image"
              className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-accent/40 bg-accent/[0.03] p-6 text-center transition-colors hover:bg-accent/[0.07]"
            >
              <ImagePlus className="h-9 w-9 text-accent" />
              <span className="mt-3 font-bold">{file ? file.name : 'Choose an image to upload'}</span>
              <span className="mt-1 text-xs text-muted">JPEG, PNG, or WebP · up to 10 MB</span>
              <input
                id="background-image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => {
                  selectFile(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
            </label>

            {error && <p role="alert" className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
            {statusError && <p role="alert" className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{statusError}</p>}

            <button
              type="button"
              onClick={removeBackground}
              disabled={!file || processing || serviceStatus?.available !== true}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Removing background…</> : 'Remove background'}
            </button>

            {!serviceStatus?.available && !statusError && !authLoading && user && (
              <p className="mt-3 text-center text-xs leading-relaxed text-muted">
                This tool is not enabled for this account yet. The server requires a provider key and an explicit account allowlist.
              </p>
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
            <p className="mt-4 text-xs leading-relaxed text-muted">
              AI processing uses the provider account’s quota. Your API key stays on the backend; images are not saved by this app.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Need larger dimensions? <Link href="/tools?tool=resize" className="font-semibold text-accent hover:underline">Use standard resizing</Link>.
              AI super-resolution is not enabled yet.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
