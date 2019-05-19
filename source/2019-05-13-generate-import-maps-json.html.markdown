---
title: import-mapsのjsonファイルを生成するツールを作ってみた
date: 2019-05-13 09:18 UTC
tags:
- WebComponents
- Polymer
- import maps
---

前回 [TRY import maps](/2019/05/05/try-import-maps.html) ということで、[import maps](https://github.com/WICG/import-maps) を試してみる記事を書きました。
最後に

> JSON定義を自動生成するスクリプトが出ないか期待したいですね（がんばって自作するのもあり）。

という記述をしたのですが、その後調べたら [How to convert package-lock.json to import maps? #60](https://github.com/WICG/import-maps/issues/60) というissue が上がっているのを見て、いくつか `yarn` のサンプルが出ていたりして、これ自作できるのでは？と思い、作ってみました。

[gen-import-maps-json](https://www.npmjs.com/package/gen-import-maps-json) です。

READMEのとおりで簡単に動きます。

### しくみ

とても小さいJavaScriptのコードです。以下のような手順で処理しています。

1. コマンドが実行されたディレクトリにある `package-lock.json` ファイルを読み込む
1. devDependencies のモジュールは除外する
1. Web Components の polyfill は除外する
1. 対象モジュールの `package.json` を読み取って、 `main` ファイルのパスを入手する
1. メインファイルのモジュール名と、相対パスをキーにした、map情報を書き出す

### ためしてみる

前回と同じく[Polymer-Japan/litelement-first-element](https://github.com/Polymer-Japan/litelement-first-element) のコードを使って実行してみます。

生成できたJSONは以下のとおりです。

```json
{
  "imports": {
    "@polymer/font-roboto/": "/node_modules/@polymer/font-roboto/",
    "@polymer/font-roboto": "/node_modules/@polymer/font-roboto/roboto.js",
    "@polymer/iron-demo-helpers/": "/node_modules/@polymer/iron-demo-helpers/",
    "@polymer/iron-flex-layout/": "/node_modules/@polymer/iron-flex-layout/",
    "@polymer/iron-icon/": "/node_modules/@polymer/iron-icon/",
    "@polymer/iron-icon": "/node_modules/@polymer/iron-icon/iron-icon.js",
    "@polymer/iron-icons/": "/node_modules/@polymer/iron-icons/",
    "@polymer/iron-icons": "/node_modules/@polymer/iron-icons/iron-icons.js",
    "@polymer/iron-iconset-svg/": "/node_modules/@polymer/iron-iconset-svg/",
    "@polymer/iron-iconset-svg": "/node_modules/@polymer/iron-iconset-svg/iron-iconset-svg.js",
    "@polymer/iron-location/": "/node_modules/@polymer/iron-location/",
    "@polymer/iron-meta/": "/node_modules/@polymer/iron-meta/",
    "@polymer/iron-meta": "/node_modules/@polymer/iron-meta/iron-meta.js",
    "@polymer/marked-element/": "/node_modules/@polymer/marked-element/",
    "@polymer/marked-element": "/node_modules/@polymer/marked-element/marked-element.js",
    "@polymer/polymer/": "/node_modules/@polymer/polymer/",
    "@polymer/polymer": "/node_modules/@polymer/polymer/polymer-element.js",
    "@polymer/prism-element/": "/node_modules/@polymer/prism-element/",
    "@webcomponents/shadycss/": "/node_modules/@webcomponents/shadycss/",
    "@webcomponents/shadycss": "/node_modules/@webcomponents/shadycss/shadycss.min.js",
    "clipboard/": "/node_modules/clipboard/",
    "clipboard": "/node_modules/clipboard/dist/clipboard.js",
    "delegate/": "/node_modules/delegate/",
    "delegate": "/node_modules/delegate/src/delegate.js",
    "good-listener/": "/node_modules/good-listener/",
    "good-listener": "/node_modules/good-listener/src/listen.js",
    "lit-element/": "/node_modules/lit-element/",
    "lit-element": "/node_modules/lit-element/lit-element.js",
    "lit-html/": "/node_modules/lit-html/",
    "lit-html": "/node_modules/lit-html/lit-html.js",
    "marked/": "/node_modules/marked/",
    "marked": "/node_modules/marked/lib/marked.js",
    "prismjs/": "/node_modules/prismjs/",
    "prismjs": "/node_modules/prismjs/prism.js",
    "select/": "/node_modules/select/",
    "select": "/node_modules/select/src/select.js",
    "tiny-emitter/": "/node_modules/tiny-emitter/",
    "tiny-emitter": "/node_modules/tiny-emitter/index.js"
  }
}
```

前回のJSONは以下のとおりでした。

```json
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
```

だいぶ違いますね！

このツールを作ることで、[import maps](https://github.com/WICG/import-maps) の仕様理解が深まりました。

- キー名に対応するパスが1つの場合、値は配列でなく文字列で良い
- パッケージが複数のモジュールを持っている場合、 キー名を `/` で終了すると他のファイルを参照できる。くわしくは ["Packages" via trailing slashes](https://github.com/WICG/import-maps#packages-via-trailing-slashes) を参照ください

これで、定義ファイルを自動生成できます。

### 実行してみる

前回と同じくPHPのビルトインサーバーを利用します。
ツールで生成できた JSON をHTMLに追加しておきましょう。

```
$ php -S localhost:8080 -t .
```

前回と同じように、無事デモが動作しました。

### JSONを外部ファイルにしてみる

いろいろとissueを見たりしているうちに、JSON記述は外部ファイルが使えるかも？と思ったので、import-mapsの定義をファイルに変更してみます。
ツールで出力されたJSONを `import-maps.json` というファイル名にして、以下のようにHTMLの記述を変更します。

```html
    <script type="importmap" src="import-maps.json"></script>
```

ページをリロードしてみると Dev Tool のコンソールに ***External import maps are not yet supported.*** と表示されました。
まだサポートされてなかった...

ということで、サポートを待ちましょう。

### さいごに

仕様は文面だけで読んでいると、わかっているつもりでも、実際のユースケースではわかっていないことも多いと実感しました。
ツールやデモプログラムを作って、実際に手に馴染ませることが重要ですね。

それと、polyfill の除外がWeb Components固定になっているので、今後の展望としては、ignoreするモジュールを定義ファイルで指定できるようにしたいなーと思っています。

今後も [import maps](https://github.com/WICG/import-maps) の最新状況を追いかけていきたいと思っています。
