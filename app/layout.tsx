import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "./components/AppShell";
import "katex/dist/katex.min.css";
import Script from "next/script"; // 🚀 Imported Next.js high-performance Script wrapper

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Study Engine",
  description: "An academic study workspace grounded in real sources",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Automatically processes and beautifully renders all mathematical notation on the page */}
        <Script
          src="https://jsdelivr.net"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
