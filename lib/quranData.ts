/**
 * طبقة البيانات — Quran Innovative Hub
 * المصادر الموثقة:
 *  - النص العثماني والتراجم والصوت: AlQuran Cloud API (api.alquran.cloud) + Islamic Network CDN (cdn.islamic.network)
 *    وهي مبنية على مصحف المدينة النبوية (مجمع الملك فهد لطباعة المصحف الشريف) بترميز Tanzil.
 *  - التفاسير الموسعة (ابن كثير، الطبري، السعدي...): مشروع tafsir_api المفتوح (بيانات qul.tarteel.ai) عبر jsDelivr CDN.
 */

// ─────────────────────────────── الأنواع ───────────────────────────────
export interface SurahMeta {
  number: number;
  name: string; // الاسم العربي
  englishName: string;
  ayahs: number;
  revelation: "مكية" | "مدنية";
}

export interface VerseData {
  surahNumber: number;
  surahName: string;
  surahEnglishName: string;
  verseNumber: number;
  globalNumber: number; // رقم الآية في المصحف كاملاً (1..6236)
  totalVersesInSurah: number;
  textUthmani: string;
  textSimple: string;
  audioUrl: string;
  tafseerArabic: string;
  tafseerName: string;
  reciterName: string;
  translations: { [langCode: string]: string };
}

export interface BackgroundMedia {
  id: string;
  name: string;
  url: string;
  type: "image" | "video" | "gradient" | "animated";
  category?: string;
  credit?: string;
}

export interface Reciter {
  id: string;
  name: string;
  style: "مرتل" | "مجود";
  bitrate: number;
}

export interface TafseerOption {
  id: string;
  name: string;
  author: string;
  source: "alquran" | "tafsir_api";
  slug: string; // المعرّف الفعلي في المصدر
  length: "موجز" | "متوسط" | "موسّع";
}

export interface TranslationLang {
  code: string;
  name: string;
  nativeName: string;
  edition: string;
  rtl: boolean;
}

// ─────────────────────────────── السور (114) ───────────────────────────────
const MEDINAN = new Set([2, 3, 4, 5, 8, 9, 13, 22, 24, 33, 47, 48, 49, 55, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 76, 98, 99, 110]);

const SURAH_RAW: [string, string, number][] = [
  ["الفاتحة", "Al-Fatihah", 7], ["البقرة", "Al-Baqarah", 286], ["آل عمران", "Aal-E-Imran", 200], ["النساء", "An-Nisa", 176],
  ["المائدة", "Al-Ma'idah", 120], ["الأنعام", "Al-An'am", 165], ["الأعراف", "Al-A'raf", 206], ["الأنفال", "Al-Anfal", 75],
  ["التوبة", "At-Tawbah", 129], ["يونس", "Yunus", 109], ["هود", "Hud", 123], ["يوسف", "Yusuf", 111],
  ["الرعد", "Ar-Ra'd", 43], ["إبراهيم", "Ibrahim", 52], ["الحجر", "Al-Hijr", 99], ["النحل", "An-Nahl", 128],
  ["الإسراء", "Al-Isra", 111], ["الكهف", "Al-Kahf", 110], ["مريم", "Maryam", 98], ["طه", "Ta-Ha", 135],
  ["الأنبياء", "Al-Anbiya", 112], ["الحج", "Al-Hajj", 78], ["المؤمنون", "Al-Mu'minun", 118], ["النور", "An-Nur", 64],
  ["الفرقان", "Al-Furqan", 77], ["الشعراء", "Ash-Shu'ara", 227], ["النمل", "An-Naml", 93], ["القصص", "Al-Qasas", 88],
  ["العنكبوت", "Al-Ankabut", 69], ["الروم", "Ar-Rum", 60], ["لقمان", "Luqman", 34], ["السجدة", "As-Sajdah", 30],
  ["الأحزاب", "Al-Ahzab", 73], ["سبأ", "Saba", 54], ["فاطر", "Fatir", 45], ["يس", "Ya-Sin", 83],
  ["الصافات", "As-Saffat", 182], ["ص", "Sad", 88], ["الزمر", "Az-Zumar", 75], ["غافر", "Ghafir", 85],
  ["فصلت", "Fussilat", 54], ["الشورى", "Ash-Shura", 53], ["الزخرف", "Az-Zukhruf", 89], ["الدخان", "Ad-Dukhan", 59],
  ["الجاثية", "Al-Jathiyah", 37], ["الأحقاف", "Al-Ahqaf", 35], ["محمد", "Muhammad", 38], ["الفتح", "Al-Fath", 29],
  ["الحجرات", "Al-Hujurat", 18], ["ق", "Qaf", 45], ["الذاريات", "Adh-Dhariyat", 60], ["الطور", "At-Tur", 49],
  ["النجم", "An-Najm", 62], ["القمر", "Al-Qamar", 55], ["الرحمن", "Ar-Rahman", 78], ["الواقعة", "Al-Waqi'ah", 96],
  ["الحديد", "Al-Hadid", 29], ["المجادلة", "Al-Mujadila", 22], ["الحشر", "Al-Hashr", 24], ["الممتحنة", "Al-Mumtahanah", 13],
  ["الصف", "As-Saf", 14], ["الجمعة", "Al-Jumu'ah", 11], ["المنافقون", "Al-Munafiqun", 11], ["التغابن", "At-Taghabun", 18],
  ["الطلاق", "At-Talaq", 12], ["التحريم", "At-Tahrim", 12], ["الملك", "Al-Mulk", 30], ["القلم", "Al-Qalam", 52],
  ["الحاقة", "Al-Haqqah", 52], ["المعارج", "Al-Ma'arij", 44], ["نوح", "Nuh", 28], ["الجن", "Al-Jinn", 28],
  ["المزمل", "Al-Muzzammil", 20], ["المدثر", "Al-Muddathir", 56], ["القيامة", "Al-Qiyamah", 40], ["الإنسان", "Al-Insan", 31],
  ["المرسلات", "Al-Mursalat", 50], ["النبأ", "An-Naba", 40], ["النازعات", "An-Nazi'at", 46], ["عبس", "Abasa", 42],
  ["التكوير", "At-Takwir", 29], ["الانفطار", "Al-Infitar", 19], ["المطففين", "Al-Mutaffifin", 36], ["الانشقاق", "Al-Inshiqaq", 25],
  ["البروج", "Al-Buruj", 22], ["الطارق", "At-Tariq", 17], ["الأعلى", "Al-A'la", 19], ["الغاشية", "Al-Ghashiyah", 26],
  ["الفجر", "Al-Fajr", 30], ["البلد", "Al-Balad", 20], ["الشمس", "Ash-Shams", 15], ["الليل", "Al-Layl", 21],
  ["الضحى", "Ad-Duha", 11], ["الشرح", "Ash-Sharh", 8], ["التين", "At-Tin", 8], ["العلق", "Al-Alaq", 19],
  ["القدر", "Al-Qadr", 5], ["البينة", "Al-Bayyinah", 8], ["الزلزلة", "Az-Zalzalah", 8], ["العاديات", "Al-Adiyat", 11],
  ["القارعة", "Al-Qari'ah", 11], ["التكاثر", "At-Takathur", 8], ["العصر", "Al-Asr", 3], ["الهمزة", "Al-Humazah", 9],
  ["الفيل", "Al-Fil", 5], ["قريش", "Quraysh", 4], ["الماعون", "Al-Ma'un", 7], ["الكوثر", "Al-Kawthar", 3],
  ["الكافرون", "Al-Kafirun", 6], ["النصر", "An-Nasr", 3], ["المسد", "Al-Masad", 5], ["الإخلاص", "Al-Ikhlas", 4],
  ["الفلق", "Al-Falaq", 5], ["الناس", "An-Nas", 6],
];

