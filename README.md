# BASS LISTENING LAB

Spotifyプレイリスト48曲を使い、エレキベース、ソウル、ファンク、フュージョン、ロック、現代のベーシストを14日間で聴き進める日本語教材です。

各曲には背景、演奏分析、3段階の聴き方、ベースで試す課題、誤解しやすい点を収録しています。進捗とメモはブラウザに保存され、テキストとして書き出せます。

## ローカルで見る

```bash
python3 scripts/build.py
python3 -m http.server 8000 --directory dist
```

`http://localhost:8000` を開いてください。

## 更新する

教材本文は `src/course.json`、画面は `src/template.html`、`src/style.css`、`src/app.js` にあります。`main` ブランチへのpushでGitHub Actionsが `dist/index.html` を生成し、GitHub Pagesへ公開します。

## 録音について

同名曲やライブ版がある録音には対象バージョンを明記しています。教材の分析は学習のための聴き方であり、演奏者本人の意図や唯一の正解を断定するものではありません。

