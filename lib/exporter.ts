/**
 * محرك التصدير: صور PNG/JPG، دفعات ZIP، وفيديو مع مسار صوتي مدمج (Web Audio + MediaRecorder)
 */
import JSZip from "jszip";
import { VerseData, ayahAudioFallbacks } from "./quranData";
import { CardDesign, renderCard, RenderAnim, ensureFonts, loadImage } from "./renderer";
import type { FFmpeg as FFmpegType } from "@ffmpeg/ffmpeg";

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: "image/png" | "image/jpeg" | "image/webp" = "image/png", quality = 0.95): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), type, quality));
}

export const safeName = (s: string) => s.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "_");

/** تصدير الصورة الحالية */
export async function exportImage(canvas: HTMLCanvasElement, verse: VerseData, format: "png" | "jpg" | "webp" = "png") {
  const type = format === "png" ? "image/png" : format === "jpg" ? "image/jpeg" : "image/webp";
  const blob = await canvasToBlob(canvas, type, 0.95);
  downloadBlob(blob, `Quran_${safeName(verse.surahName)}_${verse.verseNumber}_${canvas.width}x${canvas.height}.${format}`);
}

/** تصدير دفعة آيات كملف ZIP */
export async function exportBatchZip(
  verses: VerseData[],
  design: CardDesign,
  langCode: string,
  format: "png" | "jpg",
  onProgress?: (done: number, total: number) => void,
  signal?: { cancelled: boolean }
) {
  await ensureFonts(design);
  const media = await loadImage(design.bgUrl);
  const zip = new JSZip();
  const canvas = document.createElement("canvas");
  const type = format === "png" ? "image/png" : "image/jpeg";
  for (let i = 0; i < verses.length; i++) {
    if (signal?.cancelled) break;
    const v = verses[i];
    renderCard(canvas, { verse: v, design, langCode, media, anim: { t: 0, enter: 1, progress: 0 } });
    const blob = await canvasToBlob(canvas, type, 0.93);
    zip.file(`${String(v.surahNumber).padStart(3, "0")}_${String(v.verseNumber).padStart(3, "0")}_${safeName(v.surahName)}.${format}`, blob);
    onProgress?.(i + 1, verses.length);
    await new Promise((r) => setTimeout(r, 0));
  }
  const out = await zip.generateAsync({ type: "blob" });
  const first = verses[0];
  downloadBlob(out, `Quran_${safeName(first.surahName)}_${first.verseNumber}-${verses[verses.length - 1].verseNumber}.zip`);
}

// ───────────────────────────── الفيديو ─────────────────────────────
export interface VideoOptions {
  fps: number;
  introSlate: boolean;
  outroSlate: boolean;
  slateSeconds: number;
  gapSeconds: number; // فاصل صامت بين الآيات
  repeat: number; // تكرار كل آية
  monitor: boolean; // سماع الصوت أثناء التسجيل
  channelName: string;
}

export interface VideoJob {
  cancel: () => void;
  done: Promise<{ blob: Blob; ext: string } | null>;
}

export function pickMime(): { mime: string; ext: string } {
  const candidates: [string, string][] = [
    ['video/mp4;codecs="avc1.42E01E,mp4a.40.2"', "mp4"],
    ['video/mp4;codecs="avc1,mp4a.40.2"', "mp4"],
    ["video/mp4", "mp4"],
    ['video/webm;codecs="vp9,opus"', "webm"],
    ['video/webm;codecs="vp8,opus"', "webm"],
    ["video/webm", "webm"],
  ];
  for (const [mime, ext] of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(mime)) return { mime, ext };
    } catch {}
  }
  return { mime: "", ext: "webm" };
}

/** تحميل صوت آية مع تجربة روابط بديلة */
function loadAudio(urls: string[]): Promise<HTMLAudioElement | null> {
  return new Promise((resolve) => {
    let i = 0;
    const tryNext = () => {
      if (i >= urls.length) return resolve(null);
      const a = new Audio();
      a.crossOrigin = "anonymous";
      a.preload = "auto";
      a.src = urls[i++];
      a.oncanplaythrough = () => resolve(a);
      a.onerror = () => tryNext();
    };
    tryNext();
  });
}

