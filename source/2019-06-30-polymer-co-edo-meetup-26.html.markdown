---
title: Polymer.co-edo  meetup ＃26を開催しました
date: 2019-06-30 02:36 UTC
tags:
- Polymer
- Polymer.co-edo
---

2019年5回目となる [Polymer.co-edo ミートアップ](https://polymercoedo.doorkeeper.jp/events/93071) を開催しました。

まず最初に私から、先日の[合宿に参加してKARAKURIを作った](/2019/06/16/karakuri.html)について共有しました。
[edo-karakuri](https://github.com/Edo-Elements/edo-karakuri)の仕組みやできることなど、edo-blogcardとの関連など。

### lit-loaderのコンパイルがエラーになる？

で、そのあとはedo-blogcardとedo-karakuriをつないで、動かそうとしたところ、[lit-loader](https://github.com/PolymerX/lit-loader)というかBabelでエラーになります。
どうもコンストラクターがダメらしい。lit-loaderの公式では以下のような例です。

```js
  export default class CounterElement {
    static get properties() { return {
      clicks: Number,
      value: Number
    }};

    constructor() {
      super();
      this.clicks = 0;
      this.value = 0;
    }
```

これを見てパッとは気づかなかったのですが、よく考えると `extends` してない（親クラスない）のに、 `constructor` で `super` 呼んだらダメじゃね？と。
まぁ厳密には `lit-loader` を使ってコンパイルされると、以下のように `LitElement` を継承するので、コンパイル後であれば問題はないです。

```js
  export default class CounterElement extends LitElement {
    static get properties() { return {
      clicks: Number,
      value: Number
    }};

    constructor() {
      super();
      this.clicks = 0;
      this.value = 0;
    }
```

あれ？でもこれ [lit-loader-example](https://github.com/PolymerX/lit-loader-example)でうまく動作していなかったっけ？と思ったわけです。
そして、確かにリポジトリをcloneしてから `yarn install` して `yarn build` してもエラーになりません。

### そのときと現状

当時のパッケージバージョンと、現在のパッケージバージョンを比較してみました。

```
$ npm outdated
Package               Current      Wanted  Latest  Location
@babel/core             7.2.2       7.2.2   7.4.5  lit-loader-example
@babel/preset-env       7.3.0       7.3.0   7.4.5  lit-loader-example
babel-loader            7.1.5       7.1.5   8.0.6  lit-loader-example
lit-element        2.0.0-rc.3  2.0.0-rc.3   2.2.0  lit-loader-example
webpack                4.16.1      4.16.1  4.35.0  lit-loader-example
webpack-cli             3.0.8       3.0.8   3.3.5  lit-loader-example
xo                     0.21.1      0.21.1  0.24.0  lit-loader-example
```

babel新しくなってるな。確かに新しくするとES6のチェックが厳密になっている。
まぁあるべき姿なんですけどね。

### どうするか？

ただしく解決するなら `constructor` が定義されている場合のみ、最初の行に `super()` を差し込むような `lit-loader` にすれば良いのかなと。
で、 `lit-loader` は [jscodeshift](https://github.com/facebook/jscodeshift) を使っているので、JavaScriptのASTとか調べながら、jscodeshiftでどうやってソースコードを変換できるかを調べました。
で、修正コードは作れたので、PR出すかなーと思っています。
今のところ通過するようにするためには Babel のバージョンを `7.2.2` にしておくと良いです。

### 次回

Polymer Japanのイベントが同じ週に計画されているので、次回は8月の予定です。

引き続きEdoエレメントの開発ともくもくを進めていきます。
皆様の参加をお待ちしております。

[Doorkeeperのコミュニティページ](https://polymercoedo.doorkeeper.jp/)