export const SURAHS: SurahMeta[] = SURAH_RAW.map(([name, englishName, ayahs], i) => ({
  number: i + 1,
  name,
  englishName,
  ayahs,
  revelation: MEDINAN.has(i + 1) ? "مدنية" : "مكية",
}));

/** للتوافق مع الكود السابق */
export const SURAHS_LIST = SURAHS.map((s) => s.name);

/** مجموع الآيات قبل كل سورة (لحساب الرقم العام للآية) */
const CUMULATIVE: number[] = (() => {
  const arr: number[] = [0];
  for (const s of SURAHS) arr.push(arr[arr.length - 1] + s.ayahs);
  return arr;
})();

export const TOTAL_AYAHS = CUMULATIVE[114]; // 6236
export const getSurah = (n: number): SurahMeta => SURAHS[Math.min(114, Math.max(1, n)) - 1];
export const globalAyahNumber = (surah: number, verse: number) => CUMULATIVE[surah - 1] + verse;
export const BASMALA = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

// ─────────────────────────────── القرّاء ───────────────────────────────
export const RECITERS_LIST: Reciter[] = [
  { id: "ar.hudhaify", name: "علي بن عبد الرحمن الحذيفي", style: "مرتل", bitrate: 128 },
  { id: "ar.abdulbasitmurattal", name: "عبد الباسط عبد الصمد (مرتل)", style: "مرتل", bitrate: 192 },
  { id: "ar.abdulsamad", name: "عبد الباسط عبد الصمد (مجود)", style: "مجود", bitrate: 64 },
  { id: "ar.husary", name: "محمود خليل الحصري (مرتل)", style: "مرتل", bitrate: 128 },
  { id: "ar.husarymujawwad", name: "محمود خليل الحصري (مجود)", style: "مجود", bitrate: 128 },
  { id: "ar.minshawi", name: "محمد صديق المنشاوي (مرتل)", style: "مرتل", bitrate: 128 },
  { id: "ar.minshawimujawwad", name: "محمد صديق المنشاوي (مجود)", style: "مجود", bitrate: 64 },
  { id: "ar.alafasy", name: "مشاري بن راشد العفاسي", style: "مرتل", bitrate: 128 },
  { id: "ar.saoodshuraym", name: "سعود الشريم", style: "مرتل", bitrate: 64 },
  { id: "ar.abdurrahmaansudais", name: "عبد الرحمن السديس", style: "مرتل", bitrate: 192 },
  { id: "ar.mahermuaiqly", name: "ماهر المعيقلي", style: "مرتل", bitrate: 128 },
  { id: "ar.ahmedajamy", name: "أحمد بن علي العجمي", style: "مرتل", bitrate: 128 },
  { id: "ar.abdullahbasfar", name: "عبد الله بصفر", style: "مرتل", bitrate: 192 },
  { id: "ar.shaatree", name: "أبو بكر الشاطري", style: "مرتل", bitrate: 128 },
  { id: "ar.hanirifai", name: "هاني الرفاعي", style: "مرتل", bitrate: 192 },
  { id: "ar.muhammadayyoub", name: "محمد أيوب", style: "مرتل", bitrate: 128 },
  { id: "ar.muhammadjibreel", name: "محمد جبريل", style: "مرتل", bitrate: 128 },
  { id: "ar.ibrahimakhbar", name: "إبراهيم الأخضر", style: "مرتل", bitrate: 32 },
  { id: "ar.aymanswoaid", name: "أيمن سويد", style: "مرتل", bitrate: 64 },
  { id: "ar.parhizgar", name: "شهريار برهيزكار", style: "مرتل", bitrate: 48 },
];

