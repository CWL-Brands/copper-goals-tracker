'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const em = email.trim().toLowerCase();
    if (!em) return setError('Email is required');

    setStatus('sending');
    try {
      await resetPassword(em);
      setStatus('sent');
    } catch (e: any) {
      setError(e?.message || 'Failed to send reset email');
      setStatus('error');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-sm p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-kanva-green">Reset Password</h1>
          <p className="text-sm text-gray-600">Enter your Kanva Botanicals email to receive a reset link.</p>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</div>
        )}

        {status === 'sent' ? (
          <div className="text-center text-sm text-gray-700">
            If an account exists for that email, a reset link has been sent.
            <div className="mt-4">
              <a href="/login" className="text-kanva-green hover:underline">Back to login</a>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-kanva-green"
                placeholder="name@kanvabotanicals.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={status === 'sending'}
              className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-md text-white ${status === 'sending' ? 'bg-gray-400' : 'bg-kanva-green hover:bg-green-600'}`}
            >
              {status === 'sending' ? 'Sending…' : 'Send reset link'}
            </button>
            <div className="text-center">
              <a href="/login" className="text-sm text-gray-600 hover:underline">Back to login</a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
