import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';
import { RealtimeProvider } from '@/lib/realtime-context';
import { AppShell } from '@/components/layout/app-shell';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Call Agent - Enterprise Admin Dashboard & Telephony Management',
  description: 'Unified administrative control plane for AI virtual receptionist, bilingual voice AI, spam detection, smart routing, and live call management.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 min-h-screen antialiased selection:bg-indigo-500 selection:text-white`}>
        <AuthProvider>
          <ThemeProvider>
            <RealtimeProvider>
              <AppShell>{children}</AppShell>
            </RealtimeProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
