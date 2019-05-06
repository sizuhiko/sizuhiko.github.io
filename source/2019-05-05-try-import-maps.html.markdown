---
title: TRY import maps
date: 2019-05-05 02:40 UTC
tags:
- WebComponents
- Polymer
- import maps
---

GW中、最後の記事は [import maps](https://github.com/WICG/import-maps) です。
先日[esm LTでブラウザの最新動向について話しました](/2019/04/07/esm-lt-2019-04.html)でもふれたのですが、[import maps](https://github.com/WICG/import-maps)はChrome73から利用可能になっています。

今回は実際に [Polymer-Japan/litelement-first-element](https://github.com/Polymer-Japan/litelement-first-element) のコードを使って[import maps](https://github.com/WICG/import-maps)を試してみたいと思います。

### Polymer-Japan/litelement-first-element

これはLitElementを使ってはじめてWebComponentsを作るためのCodeLabs用のサンプルコードです。
通常は、`git clone`するかダウンロードした後で `npm install` を実行し、 `npm start` すると `polymer-cli` でWebサーバーを起動します。
`polymer serve` コマンドでは、[import maps](https://github.com/WICG/import-maps)なしでも、自動的にリクエストのパス変換が処理されます。

そこで、PHPやPythonなど別の言語のビルトインサーバー機能を使い、リクエストのパス変換が動かない状況で試してみます。
今回はPHPを使って、以下のコマンドを実行することにしました。

```
$ php -S localhost:8080 -t .
```

### まずは Origin Trial に申し込む

さて[import maps](https://github.com/WICG/import-maps)は、まだお試し機能なので、有効にするには[Chrome Origin Trial](https://developers.chrome.com/origintrials/)に申し込む必要があります。

Origin Trialとは？という人は、[Web 標準化のフィードバックサイクルを円滑にする Origin Trials について](https://blog.jxck.io/entries/2016-09-29/vender-prefix-to-origin-trials.html)を参照ください。とてもわかりやすく解説されています。


[Chrome Origin Trial](https://developers.chrome.com/origintrials/)にアクセスしたら、お手持ちのGoogleアカウントでログインし、[Trial for KV storage built-in module + import maps](https://developers.chrome.com/origintrials/#/view_trial/3175037737296199681)に登録してトークンを取得します。

このとき、`Web Origin` はローカルホストで試すため `http://localhost:8080` のようにポート番号まで指定して登録します。
すると、トークンが発行されます。

### 実行してみる

まずは何も指定せずPHPのビルトインサーバーを起動します。

```
$ php -S localhost:8080 -t .
```

次にサンプルコードの完成版(http://localhost:8080/icon-toggle-finished/demo/)にアクセスします。
すると、Developer Console にURLが見つからないというエラーが出てきます。

地味な作業になりますが、これを1つづつ[import maps](https://github.com/WICG/import-maps)のJSON定義に追加していきます（今は適切なツールがないため）。

### こうなる

以下のようになるまでJSONに追加していくと、すべてのパスが解決されて動作するようになりました。

```html
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, minimum-scale=1, initial-scale=1, user-scalable=yes">
    <meta
      http-equiv="origin-trial"
      data-feature="KV storage built-in module + import maps"
      data-expires="2019-6-16"
      content="発行されたトークンをコピペする">

    <title>icon-toggle demo</title>

    <script type="importmap">
      {
        "imports": {
          "@polymer/iron-demo-helpers/demo-pages-shared-styles": [
            "/node_modules/@polymer/iron-demo-helpers/demo-pages-shared-styles.js"
          ],
          "@polymer/iron-demo-helpers/demo-snippet": [
            "/node_modules/@polymer/iron-demo-helpers/demo-snippet.js"
          ],
          "@polymer/polymer/polymer-legacy.js": [
            "/node_modules/@polymer/polymer/polymer-legacy.js"
          ],
          "@polymer/iron-flex-layout/iron-flex-layout.js": [
            "/node_modules/@polymer/iron-flex-layout/iron-flex-layout.js"
          ],
          "@polymer/font-roboto/roboto.js": [
            "/node_modules/@polymer/font-roboto/roboto.js"
          ],
          "@polymer/polymer/lib/utils/html-tag.js": [
            "/node_modules/@polymer/polymer/lib/utils/html-tag.js"
          ],
          "@webcomponents/shadycss/entrypoints/apply-shim.js": [
            "/node_modules/@webcomponents/shadycss/entrypoints/apply-shim.js"
          ],
          "@webcomponents/shadycss/entrypoints/custom-style-interface.js": [
            "/node_modules/@webcomponents/shadycss/entrypoints/custom-style-interface.js"
          ],
          "@polymer/marked-element/marked-element.js": [
            "/node_modules/@polymer/marked-element/marked-element.js"
          ],
          "@polymer/prism-element/prism-highlighter.js": [
            "/node_modules/@polymer/prism-element/prism-highlighter.js"
          ],
          "@polymer/prism-element/prism-theme-default.js": [
            "/node_modules/@polymer/prism-element/prism-theme-default.js"
          ],
          "@polymer/polymer/lib/legacy/polymer-fn.js": [
            "/node_modules/@polymer/polymer/lib/legacy/polymer-fn.js"
          ],
          "@polymer/polymer/lib/legacy/polymer.dom.js": [
            "/node_modules/@polymer/polymer/lib/legacy/polymer.dom.js"
          ],
          "marked/lib/marked.js": [
            "/node_modules/marked/lib/marked.js"
          ],
          "prismjs/prism.js": [
            "/node_modules/prismjs/prism.js"
          ],
          "@polymer/polymer/lib/elements/dom-module.js": [
            "/node_modules/@polymer/polymer/lib/elements/dom-module.js"
          ],
          "lit-element": [
            "/node_modules/lit-element/lit-element.js"
          ],
          "lit-html": [
            "/node_modules/lit-html/lit-html.js"
          ],
          "lit-html/lib/shady-render": [
            "/node_modules/lit-html/lib/shady-render.js"
          ],
          "lit-html/lit-html": [
            "/node_modules/lit-html/lit-html.js"
          ],
          "@polymer/iron-icons/iron-icons.js": [
            "/node_modules/@polymer/iron-icons/iron-icons.js"
          ],
          "@polymer/iron-icon/iron-icon.js": [
            "/node_modules/@polymer/iron-icon/iron-icon.js"
          ],
          "@polymer/iron-iconset-svg/iron-iconset-svg.js": [
            "/node_modules/@polymer/iron-iconset-svg/iron-iconset-svg.js"
          ],
          "@polymer/iron-meta/iron-meta.js": [
            "/node_modules/@polymer/iron-meta/iron-meta.js"
          ]
        }
      }
    </script>

    <script src="../../node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>
```

すごい[import maps](https://github.com/WICG/import-maps)ちゃんと動いてる！

ということで、まだChrome(73以上)でないと試せませんが、これで WebComponents を動かすのに Webpack しなくて良い未来を体験することができます。
JSON定義を自動生成するスクリプトが出ないか期待したいですね（がんばって自作するのもあり）。
