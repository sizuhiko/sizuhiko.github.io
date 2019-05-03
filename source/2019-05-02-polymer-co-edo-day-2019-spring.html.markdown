---
title: Polymer.co-edo day 2019 春を開催しました
date: 2019-05-02 12:12 UTC
tags:
- Polymer
- Polymer.co-edo
- WebComponents
---

2019年4回目となる [Polymer.co-edo ミートアップ](https://polymercoedo.doorkeeper.jp/events/91049) を開催しました。

[edo-blogcard](https://github.com/Edo-Elements/edo-blogcard/)に最初のコードをアップしました。
[developブランチ](https://github.com/Edo-Elements/edo-blogcard/tree/develop)にpushしています。

まだ何も動きはないのですが、[LitLoader](https://github.com/PolymerX/lit-loader) を使ってビルドするところまで実装しています。

### ES Module import との戦い

Web Components はHTMLファイルからだと以下のように読み込みます。

```html
<script type="module" src="node_modules/xx-element/xx-element.js"></script>
```

独自のカスタムエレメントから別のエレメントを利用する場合は、以下のように記述します。

```js
import '@polymer/iron-ajax/iron-ajax.js';
```

ここでブラウザは `@polymer/iron-ajax/iron-ajax.js` のようなパスを解決できないため、webpackでコンパイルすることが必要になります。
この話は、以前の記事[PHPer Kaigi 2019に参加しました](/2019/04/07/phper-kaigi-2019.html)でも書いているとおり、[import maps](https://github.com/WICG/import-maps)待ちな状況です。

### 2つのビルド結果

そこで、2つのビルド結果を保持するようにしました。

#### /dist/edo-blogcard.js

これは

```js
import '@edo-elements/edo-blogcard/dist/edo-blogcard.js';
```

のように利用するためのビルド結果で、[LitLoader](https://github.com/PolymerX/lit-loader)形式で記述された `.lit` ファイルを `.js` にコンパイルしたものです。

#### /dist/edo-blogcard.bundle.js

これは

```html
<script type="module" src="node_modules/@edo-elements/edo-blogcard/dist/edo-blogcard.bundle.js"></script>
```

のように利用するためのビルド結果で、HTMLからブログパーツとして利用したい（webpackなどを実行しないWebページで使いたい）場合のためにコンパイルしたものです。
[LitLoader](https://github.com/PolymerX/lit-loader)とwebpackを使ってHTMLから利用可能な状態になっています。

### 工夫したところ

後者の `bundle.js` については、普通に[LitLoader](https://github.com/PolymerX/lit-loader)とwebpackを使うやり方なので、特にはありません。
[LitLoader](https://github.com/PolymerX/lit-loader)はwebpackのloaderとして実装されているので、configに設定を追加するだけです。

一方前者はwebpackのloaderようにできている[LitLoader](https://github.com/PolymerX/lit-loader)を、webpack使わずにどうやって呼び出すか？というところを工夫しました。

それが [build.js](https://github.com/Edo-Elements/edo-blogcard/blob/develop/build.js) です。
そして [loader-runner](https://github.com/webpack/loader-runner#readme) という webpack のモジュールを使っています。
このモジュールは `Runs (webpack) loaders` という説明のとおり、loaderを実行することに特化しています。

```js
const fs = require("fs");
const path = require("path");
const { runLoaders } = require("loader-runner");

runLoaders(
  {
    resource: path.resolve(__dirname, "edo-blogcard.lit"),
    loaders: [require.resolve("lit-loader")]
  },
  function(err, result) {
    if (err) throw err;
    fs.writeFileSync("dist/edo-blogcard.js", result.result[0]);
  }
);
```

これだけで `.lit` ファイルを `.js` ファイルに(webpackなしで)コンパイルできます。

### 次回

通常どおりの、もくもく会として開催予定しています。
皆様の参加をお待ちしております。

[Doorkeeperのコミュニティページ](https://polymercoedo.doorkeeper.jp/)
