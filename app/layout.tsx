import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ServiceWorkerProvider } from "@/components/ServiceWorkerProvider";
import { NetworkStatusIndicator } from "@/components/NetworkStatusIndicator";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono", 
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Pokédeck - Your Personal Pokémon Collection",
  description: "Discover, collect, and learn about all your favorite Pokémon with our modern Pokédeck application.",
  keywords: ["pokemon", "pokedeck", "pokedex", "collection", "pokemon api"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://raw.githubusercontent.com"
        />
        <link
          rel="preconnect"
          href="https://pokeapi.co"
        />
        <link
          rel="dns-prefetch"
          href="https://assets.pokemon.com"
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @font-face {
                font-family: 'Geist-fallback';
                font-style: normal;
                font-weight: 100 900;
                font-display: swap;
                src: local('Arial'), local('Helvetica'), local('sans-serif');
                size-adjust: 105%;
                ascent-override: 92%;
                descent-override: 23%;
                line-gap-override: 0%;
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning={true}
      >
        <ErrorBoundary>
          {/* Skip links for keyboard navigation */}
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <a href="#navigation" className="skip-link">
            Skip to navigation
          </a>
          
          <ServiceWorkerProvider />
          <NetworkStatusIndicator />
          <Header />
          <main id="main-content" className="flex-1" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </ErrorBoundary>
      </body>
    </html>
  );
}
