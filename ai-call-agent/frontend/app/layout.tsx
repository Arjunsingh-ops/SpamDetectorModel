import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';
import { RealtimeProvider } from '@/lib/realtime-context';
import { AppShell } from '@/components/layout/app-shell';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'AI Call Agent | Enterprise Telephony Control Plane',
  description: 'Unified administrative control plane for AI virtual receptionist, bilingual voice AI, multi-signal spam detection, smart PSTN routing, and real-time call analytics.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var p = localStorage.getItem('theme_preference') || 'system';
                  var isDark = p === 'dark' || (p === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  document.documentElement.classList.toggle('dark', isDark);
                  document.documentElement.classList.toggle('light', !isDark);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${inter.className} min-h-screen antialiased bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-150`}>
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
