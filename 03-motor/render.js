/**
 * Deterministik render: sahne.html -> kare kare -> ffmpeg -> mp4
 *
 * Duvar saati yok, ekran kaydi yok. Her kare kendi numarasindan hesaplanir,
 * bu yuzden ayni girdi her zaman ayni videoyu verir.
 *
 * Kullanim:
 *   node render.js [--w 1280] [--h 720] [--olcu 16] [--tema a|b]
 *                  [--cikti ../04-ciktilar/ornek.mp4]
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer-core');

const KOK = path.resolve(__dirname, '..');
// Bulutta CHROME_PATH ortam degiskeni ile gelir; yerelde Windows Chrome.
const CHROME = process.env.CHROME_PATH
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
// Muzik dosyasi parametreli: tam bolum 264 olculuk parcayi istiyor,
// kisa testler 122 olculuk olani. Yanlis dosyayla -shortest videoyu kirpar.
const MUZIK_VAR = path.join(KOK, '01-muzik', 'bolum-01-neon-grid-120bpm.wav');

const arg = (ad, vars) => {
  const i = process.argv.indexOf('--' + ad);
  return i > -1 ? process.argv[i + 1] : vars;
};
const W = +arg('w', 1280), H = +arg('h', 720);
const OLCU_SAYISI = +arg('olcu', 16);
// Parca render: uzun bolumler bolunup paralel is olarak kosulur, sonra
// birlestirilir. Tek is olarak 264 olcu 1080p'de ~6 saat surer ve
// GitHub Actions zaman asimina ugrar.
const BASLANGIC = +arg('baslangic', 0);          // olcu cinsinden ofset
const SESSIZ = process.argv.includes('--sessiz'); // ses eklenmesin (parca)
// Gorsel dil: 'a' soyut ritim seridi (neon), 'b' temali kosu (gunduz blok).
// Ayni motor, ayni koreografi, ayni muzik - sadece gorsel katman degisiyor.
const TEMA = arg('tema', 'a') === 'b' ? 'b' : 'a';
// Bolumun TAM uzunlugu (olcu). Parca render'da --olcu parcanin uzunlugu
// olur; sahne ise final kartini ve ortam gecislerini tam bolume gore
// hesaplamak zorunda. Verilmezse tek parcalik render varsayilir.
const BOLUM_OLCU = +arg('toplam', BASLANGIC + OLCU_SAYISI);
const CIKTI = path.resolve(arg('cikti', path.join(KOK, '04-ciktilar', 'ornek.mp4')));
const MUZIK = path.resolve(arg('muzik', MUZIK_VAR));
// Kare bicimi. Olculdu: bicim hizi degistirmiyor - darbogaz kodlama degil,
// SwiftShader'in yazilimla rasterlestirmesi (bkz. olc-dongu.js). Kayipsiz
// webp varsayilan: png ile bit bit ayni, boruda yarisi kadar veri.
const BICIM = arg('bicim', 'webp');
// Bolum tanimi (koreografi + ortam dizilisi). Verilmezse motordaki varsayilan.
const BOLUM = arg('bolum', '');
const FF_GIRIS = BICIM === 'jpeg' ? 'mjpeg' : BICIM;

const MIME = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript',
               '.json':'application/json', '.fbx':'application/octet-stream' };

// ---- kucuk statik sunucu (ES module + fetch icin file:// yetmiyor)
function sunucuBaslat() {
  return new Promise(res => {
    const s = http.createServer((req, rep) => {
      const p = path.join(KOK, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(KOK) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
        rep.writeHead(404); return rep.end();
      }
      rep.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(rep);
    });
    s.listen(0, '127.0.0.1', () => res(s));
  });
}

(async () => {
  const sunucu = await sunucuBaslat();
  const port = sunucu.address().port;
  console.log(`sunucu :${port}`);

  const tarayici = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
           '--hide-scrollbars', '--mute-audio', '--no-sandbox',
           `--window-size=${W},${H}`],
  });
  const sayfa = await tarayici.newPage();
  await sayfa.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  sayfa.on('pageerror', e => console.log('SAYFA HATASI:', e.message));
  sayfa.on('console', m => { if (m.type() === 'error') console.log('konsol:', m.text()); });

  console.log(`tema: ${TEMA}  bolum: ${BOLUM_OLCU} olcu`);
  await sayfa.goto(
    `http://127.0.0.1:${port}/03-motor/sahne.html?w=${W}&h=${H}&tema=${TEMA}&toplam=${BOLUM_OLCU}` +
    (BOLUM ? `&bolum=${encodeURIComponent(BOLUM)}` : '') + arg('ek',''),
                   { waitUntil: 'load', timeout: 120000 });
  await sayfa.waitForFunction('window.HAZIR === true', { timeout: 180000 });

  const bilgi = await sayfa.evaluate(() => ({
    siluet: window.SILUET_VAR, klip: window.KLIP_SAYISI,
    nota: window.NOTA_SAYISI, kare: window.TOPLAM_KARE,
  }));
  console.log(`siluet:${bilgi.siluet ? 'VAR' : 'YOK'}  klip:${bilgi.klip}  nota:${bilgi.nota}`);

  const TOPLAM = Math.round(OLCU_SAYISI * 2.0 * 30);
  const KARE0  = Math.round(BASLANGIC * 2.0 * 30);
  fs.mkdirSync(path.dirname(CIKTI), { recursive: true });
  const sesEkle = !SESSIZ && fs.existsSync(MUZIK);
  if (BASLANGIC) console.log(`parca: olcu ${BASLANGIC}-${BASLANGIC+OLCU_SAYISI}`);

  const ff = spawn('ffmpeg', [
    '-v','error','-y',
    '-f','image2pipe','-c:v',FF_GIRIS,'-r','30','-i','pipe:0',
    ...(sesEkle ? ['-i', MUZIK] : []),
    '-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p',
    ...(sesEkle ? ['-c:a','aac','-b:a','192k','-shortest'] : []),
    CIKTI,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  const t0 = Date.now();
  for (let i = 0; i < TOPLAM; i++) {
    const n = KARE0 + i;                 // mutlak kare no - determinizm korunur
    await sayfa.evaluate(k => window.kareKur(k), n);
    const veri = await sayfa.evaluate(b => window.kareAl(b), BICIM);
    const buf = Buffer.from(veri.split(',')[1], 'base64');
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));

    if (i % 30 === 0 || i === TOPLAM - 1) {
      const gecen = (Date.now() - t0) / 1000;
      const hiz = (i + 1) / gecen;
      const kalan = (TOPLAM - i - 1) / hiz;
      process.stdout.write(
        `\r kare ${i+1}/${TOPLAM}  ${hiz.toFixed(1)} kare/sn  kalan ~${(kalan/60).toFixed(1)} dk   `);
    }
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log(`\nbitti -> ${CIKTI}`);

  await tarayici.close();
  sunucu.close();
})();
