[![.github/workflows/lint.yml](https://github.com/sacckey/wipeout-ink/actions/workflows/lint.yml/badge.svg)](https://github.com/sacckey/wipeout-ink/actions/workflows/lint.yml)

## これはなに
Twitterに投稿されたスプラトゥーン3のwipeout動画を表示するサービスです。

## ローカルで動かす
```
git clone git@github.com:sacckey/wipeout-ink.git

cd wipeout-ink/functions
npm install
npm run build
cd ..

docker compose up

yarn install
yarn dev
```

## 解説記事
https://note.sacckey.dev/n/n54e1b819dba1