/**
 * تسجيل فيديو: يرسم كل آية على الـ canvas أثناء تشغيل تلاوتها، ويدمج الصوت في المسار.
 */
export function recordVideo(params: {
  canvas: HTMLCanvasElement;
  draw: (anim: RenderAnim, verse?: VerseData, slate?: { title: string; subtitle: string } | null) => void;
  verses: VerseData[];
  reciterId: string;
  design: CardDesign;
  options: VideoOptions;
  onProgress?: (info: { phase: string; verseIndex: number; total: number; percent: number }) => void;
}): VideoJob {
  const { canvas, draw, verses, reciterId, options: o, design } = params;
  let cancelled = false;
  let stopRecorder: (() => void) | null = null;

  const done = (async () => {
    const { mime, ext } = pickMime();
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    const actx: AudioContext = new AudioCtx();
    await actx.resume();
    const dest = actx.createMediaStreamDestination();

    const stream = canvas.captureStream(o.fps);
    dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));

    const isUHD = canvas.width >= 2000;
    const recorder = new MediaRecorder(stream, {
      ...(mime ? { mimeType: mime } : {}),
      videoBitsPerSecond: isUHD ? 45_000_000 : 14_000_000,
      audioBitsPerSecond: 192_000,
    });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const stopped = new Promise<void>((r) => (recorder.onstop = () => r()));
    stopRecorder = () => recorder.state !== "inactive" && recorder.stop();

    // مولّد صمت لضمان وجود مسار صوتي مستمر
    const silence = actx.createGain();
    silence.gain.value = 0;
    const osc = actx.createOscillator();
    osc.connect(silence).connect(dest);
    osc.start();

    recorder.start(250);
    const total = verses.length;
    const report = (phase: string, i: number, frac: number) =>
      params.onProgress?.({ phase, verseIndex: i, total, percent: Math.round(((i + frac) / Math.max(1, total)) * 100) });

    const holdFrames = async (secs: number, drawFn: (t: number) => void) => {
      const start = performance.now();
      await new Promise<void>((resolve) => {
        const loop = () => {
          if (cancelled) return resolve();
          const t = Math.min(1, (performance.now() - start) / (secs * 1000));
          drawFn(t);
          if (t >= 1) return resolve();
          requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      });
    };

    try {
      // بطاقة افتتاحية
      if (o.introSlate && !cancelled) {
        report("المقدمة", 0, 0);
        const first = verses[0];
        await holdFrames(o.slateSeconds, (t) =>
          draw({ t, enter: t * 2, progress: 0 }, first, {
            title: `سُورَةُ ${first.surahName}`,
            subtitle: `${verses.length === 1 ? `الآية ${first.verseNumber}` : `الآيات ${first.verseNumber} – ${verses[verses.length - 1].verseNumber}`} • ${first.reciterName}`,
          })
        );
      }

      for (let i = 0; i < verses.length && !cancelled; i++) {
        const v = verses[i];
        report("تحميل التلاوة", i, 0);
        const audio = await loadAudio([v.audioUrl, ...ayahAudioFallbacks(reciterId, v.surahNumber, v.verseNumber)]);
        let src: MediaElementAudioSourceNode | null = null;
        if (audio) {
          src = actx.createMediaElementSource(audio);
          src.connect(dest);
          if (o.monitor) src.connect(actx.destination);
        }
        for (let rep = 0; rep < Math.max(1, o.repeat) && !cancelled; rep++) {
          if (audio) {
            audio.currentTime = 0;
            await audio.play().catch(() => {});
            await new Promise<void>((resolve) => {
              const loop = () => {
                if (cancelled) {
                  audio.pause();
                  return resolve();
                }
                const dur = audio.duration || 1;
                const t = Math.min(1, audio.currentTime / dur);
                draw({ t, enter: Math.min(1, audio.currentTime / 0.9), progress: (i + t) / total }, v);
                report("تسجيل", i, t);
                if (audio.ended || audio.paused && audio.currentTime >= dur - 0.05) return resolve();
                requestAnimationFrame(loop);
              };
              audio.onended = () => resolve();
              requestAnimationFrame(loop);
            });
          } else {
            // بدون صوت: 6 ثوانٍ لكل آية
            await holdFrames(6, (t) => draw({ t, enter: t * 4, progress: (i + t) / total }, v));
          }
          if (o.gapSeconds > 0 && !cancelled) await holdFrames(o.gapSeconds, () => draw({ t: 1, enter: 1, progress: (i + 1) / total }, v));
        }
        try {
          src?.disconnect();
        } catch {}
      }

      if (o.outroSlate && !cancelled) {
        report("الخاتمة", total - 1, 1);
        const last = verses[verses.length - 1];
        await holdFrames(o.slateSeconds, (t) =>
          draw({ t, enter: t * 2, progress: 1 }, last, { title: "صَدَقَ اللهُ العَظِيم", subtitle: o.channelName || "قناة القرآن الكريم" })
        );
      }
    } finally {
      recorder.state !== "inactive" && recorder.stop();
      await stopped;
      osc.stop();
      actx.close().catch(() => {});
    }
    if (cancelled && chunks.length === 0) return null;
    return { blob: new Blob(chunks, { type: mime || "video/webm" }), ext };
  })();

  return {
    cancel: () => {
      cancelled = true;
      stopRecorder?.();
    },
    done,
  };
}

