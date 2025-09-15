import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Kanva Sales Goals Tracker',
  description: 'Track and achieve your sales goals with real-time Copper CRM integration',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#363636',
              boxShadow: '0 4px 6px -1px rgba(147, 213, 0, 0.1), 0 2px 4px -1px rgba(147, 213, 0, 0.06)',
            },
            success: {
              iconTheme: {
                primary: '#93D500',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
        
        {/* Copper SDK Script */}
        {typeof window !== 'undefined' && window.self !== window.top && (
          <script
            src={process.env.NEXT_PUBLIC_COPPER_SDK_URL}
            async
          />
        )}
      </body>
    </html>
  );
}