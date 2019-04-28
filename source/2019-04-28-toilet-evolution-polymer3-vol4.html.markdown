---
title: Toilet EvolutionのフロントエンドをPolymer3対応する(4)
date: 2019-04-28 08:13 UTC
tags:
- Polymer
- WebComponents
- IoT
- ToiletEvolution
---

この記事は[Toilet EvolutionのフロントエンドをPolymer3対応する(3)](/2019/04/27/toilet-evolution-polymer3-vol3.html)の続編です。

前回までの対応で、ページをロードしたときに、ブラウザのコンソールにエラーが出ることが少なくなりました。
ただし多くのページで表示が崩れていたり、うまく表示できないエレメントがあります。
これは今回の `ES Modules` に対応してなかったエレメントに関連するところだったのですが、これらの対応を解説していきます。

### dom-module has style outside template というワーニングが出る

ブラウザのコンソールを確認していると `dom-module has style outside template` といったワーニングが表示されます。
これは `<dom-module>` の中で `<template>` と `<style>` が並列に記述されている場合に発生します。

なので、すべて `<template>` の子要素に `<style>` を移動しました（[コミット](https://github.com/toiletevolution/toiletevolution-server/commit/57ac6537723ead18bf953cbe4577a69c990bafe1)）。

### 動かすようにするための微調整

続いて1つずつの修正はそれぞれ大きくないものの、動作するまでの調整をたくさん実施しました（[コミット](https://github.com/toiletevolution/toiletevolution-server/commit/c1cb2e9fa4d12cc049dac8abc996cb3be0057155)）。

#### クリック処理が動かない

これは1から2の段階で廃止になった `listeners` を使っていたためで、利用箇所を `addEventListener` や、 `on-tap`, `on-click` に変更しました。

#### moment でロケールを利用しようとするとエラーになる

Toilet Evolution では、トイレの利用状況を表示するときに `10分前` のような表示をしているのですが、これに `moment.js` の機能(`toDate()`)を使っています。
`moment` だけ(ロケールを使わない)なら npm でインストールして

```js
import moment from 'moment';
```

と記述すればよかった(動いた)のですが、どうしてもロケールの解決がうまくいかない（Webpackするとエラーになる）ので、今回はあきらめてHTML側でグローバルに利用できる形にしました。

```html
  <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/locale/ja.js"></script>
```

いくつかWebpackとmomentのissueも見つけて解決策もありそうだったのですが、とりあえず困らないのでこの方法で。

#### style や slot が解決されない

modulizerで自動変換された `<google-map-marker>` エレメントは以下のようになっていました。

```js
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="google-map-marker">
  <style>
    :host {
      display: none;
    }
  </style>
  <template><slot></slot></template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);
```

もとのHTMLでの記述は以下のようになっていました。

```html
<dom-module id="google-map-marker">
  <template>
    <style>
      :host {
        display: none;
      }
    </style>

    <slot></slot>
  </template>
  <script>
```

自分が作ったカスタムエレメントでは、 `Polymer` の `_template` に `html` を使うように変換されていたのですが、bowerでインストールしたコンポーネントの多くは上記のように変換されていました。これを `html` を使うようにしてみたところ解決しました。

```js
Polymer({

  _template: html`
  <style>
    :host {
      display: none;
    }
  </style>
  <slot></slot>
`,
```

`<google-map>` エレメントも同様にうまく動作しなかったので、 `html` をつけて `_template` で返却するように対応しました。

### さいごに

4回にわたって、Polymer1のプロジェクトをPolymer3に移行した解説をしてきました。
この連載がPolymer1からアップグレードする他の方の手助けになれば幸いです。

基本的な部分は、ほとんどmodulizerで変換できるので、これは便利だなーと思うのでした。
Polymer3対応した依存エレメントは、どこかのタイミングでPRを出してフィードバックしたいなと思っています。

では良いWeb Componentsライフを！
