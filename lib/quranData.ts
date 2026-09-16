export interface VerseData {
  surahNumber: number;
  surahName: string;
  verseNumber: number;
  totalVersesInSurah: number;
  textUthmani: string;
  audioUrl: string;
  tafseerArabic: string;
  reciterName: string;
  translations: {
    [key: string]: string;
  };
}

export interface BackgroundMedia {
  id: string;
  name: string;
  url: string;
}

export const SURAHS_LIST = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
  "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
  "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
  "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
  "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
  "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
  "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
  "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
  "التكوير", "الإنفطار", "المطففين", "الإنشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
  "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
  "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
  "المسد", "الإخلاص", "الفلق", "الناس"
];

export const RECITERS_LIST = [
  { id: "ar.hudhaify", name: "علي بن عبد الرحمن الحذيفي" },
  { id: "ar.abdulbasitmurattal", name: "عبد الباسط عبد الصمد" },
  { id: "ar.husary", name: "محمود خليل الحصري" },
  { id: "ar.minshawi", name: "محمد صديق المنشاوي" },
  { id: "ar.alafasy", name: "مشاري بن راشد العفاسي" },
  { id: "ar.saoodshuraym", name: "سعود الشريم" }
];

export const TAFSEER_OPTIONS = [
  { id: "ar.muyassar", name: "التفسير الميسر (معتمد)" },
  { id: "ar.qurtubi", name: "تفسير القرطبي" },
  { id: "ar.jalalayn", name: "تفسير الجلالين" },
  { id: "ar.ibnkathir", name: "تفسير ابن كثير" },
  { id: "ar.tabari", name: "تفسير الطبري" }
];

export const TRANSLATION_LANGUAGES = [
  { code: "en", name: "English (Sahih International)", edition: "en.sahih" },
  { code: "fr", name: "Français (Hamidullah)", edition: "fr.hamidullah" },
  { code: "ur", name: "Urdu (Jalandhri)", edition: "ur.jalandhri" },
  { code: "id", name: "Indonesian (Bahasa)", edition: "id.indonesian" },
  { code: "tr", name: "Türkçe (Diyanet)", edition: "tr.diyanet" }
];

export const BACKGROUND_LIBRARY: BackgroundMedia[] = [
  {
    id: "1",
    name: "محراب ومسجد 4K",
    url: "https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=1600&auto=format&fit=crop"
  },
  {
    id: "2",
    name: "شاطئ وغروب 4K",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop"
  },
  {
    id: "3",
    name: "جبال وضباب 4K",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&auto=format&fit=crop"
  },
  {
    id: "4",
    name: "سماء ونجوم 4K",
    url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop"
  }
];

export async function fetchVerseDetails(
  surah: number,
  verse: number,
  reciterId: string = "ar.hudhaify",
  tafseerEdition: string = "ar.muyassar",
  selectedLangCode: string = "en"
): Promise<VerseData> {
  try {
    const resVerse = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${verse}/ar.uthmani`);
    const dataVerse = await resVerse.json();

    const audioUrl = `https://cdn.islamic.network/quran/audio/128/${reciterId}/${dataVerse.data.number}.mp3`;
    const currentReciter = RECITERS_LIST.find((r) => r.id === reciterId)?.name || "القارئ المعتمد";

    let tafseerText = "";
    const resTafseer = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${verse}/${tafseerEdition}`);
    const dataTafseer = await resTafseer.json();

    if (dataTafseer.code === 200 && dataTafseer.data && dataTafseer.data.text) {
      tafseerText = dataTafseer.data.text;
    } else {
      const resFallback = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${verse}/ar.muyassar`);
      const dataFallback = await resFallback.json();
      tafseerText = dataFallback.data.text;
    }

    const langObj = TRANSLATION_LANGUAGES.find((l) => l.code === selectedLangCode) || TRANSLATION_LANGUAGES[0];
    const resTrans = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${verse}/${langObj.edition}`);
    const dataTrans = await resTrans.json();

    return {
      surahNumber: surah,
      surahName: dataVerse.data.surah.name,
      verseNumber: verse,
      totalVersesInSurah: dataVerse.data.surah.numberOfAyahs,
      textUthmani: dataVerse.data.text,
      audioUrl: audioUrl,
      tafseerArabic: tafseerText,
      reciterName: currentReciter,
      translations: {
        [selectedLangCode]: dataTrans.data ? dataTrans.data.text : ""
      }
    };
  } catch (err) {
    return {
      surahNumber: 1,
      surahName: "الفاتحة",
      verseNumber: 1,
      totalVersesInSurah: 7,
      textUthmani: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
      audioUrl: "https://cdn.islamic.network/quran/audio/128/ar.hudhaify/1.mp3",
      tafseerArabic: "سورة الفاتحة افتتح بها المصحف الشريف.",
      reciterName: "علي بن عبد الرحمن الحذيفي",
      translations: {
        en: "In the name of Allah, the Entirely Merciful, the Especially Merciful."
      }
    };
  }
}