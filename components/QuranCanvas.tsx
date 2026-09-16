"use client";

import React, { useEffect, useImperativeHandle, useRef, forwardRef, useState } from "react";
import { VerseData } from "@/lib/quranData";
import { CardDesign, RenderAnim, renderCard, ensureFonts, loadImage, physicalSize } from "@/lib/renderer";

export interface QuranCanvasHandle {
  canvas: HTMLCanvasElement | null;
  /** إعادة الرسم بحالة حركة معينة (للفيديو) */
  draw: (anim?: RenderAnim, verseOverride?: VerseData, slate?: { title: string; subtitle: string } | null) => void;
  media: () => HTMLImageElement | HTMLVideoElement | null;
}

interface Props {
  verse: VerseData;
  design: CardDesign;
  langCode: string;
  className?: string;
  onReady?: () => void;
}

const isVideoUrl = (u: string) => /\.(mp4|webm|mov)(\?|$)/i.test(u) || u.startsWith("video:");

const QuranCanvas = forwardRef<QuranCanvasHandle, Props>(function QuranCanvas({ verse, design, langCode, className, onReady }, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null);
  const rafRef = useRef<number>(0);
  const [mediaReady, setMediaReady] = useState(0);
  const latest = useRef({ verse, design, langCode });
  latest.current = { verse, design, langCode };

  // تحميل الخلفية (صورة / فيديو)
  useEffect(() => {
    let cancelled = false;
    const url = design.bgUrl;
    cancelAnimationFrame(rafRef.current);
    if (mediaRef.current instanceof HTMLVideoElement) {
      mediaRef.current.pause();
      mediaRef.current.src = "";
    }
    mediaRef.current = null;

    if (!url || url.startsWith("gradient:")) {
      setMediaReady((n) => n + 1);
      return;
    }
    if (isVideoUrl(url)) {
      const v = document.createElement("video");
      v.crossOrigin = "anonymous";
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.src = url.replace(/^video:/, "");
      v.onloadeddata = () => {
        if (cancelled) return;
        mediaRef.current = v;
        v.play().catch(() => {});
        setMediaReady((n) => n + 1);
      };
      v.onerror = () => !cancelled && setMediaReady((n) => n + 1);
      return () => {
        cancelled = true;
        v.pause();
      };
    }
    loadImage(url).then((img) => {
      if (cancelled) return;
      mediaRef.current = img;
      setMediaReady((n) => n + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [design.bgUrl]);

  const draw = (anim?: RenderAnim, verseOverride?: VerseData, slate?: { title: string; subtitle: string } | null) => {
    const c = canvasRef.current;
    if (!c) return;
    const { verse: v, design: d, langCode: l } = latest.current;
    renderCard(c, { verse: verseOverride || v, design: d, langCode: l, media: mediaRef.current, anim, slate: slate || null });
  };

  // الرسم عند أي تغيير + حلقة مستمرة لخلفيات الفيديو
  useEffect(() => {
    let alive = true;
    (async () => {
      await ensureFonts(design);
      if (!alive) return;
      draw();
      onReady?.();
      if (mediaRef.current instanceof HTMLVideoElement) {
        const loop = () => {
          if (!alive) return;
          draw();
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      }
    })();
    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verse, design, langCode, mediaReady]);

  useImperativeHandle(ref, () => ({
    get canvas() {
      return canvasRef.current;
    },
    draw,
    media: () => mediaRef.current,
  }));

  const [pw, ph] = physicalSize(design.aspect, design.resolution);

  return (
    <div className={`relative flex items-center justify-center ${className || ""}`}>
      <canvas
        ref={canvasRef}
        width={pw}
        height={ph}
        className="max-h-[72vh] max-w-full rounded-2xl object-contain shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/10"
        style={{ aspectRatio: `${pw}/${ph}` }}
      />
      <span dir="ltr" className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-gold-300 ring-1 ring-gold-500/40">
        {pw}×{ph}
      </span>
    </div>
  );
});

export default QuranCanvas;