// ───────────────────── تجهيز فيديو جاهز للنشر (MP4 عالمي) ─────────────────────
// نستخدم ffmpeg.wasm لتحويل ناتج التسجيل (الذي قد يخرج WebM على بعض المتصفحات)
// إلى MP4 قياسي H.264/AAC مع "+faststart" — الصيغة التي تقبلها كل منصات التواصل
// الاجتماعي (إنستغرام، تيك توك، واتساب، إكس، يوتيوب) للنشر المباشر، مع تحكم بالجودة
// والحجم عبر CRF وتحديد أقصى بُعد للإطار حتى لا يكبر حجم الملف بلا داعٍ.
let ffmpegSingleton: FFmpegType | null = null;
let ffmpegLoading: Promise<FFmpegType> | null = null;

async function getFFmpeg(onLog?: (msg: string) => void): Promise<FFmpegType> {
  if (ffmpegSingleton) return ffmpegSingleton;
  if (ffmpegLoading) return ffmpegLoading;
  ffmpegLoading = (async () => {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { toBlobURL } = await import("@ffmpeg/util");
    const ff = new FFmpeg();
    if (onLog) ff.on("log", ({ message }: { message: string }) => onLog(message));
    // نستضيف ملفات محرك ffmpeg.wasm محليًا (public/ffmpeg) بدلاً من الاعتماد على CDN خارجي،
    // لضمان عمل التحويل دون اتصال بخدمة خارجية وبأقصى موثوقية على كل الشبكات.
    const base = "/ffmpeg";
    await ff.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegSingleton = ff;
    return ff;
  })();
  try {
    return await ffmpegLoading;
  } catch (e) {
    ffmpegLoading = null;
    throw e;
  }
}

/** هل يدعم هذا المتصفح تحويل الفيديو محليًا (WebAssembly)؟ */
export function canFinalizeVideo() {
  return typeof WebAssembly !== "undefined";
}

export interface FinalizeOptions {
  /** أقصى بُعد (عرض أو ارتفاع) للإطار الناتج — يحافظ على الأبعاد الأصغر كما هي */
  maxDimension?: number;
  /** جودة الترميز — أرقام أصغر = جودة أعلى وحجم أكبر (18 ممتاز، 23 متوسط) */
  crf?: number;
  onProgress?: (percent: number) => void;
  onStage?: (stage: string) => void;
}

