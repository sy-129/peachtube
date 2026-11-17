// make-www.js —— 把站点复制成 App 内置离线包（绝对路径改相对）
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '../public');
const DST = path.join(__dirname, '../ios/app/Resources/www');

fs.rmSync(DST, { recursive: true, force: true });
fs.mkdirSync(DST, { recursive: true });

for (const dir of ['thumbs', 'media']) {
  const s = path.join(SRC, dir);
  if (!fs.existsSync(s)) continue;
  fs.mkdirSync(path.join(DST, dir), { recursive: true });
  for (const f of fs.readdirSync(s)) fs.copyFileSync(path.join(s, f), path.join(DST, dir, f));
}

const rewrite = s => s
  .replace(/href="\/"([ >])/g, 'href="index.html"$1')
  .replace(/(href|src)="\/(?!\/)/g, '$1="')
  .replace(/"\/thumbs\//g, '"thumbs/')
  .replace(/"\/media\//g, '"media/');

for (const f of ['index.html', 'style.css', 'app.js', 'manifest.json', 'icon.svg']) {
  const p = path.join(SRC, f);
  if (!fs.existsSync(p)) continue;
  fs.writeFileSync(path.join(DST, f), rewrite(fs.readFileSync(p, 'utf8')));
}

const videos = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/videos.json'), 'utf8'))
  .map(v => ({ ...v, thumb: v.thumb.replace(/^\//, ''), src: v.src.replace(/^\//, '') }));
fs.writeFileSync(path.join(DST, 'videos.json'), JSON.stringify(videos, null, 1));

// 离线数据层：WKWebView 里没有后端，拦掉 fetch('/api/...')
const shim = `
<script>
(function(){
  var DATA = ${JSON.stringify(videos)};
  function respond(o,c){return Promise.resolve(new Response(JSON.stringify(o),{status:c||200,headers:{'Content-Type':'application/json'}}));}
  window.fetch = function(url){
    var u = String(url && url.url ? url.url : url);
    if (u.indexOf('/api/videos') === 0){
      var p = new URLSearchParams(u.split('?')[1]||'');
      var cat = p.get('cat')||'', q=(p.get('q')||'').toLowerCase(), sort=p.get('sort')||'new';
      var list = DATA.slice();
      if (cat && cat!=='全部') list = list.filter(function(v){return v.cat===cat;});
      if (q) list = list.filter(function(v){return (v.title+v.desc+v.tags.join(' ')+v.cat).toLowerCase().indexOf(q)>=0;});
      if (sort==='hot') list.sort(function(a,b){return parseFloat(b.views)-parseFloat(a.views);});
      return respond({total:list.length,cats:['全部'].concat(Array.from(new Set(DATA.map(function(v){return v.cat;})))),items:list});
    }
    if (u.indexOf('/api/video/') === 0){
      var id = decodeURIComponent(u.slice('/api/video/'.length));
      var v = DATA.filter(function(x){return x.id===id;})[0];
      if (!v) return respond({error:'not found'},404);
      var rel = DATA.filter(function(x){return x.id!==id && x.cat===v.cat;})
        .concat(DATA.filter(function(x){return x.id!==id && x.cat!==v.cat;})).slice(0,6);
      var out = JSON.parse(JSON.stringify(v)); out.related = rel; return respond(out);
    }
    return Promise.reject(new Error('offline'));
  };
})();
</script>`;

const idx = path.join(DST, 'index.html');
fs.writeFileSync(idx, fs.readFileSync(idx, 'utf8').replace('</head>', shim + '\n</head>'));
console.log('www ok:', fs.readdirSync(DST).join(', '));
