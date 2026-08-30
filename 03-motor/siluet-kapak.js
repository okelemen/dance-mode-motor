/** Kapak icin saydam zeminli siluet uretir.
 *  node siluet-kapak.js --klip jacks --faz 0.45 --gen 1100 --yuk 1500 --cikti ../04-ciktilar/siluet.png
 *  --tara 1  verilirse butun kliplerin bir tabakasini uretir.                */
const http=require('http'),fs=require('fs'),path=require('path'),puppeteer=require('puppeteer-core');
const KOK=path.resolve(__dirname,'..');
const CHROME=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json','.fbx':'application/octet-stream'};
const arg=(a,d)=>{const i=process.argv.indexOf('--'+a);return i>-1?process.argv[i+1]:d;};
(async()=>{
  const KLIP=arg('klip','jacks'), FAZ=+arg('faz','0.45');
  const GEN=+arg('gen','1100'), YUK=+arg('yuk','1500');
  const TARA=arg('tara','0')==='1';
  const CIKTI=path.resolve(arg('cikti','../04-ciktilar/siluet.png'));
  const s=http.createServer((q,r)=>{const p=path.join(KOK,decodeURIComponent(q.url.split('?')[0]));
    if(!fs.existsSync(p)||fs.statSync(p).isDirectory()){r.writeHead(404);return r.end();}
    r.writeHead(200,{'Content-Type':MIME[path.extname(p)]||'application/octet-stream'});
    fs.createReadStream(p).pipe(r);});
  await new Promise(r=>s.listen(0,'127.0.0.1',r));
  const b=await puppeteer.launch({executablePath:CHROME,headless:'new',
    args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const pg=await b.newPage(); await pg.setViewport({width:1280,height:720});
  pg.on('pageerror',e=>console.log('HATA:',e.message));
  await pg.goto(`http://127.0.0.1:${s.address().port}/03-motor/sahne.html?w=1280&h=720&tema=b&toplam=264`,
                {waitUntil:'load',timeout:240000});
  await pg.waitForFunction('window.HAZIR===true',{timeout:300000});

  const kaydet=async(klip,faz,dosya)=>{
    const veri=await pg.evaluate((k,f,g,y)=>window.siluetKaresi(k,f,g,y),klip,faz,GEN,YUK);
    if(!veri){console.log('siluet yok');return;}
    fs.mkdirSync(path.dirname(dosya),{recursive:true});
    fs.writeFileSync(dosya,Buffer.from(veri.split(',')[1],'base64'));
    console.log('->',path.basename(dosya));
  };
  if(TARA){
    const klipler=await pg.evaluate(()=>Object.keys(window.__T.aksiyon));
    const dizin=path.dirname(CIKTI);
    for(const k of klipler) await kaydet(k,FAZ,path.join(dizin,`siluet-${k}.png`));
  } else {
    await kaydet(KLIP,FAZ,CIKTI);
  }
  await b.close(); s.close();
})();
