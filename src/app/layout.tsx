import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientBody from "./ClientBody";
import { Analytics } from "@/components/Analytics";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { StructuredData } from "@/components/StructuredData";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Remove Watermark AI - AI Image Watermark Remover | Professional AI Tool",
    template: "%s | Remove Watermark AI"
  },
  description: "Professional AI image watermark remover powered by Remove Watermark AI. Remove watermarks from images with advanced AI technology. Free watermark removal tool.",
  keywords: [
    "remove watermark ai",
    "ai watermark remover",
    "image watermark removal",
    "ai image tool",
    "remove watermark",
    "ai art",
    "ai image editing"
  ],
  authors: [{ name: "Remove Watermark AI Team" }],
  creator: "Remove Watermark AI",
  publisher: "Remove Watermark AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://remove-watermark-ai.com'),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-RNCEF1BNCV"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-RNCEF1BNCV');
            `,
          }}
        />
        <StructuredData />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ErrorBoundary>
          <AuthProvider>
            <ClientBody>
              {children}
            </ClientBody>
            <Analytics />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

