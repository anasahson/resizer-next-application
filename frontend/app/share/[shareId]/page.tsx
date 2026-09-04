'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Zap, ArrowRight, CheckCircle2, TrendingDown, Sparkles, Shield, Clock, Maximize2, Share2, Copy, Check } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
  || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '')
  || 'http://localhost:5000';

interface ShareResult {
  share_id: string;
  original_size: number;
  output_size: number;
  savings_percent: number;
  format: string;
  width: number;
  height: number;
  compression_time_ms: number;
  view_count?: number;
  created_at: string;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export default function SharedResultPage() {
  const params = useParams();
  const shareId = params?.shareId as string;

  const [data, setData] = useState<ShareResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!shareId) return;

    fetch(`${BACKEND_URL}/api/share/${shareId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Share link expired or not found');
        return res.json();
      })
      .then((json) => {
        if (json.success && json.result) {
          setData(json.result);
        } else {
          throw new Error('Invalid share data');
        }
      })
      .catch((err) => {
        setError(err.message || 'Share result not found');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [shareId]);

  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted text-sm">Loading shared optimization card...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-5 bg-surface-elevated dark:bg-zinc-900 border border-border p-8 rounded-3xl shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto text-2xl">
            ⚠️
          </div>
          <h1 className="text-2xl font-extrabold text-primary dark:text-white">Link Expired or Not Found</h1>
          <p className="text-muted text-sm">
            This shared compression link has expired or does not exist. You can compress and resize your own images for free!
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-md"
          >
            <span>Start Resizing Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const savingsNum = Math.max(0, Math.round(Number(data.savings_percent) || 0));

  return (
    <div className="min-h-[85vh] py-12 px-4 sm:px-6 max-w-3xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Verified Image Optimization Result</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-primary dark:text-white tracking-tight">
          Reduced by <span className="text-emerald-500">-{savingsNum}%</span> Without Quality Loss
        </h1>
        <p className="text-muted text-sm sm:text-base max-w-lg mx-auto">
          This image was processed and compressed with Resizer's high-efficiency image optimization pipeline.
        </p>
      </div>

      {/* Hero Stats Card */}
      <div className="relative rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 via-surface-elevated to-surface-elevated dark:from-emerald-500/10 dark:via-zinc-900 dark:to-zinc-900 p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Big Savings Metric */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-surface dark:bg-zinc-950 border border-border">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">Original Size</span>
            <span className="text-xl sm:text-2xl font-extrabold font-mono text-primary dark:text-white">
              {formatBytes(data.original_size)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-surface dark:bg-zinc-950 border border-border">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider block mb-1">Optimized Size</span>
            <span className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {formatBytes(data.output_size)}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">Total Savings</span>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              -{savingsNum}%
            </span>
          </div>
        </div>

        {/* Technical Specs Details */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs py-3 border-y border-border">
          <div>
            <span className="text-muted block text-[10px] uppercase font-bold">Format</span>
            <span className="font-extrabold font-mono uppercase text-primary dark:text-white">
              {data.format || 'WEBP'}
            </span>
          </div>
          <div>
            <span className="text-muted block text-[10px] uppercase font-bold">Dimensions</span>
            <span className="font-extrabold font-mono text-primary dark:text-white">
              {data.width} × {data.height} px
            </span>
          </div>
          <div>
            <span className="text-muted block text-[10px] uppercase font-bold">Speed</span>
            <span className="font-extrabold font-mono text-primary dark:text-white">
              {data.compression_time_ms ? `${data.compression_time_ms}ms` : 'Instant'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Link
            href="/"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-xl shadow-blue-500/25 transition-all hover:scale-[1.01] active:scale-95"
          >
            <Zap className="w-5 h-5" />
            <span>Resize &amp; Compress Your Own Images Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-2.5 px-4 rounded-xl bg-surface dark:bg-zinc-800 border border-border hover:border-primary text-xs font-semibold text-primary dark:text-white flex items-center justify-center gap-2 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Link Copied!' : 'Copy Share Link'}</span>
            </button>
            <Link
              href="/pricing"
              className="py-2.5 px-4 rounded-xl bg-surface dark:bg-zinc-800 border border-border hover:border-primary text-xs font-semibold text-primary dark:text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>View Plans</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-2xl bg-surface-elevated dark:bg-zinc-900 border border-border flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-primary dark:text-white">100% Private</h4>
            <p className="text-[11px] text-muted mt-0.5">Images are processed and never stored permanently.</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-elevated dark:bg-zinc-900 border border-border flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-primary dark:text-white">Ultra Fast</h4>
            <p className="text-[11px] text-muted mt-0.5">High performance backend with Sharp image engine.</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-elevated dark:bg-zinc-900 border border-border flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
            <Maximize2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-primary dark:text-white">Next-Gen Formats</h4>
            <p className="text-[11px] text-muted mt-0.5">Supports WebP, AVIF, JPG, and PNG with batch export.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
