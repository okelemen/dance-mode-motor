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
  const pg=await b.newPage(); await pg.setViewport({width:1200,height:400});
  await pg.goto(`http://127.0.0.1:${s.address().port}/03-motor/sahne.html?w=640&h=360&tema=b`,{waitUntil:'load',timeout:120000});
  await pg.waitForFunction('window.HAZIR===true',{timeout:180000});
  const veri=await pg.evaluate(()=>{
    const tipler=['step_L','step_R','jump','duck','dodge_R','punch','arms_up'];
    const ad={step_L:'SOL ADIM',step_R:'SAG ADIM',jump:'ZIPLAMA',duck:'COMELME',
              dodge_R:'YANA KACIS',punch:'YUMRUK',arms_up:'KOLLAR YUKARI'};
    const W=1260,H=250,c=document.createElement('canvas');c.width=W;c.height=H;
    const g=c.getContext('2d'); g.fillStyle='#0b0618'; g.fillRect(0,0,W,H);
    tipler.forEach((t,i)=>{
      const cx=90+i*180, cy=118;
      g.save(); g.translate(cx,cy);
      g.strokeStyle='#22e0e8'; g.fillStyle='#22e0e8';
      window.insanSimge(g,t,0.92,11); g.restore();
      g.fillStyle='#ffffff'; g.font='700 15px Arial'; g.textAlign='center';
      g.fillText(ad[t],cx,224);
    });
    return c.toDataURL('image/png');
  });
  fs.writeFileSync(process.argv[2],Buffer.from(veri.split(',')[1],'base64'));
  console.log('->',process.argv[2]); await b.close(); s.close();
})();
