# 蜜桃TUBE · 站点 + iOS ipa

手机网页版 + 原生 WKWebView 壳，云端 macOS runner 编出 `PeachTube.ipa`。

## 目录

```
public/            前端（index.html / style.css / app.js / manifest / icon）
data/videos.json   片库
tools/prepare.js   生成封面 SVG 与 3 段示例片源（ffmpeg）
tools/make-www.js  生成 App 内置离线包 + 注入离线数据层
ios/app/           Theos application 工程（main.m / AppDelegate.m / Info.plist）
ci/build-ipa.yml   ⚠️ 需要你手动放到 .github/workflows/ 下（见下）
```

## 出 ipa（云端，无需 Mac）

1. 让 workflow 就位（GitHub 的 token 权限挡住了自动创建）：

   打开 https://github.com/sy-129/peachtube/new/main?filename=.github/workflows/build-ipa.yml
   把 `ci/build-ipa.yml` 的内容整段粘进去，Commit changes。

2. 提交后自动开跑：仓库 → Actions → build-ipa → 最近一次 run
3. 跑完在页面底部 **Artifacts → PeachTube-ipa** 下载，解压得到 `PeachTube.ipa`

耗时约 3–6 分钟。改动 `public/`、`data/`、`ios/` 任意文件再推一次就会重新编。

## 装到 iPhone（iOS 27 无越狱）

1. Sideloadly（Windows / Mac 都行）连手机，把 ipa 拖进去，填 Apple ID，Start
2. 设置 → 通用 → VPN与设备管理 → 信任证书
3. 设置 → 隐私与安全性 → 开发者模式 → 打开 → 重启

免费证书 7 天到期，到期重签一次，App 数据保留。

## 有 macOS 时本地构建

```bash
brew install ldid xz ffmpeg
export THEOS=~/theos
./tools/build-ipa.sh
```
