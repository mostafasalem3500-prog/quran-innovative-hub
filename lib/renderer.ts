/**
 * محرك الرسم السينمائي — يرسم بطاقة قرآنية على Canvas بأي دقة (HD / 4K)
 * جميع القياسات بوحدات "منطقية" (عرض 1080 للطولي والمربع، 1920 للعرضي) ثم تُكبَّر بمعامل الدقة.
 */
import { VerseData, BASMALA, toArabicDigits, getLang, trimTafseer } from "./quranData";

export type AspectRatio = "9:16" | "1:1" | "16:9" | "4:5";
export type Resolution = "hd" | "2k" | "4k";
export type FrameStyle = "none" | "thin" | "double" | "corners" | "ornate";
export type HeaderStyle = "broadcast" | "banner" | "minimal" | "none";
export type BracketStyle = "ornate" | "simple" | "none";
export type Animation = "none" | "fade" | "rise" | "zoom";

export interface Theme {
  id: string;
  name: string;
  verse: string; // لون النص القرآني
  accent: string; // ذهبي / لون التمييز
  text: string; // نص عادي
  muted: string; // نص خافت
  overlayTop: string;
  overlayBottom: string;
  panel: string; // لون صندوق التفسير
  light?: boolean;
}

export const THEMES: Theme[] = [
  { id: "gold-night", name: "ذهبي ليلي", verse: "#FDE68A", accent: "#D4A94A", text: "#F8FAFC", muted: "#CBD5E1", overlayTop: "rgba(6,10,14,0.45)", overlayBottom: "rgba(2,6,12,0.88)", panel: "rgba(5,10,20,0.55)" },
  { id: "emerald-haram", name: "أخضر حرمي", verse: "#F5D78E", accent: "#34D399", text: "#ECFDF5", muted: "#A7F3D0", overlayTop: "rgba(3,28,20,0.5)", overlayBottom: "rgba(2,20,14,0.9)", panel: "rgba(2,30,22,0.6)" },
  { id: "navy-royal", name: "كحلي ملكي", verse: "#FFFFFF", accent: "#F5D78E", text: "#E2E8F0", muted: "#94A3B8", overlayTop: "rgba(10,18,48,0.5)", overlayBottom: "rgba(5,10,30,0.92)", panel: "rgba(8,15,40,0.6)" },
  { id: "ivory-paper", name: "ورق عاجي (فاتح)", verse: "#1F2937", accent: "#8B6B1E", text: "#1F2937", muted: "#4B5563", overlayTop: "rgba(250,246,232,0.78)", overlayBottom: "rgba(245,238,214,0.92)", panel: "rgba(255,255,255,0.55)", light: true },
  { id: "sunset-rose", name: "غروب وردي", verse: "#FFF7ED", accent: "#FDBA74", text: "#FFEDD5", muted: "#FED7AA", overlayTop: "rgba(60,15,30,0.45)", overlayBottom: "rgba(30,5,15,0.9)", panel: "rgba(50,10,25,0.55)" },
  { id: "mono", name: "أحادي أنيق", verse: "#FFFFFF", accent: "#E5E7EB", text: "#F3F4F6", muted: "#9CA3AF", overlayTop: "rgba(0,0,0,0.55)", overlayBottom: "rgba(0,0,0,0.92)", panel: "rgba(0,0,0,0.5)" },
  { id: "teal-glass", name: "زجاج فيروزي", verse: "#CCFBF1", accent: "#2DD4BF", text: "#F0FDFA", muted: "#99F6E4", overlayTop: "rgba(4,30,36,0.5)", overlayBottom: "rgba(2,18,24,0.9)", panel: "rgba(4,40,44,0.55)" },
];

export const QURAN_FONTS = [
  { id: "Amiri Quran", name: "أميري قرآن (مصحفي)" },
  { id: "Scheherazade New", name: "شهرزاد (نسخ عثماني)" },
  { id: "Noto Naskh Arabic", name: "نوتو نسخ" },
  { id: "Amiri", name: "أميري" },
  { id: "Lateef", name: "لطيف" },
  { id: "Aref Ruqaa", name: "عارف رقعة" },
  { id: "Reem Kufi", name: "ريم كوفي" },
];

