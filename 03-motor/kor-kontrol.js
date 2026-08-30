const http=require('http'),fs=require('fs'),path=require('path'),puppeteer=require('puppeteer-core');
const KOK=path.resolve(__dirname,'..');
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
  pg.on('pageerror',e=>console.log('HATA:',e.message));
  await pg.goto(`http://127.0.0.1:${s.address().port}/03-motor/sahne.html?w=640&h=360&tema=b&toplam=264`,{waitUntil:'load',timeout:240000});
  await pg.waitForFunction('window.HAZIR===true',{timeout:300000});
  const r=await pg.evaluate(()=>{
    const N=window.__T.NOTALAR, OL=2.0, TOP=264;
    const tipler={}; N.forEach(n=>tipler[n.tip]=(tipler[n.tip]||0)+1);
    const patlama=N.filter(n=>n.patlama).length;
    // 8 olculuk cumle basina yogunluk
    const cumle=[];
    for(let c=0;c<TOP/8;c++){
      const a=c*8*OL,b2=(c+1)*8*OL;
      cumle.push(N.filter(n=>n.t>=a&&n.t<b2).length/8);
    }
    return {toplam:N.length, ort:N.length/TOP, tipler, patlama, cumle};
  });
  console.log('toplam cue: %d   ortalama %.2f cue/olcu   patlama: %d',r.toplam,r.ort,r.patlama);
  console.log('cue tipleri:', JSON.stringify(r.tipler));
  console.log('\n8 olculuk cumle basina yogunluk:');
  r.cumle.forEach((v,i)=>{
    const ol=i*8;
    console.log('  olcu %3d-%3d  %.2f  %s',ol,ol+8,v,'#'.repeat(Math.round(v*6)));
  });
  await b.close(); s.close();
})();