export const getReciter = (id: string) => RECITERS_LIST.find((r) => r.id === id) || RECITERS_LIST[0];

/** رابط الصوت للآية (آية بآية) */
export function ayahAudioUrl(reciterId: string, surah: number, verse: number, bitrate?: number) {
  const r = getReciter(reciterId);
  const br = bitrate || r.bitrate;
  return `https://cdn.islamic.network/quran/audio/${br}/${reciterId}/${globalAyahNumber(surah, verse)}.mp3`;
}

// مرايا صوتية بديلة على خادم مستقل تماماً (everyayah.com) — تُستخدم فقط عند فشل
// كل محاولات cdn.islamic.network، لضمان استمرار الصوت حتى لو تعطّل خادم واحد.
// تم التحقق من كل مسار هنا فعلياً قبل إدراجه؛ لا نخمّن أسماء المجلدات.
const EVERYAYAH_MAP: Record<string, string> = {
  "ar.hudhaify": "Hudhaify_128kbps",
  "ar.abdulbasitmurattal": "Abdul_Basit_Murattal_192kbps",
  "ar.abdulsamad": "Abdul_Basit_Mujawwad_128kbps",
  "ar.husary": "Husary_128kbps",
  "ar.minshawi": "Minshawy_Murattal_128kbps",
  "ar.minshawimujawwad": "Minshawy_Mujawwad_192kbps",
  "ar.alafasy": "Alafasy_128kbps",
  "ar.saoodshuraym": "Saood_ash-Shuraym_128kbps",
  "ar.abdurrahmaansudais": "Abdurrahmaan_As-Sudais_192kbps",
  "ar.mahermuaiqly": "MaherAlMuaiqly128kbps",
  "ar.ahmedajamy": "Ahmed_ibn_Ali_al-Ajamy_64kbps_QuranExplorer.Com",
  "ar.abdullahbasfar": "Abdullah_Basfar_192kbps",
  "ar.shaatree": "Abu_Bakr_Ash-Shaatree_128kbps",
  "ar.hanirifai": "Hani_Rifai_192kbps",
  "ar.muhammadayyoub": "Muhammad_Ayyoub_128kbps",
  "ar.muhammadjibreel": "Muhammad_Jibreel_64kbps",
  "ar.aymanswoaid": "Ayman_Sowaid_64kbps",
};

function everyayahUrl(reciterId: string, surah: number, verse: number) {
  const folder = EVERYAYAH_MAP[reciterId];
  if (!folder) return null;
  const code = `${String(surah).padStart(3, "0")}${String(verse).padStart(3, "0")}`;
  return `https://everyayah.com/data/${folder}/${code}.mp3`;
}

/**
 * روابط بديلة للصوت عند فشل الجودة الأصلية — تشمل مرايا على خادم مستقل لضمان الاستمرارية.
 * نجرّب أولاً بِت-ريت القارئ الحقيقي (كما في RECITERS_LIST، وهو المطابق فعلياً لما يخدمه CDN
 * لكل قارئ)، ثم بقية البتات الشائعة (32/48/64/128/192) كاحتياط لو تغيّر شيء على الخادم،
 * ثم مرآة everyayah.com المستقلة تماماً كملاذ أخير.
 */
export function ayahAudioFallbacks(reciterId: string, surah: number, verse: number) {
  const g = globalAyahNumber(surah, verse);
  const r = getReciter(reciterId);
  const bitrates = Array.from(new Set([r.bitrate, 128, 64, 192, 48, 32]));
  const list = bitrates.map((br) => `https://cdn.islamic.network/quran/audio/${br}/${reciterId}/${g}.mp3`);
  const mirror = everyayahUrl(reciterId, surah, verse);
  if (mirror) list.push(mirror);
  return list;
}

