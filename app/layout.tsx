import React from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quran Innovative Hub | منصة توليد بطاقات وفيديوهات القرآن الكريم 4K",
  description:
    "استوديو متكامل لإنتاج بطاقات ومقاطع قرآنية بدقة 4K — نص عثماني موثق، 20 قارئاً، 9 تفاسير، 18 لغة ترجمة، وقوالب بث فضائي احترافية.",
  manifest: "/manifest.json",
  icons: { icon: "/icons/icon.svg" },
  openGraph: {
    title: "Quran Innovative Hub 4K",
    description: "مولّد بطاقات ومقاطع قرآنية معتمدة بدقة 4K",
    type: "website",
    locale: "ar_SA",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a1512",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;800&family=Amiri+Quran&family=Amiri:wght@400;700&family=Scheherazade+New:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Aref+Ruqaa:wght@400;700&family=Reem+Kufi:wght@400;500;600;700&family=Lateef:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://api.alquran.cloud" />
        <link rel="preconnect" href="https://cdn.islamic.network" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
      </head>
      <body className="pattern-bg min-h-screen font-sans text-slate-100 antialiased" style={{ fontFamily: "Cairo, Tajawal, system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