export interface CardDesign {
  aspect: AspectRatio;
  resolution: Resolution;
  themeId: string;
  fontFamily: string;
  uiFont: string;
  fontSize: number; // بوحدات منطقية (أساس 1080)
  lineHeight: number; // نسبة
  verseOffsetY: number; // -1..1 إزاحة عمودية للنص
  bracket: BracketStyle;
  showVerseBadge: boolean;
  showBasmala: boolean;
  headerStyle: HeaderStyle;
  channelName: string;
  showReciter: boolean;
  showTranslation: boolean;
  translationSize: number;
  showTafseer: boolean;
  tafseerMaxChars: number;
  tafseerSize: number;
  tafseerPanel: boolean;
  showFooter: boolean;
  footerText: string;
  watermark: string;
  frame: FrameStyle;
  overlayOpacity: number; // 0..1
  blur: number; // px
  vignette: number; // 0..1
  glow: number; // 0..1
  kenBurns: boolean;
  animation: Animation;
  showProgress: boolean;
  bgUrl: string;
  bgPosX: number; // 0..1
  bgPosY: number; // 0..1
}

export const DEFAULT_DESIGN: CardDesign = {
  aspect: "9:16",
  resolution: "hd",
  themeId: "gold-night",
  fontFamily: "Amiri Quran",
  uiFont: "Cairo",
  fontSize: 58,
  lineHeight: 1.9,
  verseOffsetY: 0,
  bracket: "ornate",
  showVerseBadge: true,
  showBasmala: true,
  headerStyle: "broadcast",
  channelName: "قناة القرآن الكريم",
  showReciter: true,
  showTranslation: true,
  translationSize: 26,
  showTafseer: true,
  tafseerMaxChars: 420,
  tafseerSize: 24,
  tafseerPanel: true,
  showFooter: true,
  footerText: "النص القرآني وفق مصحف المدينة النبوية — مجمع الملك فهد لطباعة المصحف الشريف",
  watermark: "",
  frame: "corners",
  overlayOpacity: 0.7,
  blur: 0,
  vignette: 0.6,
  glow: 0.5,
  kenBurns: true,
  animation: "rise",
  showProgress: true,
  bgUrl: "",
  bgPosX: 0.5,
  bgPosY: 0.5,
};

export const PRESETS: { id: string; name: string; desc: string; patch: Partial<CardDesign> }[] = [
  { id: "broadcast", name: "بث فضائي", desc: "ترويسة قناة، شريط قارئ، ذهبي ليلي", patch: { themeId: "gold-night", headerStyle: "broadcast", frame: "corners", showReciter: true, showTafseer: true, showProgress: true } },
  { id: "reels-minimal", name: "ريلز بسيط", desc: "آية فقط بخط كبير بدون تفسير", patch: { themeId: "mono", headerStyle: "minimal", frame: "none", showTafseer: false, showTranslation: false, fontSize: 70, showReciter: false, vignette: 0.8 } },
  { id: "haram", name: "حرمي أخضر", desc: "لمسة الحرم الشريف بإطار مزخرف", patch: { themeId: "emerald-haram", headerStyle: "banner", frame: "ornate", showTafseer: true } },
  { id: "paper", name: "مصحف ورقي", desc: "خلفية فاتحة كأوراق المصحف", patch: { themeId: "ivory-paper", headerStyle: "banner", frame: "double", bgUrl: "gradient:#f7f1de,#efe5c4,#f5eed6", overlayOpacity: 0.2, glow: 0, showTafseer: true } },
  { id: "translation", name: "دعوي مترجم", desc: "آية + ترجمة بارزة للجمهور غير العربي", patch: { themeId: "navy-royal", showTranslation: true, translationSize: 32, showTafseer: false, headerStyle: "minimal", frame: "thin" } },
  { id: "tafseer-focus", name: "دراسة التفسير", desc: "مساحة أوسع للتفسير الموسّع", patch: { themeId: "teal-glass", showTafseer: true, tafseerMaxChars: 700, tafseerSize: 22, fontSize: 46, tafseerPanel: true, headerStyle: "banner" } },
];

export interface RenderAnim {
  t: number; // 0..1 تقدم الآية الحالية (لحركة Ken Burns)
  enter: number; // 0..1 دخول النص
  progress: number; // 0..1 تقدم المقطع كاملاً
}

export const LOGICAL_SIZE: Record<AspectRatio, [number, number]> = {
  "9:16": [1080, 1920],
  "1:1": [1080, 1080],
  "16:9": [1920, 1080],
  "4:5": [1080, 1350],
};

