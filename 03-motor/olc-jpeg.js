const http=require('http'),fs=require('fs'),path=require('path'),puppeteer=require('puppeteer-core');
const KOK=path.resolve(__dirname,'..');
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json','.fbx':'application/octet-stream'};
(async()=>{
  const W=1920,H=1080,N=6,out=process.argv[2];
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
  const d=await pg.evaluate((N)=>{
    window.kareKur(9000);
    const png=window.kareAl('png');
    const cv=window.__CIKIS, r={};
    for (const q of [1.0,0.99,0.97]) {
      const a=performance.now(); let v;
      for(let i=0;i<N;i++) v=cv.toDataURL('image/jpeg',q);
      r['q'+Math.round(q*100)]={veri:v, ms:(performance.now()-a)/N};
    }
    return {png, r};
  },N);
  const fs2=require('fs');
  fs2.writeFileSync(path.join(out,'ref.png'),Buffer.from(d.png.split(',')[1],'base64'));
  for(const [k,v] of Object.entries(d.r)){
    fs2.writeFileSync(path.join(out,k+'.jpg'),Buffer.from(v.veri.split(',')[1],'base64'));
    console.log('jpeg %s : %s ms   %s KB',k,v.ms.toFixed(0),(v.veri.length/1024).toFixed(0));
  }
  await b.close(); s.close();
})();