// ─────────────────────────────── التفاسير ───────────────────────────────
export const TAFSEER_OPTIONS: TafseerOption[] = [
  { id: "muyassar", name: "التفسير الميسر", author: "مجمع الملك فهد", source: "alquran", slug: "ar.muyassar", length: "موجز" },
  { id: "jalalayn", name: "تفسير الجلالين", author: "المحلي والسيوطي", source: "alquran", slug: "ar.jalalayn", length: "موجز" },
  { id: "saadi", name: "تفسير السعدي", author: "عبد الرحمن السعدي", source: "tafsir_api", slug: "ar-tafseer-al-saddi", length: "متوسط" },
  { id: "ibnkathir", name: "تفسير ابن كثير", author: "الحافظ ابن كثير", source: "tafsir_api", slug: "ar-tafsir-ibn-kathir", length: "موسّع" },
  { id: "tabari", name: "تفسير الطبري", author: "ابن جرير الطبري", source: "tafsir_api", slug: "ar-tafsir-al-tabari", length: "موسّع" },
  { id: "qurtubi", name: "تفسير القرطبي", author: "أبو عبد الله القرطبي", source: "alquran", slug: "ar.qurtubi", length: "موسّع" },
  { id: "baghawi", name: "تفسير البغوي", author: "الحسين البغوي", source: "alquran", slug: "ar.baghawi", length: "متوسط" },
  { id: "waseet", name: "التفسير الوسيط", author: "محمد سيد طنطاوي", source: "alquran", slug: "ar.waseet", length: "متوسط" },
  { id: "miqbas", name: "تنوير المقباس", author: "منسوب لابن عباس", source: "alquran", slug: "ar.miqbas", length: "موجز" },
];

export const getTafseer = (id: string) => TAFSEER_OPTIONS.find((t) => t.id === id || t.slug === id) || TAFSEER_OPTIONS[0];

// ─────────────────────────────── التراجم ───────────────────────────────
export const TRANSLATION_LANGUAGES: TranslationLang[] = [
  { code: "en", name: "English — Sahih International", nativeName: "English", edition: "en.sahih", rtl: false },
  { code: "en2", name: "English — Pickthall", nativeName: "English (Pickthall)", edition: "en.pickthall", rtl: false },
  { code: "fr", name: "French — Hamidullah", nativeName: "Français", edition: "fr.hamidullah", rtl: false },
  { code: "es", name: "Spanish — Cortés", nativeName: "Español", edition: "es.cortes", rtl: false },
  { code: "de", name: "German — Bubenheim", nativeName: "Deutsch", edition: "de.bubenheim", rtl: false },
  { code: "it", name: "Italian — Piccardo", nativeName: "Italiano", edition: "it.piccardo", rtl: false },
  { code: "pt", name: "Portuguese — El-Hayek", nativeName: "Português", edition: "pt.elhayek", rtl: false },
  { code: "nl", name: "Dutch — Keyzer", nativeName: "Nederlands", edition: "nl.keyzer", rtl: false },
  { code: "ru", name: "Russian — Kuliev", nativeName: "Русский", edition: "ru.kuliev", rtl: false },
  { code: "tr", name: "Turkish — Diyanet", nativeName: "Türkçe", edition: "tr.diyanet", rtl: false },
  { code: "ur", name: "Urdu — Jalandhri", nativeName: "اردو", edition: "ur.jalandhry", rtl: true },
  { code: "fa", name: "Persian — Makarem", nativeName: "فارسی", edition: "fa.makarem", rtl: true },
  { code: "id", name: "Indonesian — Kemenag", nativeName: "Bahasa Indonesia", edition: "id.indonesian", rtl: false },
  { code: "ms", name: "Malay — Basmeih", nativeName: "Bahasa Melayu", edition: "ms.basmeih", rtl: false },
  { code: "bn", name: "Bengali — Muhiuddin Khan", nativeName: "বাংলা", edition: "bn.bengali", rtl: false },
  { code: "hi", name: "Hindi — Farooq Khan", nativeName: "हिन्दी", edition: "hi.hindi", rtl: false },
  { code: "ta", name: "Tamil — Jan Trust", nativeName: "தமிழ்", edition: "ta.tamil", rtl: false },
  { code: "zh", name: "Chinese — Ma Jian", nativeName: "中文", edition: "zh.jian", rtl: false },
  { code: "sw", name: "Swahili — Al-Barwani", nativeName: "Kiswahili", edition: "sw.barwani", rtl: false },
  { code: "ha", name: "Hausa — Gumi", nativeName: "Hausa", edition: "ha.gumi", rtl: false },
];

export const getLang = (code: string) => TRANSLATION_LANGUAGES.find((l) => l.code === code) || TRANSLATION_LANGUAGES[0];

// ─────────────────────────────── الخلفيات ───────────────────────────────
// كل صور Unsplash تصل بدون قيود CORS (تدعم الرسم على Canvas والتصدير كفيديو).
const u = (id: string) => `https://images.unsplash.com/${id}?w=3840&auto=format&fit=crop&q=82`;

