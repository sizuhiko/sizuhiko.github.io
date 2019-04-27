---
title: Toilet EvolutionのフロントエンドをPolymer3対応する(3)
date: 2019-04-27 10:16 UTC
tags:
- Polymer
- WebComponents
- IoT
- ToiletEvolution
---

この記事は[Toilet EvolutionのフロントエンドをPolymer3対応する(2)](/2019/04/26/toilet-evolution-polymer3-vol2.html)の続編です。

今回も[mozlier適用だけでは動かないので、ローカルで動作するように修正](https://github.com/toiletevolution/toiletevolution-server/commit/69e3ab53048a42323db2db3af5da0ef0f7edb498)というコミットにおける試行錯誤を書いていきます。

前回は多くのアプリケーションや、カスタムエレメントで実施しなければならない共通的な修正箇所について解説しましたが、ここからはアプリケーションで使っている機能やエレメントについて、修正が必要だった箇所について解説していきます。

### ES Module対応になっていないエレメントを使う

前回の記事で「`bower_components を使わないようにする`」について解説しました。
PolymerチームやVaadinチームなどが作っているコンポーネントについては、ほとんど `ES Module` に対応しているのですが、場合によっては対応してないモジュールを使っていることがあるかもしれません。

Toilet Evolutionでは以下のエレメントが `ES Module` に対応していませんでした。`iron-signals` は `toast-er` の依存に関連しています。

- [excess-router](https://github.com/atotic/excess-router)
- [geo-location](https://www.webcomponents.org/element/ebidel/geo-location)
- [gold-password-input](https://www.webcomponents.org/element/GeoloeG/gold-password-input)
- [google-map](https://www.webcomponents.org/element/GoogleWebComponents/google-map)
- [paper-menu](https://www.webcomponents.org/element/googlearchive/paper-menu)
- [toast-er](https://github.com/masonlouchart/toast-er)
  - [iron-signals](https://www.webcomponents.org/element/googlearchive/iron-signals)

そこで、これらのエレメントは modulizer で変換されたものを、そのまま利用することにしました。
また変換されたエレメントについては、前回の記事同様に共通的な修正箇所が必要になります。
つまり自分で作ったエレメントと同様に、そのエレメントが依存している（bower.jsonに含まれている）エレメントやライブラリについても、 `npm install` で取得するように変更する必要があります。

またPolymer1用のライブラリだったりする場合は、[Polymer1から2へのアップグレードガイド](https://polymer-library.polymer-project.org/2.0/docs/upgrade)に書いてある `slot` の対応なども必要だったので、そのライブラリが最新版だとPolymerのどのバージョンに対応したものなのかを確認しておくことが重要です。

そして、これらの作業が結構やっかいです（自分で作ったものでないので、ソースを理解する必要があります）。

### 以前のPolymerのビヘイビアは個別にインストールする必要がある

HTMLインポートで利用していた、Polymerチームが作っていたようなカスタムエレメントのビヘイビアは、個別に `import` するか、場合によっては `npm install` で導入する必要があります。
自分で作ったエレメントでは、ビヘイビアを使っていなかったので、この段階で初めて知りました（これは意外にもドキュメントに書いていません）。

例えば `<gold-password-input>` では、`PaperInputAddonBehavior` という `paper-input` に含まれていたビヘイビアを使っています。
これは以下のように、`import` を追加してあげる必要があります。

```js
import {PaperInputAddonBehavior} from '@polymer/paper-input/paper-input-addon-behavior.js';
```

`ES Module`対応しているエレメントであれば、[webcomponents.org](https://www.webcomponents.org)のビヘイビアを参照すると解説が書いてあります。
上記の `PaperInputAddonBehavior` であれば、[こちら](https://www.webcomponents.org/element/@polymer/paper-input/behaviors/PaperInputAddonBehavior)です。

### Polymer.dom を変更する

これも自分のエレメントでは使っていなかったので気付かなかったのですが、使っているエレメントがあったので修正の必要がありました。
まず `dom` をインポートします。

```js
import {dom} from '@polymer/polymer/lib/legacy/polymer.dom.js'
```

で、`Polymer.dom` を使っている箇所を `dom` に変更します。例えば以下のような感じです。

```js
return dom(this).parentNode;
```

### bowerでカスタムエレメント以外のライブラリに依存している

`<gold-password-input>` は[zxcvbn](https://github.com/dropbox/zxcvbn)というパスワードストレングスエミュレータを使っています。
Node.jsなどにも対応しているのですが、今回はbowerでインストールしたフォルダをそのままコピーして、リポジトリに追加しました。
このようにカスタムエレメント以外のライブラリを使っている場合は、npmでインストールしてビルドする方法以外の検討も必要となります。
特に`<gold-password-input>`では、以下のように `script` タグを動的に追加してライブラリをインポートしていたため、npmを利用するのに適していなかったという理由があります。

```js
  ready: function() {
    isZxcvbnLoaded = typeof zxcvbn !== "undefined";
    if (!isZxcvbnLoaded) {
      isZxcvbnLoaded = true;
      var oScript = document.createElement("script");
      oScript.type = "text\/javascript";
      oScript.onerror = function(err) {
        isZxcvbnLoaded = false;
        throw new URIError("The script " + err.target.src + " is not accessible.");
      };
      this.parentNode.insertBefore(oScript, this);
      oScript.src = this.resolveUrl("../zxcvbn/dist/zxcvbn.js");
    }
  },
```

このぐらいまで対応が進むと、ページをロードしたときに、ブラウザのコンソールにエラーが出ることが少なくなります。
ただし多くのページで表示が崩れていたり、うまく表示できないエレメントがあります。
これは今回の `ES Modules` に対応してなかったエレメントに関連するところなのですが、
これらの対応方法については次回解説していきます。
