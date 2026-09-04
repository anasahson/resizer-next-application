'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /referral is consolidated inside the user dashboard.
 * Redirect users to the dashboard where the referral section lives.
 */
export default function ReferralRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted text-sm">Redirecting to your Dashboard…</p>
      </div>
    </div>
  );
}
