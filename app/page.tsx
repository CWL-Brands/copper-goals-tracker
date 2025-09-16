'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { copperIntegration } from '@/lib/copper/integration';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if we're in Copper iframe
    const checkEnvironment = async () => {
      const isInIframe = window.self !== window.top;
      
      if (isInIframe) {
        // We're in Copper, initialize SDK
        await copperIntegration.init();
        console.log('Running in Copper iframe');
      }
      
      // Redirect to dashboard (preserve Copper iframe query params, if any)
      const qs = typeof window !== 'undefined' ? window.location.search : '';
      router.push(`/dashboard${qs}`);
    };

    checkEnvironment();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-kanva-lightGreen to-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-kanva-green rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
          <svg
            className="w-12 h-12 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Kanva Sales Goals Tracker
        </h1>
        <p className="text-gray-600">Loading your dashboard...</p>
      </div>
    </div>
  );
}