"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QuranCanvas, { QuranCanvasHandle } from "@/components/QuranCanvas";
import { Section, Toggle, Slider, SelectField, Segmented, Toasts, useToasts, useLocalState } from "@/components/ui";
import {
  fetchVerseDetails,
  fetchVerseRange,
  SURAHS,
  getSurah,
  BACKGROUND_LIBRARY,
  BACKGROUND_CATEGORIES,
  TAFSEER_OPTIONS,
  TRANSLATION_LANGUAGES,
  RECITERS_LIST,
  VerseData,
  ayahAudioFallbacks,
  randomVerseRef,
  toArabicDigits,
  clearQuranCache,
} from "@/lib/quranData";
import { CardDesign, DEFAULT_DESIGN, THEMES, QURAN_FONTS, PRESETS, physicalSize, AspectRatio, Resolution } from "@/lib/renderer";
import {
  exportImage,
  exportBatchZip,
  recordVideo,
  VideoJob,
  VideoOptions,
  buildCaption,
  downloadBlob,
  pickMime,
  finalizeShareableMp4,
  shareVideoFile,
  canFinalizeVideo,
} from "@/lib/exporter";
import {
  Download,
  Sparkles,
  Image as ImageIcon,
  Type,
  Globe,
  Pause,
  Play,
  Video,
  ChevronRight,
  ChevronLeft,
  Mic,
  BookOpen,
  Layers,
  Radio,
  Repeat,
  Palette,
  Film,
  Upload,
  Copy,
  Share2,
  Shuffle,
  RotateCcw,
  Settings2,
  Volume2,
  Gauge,
  Frame,
  SlidersHorizontal,
  Package,
  FileJson,
  StopCircle,
  Keyboard,
  Shield,
  Search,
  Wand2,
} from "lucide-react";

type Tab = "verse" | "design" | "audio" | "export";

const INITIAL_DESIGN: CardDesign = { ...DEFAULT_DESIGN, bgUrl: BACKGROUND_LIBRARY[0].url };

