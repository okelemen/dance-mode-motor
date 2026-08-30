const http=require('http'),fs=require('fs'),path=require('path'),puppeteer=require('puppeteer-core');
const KOK=path.resolve(__dirname,'..');
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json','.fbx':'application/octet-stream'};
(async()=>{
  const W=1920,H=1080,N=12;
  const s=http.createServer((q,r)=>{const p=path.join(KOK,decodeURIComponent(q.url.split('?')[0]));
    if(!fs.existsSync(p)||fs.statSync(p).isDirectory()){r.writeHead(404);return r.end();}
    r.writeHead(200,{'Content-Type':MIME[path.extname(p)]||'application/octet-stream'});
    fs.createReadStream(p).pipe(r);});
  await new Promise(r=>s.listen(0,'127.0.0.1',r));
  const b=await puppeteer.launch({executablePath:CHROME,headless:'new',
    args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox',
          `--window-size=${W},${H}`]});
  const pg=await b.newPage(); await pg.setViewport({width:W,height:H,deviceScaleFactor:1});
  pg.on('pageerror',e=>console.log('HATA:',e.message));
  await pg.goto(`http://127.0.0.1:${s.address().port}/03-motor/sahne.html?w=${W}&h=${H}&tema=b&toplam=264`,
                {waitUntil:'load',timeout:300000});
  await pg.waitForFunction('window.HAZIR===true',{timeout:300000});

  const r=await pg.evaluate(async(N)=>{
    const olc=(f)=>{const t0=performance.now();for(let i=0;i<N;i++)f(3000+i*7);return (performance.now()-t0)/N;};
    // isinma
    for(let i=0;i<3;i++) window.kareKur(3000+i);
    const tKur = olc(n=>window.kareKur(n));
    window.kareKur(3000);
    const t1=performance.now(); let png; for(let i=0;i<N;i++) png=window.kareAl(); const tPng=(performance.now()-t1)/N;
    const cv=document.querySelectorAll('canvas'); const buyuk=[...cv].find(c=>c.width>=1900);
    const t2=performance.now(); let jpg; for(let i=0;i<N;i++) jpg=buyuk.toDataURL('image/jpeg',0.95); const tJpg=(performance.now()-t2)/N;
    const t3=performance.now(); let wp; for(let i=0;i<N;i++) wp=buyuk.toDataURL('image/webp',0.95); const tWebp=(performance.now()-t3)/N;
    return {tKur,tPng,tJpg,tWebp,pngKB:png.length/1024,jpgKB:jpg.length/1024,webpKB:wp.length/1024};
  },N);
  console.log('--- 1920x1080, kare basina (ms)');
  console.log('  kareKur (sahne + 2B pas) : %s ms', r.tKur.toFixed(0));
  console.log('  toDataURL PNG            : %s ms   (%s KB)', r.tPng.toFixed(0), r.pngKB.toFixed(0));
  console.log('  toDataURL JPEG q95       : %s ms   (%s KB)', r.tJpg.toFixed(0), r.jpgKB.toFixed(0));
  console.log('  toDataURL WEBP q95       : %s ms   (%s KB)', r.tWebp.toFixed(0), r.webpKB.toFixed(0));
  // CDP gidis donus maliyeti
  const t0=Date.now(); for(let i=0;i<N;i++){ await pg.evaluate(n=>{window.kareKur(n);return window.kareAl();},4000+i); }
  console.log('  Node tarafi tam dongu    : %s ms/kare', ((Date.now()-t0)/N).toFixed(0));
  await b.close(); s.close();
})();