export const BACKGROUND_LIBRARY: BackgroundMedia[] = [
  // ── المعالم والعمارة الإسلامية ──
  { id: "mosque", name: "محراب ومسجد", type: "image", category: "معالم", url: u("photo-1542810634-71277d95dcbb"), credit: "Unsplash" },
  { id: "kaaba-night", name: "الحرم ليلاً", type: "image", category: "معالم", url: u("photo-1591604129939-f1efa4d9f7fa"), credit: "Unsplash" },
  { id: "madinah", name: "المسجد النبوي", type: "image", category: "معالم", url: u("photo-1565552645632-d725f8bfc19a"), credit: "Unsplash" },
  { id: "minaret", name: "مئذنة وسماء", type: "image", category: "معالم", url: u("photo-1519817650390-64a93db51149"), credit: "Unsplash" },
  { id: "dome", name: "قبة مزخرفة", type: "image", category: "معالم", url: u("photo-1564769625905-50e93615e769"), credit: "Unsplash" },
  { id: "arch", name: "أقواس عربية", type: "image", category: "معالم", url: u("photo-1548013146-72479768bada"), credit: "Unsplash" },
  { id: "geometry", name: "زخرفة هندسية إسلامية", type: "image", category: "معالم", url: u("photo-1725710017265-f33a3129726e"), credit: "Unsplash" },
  { id: "calligraphy-wall", name: "جدار خط عربي", type: "image", category: "معالم", url: u("photo-1591123120675-6f7f1aae0e5b"), credit: "Unsplash" },
  { id: "carpet", name: "سجادة مزخرفة", type: "image", category: "معالم", url: u("photo-1600166898405-da9535204843"), credit: "Unsplash" },
  { id: "lantern2", name: "فانوس رمضاني", type: "image", category: "معالم", url: u("photo-1639918063455-65e676f2ca60"), credit: "Unsplash" },
  // ── طبيعة وسماء ──
  { id: "desert", name: "صحراء وغروب", type: "image", category: "طبيعة", url: u("photo-1509316785289-025f5b846b35"), credit: "Unsplash" },
  { id: "dunes", name: "كثبان رملية", type: "image", category: "طبيعة", url: u("photo-1547234935-80c7145ec969"), credit: "Unsplash" },
  { id: "sea", name: "شاطئ وغروب", type: "image", category: "طبيعة", url: u("photo-1507525428034-b723cf961d3e"), credit: "Unsplash" },
  { id: "ocean-wave", name: "أمواج المحيط", type: "image", category: "طبيعة", url: u("photo-1505142468610-359e7d316be0"), credit: "Unsplash" },
  { id: "mountains", name: "جبال وضباب", type: "image", category: "طبيعة", url: u("photo-1464822759023-fed622ff2c3b"), credit: "Unsplash" },
  { id: "snow-peak", name: "قمم ثلجية", type: "image", category: "طبيعة", url: u("photo-1519681393784-d120267933ba"), credit: "Unsplash" },
  { id: "stars", name: "سماء ونجوم", type: "image", category: "طبيعة", url: u("photo-1506703719100-a0f3a48c0f86"), credit: "Unsplash" },
  { id: "aurora", name: "شفق قطبي", type: "image", category: "طبيعة", url: u("photo-1483347756197-71ef80e95f73"), credit: "Unsplash" },
  { id: "milkyway", name: "مجرة درب التبانة", type: "image", category: "طبيعة", url: u("photo-1444703686981-a3abbc4d4fe3"), credit: "Unsplash" },
  { id: "clouds", name: "غيوم من الأعلى", type: "image", category: "طبيعة", url: u("photo-1499956827185-0d63ee78a910"), credit: "Unsplash" },
  { id: "forest", name: "غابة وضوء", type: "image", category: "طبيعة", url: u("photo-1441974231531-c6227db76b6e"), credit: "Unsplash" },
  { id: "misty-path", name: "طريق ضبابي", type: "image", category: "طبيعة", url: u("photo-1738395548716-522475b89043"), credit: "Unsplash" },
  { id: "rain", name: "مطر على زجاج", type: "image", category: "طبيعة", url: u("photo-1428592953211-077101b2021b"), credit: "Unsplash" },
  { id: "waterfall", name: "شلال أخضر", type: "image", category: "طبيعة", url: u("photo-1433086966358-54859d0ed716"), credit: "Unsplash" },
  { id: "garden", name: "حديقة خضراء", type: "image", category: "طبيعة", url: u("photo-1585320806297-9794b3e4eeae"), credit: "Unsplash" },
  { id: "palm", name: "نخيل وسماء", type: "image", category: "طبيعة", url: u("photo-1765249456442-f51badd803b4"), credit: "Unsplash" },
  { id: "dates-fruit", name: "تمر وسعف النخيل", type: "image", category: "طبيعة", url: u("photo-1785531191261-2207cb51381d"), credit: "Unsplash" },
  { id: "sky-glow", name: "سماء متوهجة", type: "image", category: "طبيعة", url: u("photo-1506905925346-21bda4d32df4"), credit: "Unsplash" },
  { id: "peak-mist", name: "قمة وضباب", type: "image", category: "طبيعة", url: u("photo-1470252649378-9c29740c9fa8"), credit: "Unsplash" },
  { id: "golden-peak", name: "قمة ذهبية عند الغروب", type: "image", category: "طبيعة", url: u("photo-1470770903676-69b98201ea1c"), credit: "Unsplash" },
  { id: "night-sky2", name: "سماء ليلية صافية", type: "image", category: "طبيعة", url: u("photo-1500534623283-312aade485b7"), credit: "Unsplash" },
  { id: "blue-horizon", name: "أفق أزرق هادئ", type: "image", category: "طبيعة", url: u("photo-1519452575417-564c1401ecc0"), credit: "Unsplash" },
  { id: "reflection-lake", name: "بحيرة وانعكاس", type: "image", category: "طبيعة", url: u("photo-1500964757637-c85e8a162699"), credit: "Unsplash" },
  { id: "sunbeam-forest", name: "أشعة بين الأشجار", type: "image", category: "طبيعة", url: u("photo-1477414348463-c0eb7f1359b6"), credit: "Unsplash" },
  { id: "hills-fog", name: "تلال ضبابية", type: "image", category: "طبيعة", url: u("photo-1478760329108-5c3ed9d495a0"), credit: "Unsplash" },
  { id: "canyon-glow", name: "أخدود صخري وضوء", type: "image", category: "طبيعة", url: u("photo-1475724017904-b712052c192a"), credit: "Unsplash" },
  { id: "night-city", name: "أفق ليلي بعيد", type: "image", category: "طبيعة", url: u("photo-1524055988636-436cfa46e59e"), credit: "Unsplash" },
  { id: "green-hills", name: "تلال خضراء", type: "image", category: "طبيعة", url: u("photo-1473773508845-188df298d2d1"), credit: "Unsplash" },
  { id: "lake-mountain", name: "بحيرة وجبال", type: "image", category: "طبيعة", url: u("photo-1490730141103-6cac27aaab94"), credit: "Unsplash" },
  { id: "mosque-sunset2", name: "مسجد عند الغروب", type: "image", category: "معالم", url: u("photo-1745863676110-e7494bf3a9ea"), credit: "Unsplash" },
  { id: "mosque-golden-hour", name: "مسجد بالساعة الذهبية", type: "image", category: "معالم", url: u("photo-1576301173659-228b963e83b2"), credit: "Unsplash" },
  { id: "mosque-marble-arches", name: "أقواس مرمرية داخلية", type: "image", category: "معالم", url: u("photo-1784400340561-270c9c240613"), credit: "Unsplash" },
  { id: "mosque-columns", name: "أعمدة وأقواس مسجد", type: "image", category: "معالم", url: u("photo-1769428197774-2dfdffe4a723"), credit: "Unsplash" },
  { id: "quran-book", name: "كتاب مفتوح", type: "image", category: "معالم", url: u("photo-1542816417-0983c9c9ad53"), credit: "Unsplash" },
  { id: "prayer-beads", name: "مسبحة وكتاب", type: "image", category: "معالم", url: u("photo-1527999230720-768828d2d0a3"), credit: "Unsplash" },
  // ── قوام وأنسجة ──
  { id: "marble", name: "رخام فاخر", type: "image", category: "قوام", url: u("photo-1541417904950-b855846fe074"), credit: "Unsplash" },
  { id: "gold-texture", name: "قوام ذهبي", type: "image", category: "قوام", url: u("photo-1513346940221-6f673d962e97"), credit: "Unsplash" },
  { id: "smoke", name: "دخان بخور", type: "image", category: "قوام", url: u("photo-1518073399906-6ea6b5c4c1e3"), credit: "Unsplash" },
  { id: "bokeh", name: "أضواء بوكيه", type: "image", category: "قوام", url: u("photo-1518895312237-a9e23508077d"), credit: "Unsplash" },
  { id: "mandala-gold", name: "زخرفة هندسية ذهبية", type: "image", category: "قوام", url: u("photo-1772388864594-eea7885fa799"), credit: "Unsplash" },
  { id: "candle-dark", name: "شمعة في الظلام", type: "image", category: "قوام", url: u("photo-1694588061661-ecd7a7b69b79"), credit: "Unsplash" },
  // ── تدرّجات ──
  { id: "g-emerald", name: "تدرّج أخضر حرمي", type: "gradient", category: "تدرّج", url: "gradient:#062a1f,#0b3d2e,#123f33" },
  { id: "g-navy", name: "تدرّج كحلي ذهبي", type: "gradient", category: "تدرّج", url: "gradient:#0b1230,#12204d,#1b1b3a" },
  { id: "g-brown", name: "تدرّج بني عتيق", type: "gradient", category: "تدرّج", url: "gradient:#2b1d12,#3d2a1a,#1f150c" },
  { id: "g-black", name: "أسود فحمي", type: "gradient", category: "تدرّج", url: "gradient:#000000,#0d0d0d,#1a1a1a" },
  { id: "g-purple", name: "تدرّج بنفسجي ليلي", type: "gradient", category: "تدرّج", url: "gradient:#1a0b2e,#2d1b4e,#0f0a1f" },
  { id: "g-rose", name: "تدرّج وردي غروب", type: "gradient", category: "تدرّج", url: "gradient:#3d1a1a,#4a2418,#1a0d0d" },
  // ── خلفيات متحركة (تُرسم مباشرة، بلا أي ملفات خارجية → متوافقة مع تصدير الفيديو) ──
  { id: "anim-stars", name: "نجوم متلألئة", type: "animated", category: "متحركة", url: "anim:stars" },
  { id: "anim-particles", name: "جزيئات ذهبية عائمة", type: "animated", category: "متحركة", url: "anim:particles" },
  { id: "anim-aurora", name: "سديم متحرك", type: "animated", category: "متحركة", url: "anim:aurora" },
  { id: "anim-geometry", name: "زخرفة هندسية دوارة", type: "animated", category: "متحركة", url: "anim:geometry" },
  { id: "anim-waves", name: "أمواج ضوء", type: "animated", category: "متحركة", url: "anim:waves" },
  { id: "anim-rays", name: "أشعة نور علوية", type: "animated", category: "متحركة", url: "anim:rays" },
  { id: "anim-crescent", name: "هلال متوهج وسماء ليلية", type: "animated", category: "متحركة", url: "anim:crescent" },
  { id: "anim-sweep", name: "شريط ضوء ذهبي متحرك", type: "animated", category: "متحركة", url: "anim:sweep" },
  { id: "anim-embers", name: "شرر رمضاني دافئ", type: "animated", category: "متحركة", url: "anim:embers" },
];