/**
 * يحوّل ناتج التسجيل إلى MP4 قياسي (H.264 + AAC + faststart) جاهز للنشر
 * والمشاركة المباشرة على مواقع التواصل الاجتماعي، بجودة عالية وحجم معتدل.
 */
export async function finalizeShareableMp4(input: Blob, srcExt: string, opts: FinalizeOptions = {}): Promise<Blob> {
  const { maxDimension = 1920, crf = 22 } = opts;
  opts.onStage?.("تحميل محرك التحويل");
  const ff = await getFFmpeg();
  const inName = `in_${Date.now()}.${srcExt === "mp4" ? "mp4" : "webm"}`;
  const outName = `out_${Date.now()}.mp4`;

  const progressHandler = ({ progress }: { progress: number }) => {
    if (Number.isFinite(progress)) opts.onProgress?.(Math.max(0, Math.min(100, Math.round(progress * 100))));
  };
  ff.on("progress", progressHandler);

  try {
    opts.onStage?.("تحضير الملف");
    const buf = new Uint8Array(await input.arrayBuffer());
    await ff.writeFile(inName, buf);

    opts.onStage?.("ترميز MP4 عالي الجودة");
    // نفرض بكسلات مربعة (setsar=1) لضمان عرض النِّسبة الصحيحة على كل مشغّلات الجوال
    const scale = `scale=w='min(iw,${maxDimension})':h='min(ih,${maxDimension})':force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1`;
    await ff.exec([
      "-i",
      inName,
      "-vf",
      scale,
      "-c:v",
      "libx264",
      "-profile:v",
      "high",
      "-level",
      "4.1",
      "-preset",
      "medium",
      "-crf",
      String(crf),
      "-pix_fmt",
      "yuv420p",
      "-r",
      "30",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-ar",
      "44100",
      "-movflags",
      "+faststart",
      outName,
    ]);

    const data = await ff.readFile(outName);
    const bytes = data instanceof Uint8Array ? new Uint8Array(data) : new TextEncoder().encode(String(data));
    return new Blob([bytes.buffer as ArrayBuffer], { type: "video/mp4" });
  } finally {
    ff.off("progress", progressHandler);
    await ff.deleteFile(inName).catch(() => {});
    await ff.deleteFile(outName).catch(() => {});
  }
}

export type ShareResult = "shared" | "unsupported" | "cancelled" | "error";

/** مشاركة الفيديو مباشرة عبر واجهة المشاركة الأصلية للنظام (إن كانت متاحة) */
export async function shareVideoFile(blob: Blob, filename: string, text?: string): Promise<ShareResult> {
  try {
    const nav: any = navigator;
    const file = new File([blob], filename, { type: blob.type || "video/mp4" });
    if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
      await nav.share({ files: [file], text, title: filename });
      return "shared";
    }
    return "unsupported";
  } catch (e: any) {
    if (e?.name === "AbortError") return "cancelled";
    return "error";
  }
}

/** توليد نص منشور جاهز للنشر */
export function buildCaption(verses: VerseData[], langCode: string, channel: string) {
  const first = verses[0];
  const last = verses[verses.length - 1];
  const range = first.verseNumber === last.verseNumber ? `الآية ${first.verseNumber}` : `الآيات ${first.verseNumber}-${last.verseNumber}`;
  const lines = [
    `﴿ ${verses.map((v) => v.textUthmani).join(" ")} ﴾`,
    `[سورة ${first.surahName} — ${range}]`,
    "",
    `🎙️ بصوت القارئ: ${first.reciterName}`,
  ];
  const tr = first.translations[langCode];
  if (tr && verses.length === 1) lines.push("", tr);
  lines.push("", `📖 ${first.tafseerName}: ${first.tafseerArabic.slice(0, 220)}${first.tafseerArabic.length > 220 ? "…" : ""}`);
  lines.push("", `${channel ? channel + " • " : ""}#القرآن_الكريم #تلاوة #${first.surahName.replace(/\s/g, "_")} #quran #reels #تدبر`);
  return lines.join("\n");
}
