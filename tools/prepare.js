// prepare.js —— 构建前生成封面 SVG 与 3 段示例片源（仓库里只放文本）
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const V = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/videos.json'), 'utf8'));
const TH = path.join(ROOT, 'public/thumbs');
const MD = path.join(ROOT, 'public/media');

fs.mkdirSync(TH, { recursive: true });
fs.mkdirSync(MD, { recursive: true });

// ---------- 封面 ----------
for (const v of V) {
  const t = v.title.length > 12 ? v.title.slice(0, 12) + '…' : v.title;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${v.color}"/><stop offset="1" stop-color="#120811"/>
    </linearGradient>
    <pattern id="s" width="18" height="18" patternTransform="rotate(35)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="18" stroke="#fff" stroke-opacity="0.06" stroke-width="6"/>
    </pattern>
  </defs>
  <rect width="640" height="360" fill="url(#g)"/>
  <rect width="640" height="360" fill="url(#s)"/>
  <circle cx="540" cy="60" r="150" fill="#fff" fill-opacity="0.05"/>
  <text x="32" y="300" font-family="PingFang SC,Helvetica,sans-serif" font-size="34"
        font-weight="700" fill="#fff" fill-opacity="0.95">${t}</text>
  <text x="32" y="334" font-family="PingFang SC,Helvetica,sans-serif" font-size="18"
        fill="#fff" fill-opacity="0.55">${v.cat} · ${v.tags.slice(0, 2).join(' / ')}</text>
  <rect x="532" y="278" width="76" height="30" rx="6" fill="#000" fill-opacity="0.55"/>
  <text x="570" y="299" font-family="Helvetica,sans-serif" font-size="16"
        fill="#fff" text-anchor="middle">${v.duration}</text>
  <rect x="28" y="28" width="46" height="24" rx="5" fill="#ff2d6f"/>
  <text x="51" y="45" font-family="Helvetica,sans-serif" font-size="13"
        font-weight="700" fill="#fff" text-anchor="middle">18+</text>
</svg>`;
  fs.writeFileSync(path.join(TH, v.id + '.svg'), svg);
}
console.log('thumbs:', fs.readdirSync(TH).length);

// ---------- 示例片源 ----------
function ppm(w, h, c1, c2) {
  const b = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const t = (x / w) * 0.6 + (y / h) * 0.4;
    const i = (y * w + x) * 3;
    for (let k = 0; k < 3; k++) b[i + k] = Math.round(c1[k] * (1 - t) + c2[k] * t);
  }
  return Buffer.concat([Buffer.from('P6\n' + w + ' ' + h + '\n255\n'), b]);
}

const clips = [
  ['a', [255, 45, 111], [26, 8, 32]],
  ['b', [120, 60, 255], [12, 10, 26]],
  ['c', [255, 140, 66], [30, 10, 18]],
];

let ffmpeg = true;
try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); } catch (e) { ffmpeg = false; }

for (const [n, c1, c2] of clips) {
  const out = path.join(MD, n + '.mp4');
  if (fs.existsSync(out)) continue;
  if (!ffmpeg) { console.log('skip ffmpeg:', n); continue; }
  const src = path.join(MD, n + '.ppm');
  fs.writeFileSync(src, ppm(960, 540, c1, c2));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-loop', '1', '-i', src,
    '-t', '8', '-r', '24', '-pix_fmt', 'yuv420p',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '30', out]);
  fs.unlinkSync(src);
  console.log('clip:', n, fs.statSync(out).size, 'bytes');
}