export const RES_SCALE: Record<Resolution, number> = { hd: 1, "2k": 1.5, "4k": 2 };

export function physicalSize(aspect: AspectRatio, res: Resolution): [number, number] {
  const [w, h] = LOGICAL_SIZE[aspect];
  const s = RES_SCALE[res];
  return [Math.round(w * s), Math.round(h * s)];
}

export const getTheme = (id: string) => THEMES.find((t) => t.id === id) || THEMES[0];

// ────────────────────────────── أدوات مساعدة ──────────────────────────────
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function star8(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const rad = i % 2 === 0 ? r : r * 0.55;
    const a = (Math.PI / 8) * i - Math.PI / 2;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawCornerOrnament(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.lineTo(0, 0);
  ctx.lineTo(size, 0);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(12, size * 0.7);
  ctx.lineTo(12, 12);
  ctx.lineTo(size * 0.7, 12);
  ctx.stroke();
  star8(ctx, 26, 26, 11);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(size, 0, 4, 0, Math.PI * 2);
  ctx.arc(0, size, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFrame(ctx: CanvasRenderingContext2D, W: number, H: number, style: FrameStyle, color: string) {
  if (style === "none") return;
  const m = 34;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 6;
  if (style === "thin") {
    ctx.lineWidth = 2.5;
    ctx.strokeRect(m, m, W - m * 2, H - m * 2);
  } else if (style === "double") {
    ctx.lineWidth = 3;
    ctx.strokeRect(m, m, W - m * 2, H - m * 2);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(m + 12, m + 12, W - (m + 12) * 2, H - (m + 12) * 2);
  } else if (style === "corners") {
    const s = Math.min(W, H) * 0.11;
    drawCornerOrnament(ctx, m, m, s, 0, color);
    drawCornerOrnament(ctx, W - m, m, s, Math.PI / 2, color);
    drawCornerOrnament(ctx, W - m, H - m, s, Math.PI, color);
    drawCornerOrnament(ctx, m, H - m, s, -Math.PI / 2, color);
  } else if (style === "ornate") {
    ctx.lineWidth = 3;
    ctx.strokeRect(m, m, W - m * 2, H - m * 2);
    ctx.lineWidth = 1;
    ctx.strokeRect(m + 14, m + 14, W - (m + 14) * 2, H - (m + 14) * 2);
    // نجوم ثمانية على طول الحواف
    ctx.fillStyle = color;
    const step = 64;
    const r = 7;
    for (let x = m + 40; x < W - m - 30; x += step) {
      star8(ctx, x, m + 7, r);
      ctx.fill();
      star8(ctx, x, H - m - 7, r);
      ctx.fill();
    }
    for (let y = m + 40; y < H - m - 30; y += step) {
      star8(ctx, m + 7, y, r);
      ctx.fill();
      star8(ctx, W - m - 7, y, r);
      ctx.fill();
    }
    const s = Math.min(W, H) * 0.1;
    drawCornerOrnament(ctx, m + 22, m + 22, s, 0, color);
    drawCornerOrnament(ctx, W - m - 22, m + 22, s, Math.PI / 2, color);
    drawCornerOrnament(ctx, W - m - 22, H - m - 22, s, Math.PI, color);
    drawCornerOrnament(ctx, m + 22, H - m - 22, s, -Math.PI / 2, color);
  }
  ctx.restore();
}

function drawDivider(ctx: CanvasRenderingContext2D, cx: number, y: number, width: number, color: string) {
  ctx.save();
  const g = ctx.createLinearGradient(cx - width / 2, 0, cx + width / 2, 0);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(0.5, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.strokeStyle = g;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - width / 2, y);
  ctx.lineTo(cx + width / 2, y);
  ctx.stroke();
  ctx.fillStyle = color;
  star8(ctx, cx, y, 8);
  ctx.fill();
  ctx.restore();
}

/** رسم الخلفية (صورة / فيديو / تدرّج) مع تغطية كاملة و Ken Burns */
export function drawBackground(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  media: HTMLImageElement | HTMLVideoElement | null,
  d: CardDesign,
  anim: RenderAnim
) {
  if (d.bgUrl.startsWith("gradient:") || !media) {
    const cols = d.bgUrl.startsWith("gradient:") ? d.bgUrl.slice(9).split(",") : ["#062a1f", "#0b3d2e", "#123f33"];
    const g = ctx.createLinearGradient(0, 0, W, H);
    cols.forEach((c, i) => g.addColorStop(i / Math.max(1, cols.length - 1), c.trim()));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // لمعة ناعمة
    const rg = ctx.createRadialGradient(W * 0.5, H * 0.3, 10, W * 0.5, H * 0.3, Math.max(W, H) * 0.8);
    rg.addColorStop(0, "rgba(255,255,255,0.08)");
    rg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
    return;
  }
  const mw = (media as HTMLVideoElement).videoWidth || (media as HTMLImageElement).naturalWidth || 1;
  const mh = (media as HTMLVideoElement).videoHeight || (media as HTMLImageElement).naturalHeight || 1;
  const kb = d.kenBurns ? 1 + 0.08 * anim.t : 1;
  const scale = Math.max(W / mw, H / mh) * kb;
  const dw = mw * scale;
  const dh = mh * scale;
  const panX = d.kenBurns ? (anim.t - 0.5) * 0.04 * W : 0;
  const dx = (W - dw) * d.bgPosX + panX;
  const dy = (H - dh) * d.bgPosY;
  ctx.save();
  if (d.blur > 0) ctx.filter = `blur(${d.blur}px)`;
  ctx.drawImage(media, dx, dy, dw, dh);
  ctx.restore();
}

export interface RenderInput {
  verse: VerseData;
  design: CardDesign;
  langCode: string;
  media: HTMLImageElement | HTMLVideoElement | null;
  anim?: RenderAnim;
  /** رسم بطاقة افتتاحية/ختامية بدل الآية */
  slate?: { title: string; subtitle: string } | null;
}

/** الدالة الرئيسية: ترسم البطاقة كاملة على الـ canvas المعطى */
export function renderCard(canvas: HTMLCanvasElement, input: RenderInput) {
  const { verse, design: d, langCode, media } = input;
  const anim: RenderAnim = input.anim || { t: 0, enter: 1, progress: 0 };
  const theme = getTheme(d.themeId);
  const [LW, LH] = LOGICAL_SIZE[d.aspect];
  const s = RES_SCALE[d.resolution];
  const PW = Math.round(LW * s);
  const PH = Math.round(LH * s);
  if (canvas.width !== PW || canvas.height !== PH) {
    canvas.width = PW;
    canvas.height = PH;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, PW, PH);
  ctx.scale(s, s);
  const W = LW;
  const H = LH;
  const wide = d.aspect === "16:9";
  const uiFont = `"${d.uiFont}", "Cairo", "Tajawal", sans-serif`;
  const qFont = `"${d.fontFamily}", "Amiri Quran", "Scheherazade New", serif`;

  // 1) الخلفية
  drawBackground(ctx, W, H, media, d, anim);

  // 2) الطبقة السينمائية
  const ov = ctx.createLinearGradient(0, 0, 0, H);
  ov.addColorStop(0, theme.overlayTop);
  ov.addColorStop(0.5, theme.overlayTop);
  ov.addColorStop(1, theme.overlayBottom);
  ctx.globalAlpha = d.overlayOpacity;
  ctx.fillStyle = ov;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
  if (d.vignette > 0) {
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, `rgba(0,0,0,${0.85 * d.vignette})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  // 3) الإطار
  drawFrame(ctx, W, H, d.frame, theme.accent);

  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.direction = "rtl";

  // بطاقة افتتاحية / ختامية
  if (input.slate) {
    ctx.fillStyle = theme.accent;
    ctx.font = `700 ${wide ? 64 : 58}px ${qFont}`;
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 18;
    ctx.fillText(input.slate.title, W / 2, H * 0.44);
    ctx.font = `600 ${wide ? 30 : 28}px ${uiFont}`;
    ctx.fillStyle = theme.text;
    ctx.fillText(input.slate.subtitle, W / 2, H * 0.44 + 80);
    drawDivider(ctx, W / 2, H * 0.44 + 130, W * 0.45, theme.accent);
    ctx.shadowBlur = 0;
    return;
  }

  // 4) الترويسة
  const surahTitle = `سُورَةُ ${verse.surahName}`;
  const verseLabel = `الآية ${toArabicDigits(verse.verseNumber)} من ${toArabicDigits(verse.totalVersesInSurah)}`;
  let topY = wide ? 64 : 100;

  if (d.headerStyle === "broadcast") {
    // شريط بث علوي: اسم القناة يميناً + شارة مباشر يساراً
    const barH = wide ? 54 : 62;
    const y = wide ? 46 : 60;
    ctx.save();
    const inset = d.frame === "ornate" || d.frame === "double" ? 88 : 60;
    ctx.fillStyle = theme.panel;
    roundRect(ctx, inset, y, W - inset * 2, barH, barH / 2);
    ctx.fill();
    ctx.strokeStyle = theme.accent;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.textAlign = "right";
    ctx.fillStyle = theme.accent;
    ctx.font = `800 ${wide ? 22 : 24}px ${uiFont}`;
    ctx.fillText(d.channelName || "قناة القرآن الكريم", W - inset - 28, y + barH / 2);
    // شارة
    ctx.textAlign = "left";
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(inset + 34, y + barH / 2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = theme.text;
    ctx.font = `700 ${wide ? 18 : 20}px ${uiFont}`;
    ctx.fillText("تلاوة مباشرة", inset + 50, y + barH / 2);
    ctx.restore();
    topY = y + barH + (wide ? 34 : 70);
    // عنوان السورة
    ctx.fillStyle = theme.accent;
    ctx.font = `700 ${wide ? 34 : 40}px ${qFont}`;
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 12;
    ctx.fillText(`۞ ${surahTitle} ۞`, W / 2, topY);
    ctx.shadowBlur = 0;
    ctx.fillStyle = theme.muted;
    ctx.font = `600 ${wide ? 18 : 22}px ${uiFont}`;
    ctx.fillText(verseLabel, W / 2, topY + (wide ? 36 : 44));
    topY += wide ? 70 : 90;
  } else if (d.headerStyle === "banner") {
    const bw = Math.min(W * 0.62, 620);
    const bh = wide ? 70 : 84;
    const y = wide ? 44 : 84;
    ctx.save();
    ctx.fillStyle = theme.panel;
    roundRect(ctx, W / 2 - bw / 2, y, bw, bh, 18);
    ctx.fill();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = theme.accent;
    star8(ctx, W / 2 - bw / 2, y + bh / 2, 12);
    ctx.fill();
    star8(ctx, W / 2 + bw / 2, y + bh / 2, 12);
    ctx.fill();
    ctx.font = `700 ${wide ? 32 : 36}px ${qFont}`;
    ctx.fillText(surahTitle, W / 2, y + bh / 2 - 12);
    ctx.fillStyle = theme.muted;
    ctx.font = `600 ${wide ? 16 : 18}px ${uiFont}`;
    ctx.fillText(verseLabel, W / 2, y + bh / 2 + 22);
    ctx.restore();
    topY = y + bh + (wide ? 30 : 60);
  } else if (d.headerStyle === "minimal") {
    ctx.fillStyle = theme.accent;
    ctx.font = `600 ${wide ? 24 : 28}px ${qFont}`;
    ctx.fillText(`${surahTitle} • ${toArabicDigits(verse.verseNumber)}`, W / 2, topY);
    topY += wide ? 40 : 60;
  }

  // ── حدود المنطقة السفلية (شريط القارئ + التذييل)
  const footerH = d.showFooter ? (wide ? 56 : 70) : 30;
  const reciterH = d.showReciter ? (wide ? 60 : 74) : 0;
  const bottomLimit = H - footerH - reciterH - 24;

  // ── قياس التفسير مسبقاً لتثبيته أسفل البطاقة
  const tfs = wide ? d.tafseerSize * 0.9 : d.tafseerSize;
  const tlhT = tfs * 1.65;
  let tafLines: string[] = [];
  let panelH = 0;
  if (d.showTafseer && verse.tafseerArabic) {
    ctx.save();
    ctx.direction = "rtl";
    ctx.font = `400 ${tfs}px ${uiFont}`;
    const maxLinesByArea = Math.max(2, Math.floor(((bottomLimit - topY) * (wide ? 0.5 : 0.42)) / tlhT));
    tafLines = wrapLines(ctx, trimTafseer(verse.tafseerArabic, d.tafseerMaxChars), W * 0.82);
    if (tafLines.length > maxLinesByArea) {
      tafLines = tafLines.slice(0, maxLinesByArea);
      tafLines[maxLinesByArea - 1] = tafLines[maxLinesByArea - 1].replace(/[،.؛\s]+$/, "") + " …";
    }
    panelH = tafLines.length * tlhT + 74;
    ctx.restore();
  }
  const panelY = bottomLimit - panelH;

  // ── قياس الترجمة
  const lang = getLang(langCode);
  const translated = d.showTranslation ? verse.translations[langCode] : "";
  const trSize = wide ? d.translationSize * 0.85 : d.translationSize;
  const trLH = d.translationSize * 1.45;
  let trLines: string[] = [];
  if (translated) {
    ctx.save();
    ctx.direction = lang.rtl ? "rtl" : "ltr";
    ctx.font = `italic 400 ${trSize}px ${lang.rtl ? qFont : `"Cairo", "Segoe UI", sans-serif`}`;
    trLines = wrapLines(ctx, translated, W * 0.8).slice(0, 6);
    ctx.restore();
  }
  const trBlockH = translated ? 30 + trLines.length * trLH + 10 : 0;

  // 5) النص القرآني
  const enter = easeOut(Math.min(1, Math.max(0, anim.enter)));
  ctx.save();
  if (d.animation === "fade") ctx.globalAlpha = enter;
  if (d.animation === "rise") {
    ctx.globalAlpha = enter;
    ctx.translate(0, (1 - enter) * 40);
  }
  if (d.animation === "zoom") {
    ctx.globalAlpha = enter;
    const z = 0.94 + 0.06 * enter;
    ctx.translate(W / 2, H / 2);
    ctx.scale(z, z);
    ctx.translate(-W / 2, -H / 2);
  }

  const fs = wide ? d.fontSize * 0.85 : d.fontSize;
  ctx.font = `400 ${fs}px ${qFont}`;
  ctx.fillStyle = theme.verse;
  const maxW = W * (wide ? 0.8 : 0.84);
  const open = d.bracket === "ornate" ? "﴿ " : d.bracket === "simple" ? "« " : "";
  const close = d.bracket === "ornate" ? " ﴾" : d.bracket === "simple" ? " »" : "";
  const bodyLines = wrapLines(ctx, `${open}${verse.textUthmani}${close}`, maxW);
  const lh = fs * d.lineHeight;

  const basmalaOn = d.showBasmala && verse.verseNumber === 1 && verse.surahNumber !== 1 && verse.surahNumber !== 9;
  const blockH = bodyLines.length * lh + (basmalaOn ? lh * 0.9 : 0) + trBlockH;
  const areaTop = topY;
  const areaBottom = panelH ? panelY - 16 : bottomLimit;
  let y = areaTop + (areaBottom - areaTop - blockH) / 2 + lh / 2 + d.verseOffsetY * 0.15 * H;
  y = Math.max(areaTop + lh / 2, y);

  ctx.shadowColor = theme.light ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.9)";
  ctx.shadowBlur = 14;
  if (basmalaOn) {
    ctx.font = `400 ${fs * 0.82}px ${qFont}`;
    ctx.fillStyle = theme.accent;
    ctx.fillText(BASMALA, W / 2, y);
    y += lh * 0.9;
    ctx.font = `400 ${fs}px ${qFont}`;
    ctx.fillStyle = theme.verse;
  }
  if (d.glow > 0 && !theme.light) {
    ctx.shadowColor = theme.verse;
    ctx.shadowBlur = 24 * d.glow;
  }
  bodyLines.forEach((line, i) => ctx.fillText(line, W / 2, y + i * lh));

  // شارة رقم الآية بجانب نهاية النص
  if (d.showVerseBadge) {
    const last = bodyLines[bodyLines.length - 1];
    const lw = ctx.measureText(last).width;
    const r = fs * 0.36;
    const bx = W / 2 - lw / 2 - r - 14;
    const by = y + (bodyLines.length - 1) * lh;
    ctx.shadowBlur = 0;
    ctx.fillStyle = theme.panel;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.stroke();
    star8(ctx, bx, by, r * 0.92);
    ctx.stroke();
    ctx.fillStyle = theme.accent;
    ctx.font = `700 ${r * 0.9}px ${uiFont}`;
    ctx.fillText(toArabicDigits(verse.verseNumber), bx, by + 1);
  }
  ctx.shadowBlur = 0;
  let nextY = y + (bodyLines.length - 1) * lh + lh * 0.7;
  ctx.restore();

  // 6) الترجمة
  if (translated && trLines.length) {
    drawDivider(ctx, W / 2, nextY, W * 0.4, theme.accent);
    nextY += 30;
    ctx.save();
    ctx.direction = lang.rtl ? "rtl" : "ltr";
    ctx.font = `italic 400 ${trSize}px ${lang.rtl ? qFont : `"Cairo", "Segoe UI", sans-serif`}`;
    ctx.fillStyle = theme.text;
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 8;
    trLines.forEach((l, i) => ctx.fillText(l, W / 2, nextY + trLH / 2 + i * trLH));
    ctx.restore();
  }

  // 7) التفسير (مثبّت أسفل البطاقة)
  if (panelH) {
    ctx.save();
    ctx.direction = "rtl";
    const px = W * 0.06;
    const py = panelY;
    if (d.tafseerPanel) {
      ctx.fillStyle = theme.panel;
      roundRect(ctx, px, py, W - px * 2, panelH, 22);
      ctx.fill();
      ctx.strokeStyle = theme.accent;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = theme.accent;
    ctx.font = `800 ${tfs * 0.95}px ${uiFont}`;
    ctx.fillText(`${verse.tafseerName || "التفسير المعتمد"}`, W / 2, py + 30);
    drawDivider(ctx, W / 2, py + 52, W * 0.3, theme.accent);
    ctx.font = `400 ${tfs}px ${uiFont}`;
    ctx.fillStyle = theme.text;
    tafLines.forEach((l, i) => ctx.fillText(l, W / 2, py + 74 + i * tlhT + tlhT / 2 - 6));
    ctx.restore();
  }

  // 8) شريط القارئ (Lower third)
  if (d.showReciter) {
    const y = H - footerH - reciterH + 8;
    const bh = reciterH - 16;
    const bw = Math.min(W * 0.7, 720);
    ctx.save();
    ctx.fillStyle = theme.panel;
    roundRect(ctx, W / 2 - bw / 2, y, bw, bh, 14);
    ctx.fill();
    ctx.strokeStyle = theme.accent;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (wide) {
      ctx.fillStyle = theme.accent;
      ctx.font = `800 20px ${uiFont}`;
      ctx.fillText(`🎙 بصوت القارئ: ${verse.reciterName}`, W / 2, y + bh / 2);
    } else {
      ctx.fillStyle = theme.muted;
      ctx.font = `600 15px ${uiFont}`;
      ctx.fillText("بصوت القارئ", W / 2, y + 16);
      ctx.fillStyle = theme.accent;
      ctx.font = `800 24px ${uiFont}`;
      ctx.fillText(verse.reciterName, W / 2, y + bh - 18);
    }
    ctx.restore();
  }

  // 9) التذييل
  if (d.showFooter) {
    ctx.save();
    ctx.fillStyle = theme.muted;
    ctx.font = `500 ${wide ? 14 : 16}px ${uiFont}`;
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = 6;
    const fl = wrapLines(ctx, d.footerText, W * 0.85);
    fl.slice(0, 2).forEach((l, i) => ctx.fillText(l, W / 2, H - footerH + 22 + i * 22));
    ctx.restore();
  }

  // 10) علامة مائية
  if (d.watermark) {
    ctx.save();
    ctx.textAlign = "left";
    ctx.direction = "ltr";
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = theme.accent;
    ctx.font = `700 ${wide ? 16 : 18}px ${uiFont}`;
    ctx.fillText(d.watermark, 48, H - 20 - (d.showFooter ? 0 : 0));
    ctx.restore();
  }

  // 11) شريط التقدم
  if (d.showProgress && anim.progress > 0) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(0, H - 6, W, 6);
    ctx.fillStyle = theme.accent;
    ctx.fillRect(0, H - 6, W * Math.min(1, anim.progress), 6);
    ctx.restore();
  }
}

/** تحميل الخطوط اللازمة قبل الرسم */
export async function ensureFonts(d: CardDesign) {
  if (typeof document === "undefined" || !(document as any).fonts) return;
  const list = [
    `400 40px "${d.fontFamily}"`,
    `700 24px "${d.uiFont}"`,
    `800 24px "${d.uiFont}"`,
    `400 24px "${d.uiFont}"`,
  ];
  try {
    await Promise.all(list.map((f) => (document as any).fonts.load(f)));
  } catch {}
}

/** تحميل صورة الخلفية (مع CORS) */
export function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!url || url.startsWith("gradient:")) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
