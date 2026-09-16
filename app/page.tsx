"use client";

import React, { useState, useEffect, useRef } from "react";
import QuranCanvas from "@/components/QuranCanvas";
import {
  fetchVerseDetails,
  SURAHS_LIST,
  BACKGROUND_LIBRARY,
  TAFSEER_OPTIONS,
  TRANSLATION_LANGUAGES,
  RECITERS_LIST,
  VerseData
} from "@/lib/quranData";
import {
  Download,
  Sparkles,
  Send,
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
  Repeat
} from "lucide-react";

export default function Home() {
  const [surah, setSurah] = useState<number>(111); // سورة المسد افتراضياً للتجربة
  const [verseNum, setVerseNum] = useState<number>(1);
  const [endVerseNum, setEndVerseNum] = useState<number>(5);
  const [reciterId, setReciterId] = useState<string>("ar.hudhaify");
  const [tafseerEd, setTafseerEd] = useState<string>("ar.muyassar");
  const [langCode, setLangCode] = useState<string>("en");
  const [verseData, setVerseData] = useState<VerseData | null>(null);

  const [aspectRatio, setAspectRatio] = useState<"1:1" | "9:16" | "16:9">("9:16");
  const [showTafseer, setShowTafseer] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [fontSize, setFontSize] = useState<number>(52);
  const [bgImage, setBgImage] = useState(BACKGROUND_LIBRARY[0].url);

  const [canvasInstance, setCanvasInstance] = useState<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [continuousPlay, setContinuousPlay] = useState(true); // التلاوة المستمرة
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. جلب بيانات الآية وتحديث الحدود الذكية لأعداد السورة
  useEffect(() => {
    setLoading(true);
    fetchVerseDetails(surah, verseNum, reciterId, tafseerEd, langCode).then((data) => {
      setVerseData(data);
      setEndVerseNum(data.totalVersesInSurah); // تعيين نهاية الآية الفعلية للسورة تلقائياً
      setLoading(false);
    });
  }, [surah, verseNum, reciterId, tafseerEd, langCode]);

  // 2. محرك التلاوة المستمرة والتنقل بين الآيات
  const playVerseAudio = (audioUrl: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    audioRef.current.src = audioUrl;

    audioRef.current.onended = () => {
      if (continuousPlay && verseData && verseNum < verseData.totalVersesInSurah) {
        setVerseNum((prev) => prev + 1); // للانتقال التلقائي للآية التالية
      } else {
        setIsPlaying(false);
      }
    };

    audioRef.current.play().then(() => {
      setIsPlaying(true);
    }).catch(() => setIsPlaying(false));
  };

  const toggleAudio = () => {
    if (!verseData?.audioUrl) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      playVerseAudio(verseData.audioUrl);
    }
  };

  const handleNextVerse = () => {
    if (verseData && verseNum < verseData.totalVersesInSurah) {
      setVerseNum((prev) => prev + 1);
    }
  };

  const handlePrevVerse = () => {
    if (verseNum > 1) {
      setVerseNum((prev) => prev - 1);
    }
  };

  // 3. تصدير مقطع فيديو MP4 بنطاق الآيات المحددة
  const handleExportReelsVideo = async () => {
    if (!canvasInstance) return;
    setIsRecordingVideo(true);

    try {
      const canvasStream = canvasInstance.captureStream(30);
      const mediaRecorder = new MediaRecorder(canvasStream, {
        mimeType: MediaRecorder.isTypeSupported("video/mp4") ? "video/mp4" : "video/webm"
      } as MediaRecorderOptions);

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/mp4" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Quran_Video_${surah}_Verse_${verseNum}_to_${endVerseNum}.mp4`;
        a.click();
        setIsRecordingVideo(false);
      };

      mediaRecorder.start();

      for (let v = verseNum; v <= endVerseNum; v++) {
        const currentData = await fetchVerseDetails(surah, v, reciterId, tafseerEd, langCode);
        setVerseData(currentData);

        await new Promise<void>((resolve) => {
          const tempAudio = new Audio(currentData.audioUrl);
          tempAudio.play().catch(() => resolve());
          tempAudio.onended = () => resolve();
        });
      }

      mediaRecorder.stop();
    } catch (err) {
      console.error(err);
      setIsRecordingVideo(false);
    }
  };

  const handleDownload = () => {
    if (!canvasInstance || !verseData) return;
    const link = document.createElement("a");
    link.download = `Quran_${verseData.surahName}_Verse_${verseData.verseNumber}.png`;
    link.href = canvasInstance.toDataURL("image/png");
    link.click();
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col font-sans">
      {/* الترويسة الرئيسية */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-4 flex justify-between items-center px-8 sticky top-0 z-50">
        <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 flex items-center gap-2.5">
          <Radio className="w-6 h-6 text-amber-400 animate-pulse" /> البث المباشر لمنصة القرآن الكريم 4K
        </h1>
        <span className="text-xs font-semibold bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 px-3.5 py-1.5 rounded-full shadow-lg">
          ✨ مجمع الملك فهد لطباعة المصحف الشريف
        </span>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 p-8 max-w-[1600px] mx-auto w-full">
        {/* العارض المباشر ومغير الآيات */}
        <div className="lg:col-span-2 flex flex-col justify-between items-center bg-slate-900/40 backdrop-blur-md rounded-3xl p-6 border border-slate-800/80 shadow-2xl relative">
          
          <div className="flex justify-between items-center w-full mb-4 px-2">
            <button
              onClick={handlePrevVerse}
              disabled={verseNum <= 1}
              className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-2xl transition disabled:opacity-30 border border-slate-700/60 text-sm font-medium"
            >
              <ChevronRight className="w-4 h-4 text-emerald-400" /> الآية السابقة
            </button>
            
            <div className="flex items-center gap-3 bg-slate-950/80 border border-amber-500/30 px-5 py-2 rounded-2xl">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span className="text-slate-200 font-bold text-base">
                سورة <span className="text-emerald-400">{verseData?.surahName}</span> - الآية (<span className="text-amber-400">{verseData?.verseNumber}</span> من {verseData?.totalVersesInSurah})
              </span>
            </div>

            <button
              onClick={handleNextVerse}
              disabled={verseData ? verseNum >= verseData.totalVersesInSurah : false}
              className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-2xl transition disabled:opacity-30 border border-slate-700/60 text-sm font-medium"
            >
              الآية التالية <ChevronLeft className="w-4 h-4 text-emerald-400" />
            </button>
          </div>

          {loading || !verseData ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-slate-400 font-medium animate-pulse">جاري تحميل النص والتفسير المعتمد...</div>
            </div>
          ) : (
            <QuranCanvas
              verse={verseData}
              bgImageUrl={bgImage}
              aspectRatio={aspectRatio}
              showTafseer={showTafseer}
              showTranslation={showTranslation}
              selectedLangCode={langCode}
              fontSize={fontSize}
              onCanvasReady={(canvas) => setCanvasInstance(canvas)}
            />
          )}

          {/* أزرار التشغيل والتصدير */}
          <div className="flex flex-wrap gap-3.5 mt-6 justify-center w-full">
            <button
              onClick={toggleAudio}
              className={`flex items-center gap-2 font-semibold px-6 py-3 rounded-2xl transition-all duration-300 shadow-lg ${
                isPlaying
                  ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/40 animate-pulse"
                  : "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 text-white shadow-amber-950/50 hover:scale-105"
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isPlaying ? "إيقاف البث" : "استماع للتلاوة"}
            </button>

            <button
              onClick={() => setContinuousPlay(!continuousPlay)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-medium border transition ${
                continuousPlay
                  ? "bg-emerald-950/80 border-emerald-500 text-emerald-300"
                  : "bg-slate-800/60 border-slate-700 text-slate-400"
              }`}
            >
              <Repeat className="w-4 h-4" />
              تلاوة مستمرة: {continuousPlay ? "مفعلة" : "معطلة"}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 py-3 rounded-2xl transition shadow-lg hover:scale-105"
            >
              <Download className="w-5 h-5" /> تنزيل صورة 4K
            </button>

            <button
              onClick={handleExportReelsVideo}
              disabled={isRecordingVideo}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-2xl transition shadow-lg disabled:opacity-50 hover:scale-105"
            >
              <Video className="w-5 h-5" />
              {isRecordingVideo ? "جاري إنتاج الفيديو..." : "تصدير فيديو MP4 (Reels)"}
            </button>
          </div>
        </div>

        {/* لوحة التحكم الاحترافية والربط الديناميكي */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-slate-800/80 shadow-2xl flex flex-col gap-5">
          <h2 className="text-lg font-bold text-slate-100 border-b border-slate-800/80 pb-3 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" /> ⚙️ إعدادات البث والقراء
          </h2>

          <div className="space-y-4">
            {/* اختيار السورة مع تحديث الحدود المباشر */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">اختيار السورة القرآنية:</label>
              <select
                value={surah}
                onChange={(e) => {
                  const s = parseInt(e.target.value);
                  setSurah(s);
                  setVerseNum(1); // البدء من الآية الأولى تلقائياً
                }}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-slate-100 font-medium focus:border-emerald-500 focus:outline-none"
              >
                {SURAHS_LIST.map((name, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {idx + 1}. سورة {name}
                  </option>
                ))}
              </select>
            </div>

            {/* نطاق الآيات لسورة المسد والسور الأخرى */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-amber-500/20 shadow-inner">
              <label className="text-xs font-bold text-amber-400 block mb-2 flex items-center gap-1.5">
                <Video className="w-4 h-4" /> 🎬 نطاق مقطع الفيديو (من - إلى):
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">من آية:</span>
                  <input
                    type="number"
                    min="1"
                    max={verseData?.totalVersesInSurah || 1}
                    value={verseNum}
                    onChange={(e) => setVerseNum(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 text-sm font-bold text-center"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">إلى آية (أقصى آية {verseData?.totalVersesInSurah}):</span>
                  <input
                    type="number"
                    min={verseNum}
                    max={verseData?.totalVersesInSurah || 1}
                    value={endVerseNum}
                    onChange={(e) => setEndVerseNum(Math.min(verseData?.totalVersesInSurah || 1, parseInt(e.target.value) || verseNum))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-slate-100 text-sm font-bold text-center"
                  />
                </div>
              </div>
            </div>

            {/* اختيار القارئ */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5 flex items-center gap-1">
                <Mic className="w-4 h-4 text-emerald-400" /> القارئ المفضل:
              </label>
              <select
                value={reciterId}
                onChange={(e) => setReciterId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-slate-100 font-medium focus:border-emerald-500 focus:outline-none"
              >
                {RECITERS_LIST.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* التفسير والترجمة */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">التفسير العربي:</label>
              <select
                value={tafseerEd}
                onChange={(e) => setTafseerEd(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 text-xs"
              >
                {TAFSEER_OPTIONS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">الترجمة العالمية:</label>
              <select
                value={langCode}
                onChange={(e) => setLangCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 text-xs"
              >
                {TRANSLATION_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* أبعاد البث المباشر */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2">أبعاد المقطع:</label>
            <div className="grid grid-cols-3 gap-2">
              {(["9:16", "1:1", "16:9"] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`py-2.5 rounded-xl text-xs border font-bold transition ${
                    aspectRatio === ratio
                      ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-950/60"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {ratio === "9:16" ? "طولي (Reels)" : ratio === "1:1" ? "مربع (Insta)" : "عرضي (TV Broadcast)"}
                </button>
              ))}
            </div>
          </div>

          {/* خلفيات 4K */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5 flex items-center gap-1">
              <ImageIcon className="w-4 h-4 text-emerald-400" /> خلفية البث المباشر:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BACKGROUND_LIBRARY.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setBgImage(bg.url)}
                  className={`p-2.5 text-xs rounded-xl border text-right transition truncate font-medium ${
                    bgImage === bg.url
                      ? "bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow-md"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {bg.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}