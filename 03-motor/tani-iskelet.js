/** Animasyon gercekten uygulaniyor mu? Kemik konumunu karelere gore olcer. */
const http=require('http'),fs=require('fs'),path=require('path');
const puppeteer=require('puppeteer-core');
const KOK=path.resolve(__dirname,'..');
const CHROME='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json','.fbx':'application/octet-stream'};

(async()=>{
  const s=http.createServer((q,r)=>{
    const p=path.join(KOK,decodeURIComponent(q.url.split('?')[0]));
    if(!fs.existsSync(p)||fs.statSync(p).isDirectory()){r.writeHead(404);return r.end();}
    r.writeHead(200,{'Content-Type':MIME[path.extname(p)]||'application/octet-stream'});
    fs.createReadStream(p).pipe(r);
  });
  await new Promise(r=>s.listen(0,'127.0.0.1',r));
  const b=await puppeteer.launch({executablePath:CHROME,headless:'new',
    args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const pg=await b.newPage(); await pg.setViewport({width:640,height:360});
  pg.on('pageerror',e=>console.log('HATA:',e.message));
  await pg.goto(`http://127.0.0.1:${s.address().port}/03-motor/sahne.html?w=640&h=360`,{waitUntil:'load',timeout:120000});
  await pg.waitForFunction('window.HAZIR===true',{timeout:180000});

  const r = await pg.evaluate(()=>{
    const T=window.__T, THREE=T.THREE;
    const out={};
    // iskelet var mi, kemik adlari
    const kemikler=[]; let skinned=null;
    T.siluet.traverse(o=>{ if(o.isBone) kemikler.push(o.name); if(o.isSkinnedMesh) skinned=o; });
    out.kemikSayisi=kemikler.length;
    out.ilkKemikler=kemikler.slice(0,6);
    out.skinnedMeshVar=!!skinned;

    // klip track adlari
    const k=T.aksiyon['idle'];
    out.idleVar=!!k;
    if(k){ out.idleSure=+k.klip.duration.toFixed(3);
           out.trackOrnek=k.klip.tracks.slice(0,4).map(t=>t.name); }

    // el kemigi farkli karelerde nerede?
    let el=null; T.siluet.traverse(o=>{ if(!el && /LeftHand$/.test(o.name)) el=o; });
    out.elBulundu=!!el;
    if(el){
      const konum=[];
      [10, 25, 40, 55].forEach(n=>{
        window.kareKur(n);
        T.siluet.updateMatrixWorld(true);
        const v=new THREE.Vector3(); el.getWorldPosition(v);
        konum.push(v.toArray().map(x=>+x.toFixed(3)));
      });
      out.elKonumlari=konum;
    }
    return out;
  });
  console.log(JSON.stringify(r,null,2));
  await b.close(); s.close();
})();
