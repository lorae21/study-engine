import type { Metadata } from "next";
import { Source_Serif_4, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";

const display = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display-src",
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans-src",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-src",
});

export const metadata: Metadata = {
  title: "Study Engine",
  description: "A grounded research workspace for STEM students",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <div style={{ display: "flex", minHeight: "100vh", width: "100%" }}>
          <Sidebar />
          <main
            style={{
              flex: 1,
              background: "var(--paper)",
              color: "var(--ink)",
              minWidth: 0,
            }}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
