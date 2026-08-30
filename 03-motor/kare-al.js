/** Tek kare yakalar. Karsilastirma goruntusu icin.
 *  node kare-al.js --n 416 --sade 0 --tema a --cikti ../04-ciktilar/x.png   */
const http=require('http'),fs=require('fs'),path=require('path');
const puppeteer=require('puppeteer-core');
const KOK=path.resolve(__dirname,'..');
const CHROME='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json','.fbx':'application/octet-stream'};
const arg=(a,d)=>{const i=process.argv.indexOf('--'+a);return i>-1?process.argv[i+1]:d;};

(async()=>{
  const N=+arg('n',416), SADE=arg('sade','0'), W=+arg('w',1280), H=+arg('h',720);
  const TEMA=arg('tema','a')==='b'?'b':'a';
  const TOPLAM=+arg('toplam',64);
  const BOLUM=arg('bolum','');
  const CIKTI=path.resolve(arg('cikti','../04-ciktilar/kare.png'));

  const s=http.createServer((q,r)=>{
    const p=path.join(KOK,decodeURIComponent(q.url.split('?')[0]));
    if(!fs.existsSync(p)||fs.statSync(p).isDirectory()){r.writeHead(404);return r.end();}
    r.writeHead(200,{'Content-Type':MIME[path.extname(p)]||'application/octet-stream'});
    fs.createReadStream(p).pipe(r);
  });
  await new Promise(r=>s.listen(0,'127.0.0.1',r));

  const b=await puppeteer.launch({executablePath:CHROME,headless:'new',
    args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const pg=await b.newPage();
  await pg.setViewport({width:W,height:H});
  pg.on('pageerror',e=>console.log('HATA:',e.message));
  await pg.goto(`http://127.0.0.1:${s.address().port}/03-motor/sahne.html?w=${W}&h=${H}&sade=${SADE}&tema=${TEMA}&toplam=${TOPLAM}`+(BOLUM?`&bolum=${encodeURIComponent(BOLUM)}`:''),
                {waitUntil:'load',timeout:120000});
  await pg.waitForFunction('window.HAZIR===true',{timeout:180000});
  const veri=await pg.evaluate(n=>{window.kareKur(n);return window.kareAl();},N);
  fs.writeFileSync(CIKTI, Buffer.from(veri.split(',')[1],'base64'));
  console.log('->',CIKTI);
  await b.close(); s.close();
})();
