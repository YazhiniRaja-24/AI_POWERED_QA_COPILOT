import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'QA Copilot — AI-powered quality intelligence',
  description:
    'AI-powered quality intelligence for modern software teams.',
  openGraph: {
    title: 'QA Copilot',
    description:
      'AI-powered quality intelligence for modern software teams.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster theme="dark" position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
