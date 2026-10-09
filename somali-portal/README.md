# Nuur — Quran, Somali, English and Arabic

Independent Quran learning portal. Standalone service in `/somali-portal`; the existing Quran Reels application remains at the repository root.

## Features
- All 114 surahs, Arabic text from QuranEnc, Somali translation by Abdullah Hasan Yaqoub, three English translation choices with original source metadata and version numbers.
- Side by side Somali / English meanings and original explanatory footnotes.
- Arabic recitation; QuranEnc human-recorded Somali and Rowwad English audio meanings. Arabic → Somali sequence and continuous verse playback.
- Arabic Ibn Kathir, Al-Mukhtasar, Al-Qurtubi and Al-Jalalayn. English abridged Ibn Kathir and Al-Mukhtasar. Failed editions are never silently replaced with a different book.
- Curated Quran, Tajwid, Tafsir, Quranic sciences and Dawah resources. Three confirmed PDF URLs open inside the website; mobile browsers have a direct-file fallback. Local PDF viewing never uploads the file.
- Somali / English / Arabic interface, Arabic RTL, responsive layout, reduced-motion support, dark mode, font controls, bookmarks, reading position, share with edition attribution.
- Installable web manifest and service worker shell. Previously visited surahs are saved in browser storage; audio and unvisited surahs need internet. Not a complete offline Quran package.

## Sources and fidelity
1. [QuranEnc API](https://quranenc.com/en/home/api/) provides Arabic verses, meaning translations, footnotes, translation metadata and human-recorded Somali/English audio. Translation text is not modified. The app checks surah/ayah alignment and counts. The Fatiha source snapshots are dated 2026-10-09 and only used if the live source is unavailable, with explicit snapshot labeling.
2. [IslamHouse API Hub](https://github.com/IslamHouse-API/multilingual-quran-hadith-islamic-content-database-api-hub) documents IslamHouse, QuranEnc and HadeethEnc APIs and publishing conditions. This release integrates QuranEnc directly and uses curated IslamHouse resources; it does not bulk-import every IslamHouse book and does not claim endorsement.
3. Tafsir data is delivered from [tafsir_api](https://github.com/spa5k/tafsir_api), pinned to commit `eb82bb6294efe30ad5c135c03b1864afaa70e855`. Each edition links to its QUL/Tarteel source. This is a community delivery mirror, not the King Fahd Complex API. Arabic Ibn Kathir and Qurtubi also have verse links to the King Saud University Quran site.
4. [King Fahd Complex](https://qurancomplex.gov.sa/quran-translations/) official publication catalogue and [IslamHouse Tajwid book record](https://islamhouse.com/ar/books/253178/) are linked. Some source pages returned 403/429 during research; those books are source-page entries, not fabricated internal PDFs.
5. Arabic recitation: Islamic Network CDN. Translated audio is explicitly named “meaning translation”, never “Somali Quran recitation”. Missing audio returns a visible error.

Interface labels were authored for this project; the source Quran/translation/Tafsir texts are not AI-generated. Qualified Somali linguistic and scholarly review remains necessary before broad Dawah promotion. No claim of a complete scholarly review of 6236 verses or all books is made.

## Run and deploy
Node >=22 (Docker uses Node 24). No npm runtime dependencies, database or secret keys required.

```sh
npm start
npm test
npm run check
```

Railway: root `/somali-portal`, Dockerfile `Dockerfile`, health check `/health`, watch `/somali-portal/**`. Bind `0.0.0.0:$PORT` (8080 default).

## Operations
Health endpoint validates the running process and bundled metadata, not external upstream availability. Source outages return 502; Fatiha and browser-saved surahs have identified snapshot/cache fallbacks. Tafsir mirror is intentionally pinned; inspect upstream changes before changing the pin. The server caches live source responses for one hour and refreshes translation metadata. To roll back, deploy the previous Git commit. No durable user server data or migrations exist; bookmarks are local to the browser.

## Verification
11 Node tests cover verse boundaries, unmodified source rows, rejecting incomplete/misaligned verses, allowed editions, known PDF hosts, invalid requests, health and metadata. Syntax checks and the project audit pass. Live-source verification and deployment evidence are recorded in `SOURCE_CHECK.json` and `RELEASE.md` when available. All-book scholarly review is outside automated checks.
