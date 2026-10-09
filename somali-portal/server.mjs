import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const read=async f=>JSON.parse(await fs.readFile(path.join(root,'data',f),'utf8'));
const surahs=await read('surahs.json');
const snapshotMeta=await read('translations.json');
export const tafsirs={
 mukhtasar:{name:'المختصر في تفسير القرآن الكريم',slug:'ar-tafsir-al-mukhtasar',lang:'ar',source:'https://qul.tarteel.ai/resources/tafsir/251',author:'مركز تفسير للدراسات القرآنية'},
 kathir:{name:'تفسير ابن كثير',slug:'ar-tafsir-ibn-kathir',lang:'ar',source:'https://qul.tarteel.ai/resources/tafsir/22',author:'الحافظ ابن كثير'},
 qurtubi:{name:'تفسير القرطبي',slug:'ar-tafseer-al-qurtubi',lang:'ar',source:'https://qul.tarteel.ai/resources/tafsir/23',author:'أبو عبد الله القرطبي'},
 jalalayn:{name:'تفسير الجلالين',slug:'ar-tafsir-al-jalalayn',lang:'ar',source:'https://qul.tarteel.ai/resources/tafsir/523',author:'جلال الدين المحلي وجلال الدين السيوطي'},
 en_kathir:{name:'Tafsir Ibn Kathir (abridged)',slug:'en-tafisr-ibn-kathir',lang:'en',source:'https://qul.tarteel.ai/resources/tafsir/35',author:'Ibn Kathir — English abridged edition'},
 en_mukhtasar:{name:'Al-Mukhtasar — English',slug:'en-tafsir-al-mukhtasar',lang:'en',source:'https://qul.tarteel.ai/resources/tafsir/266',author:'Tafsir Center for Quranic Studies'}
};
export const catalogue=[
 {id:'so-quran',title:{so:'Qur’aanka iyo tarjamada macnihiisa',ar:'القرآن الكريم وترجمة معانيه بالصومالية',en:'Quran: Somali meaning translation'},lang:'so',type:'pdf',topic:'quran',author:'بيانات المترجم والناشر محفوظة داخل الملف الأصلي',source:'https://islamhouse.com/so/',url:'https://d1.islamhouse.com/data/so/ih_books/single/so_quraanka_Kariimka_Iyo_Tarjamada_Macnihiisa_Ee_Afka_Soomaaliga.pdf'},
 {id:'so-tajwid',title:{so:'Xeerarka tajwiidka Qur’aanka',ar:'أحكام تجويد القرآن — بالصومالية',en:'Rules of Tajwid — Somali'},lang:'so',type:'pdf',topic:'tajwid',author:'CabdiRisaaq Maxamed Cilmi',source:'https://islamhouse.com/so/books/61670/',url:'https://d1.islamhouse.com/data/so/ih_books/single/so_the_rulings_of_the_tajweed.pdf'},
 {id:'en-quran',title:{so:'Qur’aanka — English',ar:'ترجمة المعاني الإنجليزية — مركز رواد',en:'Quran meanings — Rowwad Translation Center'},lang:'en',type:'pdf',topic:'quran',author:'Rowwad Translation Center · QuranEnc',source:'https://quranenc.com/en/browse/english_rwwad',url:'https://quranenc.com/downloads/pdf/english_rwwad.pdf'},
 {id:'so-simple',title:{so:'Qur’aanka iyo tafsiir sahlan',ar:'تفسير سهل لمعاني القرآن بالصومالية',en:'A simple explanation of Quran meanings — Somali'},lang:'so',type:'source',topic:'tafsir',author:'C. Xasan Yacquub',source:'https://islamhouse.com/so/books/2832192/'},
 {id:'ar-tajwid',title:{so:'Tajwiidka — Carabi',ar:'التجويد الميسر — إصدار مجمع الملك فهد',en:'Simplified Tajwid — King Fahd Complex edition'},lang:'ar',type:'source',topic:'tajwid',author:'مجموعة من المؤلفين · مراجعة: علي الحذيفي',source:'https://islamhouse.com/ar/books/253178/'},
 {id:'so-usul',title:{so:'Muqadimah fii At-Tafsiir',ar:'شرح مقدمة في أصول التفسير — بالصومالية',en:'Introduction to the principles of Tafsir — Somali'},lang:'so',type:'audio',topic:'sciences',author:'Axmed Maxamud Axmed-yare · مراجعة: Maxamed Axmed Cilmi Saylici',source:'https://islamhouse.com/so/audios/2801615/',url:'https://d1.islamhouse.com/data/so/ih_sounds/chain/Sharaxa_Kitaabka_Muqadimah_Fii_At_Tafsiir/so_01_Sharaxa_Kitaabka_Muqadimah_Fii_At_Tafsiir.mp3'},
 {id:'so-dirir',title:{so:'Tafsiirka Alfaatixa — Maxamed Cumar Dirir',ar:'تفسير الفاتحة — الشيخ محمد عمر درر',en:'Al-Fatihah explained — Maxamed Cumar Dirir'},lang:'so',type:'video',topic:'tafsir',author:'Maxamed Cumar Dirir · مراجعة: Maxamed Axmed Cilmi Saylici',url:'https://www.youtube.com/embed/nuKEJ19I68U?rel=0',source:'https://islamhouse.com/so/videos/2814874/'},
 {id:'so-audio',title:{so:'Tafsiirka Quraanka — maqal',ar:'دروس التفسير الصوتية بالصومالية',en:'Somali audio Tafsir library'},lang:'so',type:'source',topic:'tafsir',author:'IslamHouse.com',source:'https://islamhouse.com/so/category/193855/audios/so/1/'},
 {id:'fahd',title:{so:'Daabacaadaha King Fahd Complex',ar:'إصدارات مجمع الملك فهد وترجمات المعاني',en:'King Fahd Complex — translations and publications'},lang:'all',type:'source',topic:'quran',author:'مجمع الملك فهد لطباعة المصحف الشريف',source:'https://qurancomplex.gov.sa/quran-translations/'},
 {id:'saadi',title:{so:'Tafsiirka As-Saadi',ar:'موسوعة تفسير السعدي',en:'As-Saadi Tafsir encyclopedia'},lang:'all',type:'source',topic:'tafsir',author:'عبد الرحمن بن ناصر السعدي · IslamEnc',source:'https://saadi.islamenc.com/'},
 {id:'hadith',title:{so:'Axaadiista Nabiga',ar:'موسوعة الأحاديث النبوية',en:'Hadith encyclopedia'},lang:'all',type:'source',topic:'dawah',author:'HadeethEnc.com',source:'https://hadeethenc.com/so/'},
 {id:'dawah',title:{so:'Baro diintaada Islaamka',ar:'المكتبة الدعوية الصومالية',en:'Learn Islam — Somali resources'},lang:'so',type:'source',topic:'dawah',author:'IslamHouse.com',source:'https://islamhouse.com/so/'}
];
const keys=new Set(['somali_yacob','english_rwwad','english_hilali_khan','english_saheeh']);
const cache=new Map(),inflight=new Map();
async function json(url){
 if(cache.get(url)?.until>Date.now())return cache.get(url).value;
 if(inflight.has(url))return inflight.get(url);
 const p=(async()=>{const r=await fetch(url,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Source returned '+r.status);const d=await r.json();if(cache.size>250)cache.delete(cache.keys().next().value);cache.set(url,{value:d,until:Date.now()+3600000});return d;})();inflight.set(url,p);try{return await p}finally{inflight.delete(url)}
}
export function validRef(s,a){return Number.isInteger(s)&&s>=1&&s<=114&&Number.isInteger(a)&&a>=1&&a<=surahs[s-1].numberOfAyahs}
export function validateRows(rows,s){if(!Array.isArray(rows)||rows.length!==surahs[s-1].numberOfAyahs)throw Error('Incomplete source data');rows.forEach((r,i)=>{if(Number(r.sura)!==s||Number(r.aya)!==i+1||typeof r.translation!=='string'||!r.arabic_text)throw Error('Invalid verse alignment')});return rows}
async function translation(s,key){
 try{const [d,m]=await Promise.all([json(`https://quranenc.com/api/v1/translation/sura/${key}/${s}`),json(`https://quranenc.com/api/v1/translations/list/${key.startsWith('somali')?'so':'en'}`)]);const meta=m.translations.find(x=>x.key===key);if(!meta)throw Error('Edition unavailable');return {rows:validateRows(d.result,s),meta,mode:'live'};}
 catch(e){if(s!==1||key==='english_saheeh')throw e;const d=await read(`${key}-1.json`);return {rows:validateRows(d.result,s),meta:snapshotMeta.find(x=>x.key===key),mode:'snapshot',snapshotDate:'2026-10-09'};}
}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
export const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','SAMEORIGIN');
 const send=(code,d)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(d))};
 try{
 const u=new URL(req.url,'http://localhost'),p=u.pathname;
 if(req.method!=='GET'&&req.method!=='HEAD')return send(405,{error:'Method not allowed'});
 if(p==='/health')return send(200,{status:'ok'});
 if(p==='/api/catalogue')return send(200,{catalogue,tafsirs});
 if(p==='/api/surahs')return send(200,surahs);
 if(p==='/api/surah'){
 const s=Number(u.searchParams.get('s')),en=u.searchParams.get('en')||'english_rwwad';if(!validRef(s,1)||!keys.has(en)||!en.startsWith('english'))return send(400,{error:'Invalid surah or edition'});
 const [so,eng]=await Promise.all([translation(s,'somali_yacob'),translation(s,en)]);return send(200,{s,so,eng});
 }
 if(p==='/api/tafsir'){
 const s=Number(u.searchParams.get('s')),a=Number(u.searchParams.get('a')),id=u.searchParams.get('id'),t=tafsirs[id];if(!validRef(s,a)||!t)return send(400,{error:'Invalid reference'});
 const url=`https://raw.githubusercontent.com/spa5k/tafsir_api/eb82bb6294efe30ad5c135c03b1864afaa70e855/tafsir/${t.slug}/${s}/${a}.json`;const d=await json(url);if(Number(d.surah)!==s||Number(d.ayah)!==a||typeof d.text!=='string'||!d.text.trim())throw Error('Tafsir is unavailable');return send(200,{...t,text:d.text,delivery:url,verseKey:d.verse_key||`${s}:${a}`,retrievedAt:new Date().toISOString()});
 }
 if(p.startsWith('/api/pdf/')){
 const b=catalogue.find(x=>x.id===p.split('/').pop()&&x.type==='pdf');if(!b)return send(404,{error:'Unknown book'});
 const r=await fetch(b.url,{signal:AbortSignal.timeout(45000),headers:{'User-Agent':'Nuur-Quran/1.0','Referer':b.source,...(req.headers.range?{Range:req.headers.range}:{})}});if(!r.ok)throw Error('PDF source unavailable');if(!['quranenc.com','d1.islamhouse.com'].includes(new URL(r.url).hostname))throw Error('Unexpected source redirect');
 res.writeHead(r.status,{'Content-Type':'application/pdf','Content-Disposition':'inline','Cache-Control':'public, max-age=3600',...(r.headers.get('content-length')?{'Content-Length':r.headers.get('content-length')}:{ }),...(r.headers.get('content-range')?{'Content-Range':r.headers.get('content-range')}:{})});
 for await(const chunk of r.body){if(!res.write(chunk))await new Promise(resolve=>res.once('drain',resolve));}return res.end();
 }
 if(p==='/robots.txt'){res.writeHead(200,{'Content-Type':'text/plain'});return res.end('User-agent: *\nAllow: /\nDisallow: /api/\n')}
 const name=p==='/'?'index.html':p.slice(1),full=path.resolve(root,'public',name);if(!full.startsWith(path.join(root,'public')+path.sep))return send(404,{error:'Not found'});const body=await fs.readFile(full);res.writeHead(200,{'Content-Type':types[path.extname(full)]||'application/octet-stream','Cache-Control':'public, max-age=300'});res.end(req.method==='HEAD'?undefined:body);
 }catch(e){if(!res.headersSent)send(e.code==='ENOENT'?404:502,{error:'تعذر الوصول إلى المصدر. حاول مجددًا أو افتح المصدر الأصلي.',detail:process.env.NODE_ENV==='test'?e.message:undefined});else res.destroy();}
});
if(process.env.NODE_ENV!=='test')server.listen(Number(process.env.PORT||8080),'0.0.0.0',()=>console.log('Nuur portal ready'));
