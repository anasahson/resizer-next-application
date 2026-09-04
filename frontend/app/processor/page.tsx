'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /processor is a legacy route — the full image resizer is now on the homepage.
 * Redirect users there automatically.
 */
export default function ProcessorRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/#resizer-studio');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted text-sm">Redirecting to Image Resizer…</p>
      </div>
    </div>
  );
}
