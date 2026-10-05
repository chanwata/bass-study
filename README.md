# BASS LISTENING LAB

Spotifyプレイリスト48曲を使い、エレキベース、ソウル、ファンク、フュージョン、ロック、現代のベーシストを14日間で聴き進める日本語教材です。

各曲にはSpotifyの埋め込みプレイヤー、背景、演奏分析、3段階の聴き方、ベースで試す課題、誤解しやすい点を収録しています。さらに登場する39人全員について、略歴、代表機材、プレイスタイル、楽器の使い方、音の特徴と、手元の楽器で試せる音作りを読めます。録音で実際に使用した機材と、練習のための再現実験は明確に区別しています。進捗とメモはこの端末のブラウザに保存されます。テキストのメモと、全進捗を含むJSONバックアップを書き出せます。JSONは「復元」から読み込めます。異なる端末との自動同期はありません。

## ローカルで見る

```bash
python3 scripts/build.py
python3 -m http.server 8000 --directory dist
```

`http://localhost:8000` を開いてください。

## 更新する

教材本文は `src/course.json`、機材・音作りの実験は `src/rig_notes.json`、画面は `src/template.html`、`src/style.css`、`src/profiles.css`、`src/ux.css`、`src/app.js` にあります。人物データの再生成には `scripts/enrich_bassists.py` を使いますが、手動で校閲した機材と出典を上書きしないよう差分を確認してください。`main` ブランチへのpushでGitHub Actionsがテスト後に `dist/index.html` を生成し、GitHub Pagesへ公開します。ローカル検証は `node --test tests/*.test.js` と `python3 scripts/build.py`。

## 録音について

同名曲やライブ版がある録音には対象バージョンを明記しています。教材の分析は学習のための聴き方であり、演奏者本人の意図や唯一の正解を断定するものではありません。

Spotifyの再生先はプレイリストの位置ではなく `spotifyByTrack` の曲IDで管理します。元のプレイリストの6曲目は1967年のスタジオ版ですが、教材の6番はJerry Jemmottの1971年ライブ版を指します。同じくプレイリストの34曲目はライブ版ですが、教材の34番は『Voyeur』期の約3分14秒のスタジオ録音を指します。プレイリスト自体は変更しません。Spotify埋め込みでフル再生できるかどうかはアカウント・地域などによります。