export const BACKGROUND_CATEGORIES = Array.from(new Set(BACKGROUND_LIBRARY.map((b) => b.category || "أخرى")));

// ─────────────────────────────── التخزين المؤقت ───────────────────────────────
const memCache = new Map<string, any>();

// v2: بادئة جديدة لإبطال أي بيانات قديمة كانت مخزّنة قبل إصلاح تعريفات الترجمة
const CACHE_PREFIX = "qh2:";

async function cachedJson<T = any>(url: string, ttlMs = 1000 * 60 * 60 * 12): Promise<T> {
  const now = Date.now();
  const hit = memCache.get(url);
  if (hit && hit.exp > now) return hit.data as T;

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + url);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.exp > now) {
          memCache.set(url, parsed);
          return parsed.data as T;
        }
      }
    } catch {}
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  const data = (await res.json()) as T;
  const entry = { data, exp: now + ttlMs };
  memCache.set(url, entry);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CACHE_PREFIX + url, JSON.stringify(entry));
    } catch {}
  }
  return data;
}

/** مسح كاش المتصفح (للصيانة) */
export function clearQuranCache() {
  memCache.clear();
  if (typeof window === "undefined") return;
  Object.keys(localStorage)
    .filter((k) => k.startsWith("qh") && k.includes(":"))
    .forEach((k) => localStorage.removeItem(k));
}

