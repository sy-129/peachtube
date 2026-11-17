#!/usr/bin/env bash
# 如果本机有 macOS：./tools/build-ipa.sh 直接出 ipa
# 没有 macOS：把本文件内容复制到 .github/workflows/build-ipa.yml，推上去让 GitHub 编
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

node tools/prepare.js
node tools/make-www.js

cd ios/app
make clean || true
make -j"$(sysctl -n hw.ncpu)"

APP="$(find .theos -name 'PeachTube.app' -type d | head -1)"
[ -n "$APP" ] || { echo "编译失败"; exit 1; }

cd "$ROOT"
rm -rf Payload && mkdir -p Payload
cp -R "ios/app/$APP" Payload/
zip -qry PeachTube.ipa Payload
ls -lh PeachTube.ipa
