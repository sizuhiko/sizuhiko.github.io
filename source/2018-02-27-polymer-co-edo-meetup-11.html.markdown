---
title: Polymer.co-edo meetup ＃11 を開催しました
date: 2018-02-27 06:24 UTC
tags:
- Polymer
- Polymer.co-edo
---

今年2回目となる [Polymer.co-edo ミートアップ](https://polymercoedo.doorkeeper.jp/events/70895) を開催しました。

今回の議題は

> Web Componentsを作るにあたり、いくつか必要な開発ツールがあるので、その解説と体験がメインになります。

ということで、必要なツールと、その使い方／書き方について学習しました。

- polymer-cli の使い方
- polymer test を使ってみよう

### 開発環境をととのえる

ちょうど少し前に[YouTubeのGoogle Chrome Developersチャンネル](https://www.youtube.com/user/ChromeDevelopers/)に[Building an Element in Polymer 2という動画シリーズ1から5](https://www.youtube.com/user/ChromeDevelopers/search?query=Building+an+Element+in+Polymer2)がアップされました。
こちらの動画は英語ですが、字幕をONにして日本語に自動翻訳すれば、英語が苦手な方でも問題なく理解できるようになっていますので、ぜひご覧ください。

今回は[Building an Element in Polymer 2: Install Tools & Initialize Project (Part 1 of 5)](https://www.youtube.com/watch?v=NU4TGxYZEjs)が議題とマッチしていたので、一旦ビデオを見ならが進めました。

はじめに `polymer-cli` をインストールしましょう。

```
$ npm install -g polymer-cli
```

動画の中でも言っていますが、いろいろなものが入るので、結構時間がかかります。

次に `bower` をインストールします。

```
$ npm install -g bower
```

`polymer help` や `bower help` などを実行して、コマンドが正常にインストールされているか確認しましょう。

### 自動テストのしくみ

Polymer はテストコマンドとして `polymer test` を用意しています。
このコマンドは、[polymer-cliのリポジトリ](https://github.com/Polymer/polymer-cli)で[ソースコード](https://github.com/Polymer/polymer-cli/blob/master/src/commands/test.ts)を読むとわかりますが、このコマンドは[web-component-tester](https://github.com/Polymer/web-component-tester)へのエイリアスとなっています。

`web-component-tester` は Polymerチームによって開発されていますが、Polymer用というわけではなく、Web Components をテストするために既存のテスティングフレームワークを統合したものです。
[README](https://github.com/Polymer/web-component-tester/blob/master/README.md)にも書いてあるとおり、フロントエンドやNode.jsでは馴染みのある、以下のようなツールを使って構成されています。

* [Mocha][mocha] as a test framework.
* [Chai][chai] assertions.
* [Async][async] to keep your sanity.
* [Lodash][lodash] (3.0) to repeat fewer things.
* [Sinon][sinon] and [sinon-chai][sinon-chai] to test just your things.
* [test-fixture][test-fixture] for easy fixture testing with `<template>` tags.
* [accessibility-developer-tools][a11ydevtools] through `a11ySuite` for simple, automated Accessibility testing.

テストスイートの書き方は、Mocha でテストを書いたことがあれば、それほど違和感はないと思います。
Web Components をテストするのに、追加されているのが test-fixture で、テストするエレメントのテンプレートを複数定義しておき、テストで必要な時だけDOMへ追加できます。

またWebサイトはアクセシビリティにも配慮すべきなので、a11ySuite で自動的に問題がないかどうかを検証できます。
参考サイト：[Webアプリのアクセシビリティを追求せよ！「インクルーシブ」なマークアップを議論しながら学んでみた](https://html5experts.jp/shumpei-shiraishi/24671/)

web-component-tester はブラウザを起動してテストを行います。Web Componentsはブラウザの上で動作することを確認することが重要だからです。
しかし、さまざまなブラウザやOSのバージョンマトリクスを用意するのは困難です。
そこで[Sauce Labs](https://saucelabs.com/)のようなマルチOS/マルチブラウザで動作できるSaaSを利用するのが良いでしょう。
テスト困難はお金で解決できます。
web-component-testerでは、そのためのプラグインが標準で用意されているので、Sauce Labsならすぐに利用できます。
私は[Browserstack](http://www.browserstack.com/)を使いたい！、という場合は、[Browserstack用プラグイン](https://github.com/hotforfeature/wct-browserstack)がOSSで公開されているので、試してみてください。

また、テストで起動するブラウザは、自動的に判定されるので、特定のブラウザだけ実行したい場合などは、`wct.conf.json` というファイルを作ってREADMEを参考に設定します。

もちろんCIでの実行にも配慮されていて、 Gulp や Grunt から実行するインターフェースも用意されています。

### テストを実行してみる

実際にどうやってテストが実行されるのか、既存のエレメントで確認しました。
利用したエレメントは、以下の2つです。

- [PolymerElements/paper-progress](https://github.com/PolymerElements/paper-progress)
- [PolymerElements/gold-email-input](https://github.com/PolymerElements/gold-email-input)

どちらも、以下の手順でテストを実行できます。

- `git clone` する
- clone 先にディレクトリを移動
- `bower install` を実行
- `polymer test` を実行

端末にインストールされているブラウザが自動的に起動して、テストが実行されます。
起動したブラウザは、2ペインになっていて、左側にテスト中のDOM、右側にはテスト結果が表示されます。

### 既存のエレメントから、基本的なテストの書き方を学ぼう

それぞれのリポジトリのテストコードを読んで、テストコードの書き方を学びます。

まず、どちらのリポジトリも、ルートディレクトリに `test` というディレクトリがあります。
web-component-testerはデフォルトで、このディレクトリ名を利用するので、よほどのことがない限りこの名前を利用します。

次に test ディレクトリには index.html と、それ以外のテストファイル（複数でも、サブディレクトリでも）を配置します。
まず index.html が読み込まれるので、テストスイートを初期化します。
ほとんどの Web Components で書き方はコピペで良く、変更が必要なのは title タグと、以下のテストスイートに列挙するファイルの一覧だけです。

```js
    WCT.loadSuites([
      'basic.html',
      'basic.html?dom=shadow'
    ]);
```

重要なこととして、web-component-testerは、デフォルトでは Shadow DOM をOFFにしてテストを実行します。つまり 1行目の `basic.html` は Shady DOM でテストが実行されます。
もし、Shadow DOM でもテストしたい場合は、2行目のようにパラメータを追加する必要があります。

#### テストヘルパーの役割

実際のテストコードを見ると、以下のようなテストヘルパーをインクルードしています。

```html
<script src="../../iron-test-helpers/test-helpers.js"></script>
<script src="../../iron-test-helpers/mock-interactions.js"></script>
```

テストヘルパーを導入すると、テストコードを書くのが容易になります。
代表的なヘルパーメソッドを紹介します。

- flushAsynchronousOperations : Custom Elements のライフサイクルコールバックを強制的に実行します
- forceXIfStamp : `dom-if` を利用しているとき、データバインディングで変更された値の再描画を強制的に実行します。通常はライフサイクルコールバックに入り、非同期で書き換わります
- pressSpace : 指定したエレメント上でスペースキーが押されたことをエミュレーションします
- tap : 指定したエレメントでタップ操作をエミュレーションします

これらの操作は、ヘルパーなしに書くと冗長だったり、それだけで疲れてしまうものですが、ヘルパーを利用することでタグ本来の挙動を確認することに集中できます。

また、paper-progress のようにCSSアニメーションを利用する Web Components のテストでは、asyncPlatformFlush を使っています。
[このメソッドは web-component-tester で定義されています](https://github.com/Polymer/web-component-tester/blob/ed21e16c1b91da0e9a64b32af7f726b3c8613a0d/browser/environment/helpers.ts#L162)が、現時点では DEPRECATED なので、 `flush` を利用することが推奨されています。

flush は flushAsynchronousOperations と似ていますが、コールバックで呼び出されるか、同期実行になるかが異なります。
[公式ドキュメントでは flush を利用するように書いている](https://www.polymer-project.org/2.0/docs/tools/tests#hybrid-elements-test-local-dom)ので、flushを使って書いた方が良いでしょう。
`dom-if` や `dom-repeat` などデータバインディングの結果としてDOMの構造が書き換わる場合、変更は非同期で実行されるため、必ず flush が必要です。
私もプロダクション開発のテストコードでは、頻繁に flush を使うことがあります。

#### それ以外のテストのTIPS

今回はこのあたりで終了時間が少なくなったので、公式ドキュメントで案内されているテストの書き方について、いくつか解説しました。

- [エレメントのメソッドをスタブする方法](https://www.polymer-project.org/2.0/docs/tools/tests#create-stub-methods)
- [エレメント自体をスタブする方法](https://www.polymer-project.org/2.0/docs/tools/tests#create-stub-elements)
- [Ajaxのテスト方法](https://www.polymer-project.org/2.0/docs/tools/tests#ajax)

これらは実際にテストを書くと必要になるので、TIPSとしてリンクを残しておきます。

### FAQ

> サーバーサイド言語の単体テストは、メソッドを実行して戻り値などを検証するけど、Web Components はプロパティで値を指定して、描画後の状態を取得して検証するの？

基本的には、そのような解釈でも問題ないです。
ただし Web Components にはメソッドも定義できるので、こちらはサーバサイドのテストと同様に記述することも可能です（実際そういう需要があるかは別として）。

> 仮想環境を使っていると面倒

たしかに web-component-tester はブラウザを起動して Selenium(Web Driver)を使ってテストするので Vagrant や Virtualbox を使った開発環境ではやりずらいです。
なるべくホストOSの環境で開発するのがオススメです。

### 次回は

3/26(月) の予定です。[Doorkeeperのコミュニティページ](https://polymercoedo.doorkeeper.jp/)に今年の予定も書いてあるので参考にしてください。

いよいよ、実際に今回アイデア出ししたエレメントを作っていきたいと思います。
今後もワークショップ形式で進めていきたいと思うので、ぜひ参加ください。
新しいエレメントのアイデアも募集しています。

### さいごに

写真忘れなかったw！

![](/images/blog/20180226_211052344.jpg)

ワークショップの解説をしている私と参加者、という雰囲気です。

<!-- References -->
[async]:      https://github.com/caolan/async       "Async.js"
[chai]:       http://chaijs.com/                    "Chai Assertion Library"
[mocha]:      http://mochajs.org/                   "Mocha Test Framework"
[lodash]:     https://lodash.com/                   "Lo-Dash"
[sinon]:      http://sinonjs.org/                   "Sinon.JS"
[sinon-chai]: https://github.com/domenic/sinon-chai "Chai assertions for Sinon"
[test-fixture]: https://github.com/PolymerElements/test-fixture "Easy DOM fixture testing"
[a11ydevtools]: https://github.com/GoogleChrome/accessibility-developer-tools "A collection of audit rules checking for common accessibility problems, and an API for running these rules in an HTML page."