// ─────────────────────────────── الجلب ───────────────────────────────
const API = "https://api.alquran.cloud/v1";
const TAFSIR_CDN = "https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir";

/**
 * نص السورة كاملاً (عثماني + إملائي + ترجمة) في طلب واحد.
 * ملاحظة مهمة: إذا طُلب معرّف إصدار غير صحيح، فإن alquran.cloud لا يُرجع خطأ بل
 * يستبدله بإصدار عربي آخر بصمت (غالباً نسخة عثمانية أخرى) — ما كان يظهر سابقاً
 * كـ"ترجمة" هي فعلياً نص القرآن العربي نفسه. لذا نتحقق من حقل identifier في كل
 * عنصر بدل الوثوق بترتيب المصفوفة، ونتجاهل أي عنصر لا يطابق ما طلبناه.
 */
export async function fetchSurahBundle(surah: number, langCode: string) {
  const lang = getLang(langCode);
  const url = `${API}/surah/${surah}/editions/quran-uthmani,quran-simple,${lang.edition}`;
  const json = await cachedJson<any>(url);
  if (json.code !== 200) throw new Error("فشل تحميل السورة");
  const items: any[] = json.data;
  const byId = (id: string) => items.find((it) => it?.identifier === id);
  const uth = byId("quran-uthmani") || items[0];
  const simple = byId("quran-simple") || items[1];
  // نقبل الترجمة فقط إذا كان المعرّف المُرجَع مطابقاً تماماً لما طلبناه
  const transItem = byId(lang.edition);
  return {
    uthmani: uth.ayahs.map((a: any) => a.text as string),
    simple: simple.ayahs.map((a: any) => a.text as string),
    translation: transItem ? transItem.ayahs.map((a: any) => a.text as string) : null,
    meta: uth as { name: string; englishName: string; numberOfAyahs: number; revelationType: string },
  };
}

/** التفسير لآية بعينها من المصدر المناسب */
export async function fetchTafseer(surah: number, verse: number, tafseerId: string): Promise<{ text: string; name: string }> {
  const t = getTafseer(tafseerId);
  try {
    if (t.source === "tafsir_api") {
      const json = await cachedJson<any>(`${TAFSIR_CDN}/${t.slug}/${surah}/${verse}.json`);
      return { text: (json.text || "").trim(), name: t.name };
    }
    const json = await cachedJson<any>(`${API}/ayah/${surah}:${verse}/${t.slug}`);
    if (json.code === 200 && json.data?.text) return { text: json.data.text.trim(), name: t.name };
    throw new Error("empty");
  } catch {
    // الرجوع للتفسير الميسر
    const json = await cachedJson<any>(`${API}/ayah/${surah}:${verse}/ar.muyassar`);
    return { text: json.data?.text?.trim() || "", name: "التفسير الميسر" };
  }
}

