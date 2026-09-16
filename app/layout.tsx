import React from "react";
import "./globals.css";

export const metadata = {
  title: "منصة ونشر الآيات القرآنية المعتمدة | Quran Innovative Hub",
  description: "مولد منشورات قرآنية معتمد ومستند إلى مجمع الملك فهد لطباعة المصحف الشريف",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-slate-950 text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}