import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import AuthProvider from '@/components/AuthProvider';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Monster — Ad-Free High Quality Audio Streaming',
  description: 'Bypass streaming limits. Import any song from YouTube into your personal cloud library.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Monster',
  },
};

export const viewport: Viewport = {
  themeColor: '#070609',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
