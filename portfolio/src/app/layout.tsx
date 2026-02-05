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

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Quang Luong | Maker",
  description: "Creative software engineer with a passion for building beautiful, functional experiences.",
  keywords: ["software engineer", "portfolio", "creative developer", "game development"],
  authors: [{ name: "Quang Luong" }],
  openGraph: {
    title: "Quang Luong | Maker",
    description: "Creative software engineer with a passion for building beautiful, functional experiences.",
    type: "website",
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
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-C3Y8KL4145"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-C3Y8KL4145');
          `}
        </Script>
      </head>
      <body className={`${poppins.variable} font-sans antialiased`}>
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
