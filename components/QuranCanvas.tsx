"use client";

import React, { useRef, useEffect } from "react";
import { VerseData } from "@/lib/quranData";

interface QuranCanvasProps {
  verse: VerseData;
  bgImageUrl: string;
  aspectRatio: "1:1" | "9:16" | "16:9";
  showTafseer: boolean;
  showTranslation: boolean;
  selectedLangCode: string;
  fontSize: number;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export default function QuranCanvas({
  verse,
  bgImageUrl,
  aspectRatio,
  showTafseer,
  showTranslation,
  selectedLangCode,
  fontSize,
  onCanvasReady
}: QuranCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 1080;
    let height = 1080;
    if (aspectRatio === "9:16") height = 1920;
    if (aspectRatio === "16:9") height = 607;

    canvas.width = width;
    canvas.height = height;

    const bgImage = new Image();
    bgImage.crossOrigin = "anonymous";
    bgImage.src = bgImageUrl;

    const renderContent = () => {
      // 1. تظليل سينمائي متعدد الطبقات (Vignette & Gradient Overlay)
      ctx.drawImage(bgImage, 0, 0, width, height);
      
      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, width * 0.1,
        width / 2, height / 2, width * 0.75
      );
      gradient.addColorStop(0, "rgba(15, 23, 42, 0.55)");
      gradient.addColorStop(1, "rgba(2, 6, 23, 0.88)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 2. إطار زخرفي احترافي محيط بالبطاقة
      ctx.strokeStyle = "rgba(245, 158, 11, 0.35)";
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 24, width - 48, height - 48);

      // 3. الترويسة العليا (اسم السورة والآية بزخرفة ذهبية)
      ctx.direction = "rtl";
      ctx.font = "bold 34px 'Traditional Arabic', serif";
      ctx.fillStyle = "#F59E0B";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
      ctx.shadowBlur = 10;
      
      const topY = height * (aspectRatio === "9:16" ? 0.12 : 0.09);
      ctx.fillText(`۝ سُورَةُ ${verse.surahName} - آيَة (${verse.verseNumber}) ۝`, width / 2, topY);

      // 4. النص القرآني العثماني بالخط الذهبي الفاخر
      ctx.font = `bold ${fontSize}px 'Traditional Arabic', serif`;
      ctx.fillStyle = "#FDE047";
      ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
      ctx.shadowBlur = 16;

      const verseY = height * (aspectRatio === "9:16" ? 0.28 : aspectRatio === "16:9" ? 0.32 : 0.28);
      const maxVerseWidth = width * 0.84;
      const vWords = `﴿ ${verse.textUthmani} ﴾`.split(" ");
      let vLine = "";
      let vCurrentY = verseY;

      for (let n = 0; n < vWords.length; n++) {
        const testLine = vLine + vWords[n] + " ";
        if (ctx.measureText(testLine).width > maxVerseWidth && n > 0) {
          ctx.fillText(vLine, width / 2, vCurrentY);
          vLine = vWords[n] + " ";
          vCurrentY += fontSize * 1.25;
        } else {
          vLine = testLine;
        }
      }
      ctx.fillText(vLine, width / 2, vCurrentY);

      let nextSectionY = vCurrentY + (aspectRatio === "16:9" ? 35 : 50);

      // 5. الترجمة العالمية
      const translatedText = verse.translations[selectedLangCode];
      if (showTranslation && translatedText) {
        ctx.shadowBlur = 0;
        ctx.direction = selectedLangCode === "ur" ? "rtl" : "ltr";
        ctx.font = "italic 22px sans-serif";
        ctx.fillStyle = "#E2E8F0";

        const maxTransWidth = width * 0.82;
        const tWords = translatedText.split(" ");
        let tLine = "";

        for (let n = 0; n < tWords.length; n++) {
          const testLine = tLine + tWords[n] + " ";
          if (ctx.measureText(testLine).width > maxTransWidth && n > 0) {
            ctx.fillText(tLine, width / 2, nextSectionY);
            tLine = tWords[n] + " ";
            nextSectionY += 30;
          } else {
            tLine = testLine;
          }
        }
        ctx.fillText(tLine, width / 2, nextSectionY);
        nextSectionY += 45;
      }

      // 6. التفسير العربي المعتمد
      if (showTafseer && verse.tafseerArabic) {
        ctx.shadowBlur = 0;
        ctx.direction = "rtl";
        
        ctx.font = "bold 23px sans-serif";
        ctx.fillStyle = "#F59E0B";
        ctx.fillText("📖 التَّفْسِيرُ الْمُعْتَمَدُ:", width / 2, nextSectionY);

        ctx.font = "20px sans-serif";
        ctx.fillStyle = "#F8FAFC";
        
        const maxTextWidth = width * 0.84;
        const tafseerWords = verse.tafseerArabic.split(" ");
        let tafLine = "";
        let tafCurrentY = nextSectionY + 36;

        for (let n = 0; n < tafseerWords.length; n++) {
          const testLine = tafLine + tafseerWords[n] + " ";
          if (ctx.measureText(testLine).width > maxTextWidth && n > 0) {
            ctx.fillText(tafLine, width / 2, tafCurrentY);
            tafLine = tafseerWords[n] + " ";
            tafCurrentY += 32;
          } else {
            tafLine = testLine;
          }
        }
        ctx.fillText(tafLine, width / 2, tafCurrentY);
      }

      // 7. توثيق مجمع الملك فهد لطباعة المصحف الشريف
      ctx.direction = "rtl";
      ctx.font = "17px sans-serif";
      ctx.fillStyle = "#94A3B8";
      const footerY = height - (aspectRatio === "9:16" ? 60 : 35);
      ctx.fillText("✨ موثق من مجمع الملك فهد لطباعة المصحف الشريف ✨", width / 2, footerY);

      if (onCanvasReady) onCanvasReady(canvas);
    };

    bgImage.onload = renderContent;
    if (bgImage.complete) renderContent();
  }, [verse, bgImageUrl, aspectRatio, showTafseer, showTranslation, selectedLangCode, fontSize]);

  return (
    <div className="relative group flex justify-center items-center shadow-2xl rounded-3xl overflow-hidden border border-slate-700/80 bg-slate-950 p-2 transition-all duration-300 hover:border-emerald-500/50">
      <canvas ref={canvasRef} className="max-w-full h-auto max-h-[72vh] object-contain rounded-2xl shadow-inner" />
    </div>
  );
}