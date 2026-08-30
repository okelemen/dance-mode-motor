/** Sahneyi acar, tek kare kurar, nesnelerin nerede oldugunu raporlar. */
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
  const port=s.address().port;

  const b=await puppeteer.launch({executablePath:CHROME,headless:'new',
    args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
  const pg=await b.newPage();
  await pg.setViewport({width:854,height:480});
  pg.on('pageerror',e=>console.log('HATA:',e.message));
  await pg.goto(`http://127.0.0.1:${port}/03-motor/sahne.html?w=854&h=480`,{waitUntil:'load',timeout:120000});
  await pg.waitForFunction('window.HAZIR===true',{timeout:180000});

  const rapor=await pg.evaluate(()=>{
    window.kareKur(96);   // t = 3.2 sn
    const T=window.__T;
    const out={};
    out.siluet = T.siluet ? {
      pos: T.siluet.position.toArray().map(v=>+v.toFixed(2)),
      scale: T.siluet.scale.x,
      bbox: (()=>{const bb=new T.THREE.Box3().setFromObject(T.siluet);
        return {min:bb.min.toArray().map(v=>+v.toFixed(2)),
                max:bb.max.toArray().map(v=>+v.toFixed(2))};})(),
      gorunur: T.siluet.visible,
    } : null;
    out.kamera = { pos:T.camera.position.toArray(), fov:T.camera.fov };
    out.gorunurNota = T.notaMesh
      .map((m,i)=>({i, v:m.visible, z:+m.position.z.toFixed(1),
                    x:+m.position.x.toFixed(1), o:+m.material.opacity.toFixed(2)}))
      .filter(o=>o.v);
    // ekran koordinati
    const ekran = (obj)=>{const v=obj.position.clone().project(T.camera);
      return [Math.round((v.x*0.5+0.5)*854), Math.round((-v.y*0.5+0.5)*480)];};
    out.notaEkran = out.gorunurNota.slice(0,4).map(o=>ekran(T.notaMesh[o.i]));
    if (T.siluet) out.siluetEkran = ekran(T.siluet);
    return out;
  });
  console.log(JSON.stringify(rapor,null,2));
  await b.close(); s.close();
})();
