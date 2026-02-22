import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';
import { AuthProvider } from '@/providers/auth-provider';
import { MotionProvider } from '@/providers/motion-provider';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Instrument_Serif, Space_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
});

const spaceMono = Space_Mono({
  variable: '--font-space-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://getriven.io'),

  title: {
    default: 'Riven | Your Intelligent Unified Workspace Environment',
    template: '%s | Riven',
  },

  description: 'Stop contorting your workflows to fit rigid tools. Riven adapts to you.',

  keywords: [
    'crm',
    'workspace',
    'operational environment',
    'workflow automation',
    'business tools',
    'saas',
    'founders',
    'startups',
  ],

  openGraph: {
    title: 'Riven | Build a CRM that fits your business',
    description: 'Stop contorting your workflows to fit rigid tools. Riven adapts to you.',
    url: 'https://getriven.io',
    siteName: 'Riven',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Riven - Build a CRM that fits your business',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Riven | Build a CRM that fits your business',
    description: 'Stop contorting your workflows to fit rigid tools. Riven adapts to you.',
    images: ['/og-image.png'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${spaceMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          themes={['light', 'dark', 'amber']}
          disableTransitionOnChange
        >
          <MotionProvider>
            <QueryProvider>
              <AuthProvider>
                <Navbar />
                {children}
                <Footer />
              </AuthProvider>
            </QueryProvider>
          </MotionProvider>
          <Toaster richColors position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
