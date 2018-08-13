---
title: Polymer.co-edo meetup ＃15 を開催しました
date: 2018-07-02 06:22 UTC
tags:
- Polymer
- Polymer.co-edo
---

今年6回目となる [Polymer.co-edo ミートアップ](https://polymercoedo.doorkeeper.jp/events/76217) を開催しました。

今回の議題は

> 今回は Google I/O '18 で発表された PWA starter kit を使った、サンプルアプリを動かそう

ということで、Polymer3以降の技術で作り直されたサンプルアプリを動かしてみました。

### PWA starter kit のURL

- [PWA Starter Kit](https://github.com/Polymer/pwa-starter-kit)
- [pwa-helpers](https://github.com/Polymer/pwa-helpers)
- [Redux and state management](https://github.com/…/pwa…/wiki/4.-Redux-and-state-management)
- [Application testing](https://github.com/…/pwa-starte…/wiki/7.-Application-testing)
- [Building & Deploying](https://github.com/…/pwa-start…/wiki/5.-Building-&-Deploying)

各自 PWA Starter Kitをダウンロードして、ローカルで実行しました。
特にはまりどころもなく、READMEどおり進めていけば大丈夫です。
動きを確認したあとは、私からどうなっているのか、という技術的な解説をしました。

PolymerというかLitElementの話がメインになって、reduxの解説までは時間が足りなかったのですが、
それはインターネットにたくさん情報があるので、私の解説よりはわかりやすいかな、と。

### PWA starter kit から見える Polymer/Web Componentsの未来

Polymerが生まれた時点で `複雑なWebアプリを作るのは大変だ` と言われていた状況は、
Web ComponentsやReduxによって、わかりやすいものになっていると思います。

PolymerはLitElementの裏に隠れていて見えませんが、もちろんPolymer3がLitElementを支えています。
今後もPolymerチームの動きからは目が離せませんね。

### 次回は

7/23(月) の予定です。[Doorkeeperのコミュニティページ](https://polymercoedo.doorkeeper.jp/)に今年の予定も書いてあるので参考にしてください。

今回はPWA starter kit のハンズオンをやったので、できなかった lit-html の体験をしてみたいな、と思っています。
