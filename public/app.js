// app.js —— 列表 / 分类 / 搜索 / 播放器 / 继续观看
const $ = s => document.querySelector(s);
const state = { cat: '全部', q: '', sort: 'new', items: [] };
const KEY = 'mt_recent_v1';

const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const recent = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
function pushRecent(v) {
  const l = recent().filter(x => x.id !== v.id);
  l.unshift({ id: v.id, title: v.title, thumb: v.thumb, duration: v.duration });
  localStorage.setItem(KEY, JSON.stringify(l.slice(0, 8)));
}

function card(v) {
  const meta = [v.views ? v.views + ' 播放' : '', v.cat || ''].filter(Boolean).join(' · ');
  const el = document.createElement('article');
  el.className = 'card';
  el.innerHTML =
    '<div class="th">' +
      '<img src="' + esc(v.thumb) + '" alt="" loading="lazy">' +
      (v.hot ? '<span class="hot">HOT</span>' : '') +
      '<span class="dur">' + esc(v.duration) + '</span>' +
    '</div>' +
    '<div class="bd"><div class="tt">' + esc(v.title) + '</div>' +
    '<div class="mt">' + esc(meta) + '</div></div>';
  el.onclick = () => openPlayer(v);
  return el;
}

function renderChips(cats) {
  const box = $('#chips');
  box.innerHTML = '';
  cats.forEach(c => {
    const b = document.createElement('button');
    b.className = 'chip' + (c === state.cat ? ' on' : '');
    b.textContent = c;
    b.onclick = () => { state.cat = c; load(); };
    box.appendChild(b);
  });
}

async function load() {
  const qs = new URLSearchParams({ cat: state.cat, q: state.q, sort: state.sort });
  const r = await fetch('/api/videos?' + qs);
  const d = await r.json();
  state.items = d.items;
  renderChips(d.cats);

  const grid = $('#grid');
  grid.innerHTML = '';
  d.items.forEach(v => grid.appendChild(card(v)));
  $('#empty').hidden = d.items.length > 0;
  $('#listTitle').textContent = state.q
    ? '搜索「' + state.q + '」· ' + d.items.length + ' 部'
    : (state.cat === '全部' ? '最新上架' : state.cat + ' · ' + d.items.length + ' 部');

  if (d.items.length && !state.q) renderHero(d.items[0]);
}

function renderHero(v) {
  $('#hero').innerHTML =
    '<div class="hero-bg" style="--c1:' + esc(v.color) + '"></div>' +
    '<div class="hero-in">' +
      '<div class="hero-k">今日推荐 · ' + esc(v.cat) + '</div>' +
      '<h2 class="hero-t">' + esc(v.title) + '</h2>' +
      '<p class="hero-p">' + esc(v.desc) + '</p>' +
      '<button class="btn" id="heroPlay">▶ 立即播放</button>' +
    '</div>';
  $('#heroPlay').onclick = () => openPlayer(v);
}

function renderRecent() {
  const l = recent();
  $('#recentRow').hidden = l.length === 0;
  const rail = $('#recent');
  rail.innerHTML = '';
  l.forEach(v => rail.appendChild(card({ ...v, views: '', cat: '看过的', hot: 0 })));
}

async function openPlayer(v) {
  const r = await fetch('/api/video/' + encodeURIComponent(v.id));
  const d = await r.json();

  $('#pTitle').textContent = d.title;
  $('#pViews').textContent = d.views + ' 播放';
  $('#pDur').textContent = d.duration;
  $('#pCat').textContent = d.cat;
  $('#pDesc').textContent = d.desc;
  $('#pTags').innerHTML = d.tags.map(t => '<span class="tag">#' + esc(t) + '</span>').join('');

  const rel = $('#pRel');
  rel.innerHTML = '';
  (d.related || []).forEach(x => {
    const el = document.createElement('div');
    el.className = 'item';
    el.innerHTML = '<div class="th"><img src="' + esc(x.thumb) + '" loading="lazy"></div>' +
      '<div><div class="tt">' + esc(x.title) + '</div>' +
      '<div class="mt">' + esc(x.views) + ' 播放 · ' + esc(x.duration) + '</div></div>';
    el.onclick = () => openPlayer(x);
    rel.appendChild(el);
  });

  const vid = $('#video'), tip = $('#stageTip');
  tip.textContent = '正在载入…';
  tip.hidden = false;
  vid.src = d.src;
  const done = () => { tip.hidden = true; };
  vid.onloadeddata = done; vid.oncanplay = done; vid.onplaying = done; vid.ontimeupdate = done;
  vid.onerror = () => { tip.hidden = false; tip.textContent = '片源载入失败'; };

  $('#player').hidden = false;
  document.body.style.overflow = 'hidden';
  pushRecent(d);
  vid.play().then(done).catch(() => {});
}

function closePlayer() {
  const vid = $('#video');
  vid.pause(); vid.removeAttribute('src'); vid.load();
  $('#player').hidden = true;
  document.body.style.overflow = '';
  renderRecent();
}

$('#closePlayer').onclick = closePlayer;
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#player').hidden) closePlayer();
});
$('#searchForm').onsubmit = e => {
  e.preventDefault();
  state.q = $('#q').value.trim();
  state.cat = '全部';
  load();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
document.querySelectorAll('.sort').forEach(b => {
  b.onclick = () => {
    document.querySelectorAll('.sort').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    state.sort = b.dataset.sort;
    load();
  };
});

// 底部导航
const tabs = document.querySelectorAll('.tab');
tabs.forEach(t => {
  t.onclick = () => {
    const k = t.dataset.tab;
    tabs.forEach(x => x.classList.toggle('on', x === t));
    if (k === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      state.cat = '全部'; state.q = ''; state.sort = 'new'; $('#q').value = '';
      document.querySelectorAll('.sort').forEach(x => x.classList.toggle('on', x.dataset.sort === 'new'));
      load();
    } else if (k === 'cat') {
      $('#chips').scrollIntoView({ block: 'center', behavior: 'smooth' });
    } else if (k === 'hot') {
      state.sort = 'hot';
      document.querySelectorAll('.sort').forEach(x => x.classList.toggle('on', x.dataset.sort === 'hot'));
      load();
      $('#grid').scrollIntoView({ block: 'start', behavior: 'smooth' });
    } else if (k === 'mine') {
      const r = $('#recentRow');
      if (r.hidden) { tabs[0].click(); return; }
      r.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  };
});

renderRecent();
load();
