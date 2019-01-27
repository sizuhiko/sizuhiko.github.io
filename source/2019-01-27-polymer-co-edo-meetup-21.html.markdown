---
title: Polymer.co-edo meetup 21を開催しました
date: 2019-01-27 01:29 UTC
tags:
- Polymer
- Polymer.co-edo
---

2019年1回目となる [Polymer.co-edo ミートアップ](https://polymercoedo.doorkeeper.jp/events/85430) を開催しました。

今回、私は以下の作業を実施しました。

- [はじめての LitElement エレメントの作り方](https://polymer-japan.github.io/litelement-first-element/index.ja.html) のLitElementをv2.0にアップデート
- [LitLoader](https://github.com/PolymerX/lit-loader) のLitElement v2.0対応。どちらのPRもマージされました！
  - [本体へのPR](https://github.com/PolymerX/lit-loader/pull/25)
  - [サンプルアプリへのPR](https://github.com/PolymerX/lit-loader-example/pull/2)

[はじめての LitElement エレメントの作り方](https://polymer-japan.github.io/litelement-first-element/index.ja.html)はなるべく多くの人が体験できるようにかなっていますので、ぜひお試しいただき、何かあれば気軽に[フィードバック](https://github.com/Polymer-Japan/litelement-first-element/issues)をいただければと思います。

[LitLoader](https://github.com/PolymerX/lit-loader)は、Polymer1や2のときのようにHTMLファイルでの記述が可能で、拡張子を `.lit` という形式にしています。
WebpackをとおすとLitElementのjsファイルに変換する仕組みになっています。
私は HTML in js よりも、こちらの書き方が気に入っているので、これからも何かあれば貢献していきたいです。

なぜかと言うと、[HTML Modules](https://github.com/w3c/webcomponents/issues/645)の議論が活発に行われていますが、ブラウザの実装になるまでは時間がかかると思うので、いったんWebpackで変換するなどpolyfillにも頼らない形での記述形式は重要かな、と思っています。

[LitLoader](https://github.com/PolymerX/lit-loader)は、コードも簡単でスッキリしているので現時点では不満もありません。

### 次回（==来年）

2019年の開催予定を公開しています。次回は2/18の予定です。皆様の参加をお待ちしております。

[Doorkeeperのコミュニティページ](https://polymercoedo.doorkeeper.jp/)
