const http=require('http'),fs=require('fs'),path=require('path'),puppeteer=require('puppeteer-core');
const KOK=path.resolve(__dirname,'..');
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json','.fbx':'application/octet-stream'};
(async()=>{
  const W=1920,H=1080,N=10;
  const s=http.createServer((q,r)=>{const p=path.join(KOK,decodeURIComponent(q.url.split('?')[0]));
    if(!fs.existsSync(p)||fs.statSync(p).isDirectory()){r.writeHead(404);return r.end();}
    r.writeHead(200,{'Content-Type':MIME[path.extname(p)]||'application/octet-stream'});
    fs.createReadStream(p).pipe(r);});
  await new Promise(r=>s.listen(0,'127.0.0.1',r));
  const b=await puppeteer.launch({executablePath:CHROME,headless:'new',
    args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox',
          '--hide-scrollbars','--mute-audio',`--window-size=${W},${H}`]});
  const pg=await b.newPage(); await pg.setViewport({width:W,height:H,deviceScaleFactor:1});
  await pg.goto(`http://127.0.0.1:${s.address().port}/03-motor/sahne.html?w=${W}&h=${H}&tema=b&toplam=264`,{waitUntil:'load',timeout:300000});
  await pg.waitForFunction('window.HAZIR===true',{timeout:300000});
  for(let i=0;i<3;i++){ await pg.evaluate(n=>window.kareKur(n),3000+i); await pg.evaluate(()=>window.kareAl()); }

  let tKur=0,tAl=0,bayt=0;
  for(let i=0;i<N;i++){
    let a=Date.now(); await pg.evaluate(n=>window.kareKur(n),5000+i*3); tKur+=Date.now()-a;
    a=Date.now(); const v=await pg.evaluate(()=>window.kareAl()); tAl+=Date.now()-a; bayt+=v.length;
  }
  console.log('kareKur evaluate : %s ms/kare', (tKur/N).toFixed(0));
  console.log('kareAl  evaluate : %s ms/kare   (%s KB base64)', (tAl/N).toFixed(0), (bayt/N/1024).toFixed(0));
  // ic sure vs disari
  const ic=await pg.evaluate((N)=>{
    let a=performance.now(); for(let i=0;i<N;i++) window.kareKur(6000+i*3); const k=(performance.now()-a)/N;
    a=performance.now(); for(let i=0;i<N;i++) window.kareAl(); const l=(performance.now()-a)/N;
    return {k,l};
  },N);
  console.log('sayfa ici kareKur: %s ms   kareAl: %s ms', ic.k.toFixed(0), ic.l.toFixed(0));
  await b.close(); s.close();
})();