/** إزالة تشكيل النص للمقارنة المرنة (حركات + تنوين + شدة + مدّة) */
function stripDiacritics(s: string) {
  return s.replace(/[ً-ٰٟۖ-ࣰۭ-ࣿ]/g, "").replace(/[إأآاٱ]/g, "ا").replace(/ى/g, "ي").replace(/\s+/g, " ").trim();
}

const BASMALA_BARE = stripDiacritics("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ");

/**
 * إزالة البسملة الملحقة في بداية أول آية من كل سورة (كما ترد فعلياً في بيانات
 * Tanzil لكل السور غير الفاتحة والتوبة) لأننا نرسمها بشكل مستقل في البطاقة.
 * المقارنة تتجاهل التشكيل لضمان العمل حتى مع اختلافات طفيفة في الترميز.
 */
export function stripLeadingBasmala(text: string, surah: number, verse: number) {
  if (verse !== 1 || surah === 1 || surah === 9) return text;
  const words = text.trim().split(/\s+/);
  // البسملة أربع كلمات؛ نبحث عن أطول تطابق من بداية النص (4 ثم 3 كحدّ أدنى تحسباً لاختلاف الفصل)
  for (const n of [4, 3]) {
    if (words.length <= n) continue;
    const head = stripDiacritics(words.slice(0, n).join(" "));
    if (BASMALA_BARE.startsWith(head) || head === BASMALA_BARE) {
      return words.slice(n).join(" ").trim();
    }
  }
  return text;
}

/** تفاصيل آية واحدة (يستخدم كاش السورة) */
export async function fetchVerseDetails(
  surah: number,
  verse: number,
  reciterId: string = "ar.hudhaify",
  tafseerId: string = "muyassar",
  langCode: string = "en"
): Promise<VerseData> {
  const meta = getSurah(surah);
  const v = Math.min(meta.ayahs, Math.max(1, verse));
  try {
    const [bundle, taf] = await Promise.all([fetchSurahBundle(surah, langCode), fetchTafseer(surah, v, tafseerId)]);
    return {
      surahNumber: surah,
      surahName: meta.name,
      surahEnglishName: meta.englishName,
      verseNumber: v,
      globalNumber: globalAyahNumber(surah, v),
      totalVersesInSurah: meta.ayahs,
      textUthmani: stripLeadingBasmala(bundle.uthmani[v - 1], surah, v),
      textSimple: stripLeadingBasmala(bundle.simple[v - 1], surah, v),
      audioUrl: ayahAudioUrl(reciterId, surah, v),
      tafseerArabic: taf.text,
      tafseerName: taf.name,
      reciterName: getReciter(reciterId).name,
      translations: { [langCode]: bundle.translation ? bundle.translation[v - 1] || "" : "" },
    };
  } catch (err) {
    console.error("fetchVerseDetails", err);
    return {
      surahNumber: surah,
      surahName: meta.name,
      surahEnglishName: meta.englishName,
      verseNumber: v,
      globalNumber: globalAyahNumber(surah, v),
      totalVersesInSurah: meta.ayahs,
      textUthmani: "تعذّر تحميل النص — تحقق من الاتصال بالإنترنت",
      textSimple: "",
      audioUrl: ayahAudioUrl(reciterId, surah, v),
      tafseerArabic: "",
      tafseerName: "",
      reciterName: getReciter(reciterId).name,
      translations: { [langCode]: "" },
    };
  }
}

/** نطاق آيات (للفيديو والدفعات) مع تحميل مسبق متوازٍ للتفاسير */
export async function fetchVerseRange(
  surah: number,
  from: number,
  to: number,
  reciterId: string,
  tafseerId: string,
  langCode: string,
  onProgress?: (done: number, total: number) => void
): Promise<VerseData[]> {
  const meta = getSurah(surah);
  const a = Math.max(1, from);
  const b = Math.min(meta.ayahs, to);
  const total = b - a + 1;
  const out: VerseData[] = [];
  const CONCURRENCY = 6;
  for (let i = a; i <= b; i += CONCURRENCY) {
    const chunk: Promise<VerseData>[] = [];
    for (let v = i; v < Math.min(i + CONCURRENCY, b + 1); v++) chunk.push(fetchVerseDetails(surah, v, reciterId, tafseerId, langCode));
    out.push(...(await Promise.all(chunk)));
    onProgress?.(out.length, total);
  }
  return out;
}

/** اقتطاع التفسير الطويل عند حدود الجملة */
export function trimTafseer(text: string, maxChars: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return clean;
  const cut = clean.slice(0, maxChars);
  const lastStop = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("،"), cut.lastIndexOf("؛"), cut.lastIndexOf(" "));
  return (lastStop > maxChars * 0.5 ? cut.slice(0, lastStop) : cut).trim() + " …";
}

/** آية عشوائية (آية اليوم) */
export function randomVerseRef(): { surah: number; verse: number } {
  const g = 1 + Math.floor(Math.random() * TOTAL_AYAHS);
  let s = 1;
  while (CUMULATIVE[s] < g) s++;
  return { surah: s, verse: g - CUMULATIVE[s - 1] };
}

/** تحويل الأرقام إلى الهندية (العربية المشرقية) */
export function toArabicDigits(n: number | string) {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);
}
