const http=require('http'),fs=require('fs'),path=require('path'),puppeteer=require('puppeteer-core');
const KOK=path.resolve('C:/Users/eleme/DANCE-MODE');
const CHROME='C:/Program Files/Google/Chrome/Application/chrome.exe';
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json','.fbx':'application/octet-stream'};
(async()=>{
  const s=http.createServer((q,r)=>{const p=path.join(KOK,decodeURIComponent(q.url.split('?')[0]));
    if(!fs.existsSync(p)||fs.statSync(p).isDirectory()){r.writeHead(404);return r.end();}
    r.writeHead(200,{'Content-Type':MIME[path.extname(p)]||'application/octet-stream'});
    fs.createReadStream(p).pipe(r);});
  await new Promise(r=>s.listen(0,'127.0.0.1',r));
  const b=await puppeteer.launch({executablePath:CHROME,headless:'new',
    args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const pg=await b.newPage(); await pg.setViewport({width:640,height:360});
  await pg.goto(`http://127.0.0.1:${s.address().port}/03-motor/sahne.html?w=640&h=360&tema=b&toplam=264`,{waitUntil:'load',timeout:180000});
  await pg.waitForFunction('window.HAZIR===true',{timeout:240000});
  const r=await pg.evaluate(()=>{
    const A=window.__T.aksiyon;
    return Object.entries(A).map(([k,v])=>`${k}: sure=${v.klip.duration.toFixed(3)}s  track=${v.klip.tracks.length}  hedef=${v.hedef}  timeScale=${v.a.timeScale.toFixed(3)}`);
  });
  console.log(r.join('\n'));
  await b.close(); s.close();
})();
