import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { PageTransition } from "@/components/providers/PageTransition";
import { MusicProvider } from "@/components/audio/MusicProvider";
import { TimeLapseProvider } from "@/components/animations/TimeLapseProvider";
import { MLModelCacheProvider } from "@/components/providers/MLModelCacheProvider";
import { CursorProvider, CustomCursor } from "@/components/cursor";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { SITE_CONFIG, canonicalUrl } from "@/lib/seo";
import { PersonSchema } from "@/components/seo/PersonSchema";
import { WebSiteSchema } from "@/components/seo/WebSiteSchema";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: SITE_CONFIG.title,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  keywords: [
    "systems architect",
    "creative technologist",
    "AI solutions",
    "enterprise automation",
    "interactive experiences",
    "WebGL",
    "generative AI",
    "portfolio",
    "Quang Luong",
  ],
  authors: [{ name: SITE_CONFIG.name, url: SITE_CONFIG.url }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,
  openGraph: {
    type: "website",
    locale: SITE_CONFIG.locale,
    url: canonicalUrl("/"),
    siteName: SITE_CONFIG.name,
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    images: [
      {
        url: "/og/home.png",
        width: 1200,
        height: 630,
        alt: "Quang Luong - Systems Architect & Creative Technologist",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    images: ["/og/home.png"],
    creator: SITE_CONFIG.twitterHandle,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <PersonSchema />
        <WebSiteSchema />
        <Script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "27578cdb8c824407814c136efddbf70e"}'
        />
      </head>
      <body className={`${poppins.variable} font-sans antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-lg focus:text-sm focus:font-medium"
        >
          Skip to main content
        </a>
        <CursorProvider>
          <MLModelCacheProvider>
            <MusicProvider>
              <TimeLapseProvider>
                <SmoothScrollProvider>
                  <PageTransition>
                    {children}
                  </PageTransition>
                </SmoothScrollProvider>
              </TimeLapseProvider>
            </MusicProvider>
          </MLModelCacheProvider>
          <CustomCursor />
        </CursorProvider>
      </body>
    </html>
  );
}