export default function Home() {
  // ─────────────── الحالة الأساسية ───────────────
  const [surah, setSurah] = useState<number>(111);
  const [verseNum, setVerseNum] = useState<number>(1);
  const [endVerseNum, setEndVerseNum] = useState<number>(5);
  const [reciterId, setReciterId] = useLocalState<string>("qh:reciter", "ar.hudhaify");
  const [tafseerId, setTafseerId] = useLocalState<string>("qh:tafseer", "muyassar");
  const [langCode, setLangCode] = useLocalState<string>("qh:lang", "en");
  const [design, setDesign] = useLocalState<CardDesign>("qh:design", INITIAL_DESIGN);
  const [videoOpts, setVideoOpts] = useLocalState<VideoOptions>("qh:video", {
    fps: 30,
    introSlate: true,
    outroSlate: true,
    slateSeconds: 3,
    gapSeconds: 0.6,
    repeat: 1,
    monitor: true,
    channelName: "",
  });

  const [verseData, setVerseData] = useState<VerseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("verse");
  const [surahQuery, setSurahQuery] = useState("");

  // الصوت
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [continuousPlay, setContinuousPlay] = useLocalState("qh:continuous", true);
  const [loopVerse, setLoopVerse] = useState(false);
  const [volume, setVolume] = useLocalState("qh:volume", 1);
  const [rate, setRate] = useState(1);
  const [audioProgress, setAudioProgress] = useState(0);

  // التصدير
  const canvasHandle = useRef<QuranCanvasHandle | null>(null);
  const [recording, setRecording] = useState<{ phase: string; percent: number; verseIndex: number; total: number } | null>(null);
  const jobRef = useRef<VideoJob | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null);
  const batchSignal = useRef({ cancelled: false });
  const [imageFormat, setImageFormat] = useState<"png" | "jpg" | "webp">("png");
  const [caption, setCaption] = useState("");
  const [lastVideo, setLastVideo] = useState<{ url: string; blob: Blob; ext: string; size: number; ready: boolean } | null>(null);
  const [finalizing, setFinalizing] = useState<{ stage: string; percent: number } | null>(null);
  const [readyForSocial, setReadyForSocial] = useLocalState("qh:readySocial", true);

  const { toasts, push, remove } = useToasts();
  const meta = getSurah(surah);
  const upd = useCallback((patch: Partial<CardDesign>) => setDesign((d) => ({ ...d, ...patch })), [setDesign]);

  // ─────────────── قراءة الرابط عند البدء ───────────────
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const s = parseInt(p.get("s") || "");
    const v = parseInt(p.get("v") || "");
    const to = parseInt(p.get("to") || "");
    if (s >= 1 && s <= 114) {
      setSurah(s);
      const m = getSurah(s);
      setVerseNum(v >= 1 && v <= m.ayahs ? v : 1);
      setEndVerseNum(to >= 1 && to <= m.ayahs ? to : Math.min(m.ayahs, (v || 1) + 4));
    }
    const r = p.get("r");
    if (r && RECITERS_LIST.some((x) => x.id === r)) setReciterId(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────── جلب بيانات الآية ───────────────
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchVerseDetails(surah, verseNum, reciterId, tafseerId, langCode)
      .then((data) => {
        if (!alive) return;
        setVerseData(data);
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        console.error("fetchVerseDetails effect", e);
        setLoading(false);
        push("error", "تعذّر تحميل هذه الآية — تحقق من الاتصال بالإنترنت وحاول مجدداً");
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surah, verseNum, reciterId, tafseerId, langCode]);

  // ضبط نطاق النهاية عند تغيير السورة
  useEffect(() => {
    setEndVerseNum((e) => Math.min(Math.max(e, verseNum), meta.ayahs));
  }, [surah, verseNum, meta.ayahs]);

  // ─────────────── مشغّل الصوت ───────────────
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
    }
    setIsPlaying(false);
    setAudioProgress(0);
  }, []);

  const playVerse = useCallback(
    (v: VerseData) => {
      if (!audioRef.current) audioRef.current = new Audio();
      const a = audioRef.current;
      const urls = Array.from(new Set([v.audioUrl, ...ayahAudioFallbacks(reciterId, v.surahNumber, v.verseNumber)]));
      let idx = 0;
      a.volume = volume;
      a.playbackRate = rate;
      a.src = urls[idx];
      a.onerror = () => {
        // نسجّل كل مصدر فشل في الكونسول لتسهيل التشخيص لاحقاً (Network tab / Console عند المستخدم)
        console.error("[audio] failed:", urls[idx], a.error?.code, a.error?.message);
        idx++;
        if (idx < urls.length) {
          a.src = urls[idx];
          a.play().catch(() => setIsPlaying(false));
        } else {
          push("error", `تعذّر تحميل صوت هذا القارئ رغم تجربة ${urls.length} مصادر مختلفة — تحقّق من اتصال الإنترنت أو جرّب قارئاً آخر`);
          setIsPlaying(false);
        }
      };
      a.ontimeupdate = () => setAudioProgress(a.duration ? a.currentTime / a.duration : 0);
      a.onended = () => {
        if (loopVerse) {
          a.currentTime = 0;
          a.play();
          return;
        }
        if (continuousPlay && verseNum < meta.ayahs) setVerseNum((p) => p + 1);
        else setIsPlaying(false);
      };
      a.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error("[audio] play() rejected:", err?.name, err?.message);
          setIsPlaying(false);
          if (err?.name === "NotAllowedError") {
            push("error", "المتصفح منع التشغيل التلقائي — اضغط زر التشغيل مباشرة لبدء الصوت");
          }
        });
    },
    [reciterId, volume, rate, loopVerse, continuousPlay, verseNum, meta.ayahs, push]
  );

  // متابعة التلاوة المستمرة عند تغيّر الآية
  const wasPlaying = useRef(false);
  useEffect(() => {
    wasPlaying.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    if (verseData && wasPlaying.current && !recording) playVerse(verseData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verseData]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = rate;
    }
  }, [volume, rate]);

  const toggleAudio = () => {
    if (!verseData) return;
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else if (audioRef.current && audioRef.current.src && audioRef.current.currentTime > 0 && !audioRef.current.ended) {
      audioRef.current.play().then(() => setIsPlaying(true));
    } else playVerse(verseData);
  };

  const goVerse = (n: number) => {
    stopAudio();
    setVerseNum(Math.min(meta.ayahs, Math.max(1, n)));
  };

  // ─────────────── اختصارات لوحة المفاتيح ───────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(tag)) return;
      if (e.code === "Space") {
        e.preventDefault();
        toggleAudio();
      } else if (e.key === "ArrowLeft") goVerse(verseNum + 1);
      else if (e.key === "ArrowRight") goVerse(verseNum - 1);
      else if (e.key.toLowerCase() === "s") handleDownload();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  // ─────────────── التصدير ───────────────
  const handleDownload = async () => {
    const c = canvasHandle.current?.canvas;
    if (!c || !verseData) return;
    canvasHandle.current?.draw({ t: 0, enter: 1, progress: 0 });
    await exportImage(c, verseData, imageFormat);
    push("success", `تم تنزيل البطاقة بدقة ${c.width}×${c.height}`);
  };

  const handleBatch = async () => {
    if (!verseData) return;
    batchSignal.current = { cancelled: false };
    setBatchProgress({ done: 0, total: endVerseNum - verseNum + 1 });
    try {
      const verses = await fetchVerseRange(surah, verseNum, endVerseNum, reciterId, tafseerId, langCode, (d, t) => setBatchProgress({ done: 0, total: t }));
      await exportBatchZip(verses, design, langCode, imageFormat === "jpg" ? "jpg" : "png", (d, t) => setBatchProgress({ done: d, total: t }), batchSignal.current);
      push("success", `تم تصدير ${verses.length} بطاقة في ملف ZIP`);
    } catch (e) {
      push("error", "فشل تصدير الدفعة");
    } finally {
      setBatchProgress(null);
    }
  };

  const handleVideo = async () => {
    const c = canvasHandle.current?.canvas;
    if (!c || !verseData || recording) return;
    stopAudio();
    setLastVideo(null);
    setRecording({ phase: "تحميل الآيات", percent: 0, verseIndex: 0, total: endVerseNum - verseNum + 1 });
    try {
      const verses = await fetchVerseRange(surah, verseNum, endVerseNum, reciterId, tafseerId, langCode);
      const job = recordVideo({
        canvas: c,
        draw: (anim, v, slate) => canvasHandle.current?.draw(anim, v, slate),
        verses,
        reciterId,
        design,
        options: { ...videoOpts, channelName: videoOpts.channelName || design.channelName },
        onProgress: (info) => setRecording(info),
      });
      jobRef.current = job;
      const result = await job.done;
      setRecording(null); // إخفاء لوحة "جاري التسجيل" قبل بدء مرحلة التحويل المنفصلة
      if (result) {
        let blob = result.blob;
        let ext = result.ext;
        const namePrefix = `Quran_${meta.name}_${verseNum}-${endVerseNum}_${c.width}x${c.height}`;
        // تحويل تلقائي لصيغة MP4 قياسية (moov غير مجزّأ + faststart) — حتى عندما يخرج المتصفح
        // "mp4" مباشرة فإن MediaRecorder غالباً يولّد حاوية مجزّأة (fragmented) لا تُفتح بشكل
        // موثوق في تطبيقات الجوال ومواقع التواصل؛ إعادة الترميز هنا تضمن ملفاً يعمل في كل مكان
        // بدون أي برامج أو تعديلات إضافية من المستخدم.
        if (readyForSocial && canFinalizeVideo()) {
          try {
            setFinalizing({ stage: "تحميل محرك التحويل", percent: 0 });
            const mp4 = await finalizeShareableMp4(blob, ext, {
              maxDimension: c.width >= 3000 ? 1920 : c.width,
              crf: 21,
              onStage: (stage) => setFinalizing((f) => ({ stage, percent: f?.percent ?? 0 })),
              onProgress: (percent) => setFinalizing((f) => ({ stage: f?.stage || "ترميز MP4 عالي الجودة", percent })),
            });
            blob = mp4;
            ext = "mp4";
          } catch (e) {
            console.error("finalize failed", e);
            push("info", "تم إنتاج الفيديو بصيغته الأصلية (تعذّر التحويل التلقائي لـ MP4)");
          } finally {
            setFinalizing(null);
          }
        }
        const name = `${namePrefix}.${ext}`;
        downloadBlob(blob, name);
        setLastVideo({ url: URL.createObjectURL(blob), blob, ext, size: blob.size, ready: ext === "mp4" });
        push("success", `تم إنتاج الفيديو (${(blob.size / 1048576).toFixed(1)} MB) بصيغة ${ext.toUpperCase()}${ext === "mp4" ? " — جاهز للنشر المباشر" : ""}`);
      } else push("info", "تم إلغاء التسجيل");
    } catch (e) {
      console.error(e);
      push("error", "تعذّر إنتاج الفيديو — تأكد من استخدام متصفح Chrome/Edge حديث");
    } finally {
      setRecording(null);
      setFinalizing(null);
      jobRef.current = null;
      canvasHandle.current?.draw();
    }
  };

  const handleShareVideo = async () => {
    if (!lastVideo) return;
    const filename = `Quran_${meta.name}_${verseNum}-${endVerseNum}.${lastVideo.ext}`;
    const res = await shareVideoFile(lastVideo.blob, filename, design.channelName || undefined);
    if (res === "shared") push("success", "تم فتح نافذة المشاركة");
    else if (res === "cancelled") return;
    else if (res === "unsupported") push("info", "المشاركة المباشرة غير مدعومة على هذا المتصفح/الجهاز — استخدم التنزيل ثم الرفع اليدوي");
    else push("error", "تعذّرت المشاركة المباشرة");
  };

  const handleCaption = async () => {
    const verses = await fetchVerseRange(surah, verseNum, endVerseNum, reciterId, tafseerId, langCode);
    const text = buildCaption(verses, langCode, design.channelName);
    setCaption(text);
    try {
      await navigator.clipboard.writeText(text);
      push("success", "تم نسخ نص المنشور إلى الحافظة");
    } catch {}
  };

  const shareLink = async () => {
    const url = `${location.origin}${location.pathname}?s=${surah}&v=${verseNum}&to=${endVerseNum}&r=${reciterId}`;
    try {
      await navigator.clipboard.writeText(url);
      push("success", "تم نسخ رابط المشاركة");
    } catch {
      push("info", url);
    }
  };

  const exportSettings = () => {
    const blob = new Blob([JSON.stringify({ design, reciterId, tafseerId, langCode, videoOpts }, null, 2)], { type: "application/json" });
    downloadBlob(blob, "quran-hub-settings.json");
  };
  const importSettings = (file: File) => {
    file.text().then((t) => {
      try {
        const j = JSON.parse(t);
        if (j.design) setDesign({ ...INITIAL_DESIGN, ...j.design });
        if (j.reciterId) setReciterId(j.reciterId);
        if (j.tafseerId) setTafseerId(j.tafseerId);
        if (j.langCode) setLangCode(j.langCode);
        if (j.videoOpts) setVideoOpts(j.videoOpts);
        push("success", "تم استيراد الإعدادات");
      } catch {
        push("error", "ملف إعدادات غير صالح");
      }
    });
  };

  const uploadBackground = (file: File) => {
    const url = URL.createObjectURL(file);
    upd({ bgUrl: file.type.startsWith("video/") ? `video:${url}` : url });
    push("success", file.type.startsWith("video/") ? "تم تعيين فيديو الخلفية" : "تم تعيين صورة الخلفية");
  };

  const filteredSurahs = useMemo(() => {
    const q = surahQuery.trim().toLowerCase();
    if (!q) return SURAHS;
    return SURAHS.filter((s) => s.name.includes(q) || s.englishName.toLowerCase().includes(q) || String(s.number) === q);
  }, [surahQuery]);

  const [pw, ph] = physicalSize(design.aspect, design.resolution);
  const rangeCount = Math.max(1, endVerseNum - verseNum + 1);
  const mimeInfo = useMemo(() => (typeof window !== "undefined" && "MediaRecorder" in window ? pickMime() : { mime: "", ext: "-" }), []);

  // ═══════════════════════════════ الواجهة ═══════════════════════════════
  return (
    <main dir="rtl" className="flex min-h-screen flex-col">
      {/* الترويسة */}
      <header className="glass sticky top-0 z-50 border-b border-gold-500/10">
        <div className="mx-auto flex max-w-[1700px] flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-gold-500/30 to-emerald-500/20 ring-1 ring-gold-500/40">
              <Radio className="h-5 w-5 text-gold-300" />
              <span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-red-500/70" />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500" />
            </div>
            <div>
              <h1 className="gold-text animate-shimmer text-lg font-black leading-tight md:text-xl">Quran Innovative Hub — استوديو البطاقات والفيديو 4K</h1>
              <p className="text-[11px] text-slate-400">مولّد منشورات ومقاطع قرآنية معتمدة • نص مصحف المدينة النبوية</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip border-emerald-500/30 bg-emerald-950/60 text-emerald-300">
              <BookOpen className="h-3 w-3" /> ١١٤ سورة
            </span>
            <span className="chip border-gold-500/30 bg-gold-500/10 text-gold-300">
              <Mic className="h-3 w-3" /> {toArabicDigits(RECITERS_LIST.length)} قارئاً
            </span>
            <span className="chip border-sky-500/30 bg-sky-950/60 text-sky-300">
              <Layers className="h-3 w-3" /> {toArabicDigits(TAFSEER_OPTIONS.length)} تفاسير
            </span>
            <span className="chip border-fuchsia-500/30 bg-fuchsia-950/60 text-fuchsia-300">
              <Globe className="h-3 w-3" /> {toArabicDigits(TRANSLATION_LANGUAGES.length)} لغة
            </span>
            <button
              className="btn-ghost !px-3 !py-1.5 text-xs"
              onClick={() => {
                const r = randomVerseRef();
                stopAudio();
                setSurah(r.surah);
                setVerseNum(r.verse);
                setEndVerseNum(Math.min(getSurah(r.surah).ayahs, r.verse + 2));
                push("info", `آية عشوائية: سورة ${getSurah(r.surah).name} — الآية ${r.verse}`);
              }}
            >
              <Shuffle className="h-3.5 w-3.5 text-gold-300" /> آية عشوائية
            </button>
            <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={shareLink}>
              <Share2 className="h-3.5 w-3.5 text-emerald-300" /> مشاركة
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1700px] flex-1 grid-cols-1 gap-5 p-4 md:p-6 lg:grid-cols-12">
        {/* ─────────── العارض ─────────── */}
        <section className="card flex flex-col lg:col-span-7 xl:col-span-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <button onClick={() => goVerse(verseNum - 1)} disabled={verseNum <= 1 || !!recording} className="btn-ghost !py-2 text-xs">
              <ChevronRight className="h-4 w-4 text-emerald-400" /> السابقة
            </button>
            <div className="flex items-center gap-3 rounded-2xl border border-gold-500/25 bg-night-950/80 px-5 py-2">
              <BookOpen className="h-4 w-4 text-gold-400" />
              <span className="text-sm font-bold text-slate-200">
                سورة <span className="text-emerald-300">{meta.name}</span>
                <span className="mx-1.5 text-slate-600">|</span>
                الآية <span className="text-gold-300">{toArabicDigits(verseNum)}</span> من {toArabicDigits(meta.ayahs)}
                <span className="mx-1.5 text-slate-600">|</span>
                <span className="text-xs text-slate-400">{meta.revelation}</span>
              </span>
            </div>
            <button onClick={() => goVerse(verseNum + 1)} disabled={verseNum >= meta.ayahs || !!recording} className="btn-ghost !py-2 text-xs">
              التالية <ChevronLeft className="h-4 w-4 text-emerald-400" />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center rounded-3xl border border-white/5 bg-[radial-gradient(ellipse_at_center,rgba(212,169,74,0.06),transparent_60%)] p-3">
            {(loading && !verseData) || !verseData ? (
              <div className="flex flex-col items-center gap-4 py-40">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-gold-400 border-t-transparent" />
                <div className="animate-pulse text-sm text-slate-400">جاري تحميل النص والتفسير المعتمد…</div>
              </div>
            ) : (
              <QuranCanvas ref={canvasHandle} verse={verseData} design={design} langCode={langCode} />
            )}
            {loading && verseData && <div className="absolute left-4 top-4 h-5 w-5 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />}

            {recording && (
              <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-red-500/40 bg-black/80 p-4 backdrop-blur-md">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-bold text-red-300">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" /> جاري التسجيل — {recording.phase}
                  </span>
                  <span className="text-slate-300">
                    الآية {recording.verseIndex + 1}/{recording.total} • {recording.percent}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-gradient-to-l from-gold-500 to-red-500 transition-all" style={{ width: `${recording.percent}%` }} />
                </div>
                <button onClick={() => jobRef.current?.cancel()} className="btn-ghost mt-3 w-full !py-2 text-xs text-red-200">
                  <StopCircle className="h-4 w-4" /> إيقاف وحفظ ما تم تسجيله
                </button>
              </div>
            )}
          </div>

          {/* مشغّل التلاوة */}
          <div className="mt-4 rounded-2xl border border-white/5 bg-night-950/70 p-3">
            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-gradient-to-l from-emerald-400 to-gold-400 transition-[width] duration-200" style={{ width: `${audioProgress * 100}%` }} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={toggleAudio} disabled={!!recording} className={`btn-gold !rounded-full !px-5 ${isPlaying ? "animate-pulse" : ""}`}>
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                {isPlaying ? "إيقاف مؤقت" : "استماع"}
              </button>
              <button onClick={() => setContinuousPlay(!continuousPlay)} className={`btn !py-2 text-xs ${continuousPlay ? "border border-emerald-500/60 bg-emerald-950/70 text-emerald-200" : "btn-ghost"}`}>
                <Repeat className="h-4 w-4" /> تلاوة مستمرة
              </button>
              <button onClick={() => setLoopVerse(!loopVerse)} className={`btn !py-2 text-xs ${loopVerse ? "border border-gold-500/60 bg-gold-500/10 text-gold-200" : "btn-ghost"}`}>
                <RotateCcw className="h-4 w-4" /> تكرار الآية
              </button>
              <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-night-900 px-3 py-1.5">
                <Volume2 className="h-4 w-4 text-slate-400" />
                <input type="range" min={0} max={1} step={0.05} value={volume} style={{ ["--pct" as any]: `${volume * 100}%`, width: 90 }} onChange={(e) => setVolume(parseFloat(e.target.value))} />
              </div>
              <div className="flex items-center gap-1 rounded-xl border border-white/5 bg-night-900 px-2 py-1">
                <Gauge className="h-4 w-4 text-slate-400" />
                {[0.75, 1, 1.25, 1.5].map((r) => (
                  <button key={r} onClick={() => setRate(r)} className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${rate === r ? "bg-gold-500 text-night-950" : "text-slate-400 hover:text-white"}`}>
                    {r}×
                  </button>
                ))}
              </div>
              <span className="mr-auto text-[11px] text-slate-500">
                <Mic className="inline h-3 w-3" /> {verseData?.reciterName}
              </span>
            </div>
          </div>

          {/* أزرار سريعة */}
          <div className="mt-4 flex flex-wrap justify-center gap-2.5">
            <button onClick={handleDownload} disabled={!verseData || !!recording} className="btn-emerald">
              <Download className="h-5 w-5" /> تنزيل بطاقة {design.resolution === "4k" ? "4K" : design.resolution === "2k" ? "2K" : "HD"} ({imageFormat.toUpperCase()})
            </button>
            <button onClick={handleVideo} disabled={!verseData || !!recording} className="btn bg-gradient-to-l from-fuchsia-600 to-purple-600 text-white shadow-lg hover:brightness-110">
              <Video className="h-5 w-5" /> إنتاج فيديو بصوت ({toArabicDigits(rangeCount)} آية)
            </button>
            <button onClick={handleCaption} disabled={!verseData} className="btn-ghost">
              <Copy className="h-4 w-4 text-gold-300" /> نسخ نص المنشور
            </button>
            <button onClick={() => setTab("export")} className="btn-ghost">
              <Package className="h-4 w-4 text-sky-300" /> خيارات التصدير
            </button>
          </div>

          {finalizing && (
            <div className="mt-4 animate-fadeUp rounded-2xl border border-sky-500/30 bg-sky-950/30 p-3">
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-sky-200">
                <span>
                  <Wand2 className="ml-1 inline h-4 w-4" /> {finalizing.stage}…
                </span>
                <span dir="ltr">{finalizing.percent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-night-900">
                <div className="h-full bg-sky-400 transition-all" style={{ width: `${finalizing.percent}%` }} />
              </div>
            </div>
          )}

          {lastVideo && (
            <div className="mt-4 animate-fadeUp rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-emerald-200">
                  <Film className="ml-1 inline h-4 w-4" /> آخر فيديو مُنتج — {(lastVideo.size / 1048576).toFixed(1)} MB ({lastVideo.ext.toUpperCase()})
                  {lastVideo.ready && <span className="mr-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300">جاهز للنشر المباشر</span>}
                </span>
                <div className="flex items-center gap-3">
                  <button onClick={handleShareVideo} className="font-bold text-fuchsia-300 underline">
                    <Share2 className="ml-1 inline h-3.5 w-3.5" /> مشاركة مباشرة
                  </button>
                  <a className="text-gold-300 underline" href={lastVideo.url} download={`Quran_${meta.name}_${verseNum}-${endVerseNum}.${lastVideo.ext}`}>
                    إعادة التنزيل
                  </a>
                </div>
              </div>
              <video src={lastVideo.url} controls className="max-h-64 w-full rounded-xl bg-black" />
            </div>
          )}

          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] text-slate-500">
            <Keyboard className="h-3 w-3" /> اختصارات: مسافة = تشغيل/إيقاف • ← → = التنقل بين الآيات • S = تنزيل البطاقة
          </p>
        </section>

        {/* ─────────── لوحة التحكم ─────────── */}
        <aside className="card flex flex-col gap-4 lg:col-span-5 xl:col-span-4">
          <div className="grid grid-cols-4 gap-1 rounded-2xl bg-night-950/80 p-1">
            {(
              [
                ["verse", "الآية", <BookOpen key="1" className="h-4 w-4" />],
                ["design", "التصميم", <Palette key="2" className="h-4 w-4" />],
                ["audio", "الصوت", <Mic key="3" className="h-4 w-4" />],
                ["export", "التصدير", <Package key="4" className="h-4 w-4" />],
              ] as [Tab, string, React.ReactNode][]
            ).map(([id, label, icon]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-extrabold transition ${
                  tab === id ? "bg-gradient-to-l from-gold-500 to-gold-300 text-night-950 shadow-glow" : "text-slate-400 hover:bg-night-800 hover:text-white"
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          <div className="flex max-h-[calc(100vh-190px)] flex-col gap-3 overflow-y-auto pl-1">
            {/* ═════ تبويب الآية ═════ */}
            {tab === "verse" && (
              <>
                <Section title="اختيار السورة والآيات" icon={<BookOpen className="h-4 w-4" />}>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input className="field !pr-9" placeholder="ابحث باسم السورة أو رقمها…" value={surahQuery} onChange={(e) => setSurahQuery(e.target.value)} />
                  </div>
                  <select
                    className="field"
                    size={6}
                    value={surah}
                    onChange={(e) => {
                      stopAudio();
                      const s = parseInt(e.target.value);
                      setSurah(s);
                      setVerseNum(1);
                      setEndVerseNum(Math.min(getSurah(s).ayahs, 5));
                    }}
                  >
                    {filteredSurahs.map((s) => (
                      <option key={s.number} value={s.number}>
                        {toArabicDigits(s.number)}. {s.name} — {s.englishName} ({toArabicDigits(s.ayahs)} آية • {s.revelation})
                      </option>
                    ))}
                  </select>
                  <div className="rounded-2xl border border-gold-500/20 bg-night-950/80 p-3">
                    <label className="label flex items-center gap-1 !text-gold-300">
                      <Film className="h-3.5 w-3.5" /> نطاق الآيات للفيديو والدفعات
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="mb-1 block text-[10px] text-slate-500">من آية</span>
                        <input type="number" min={1} max={meta.ayahs} value={verseNum} onChange={(e) => goVerse(parseInt(e.target.value) || 1)} className="field text-center font-bold" />
                      </div>
                      <div>
                        <span className="mb-1 block text-[10px] text-slate-500">إلى آية (أقصى {toArabicDigits(meta.ayahs)})</span>
                        <input
                          type="number"
                          min={verseNum}
                          max={meta.ayahs}
                          value={endVerseNum}
                          onChange={(e) => setEndVerseNum(Math.min(meta.ayahs, Math.max(verseNum, parseInt(e.target.value) || verseNum)))}
                          className="field text-center font-bold"
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button className="chip border-white/10 bg-night-900 text-slate-300 hover:border-gold-500/40" onClick={() => setEndVerseNum(verseNum)}>
                        الآية الحالية فقط
                      </button>
                      <button className="chip border-white/10 bg-night-900 text-slate-300 hover:border-gold-500/40" onClick={() => setEndVerseNum(Math.min(meta.ayahs, verseNum + 4))}>
                        +٥ آيات
                      </button>
                      <button className="chip border-white/10 bg-night-900 text-slate-300 hover:border-gold-500/40" onClick={() => setEndVerseNum(Math.min(meta.ayahs, verseNum + 9))}>
                        +١٠ آيات
                      </button>
                      <button
                        className="chip border-white/10 bg-night-900 text-slate-300 hover:border-gold-500/40"
                        onClick={() => {
                          goVerse(1);
                          setEndVerseNum(meta.ayahs);
                        }}
                      >
                        السورة كاملة
                      </button>
                    </div>
                    <p className="mt-2 text-[10px] text-slate-500">المحدد الآن: {toArabicDigits(rangeCount)} آية — سيتم إنتاجها بالتسلسل مع التلاوة.</p>
                  </div>
                </Section>

                <Section title="التفسير والترجمة" icon={<Layers className="h-4 w-4" />}>
                  <SelectField
                    label="التفسير العربي (المصدر موثق)"
                    value={tafseerId}
                    onChange={(v) => setTafseerId(String(v))}
                    options={TAFSEER_OPTIONS.map((t) => ({ value: t.id, label: `${t.name} — ${t.author} (${t.length})` }))}
                  />
                  <SelectField
                    label="لغة الترجمة"
                    icon={<Globe className="h-3.5 w-3.5" />}
                    value={langCode}
                    onChange={(v) => setLangCode(String(v))}
                    options={TRANSLATION_LANGUAGES.map((l) => ({ value: l.code, label: `${l.nativeName} — ${l.name}` }))}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Toggle label="إظهار التفسير" checked={design.showTafseer} onChange={(v) => upd({ showTafseer: v })} />
                    <Toggle label="إظهار الترجمة" checked={design.showTranslation} onChange={(v) => upd({ showTranslation: v })} />
                  </div>
                  {verseData?.tafseerArabic && (
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-white/5 bg-night-950/70 p-3 text-[12px] leading-relaxed text-slate-300">
                      <span className="mb-1 block font-bold text-gold-300">{verseData.tafseerName}</span>
                      {verseData.tafseerArabic}
                    </div>
                  )}
                </Section>

                <Section title="المصادر والتوثيق" icon={<Shield className="h-4 w-4" />} defaultOpen={false}>
                  <ul className="space-y-1.5 text-[11px] leading-relaxed text-slate-400">
                    <li>• النص العثماني: مصحف المدينة النبوية (ترميز Tanzil) عبر AlQuran Cloud API.</li>
                    <li>• التلاوات: Islamic Network CDN — تلاوة آية بآية لكبار القرّاء.</li>
                    <li>• التفاسير الموجزة: التفسير الميسر (مجمع الملك فهد)، الجلالين، القرطبي، البغوي، الوسيط، تنوير المقباس.</li>
                    <li>• التفاسير الموسّعة: ابن كثير، الطبري، السعدي — من بيانات QUL (Tarteel) عبر مشروع tafsir_api.</li>
                    <li>• التراجم: {TRANSLATION_LANGUAGES.length} لغة من إصدارات AlQuran Cloud المعتمدة.</li>
                  </ul>
                  <button className="btn-ghost w-full !py-2 text-xs" onClick={() => { clearQuranCache(); push("info", "تم مسح الذاكرة المؤقتة"); }}>
                    <RotateCcw className="h-3.5 w-3.5" /> مسح الذاكرة المؤقتة للنصوص
                  </button>
                </Section>
              </>
            )}

            {/* ═════ تبويب التصميم ═════ */}
            {tab === "design" && (
              <>
                <Section title="قوالب جاهزة" icon={<Wand2 className="h-4 w-4" />}>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESETS.map((p) => (
                      <button key={p.id} onClick={() => { upd(p.patch); push("success", `تم تطبيق قالب «${p.name}»`); }} className="rounded-xl border border-white/10 bg-night-950/70 p-2.5 text-right transition hover:border-gold-500/50 hover:bg-night-800">
                        <span className="block text-xs font-extrabold text-gold-300">{p.name}</span>
                        <span className="block text-[10px] text-slate-500">{p.desc}</span>
                      </button>
                    ))}
                  </div>
                  <button className="btn-ghost w-full !py-2 text-xs" onClick={() => { setDesign(INITIAL_DESIGN); push("info", "تمت استعادة الإعدادات الافتراضية"); }}>
                    <RotateCcw className="h-3.5 w-3.5" /> استعادة الافتراضي
                  </button>
                </Section>

                <Section title="الأبعاد والدقة" icon={<Frame className="h-4 w-4" />} badge={`${pw}×${ph}`}>
                  <Segmented<AspectRatio>
                    value={design.aspect}
                    onChange={(v) => upd({ aspect: v })}
                    cols={4}
                    options={[
                      { value: "9:16", label: "9:16", sub: "Reels / TikTok" },
                      { value: "4:5", label: "4:5", sub: "Instagram Feed" },
                      { value: "1:1", label: "1:1", sub: "مربع" },
                      { value: "16:9", label: "16:9", sub: "YouTube / TV" },
                    ]}
                  />
                  <Segmented<Resolution>
                    value={design.resolution}
                    onChange={(v) => upd({ resolution: v })}
                    options={[
                      { value: "hd", label: "HD 1080", sub: "سريع" },
                      { value: "2k", label: "2K 1620", sub: "متوازن" },
                      { value: "4k", label: "4K 2160", sub: "أعلى جودة" },
                    ]}
                  />
                  <p className="text-[10px] text-slate-500">ملاحظة: تسجيل فيديو 4K يتطلب جهازاً قوياً؛ يُنصح بـ HD للفيديو و4K للبطاقات.</p>
                </Section>

                <Section title="الثيم والخط" icon={<Type className="h-4 w-4" />}>
                  <div className="grid grid-cols-4 gap-2">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => upd({ themeId: t.id })}
                        title={t.name}
                        className={`rounded-xl border p-1.5 transition ${design.themeId === t.id ? "border-gold-400 ring-2 ring-gold-500/40" : "border-white/10 hover:border-white/30"}`}
                      >
                        <span className="block h-8 rounded-lg" style={{ background: `linear-gradient(135deg, ${t.overlayTop.replace(/[\d.]+\)$/, "1)")}, ${t.overlayBottom.replace(/[\d.]+\)$/, "1)")})` }}>
                          <span className="mt-2 block h-1.5 w-2/3 rounded-full" style={{ background: t.verse, marginRight: "auto", marginLeft: "auto" }} />
                          <span className="mt-1 block h-1 w-1/3 rounded-full" style={{ background: t.accent, marginRight: "auto", marginLeft: "auto" }} />
                        </span>
                        <span className="mt-1 block truncate text-[9px] font-bold text-slate-300">{t.name}</span>
                      </button>
                    ))}
                  </div>
                  <SelectField label="خط النص القرآني" value={design.fontFamily} onChange={(v) => upd({ fontFamily: v })} options={QURAN_FONTS.map((f) => ({ value: f.id, label: f.name }))} />
                  <SelectField label="خط الواجهة والتفسير" value={design.uiFont} onChange={(v) => upd({ uiFont: v })} options={[{ value: "Cairo", label: "القاهرة (Cairo)" }, { value: "Tajawal", label: "تجوال (Tajawal)" }, { value: "Noto Naskh Arabic", label: "نوتو نسخ" }, { value: "Amiri", label: "أميري" }]} />
                  <Slider label="حجم النص القرآني" value={design.fontSize} min={30} max={110} onChange={(v) => upd({ fontSize: v })} format={(v) => `${v}px`} />
                  <Slider label="تباعد الأسطر" value={design.lineHeight} min={1.3} max={2.6} step={0.05} onChange={(v) => upd({ lineHeight: v })} format={(v) => v.toFixed(2)} />
                  <Slider label="إزاحة النص عمودياً" value={design.verseOffsetY} min={-1} max={1} step={0.05} onChange={(v) => upd({ verseOffsetY: v })} format={(v) => `${Math.round(v * 100)}%`} />
                  <Slider label="توهج النص" value={design.glow} min={0} max={1} step={0.05} onChange={(v) => upd({ glow: v })} format={(v) => `${Math.round(v * 100)}%`} />
                  <div>
                    <label className="label">أقواس الآية</label>
                    <Segmented value={design.bracket} onChange={(v) => upd({ bracket: v as any })} options={[{ value: "ornate", label: "﴿ ﴾" }, { value: "simple", label: "« »" }, { value: "none", label: "بدون" }]} />
                  </div>
                </Section>

                <Section title="عناصر البطاقة" icon={<SlidersHorizontal className="h-4 w-4" />}>
                  <div>
                    <label className="label">نمط الترويسة</label>
                    <Segmented value={design.headerStyle} onChange={(v) => upd({ headerStyle: v as any })} cols={4} options={[{ value: "broadcast", label: "بث" }, { value: "banner", label: "لافتة" }, { value: "minimal", label: "بسيط" }, { value: "none", label: "بدون" }]} />
                  </div>
                  <div>
                    <label className="label">اسم القناة (شريط البث)</label>
                    <input className="field" value={design.channelName} onChange={(e) => upd({ channelName: e.target.value })} placeholder="قناة القرآن الكريم" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Toggle label="البسملة (أول آية)" checked={design.showBasmala} onChange={(v) => upd({ showBasmala: v })} />
                    <Toggle label="شارة رقم الآية" checked={design.showVerseBadge} onChange={(v) => upd({ showVerseBadge: v })} />
                    <Toggle label="شريط اسم القارئ" checked={design.showReciter} onChange={(v) => upd({ showReciter: v })} />
                    <Toggle label="سطر التوثيق" checked={design.showFooter} onChange={(v) => upd({ showFooter: v })} />
                    <Toggle label="صندوق التفسير" checked={design.tafseerPanel} onChange={(v) => upd({ tafseerPanel: v })} />
                    <Toggle label="شريط تقدم الفيديو" checked={design.showProgress} onChange={(v) => upd({ showProgress: v })} />
                  </div>
                  <Slider label="حجم الترجمة" value={design.translationSize} min={16} max={44} onChange={(v) => upd({ translationSize: v })} format={(v) => `${v}px`} />
                  <Slider label="حجم نص التفسير" value={design.tafseerSize} min={14} max={36} onChange={(v) => upd({ tafseerSize: v })} format={(v) => `${v}px`} />
                  <Slider label="أقصى طول للتفسير" value={design.tafseerMaxChars} min={120} max={1200} step={20} onChange={(v) => upd({ tafseerMaxChars: v })} format={(v) => `${v} حرف`} />
                  <div>
                    <label className="label">نص التوثيق السفلي</label>
                    <input className="field" value={design.footerText} onChange={(e) => upd({ footerText: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">علامة مائية (اسم الحساب)</label>
                    <input className="field" dir="ltr" value={design.watermark} onChange={(e) => upd({ watermark: e.target.value })} placeholder="@your_account" />
                  </div>
                </Section>

                <Section title="الخلفية والإطار" icon={<ImageIcon className="h-4 w-4" />}>
                  <div>
                    <label className="label">نمط الإطار</label>
                    <Segmented value={design.frame} onChange={(v) => upd({ frame: v as any })} cols={5} options={[{ value: "none", label: "بدون" }, { value: "thin", label: "رفيع" }, { value: "double", label: "مزدوج" }, { value: "corners", label: "زوايا" }, { value: "ornate", label: "مزخرف" }]} />
                  </div>
                  {BACKGROUND_CATEGORIES.map((cat) => (
                    <div key={cat} className="space-y-2">
                      <label className="label !mb-0">{cat} · {BACKGROUND_LIBRARY.filter((b) => (b.category || "أخرى") === cat).length}</label>
                      <div className="grid grid-cols-2 gap-2">
                        {BACKGROUND_LIBRARY.filter((b) => (b.category || "أخرى") === cat).map((bg) => (
                          <button
                            key={bg.id}
                            onClick={() => upd({ bgUrl: bg.url })}
                            className={`group relative h-16 overflow-hidden rounded-xl border text-right transition ${design.bgUrl === bg.url ? "border-gold-400 ring-2 ring-gold-500/40" : "border-white/10 hover:border-white/40"}`}
                            style={
                              bg.type === "gradient"
                                ? { background: `linear-gradient(135deg, ${bg.url.slice(9)})` }
                                : bg.type === "animated"
                                ? { background: "linear-gradient(120deg, #1a0b2e, #2d1b4e, #0b3d2e, #1a0b2e)", backgroundSize: "300% 300%", animation: "bgShift 6s ease infinite" }
                                : { backgroundImage: `url(${bg.url.replace(/w=\d+/, "w=400")})`, backgroundSize: "cover", backgroundPosition: "center" }
                            }
                          >
                            {bg.type === "animated" && <Sparkles className="absolute right-2 top-1.5 h-3.5 w-3.5 text-gold-300 drop-shadow" />}
                            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-2 py-1 text-[10px] font-bold text-white">{bg.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <style jsx global>{`
                    @keyframes bgShift {
                      0% { background-position: 0% 50%; }
                      50% { background-position: 100% 50%; }
                      100% { background-position: 0% 50%; }
                    }
                  `}</style>
                  <label className="btn-ghost w-full cursor-pointer !py-2 text-xs">
                    <Upload className="h-4 w-4 text-gold-300" /> رفع صورة أو فيديو خلفية (MP4/WebM)
                    <input type="file" accept="image/*,video/mp4,video/webm" className="hidden" onChange={(e) => e.target.files?.[0] && uploadBackground(e.target.files[0])} />
                  </label>
                  <div>
                    <label className="label">رابط خلفية مخصص (URL)</label>
                    <input className="field" dir="ltr" placeholder="https://…jpg | mp4" onBlur={(e) => e.target.value && upd({ bgUrl: e.target.value })} />
                  </div>
                  <Slider label="تعتيم الطبقة السينمائية" value={design.overlayOpacity} min={0} max={1} step={0.05} onChange={(v) => upd({ overlayOpacity: v })} format={(v) => `${Math.round(v * 100)}%`} />
                  <Slider label="تظليل الحواف (Vignette)" value={design.vignette} min={0} max={1} step={0.05} onChange={(v) => upd({ vignette: v })} format={(v) => `${Math.round(v * 100)}%`} />
                  <Slider label="ضبابية الخلفية" value={design.blur} min={0} max={30} onChange={(v) => upd({ blur: v })} format={(v) => `${v}px`} />
                  <div className="grid grid-cols-2 gap-3">
                    <Slider label="موضع أفقي" value={design.bgPosX} min={0} max={1} step={0.05} onChange={(v) => upd({ bgPosX: v })} format={(v) => `${Math.round(v * 100)}%`} />
                    <Slider label="موضع عمودي" value={design.bgPosY} min={0} max={1} step={0.05} onChange={(v) => upd({ bgPosY: v })} format={(v) => `${Math.round(v * 100)}%`} />
                  </div>
                </Section>

                <Section title="حركة الفيديو" icon={<Sparkles className="h-4 w-4" />}>
                  <Toggle label="حركة Ken Burns للخلفية" hint="تقريب وانزياح بطيء أثناء التلاوة" checked={design.kenBurns} onChange={(v) => upd({ kenBurns: v })} />
                  <div>
                    <label className="label">دخول النص</label>
                    <Segmented value={design.animation} onChange={(v) => upd({ animation: v as any })} cols={4} options={[{ value: "none", label: "ثابت" }, { value: "fade", label: "تلاشٍ" }, { value: "rise", label: "صعود" }, { value: "zoom", label: "تقريب" }]} />
                  </div>
                </Section>
              </>
            )}

            {/* ═════ تبويب الصوت ═════ */}
            {tab === "audio" && (
              <>
                <Section title="القارئ" icon={<Mic className="h-4 w-4" />}>
                  <div className="grid max-h-80 grid-cols-1 gap-1.5 overflow-y-auto pl-1">
                    {RECITERS_LIST.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => { stopAudio(); setReciterId(r.id); }}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 text-right text-xs transition ${reciterId === r.id ? "border-gold-400/70 bg-gold-500/10 text-gold-200" : "border-white/5 bg-night-950/60 text-slate-300 hover:border-white/20"}`}
                      >
                        <span className="font-bold">{r.name}</span>
                        <span className={`chip ${r.style === "مجود" ? "border-fuchsia-500/30 text-fuchsia-300" : "border-emerald-500/30 text-emerald-300"}`}>{r.style}</span>
                      </button>
                    ))}
                  </div>
                </Section>
                <Section title="إعدادات التشغيل" icon={<Settings2 className="h-4 w-4" />}>
                  <Toggle label="التلاوة المستمرة" hint="الانتقال تلقائياً للآية التالية" checked={continuousPlay} onChange={setContinuousPlay} />
                  <Toggle label="تكرار الآية الحالية" checked={loopVerse} onChange={setLoopVerse} />
                  <Slider label="مستوى الصوت" value={volume} min={0} max={1} step={0.05} onChange={setVolume} format={(v) => `${Math.round(v * 100)}%`} />
                  <Slider label="سرعة التشغيل" value={rate} min={0.5} max={2} step={0.25} onChange={setRate} format={(v) => `${v}×`} />
                </Section>
              </>
            )}

            {/* ═════ تبويب التصدير ═════ */}
            {tab === "export" && (
              <>
                <Section title="بطاقة الصورة" icon={<ImageIcon className="h-4 w-4" />} badge={`${pw}×${ph}`}>
                  <Segmented value={imageFormat} onChange={(v) => setImageFormat(v as any)} options={[{ value: "png", label: "PNG", sub: "بدون فقد" }, { value: "jpg", label: "JPG", sub: "أخف حجماً" }, { value: "webp", label: "WebP", sub: "حديث" }]} />
                  <button onClick={handleDownload} disabled={!verseData} className="btn-emerald w-full">
                    <Download className="h-5 w-5" /> تنزيل البطاقة الحالية
                  </button>
                  <button onClick={handleBatch} disabled={!verseData || !!batchProgress} className="btn-ghost w-full">
                    <Package className="h-5 w-5 text-sky-300" /> {batchProgress ? `جاري التصدير ${batchProgress.done}/${batchProgress.total}…` : `تصدير ${toArabicDigits(rangeCount)} بطاقة كملف ZIP`}
                  </button>
                  {batchProgress && (
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full bg-sky-400 transition-all" style={{ width: `${(batchProgress.done / Math.max(1, batchProgress.total)) * 100}%` }} />
                    </div>
                  )}
                </Section>

                <Section title="فيديو بصوت التلاوة" icon={<Video className="h-4 w-4" />} badge={mimeInfo.ext.toUpperCase()}>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    يُسجَّل الفيديو من العارض مباشرة مع دمج صوت القارئ في المسار الصوتي. الصيغة المتاحة في متصفحك: <b className="text-gold-300">{mimeInfo.ext.toUpperCase()}</b> (Chrome/Edge الحديثة تنتج MP4 مباشرة).
                  </p>
                  <Segmented value={String(videoOpts.fps)} onChange={(v) => setVideoOpts({ ...videoOpts, fps: parseInt(v) })} options={[{ value: "24", label: "24 fps", sub: "سينمائي" }, { value: "30", label: "30 fps", sub: "قياسي" }, { value: "60", label: "60 fps", sub: "ناعم" }]} />
                  <div className="grid grid-cols-2 gap-2">
                    <Toggle label="بطاقة افتتاحية" checked={videoOpts.introSlate} onChange={(v) => setVideoOpts({ ...videoOpts, introSlate: v })} />
                    <Toggle label="بطاقة ختامية" checked={videoOpts.outroSlate} onChange={(v) => setVideoOpts({ ...videoOpts, outroSlate: v })} />
                  </div>
                  <Slider label="مدة البطاقات الافتتاحية/الختامية" value={videoOpts.slateSeconds} min={1} max={8} step={0.5} onChange={(v) => setVideoOpts({ ...videoOpts, slateSeconds: v })} format={(v) => `${v} ث`} />
                  <Slider label="فاصل صامت بين الآيات" value={videoOpts.gapSeconds} min={0} max={3} step={0.1} onChange={(v) => setVideoOpts({ ...videoOpts, gapSeconds: v })} format={(v) => `${v.toFixed(1)} ث`} />
                  <Slider label="تكرار كل آية" value={videoOpts.repeat} min={1} max={3} onChange={(v) => setVideoOpts({ ...videoOpts, repeat: v })} format={(v) => `${v}×`} />
                  <Toggle label="سماع الصوت أثناء التسجيل" checked={videoOpts.monitor} onChange={(v) => setVideoOpts({ ...videoOpts, monitor: v })} />
                  <Toggle
                    label="تحويل تلقائي لصيغة MP4 جاهزة للنشر"
                    hint="ترميز H.264/AAC متوافق مع كل مواقع التواصل الاجتماعي، بجودة عالية وحجم معتدل"
                    checked={readyForSocial}
                    onChange={setReadyForSocial}
                  />
                  <button onClick={handleVideo} disabled={!verseData || !!recording || !!finalizing} className="btn w-full bg-gradient-to-l from-fuchsia-600 to-purple-600 text-white shadow-lg hover:brightness-110">
                    <Video className="h-5 w-5" /> {recording ? "جاري التسجيل…" : finalizing ? "جاري التحويل…" : `إنتاج فيديو (${toArabicDigits(rangeCount)} آية • ${design.aspect} • ${design.resolution.toUpperCase()})`}
                  </button>
                  {lastVideo && (
                    <button onClick={handleShareVideo} className="btn-ghost w-full">
                      <Share2 className="h-4 w-4 text-fuchsia-300" /> مشاركة الفيديو الأخير مباشرة لمواقع التواصل
                    </button>
                  )}
                  <p className="text-[10px] text-slate-500">أبقِ التبويب مفتوحاً وظاهراً أثناء التسجيل؛ الانتقال لتبويب آخر قد يوقف الرسم.</p>
                </Section>

                <Section title="نص المنشور" icon={<Copy className="h-4 w-4" />}>
                  <button onClick={handleCaption} disabled={!verseData} className="btn-ghost w-full">
                    <Wand2 className="h-4 w-4 text-gold-300" /> توليد ونسخ نص المنشور (مع الوسوم)
                  </button>
                  {caption && <textarea readOnly className="field h-40 text-[12px] leading-relaxed" value={caption} />}
                </Section>

                <Section title="الإعدادات" icon={<FileJson className="h-4 w-4" />} defaultOpen={false}>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={exportSettings} className="btn-ghost !py-2 text-xs">
                      <Download className="h-4 w-4" /> تصدير JSON
                    </button>
                    <label className="btn-ghost cursor-pointer !py-2 text-xs">
                      <Upload className="h-4 w-4" /> استيراد JSON
                      <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importSettings(e.target.files[0])} />
                    </label>
                  </div>
                  <button onClick={shareLink} className="btn-ghost w-full !py-2 text-xs">
                    <Share2 className="h-4 w-4 text-emerald-300" /> نسخ رابط هذه الآية/النطاق
                  </button>
                </Section>
              </>
            )}
          </div>
        </aside>
      </div>

      <footer className="border-t border-white/5 px-6 py-4 text-center text-[11px] text-slate-500">
        Quran Innovative Hub © {new Date().getFullYear()} — النص القرآني والتلاوات من مصادر موثقة • يُرجى مراجعة البطاقة قبل النشر
      </footer>

      <Toasts items={toasts} onClose={remove} />
    </main>
  );
}
