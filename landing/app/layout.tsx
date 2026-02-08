import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://riven.dev'),

  title: {
    default: 'Riven | Build a CRM that fits your business',
    template: '%s | Riven'
  },

  description: 'Stop contorting your workflows to fit rigid tools. Riven adapts to you.',

  keywords: [
    'crm',
    'custom crm',
    'flexible crm',
    'workflow automation',
    'business tools',
    'saas',
    'founders',
    'startups'
  ],

  openGraph: {
    title: 'Riven | Build a CRM that fits your business',
    description: 'Stop contorting your workflows to fit rigid tools. Riven adapts to you.',
    url: 'https://riven.dev',
    siteName: 'Riven',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Riven - Build a CRM that fits your business'
      }
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          themes={["light", "dark", "amber"]}
          disableTransitionOnChange
        >
          <QueryProvider>{children}</QueryProvider>
          <Toaster richColors position="bottom-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
