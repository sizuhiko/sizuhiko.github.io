---
title: Polymer.co-edo meetup ＃14 を開催しました
date: 2018-05-29 02:55 UTC
tags:
- Polymer
- Polymer.co-edo
---

今年5回目となる [Polymer.co-edo ミートアップ](https://polymercoedo.doorkeeper.jp/events/74678) を開催しました。

今回の議題は

> 今回は先日開催された Google I/O '18 から Polymer のセッション動画を見ながら Polymer3 のリリース記念パーティとして、食べ飲みしながら情報共有したいと思っています。

ということで、ピザとビールを片手に Polymer 談義が盛り上がりました。

### Google I/O で発表された内容のリンク集

[Polymer Japan の Facebook グループ](https://www.facebook.com/groups/416344608738146/)には、Google I/Oの翌日に貼りましたが、こちらにもまとめておきます。

#### セッション動画

- [Web Components and the Polymer Project: Polymer 3.0 and beyond](https://www.youtube.com/watch?v=7CUO7PyD5zA&list=PLNYkxOF6rcIC4NQeXpdAy0RbOACI66Hvf&index=13&t=4s)
- [PWA starter kit: build fast, scalable, modern apps with Web Components](https://www.youtube.com/watch?v=we3lLo-UFtk&index=16&list=PLNYkxOF6rcIC4NQeXpdAy0RbOACI66Hvf)

#### セッションで紹介されたサイトなど

##### Web Components and the Polymer Project: Polymer 3.0 and beyond

- [CSS Shadow Parts](https://tabatkins.github.io/specs/css-shadow-parts/)
- [Custom Element Registers](https://github.com/w3c/webcomponents/issues/716)
- [Package name maps](https://github.com/domenic/package-name-maps)
- HTML Modules
  - [https://github.com/w3c/webcomponents/issues/645](https://github.com/w3c/webcomponents/issues/645)
  - [https://github.com/PolymerLabs/html-modules-toolkit](https://github.com/PolymerLabs/html-modules-toolkit)
- [HTML Template Instantiation](https://github.com/…/gh…/proposals/Template-Instantiation.md)

##### PWA starter kit: build fast, scalable, modern apps with Web Components

- [PWA Starter Kit](https://github.com/Polymer/pwa-starter-kit)
- [pwa-helpers](https://github.com/Polymer/pwa-helpers)
- [Redux and state management](https://github.com/…/pwa…/wiki/4.-Redux-and-state-management)
- [Application testing](https://github.com/…/pwa-starte…/wiki/7.-Application-testing)
- [Building & Deploying](https://github.com/…/pwa-start…/wiki/5.-Building-&-Deploying)

### Polymer の過去/現在

Polymer 3.0 のリリースに関して、Polymer がいつ発案されて、どうやって進んできたのか、という話から始まりました。
とても古いGoogle I/Oの写真を使ったりして、Web Components がどんな問題を解決しようとしていて、Chromeチームとしてどのように取り組んできたか、がわかります。

ブラウザ/JavaScriptを中心としたフロントエンドのトレンドは変化が大きく、最初にWeb Componentsを発案したころと、現在では細かいところに問題が多く残っていたのは事実です。
ただ一方でPWAに代表されるように、モバイルアプリでできることをブラウザでもできるようにする取り組みも、大きな進歩を遂げています。

PolymerがGoogle内部でどのような位置付けになっているのかを図るのは難しいのですが、少なくとも多くのプロジェクトで利用されていることは間違いないです。

そして「現在の最適解」がPolymer3であるわけです。
動画の中でも `Too weird` として紹介されていた、 polyfill/perceived silo/bower/HTML imports の解決に取り組んできたということです。

polyfill については、モバイルブラウザ（iPhoneならsafari/Androidならchrome）では、Polymer3.0の仕様であればpolyfillを必要としない対応状況です。
perceived silo （自己中心的、というかWeb Components == Polymer みたいに受け取られていた批判みたいなもの）については、 
[Custom Elements Everywhere](https://custom-elements-everywhere.com/)でも公開されているとおり、AngularやVueなどPolymer以外のJavaScriptフレームワークでも利用できることがわかります。
bowerについては、発案当時はフロントエンドでは非常に流行っていた、けど今はということで npm に。
HTML importsの仕様化はあきらめ、多くのブラウザが実装する ES Module Import へと。

そう、Web Components は、今日ではメインストリームになるのです。

一部のツールはまだPreviewですが、フィードバックを待っているということで、特に何もなければ大きな変化はなく、リリースになるのではないでしょうか？

- [lit-html](https://custom-elements-everywhere.com/)
- [polymer-modulizer](https://github.com/Polymer/polymer-modulizer)

### 未来

PWA Starter Kitで作れるアプリのコードを見るとわかるのですが、 lit-html を使うことで Polymer 感？みたいなのは非常に薄まります。PolymerElementじゃなくなるし。
ただ lit-html は Polymer3 をベースに作られているし（互換性は少ないけど）、Polymerチームは多くの Web Components を公開しています。
Polymerは、Web Components を使って課題を解決するのに役立つ下回りを整備してくれるライブラリやフレームワークとしてまだまだ価値があると思っています。

あとは、Polyemrチームが取り組んでいる、上記で紹介した今後の仕様に期待しています。
特に `HTML Modules` について、ES Module Import によって HTML部分が HTML in JavaScript になるわけです。
「どうしてもHTMLで書けた方が良いじゃん！」というPolymerチームの意思というか（私もそうですが）HTML Importsはダメだったけど、これなら良いでしょ！私たちはHTMLで書きたいんですよ！愛が溢れています。

### 次回は

6/25(月) の予定です。[Doorkeeperのコミュニティページ](https://polymercoedo.doorkeeper.jp/)に今年の予定も書いてあるので参考にしてください。

PWA starter kit のハンズオンをやって、Polymer3 や lit-html を体験してみたいな、と思っています。
