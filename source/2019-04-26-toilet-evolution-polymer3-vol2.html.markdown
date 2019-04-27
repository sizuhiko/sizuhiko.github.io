---
title: Toilet EvolutionのフロントエンドをPolymer3対応する(2)
date: 2019-04-26 07:47 UTC
tags:
- Polymer
- WebComponents
- IoT
- ToiletEvolution
---

この記事は[Toilet EvolutionのフロントエンドをPolymer3対応する(1)](/2019/04/25/toilet-evolution-polymer3-vol1.html)の続編です。

今回からは[mozlier適用だけでは動かないので、ローカルで動作するように修正](https://github.com/toiletevolution/toiletevolution-server/commit/69e3ab53048a42323db2db3af5da0ef0f7edb498)というコミットにおける試行錯誤を書いていきます。

うまく動作させるために試行錯誤して変更したファイル、実に110。1回では書ききれない予感が...


### 不要になったファイルを削除

`bower.json` や `.bowerrc` ファイルは、Polymer3でnpmに移行したので、削除します。

### linterを追加

lintは `polymer-cli` にも付いているのですが、エディタで編集中にも状況は知りたいので、eslintを導入します。
Polymer1のころはHTMLファイルだったので、特に不要でしたね。

### ビルドを変更

これまでbuildは独自にgulpで実装していたのですが、Polymer3対応をするに伴い[polymer-build](https://www.npmjs.com/package/polymer-build)を使うようにしました。
これは `polymer CLI` でも使っているビルドライブラリです。ビルドについては、この連載で触れていきます。

### polymer.jsonの変更

`shell` や `fragments` で指定したファイルの拡張子を `html` から `js` に変更します。
これは自動的に変換されないので注意しましょう。
`extraDependencies` や、そのほかの定義も変わっていますが、このあたりは[polymer.json specification](https://polymer-library.polymer-project.org/3.0/docs/tools/polymer-json)を参考にPolymer3形式に1から記述するぐらいの気持ちでいましょう。

### 変換された自作のカスタムエレメントを修正する

まずmodulizerで変換すると、Polymer本体のimportが 

```js
import '../bower_components/polymer/polymer-legacy.js';
```

のようになっているので、これを 

```js
import '@polymer/polymer/polymer-legacy.js';
import {Polymer} from '@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '@polymer/polymer/lib/utils/html-tag.js';
```

のように変更しました。

なお、公式ドキュメントによると 

```js
import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
```

にしていますが、これは `PolymerElement` 使っている場合なので、ハイブリッドモードの書き方の場合は、私のようにlegacyを使ってください。

続いてテンプレートが以下のように `Polymer.html` を参照するようになっています。

```js
Polymer({
  _template: Polymer.html`
```

この記述は利用できないので、以下のように `import` した `html` を利用するように変更します。

```js
Polymer({
  _template: html`
```

### bower_components を使わないようにする

変換されたjsファイルは、bower_components上に変換されたモジュールを参照しにいきます。
そこで各々のパッケージがnpmに公開されているか調べて、npmに移行していきます。

すでに上記で `bower_components/polymer` を変更していますが、これを例に説明します。

1. まず[webcomponents.org](https://www.webcomponents.org)のサイトでWebComponentsを検索します。
1. この例では `polymer` を入力して検索すると、該当のものが見つかるので、[詳細ページ](https://www.webcomponents.org/element/@polymer/polymer)を開きます。![](blog/2019-04-27-www.webcomponents.org-78097a3d36c6.png)
1. もし `ES Modiles` に対応していれば、左側に `View on NPM` が表示されます。
1. `INSTALLED VIA NPM` のリンクをクリックすると `npm install --save Polymer/polymer` のように表示されるので、CLIからインストールします。
1. bower_componentsから、参照しなくなったjsファイルを削除します。

### WebComponents V1対応に追従する

自分が記述したCustomElementsには利用していなかった `<content>` も、依存関係のタグでは利用している場合があります。
例えば[@polymer/app-layout](https://www.webcomponents.org/element/@polymer/app-layout)は、レイアウトないのコンポーネントを識別するときに利用しているので、slot対応を行います。たとえば以下のドロワー記述は

```html
      <app-drawer>
```

次のように `slot` 識別を追加します。

```html
      <app-drawer  slot="drawer">
```

このあたりの修正ポイントは、タグが表示されなくなることで気がつきますが、アップデートしたら最新のドキュメントを一読することをオススメします。
他にも修正箇所があるかもしれませんので。

### importHref を修正する

`iron-pages` でページを切り替えるとき、Polymer1では動的に HTML import を実行していました。

```js
  _pageChanged: function(page) {
    this.importHref('/elements/te-' + page + '.html', null, null, true);
```

`ES Module`を使うPolymer3では以下のように書き換えます。

```js
    switch (page) {
      case 'admin':
        import('./te-admin.js');
        break;
      case 'devices':
        import('./te-devices.js');
        break;
      case 'login':
        import('./te-login.js');
        break;
      case 'about':
        import('./te-about.js');
        break;
    }
```

`import` の引数には変数が利用できないので注意してください。

### Polyfillを変更する。

HTMLファイルではpolyfillLをインポートしています。
Polymer1では `/bower_components/webcomponentsjs/webcomponents-lite.min.js` を使いましたが、Polymer3では以下のpolyfillに変更します。
これもnpmを使ってインストールするように変更します。

```html
<script src="node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>
```

このように修正を重ねていくことで、徐々に動作するエレメントが増えてきます。
ここまでは多くのアプリケーションや、カスタムエレメントで実施しなければならない共通的な修正箇所です。
Toilet Evolutionでは、まだまだ修正箇所がありましたので、続きは[次回](/2019/04/27/toilet-evolution-polymer3-vol3.html)で。
