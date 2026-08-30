const http=require('http'),fs=require('fs'),path=require('path'),puppeteer=require('puppeteer-core');
const KOK=path.resolve(__dirname,'..');
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json','.fbx':'application/octet-stream'};
(async()=>{
  const W=1920,H=1080;
  const s=http.createServer((q,r)=>{const p=path.join(KOK,decodeURIComponent(q.url.split('?')[0]));
    if(!fs.existsSync(p)||fs.statSync(p).isDirectory()){r.writeHead(404);return r.end();}
    r.writeHead(200,{'Content-Type':MIME[path.extname(p)]||'application/octet-stream'});
    fs.createReadStream(p).pipe(r);});
  await new Promise(r=>s.listen(0,'127.0.0.1',r));
  const b=await puppeteer.launch({executablePath:CHROME,headless:'new',
    args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const pg=await b.newPage(); await pg.setViewport({width:W,height:H});
  await pg.goto(`http://127.0.0.1:${s.address().port}/03-motor/sahne.html?w=${W}&h=${H}&tema=b&toplam=264`,{waitUntil:'load',timeout:300000});
  await pg.waitForFunction('window.HAZIR===true',{timeout:300000});
  const out=process.argv[2];
  for (const n of [3000, 9000]) {
    const d=await pg.evaluate((n)=>{
      window.kareKur(n);
      const png = window.kareAl();          // ONCE tuvali boya
      const cv = window.__CIKIS;
      const t=(f)=>{const a=performance.now();const v=f();return [v,performance.now()-a];};
      const [w95,tw95]=t(()=>cv.toDataURL('image/webp',0.95));
      const [w100,tw100]=t(()=>cv.toDataURL('image/webp',1));
      const [j97,tj97]=t(()=>cv.toDataURL('image/jpeg',0.97));
      window.__T2={tw95,tw100,tj97};
      return { png, w95, w100, j97 };
    },n);
    for (const [k,v] of Object.entries(d))
      fs.writeFileSync(path.join(out,`k${n}-${k}.`+(k==='png'?'png':(k==='j97'?'jpg':'webp'))),Buffer.from(v.split(',')[1],'base64'));
    const tt=await pg.evaluate(()=>window.__T2);
    console.log('  webp q95 %s ms   webp q100 %s ms   jpeg q97 %s ms',
                tt.tw95.toFixed(0),tt.tw100.toFixed(0),tt.tj97.toFixed(0));
    console.log('kare',n,'yazildi');
  }
  await b.close(); s.close();
})();
