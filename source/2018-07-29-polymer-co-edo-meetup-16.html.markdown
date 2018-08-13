---
title: Polymer.co-edo meetup ＃16 を開催しました
date: 2018-07-29 02:31 UTC
tags:
- Polymer
- Polymer.co-edo
---

今年7回目となる [Polymer.co-edo ミートアップ](https://polymercoedo.doorkeeper.jp/events/77462) を開催しました。

今回の議題は

> PWA Starter Kit でも使われていた lit-element を使って、カスタムエレメントを作る体験

ということで、codelabsにある、Polymer1系のエレメント作成では定番の [Build your first Polymer element](https://codelabs.developers.google.com/codelabs/polymer-first-elements/index.html) です。
当日は、[上記チュートリアルの完成系のコード](https://github.com/googlecodelabs/polymer-first-elements/tree/master/icon-toggle-finished) を見ながら [lit-element](https://github.com/Polymer/lit-element) で作ってみました。

このブログでは、当日やったことの履歴として、今後やってみたい人のために、手順を書いておきます。

### Polymer CLI をインストールする

まず [lit-element](https://github.com/Polymer/lit-element) の README に書かれているように Polymer CLI をインストールします。
READMEではグローバルにインストールしていますが、今回はローカルに入れてみましょう。

`icon-toggle` というディレクトリを作ってから、CLIをインストールします。

```sh
$ mkdir icon-toggle
$ cd icon-toggle
$ npm i polymer-cli@next
```

念のため、インストールできたか確認してみます。
`help` コマンドが表示できていれば大丈夫です。

```sh
$ ./node_modules/.bin/polymer help



   /\˜˜/   /\˜˜/\
  /__\/   /__\/__\    Polymer-CLI
 /\  /   /\  /\  /\
/__\/   /__\/  \/__\  The multi-tool for Polymer projects
\  /\  /\  /   /\  /
 \/__\/__\/   /__\/   Usage: `polymer <command> [options ...]`
  \  /\  /   /\  /
   \/__\/   /__\/

```

### icon-toggle エレメントのスケルトンを作る

codelabs にあるコードは、すでにディレクトリ構造やファイルが準備されている状態から始まりますが、今回は CLI から作成します。

以下のコマンドを実行してみましょう。

```sh
$ ./node_modules/.bin/polymer init
```

何を作成するのか質問されるので、 `polymer-3-element` を選択します。

```
? Which starter template would you like to use? 
❯ polymer-3-element - A simple Polymer 3.0 element template 
```

エレメント名はそのまま `Enter` で進むと、 `.gitignoreがないよ` というエラーになってしまいます。

```
info: [init]    Running template polymer-3-element...
? Element name icon-toggle
? Brief description of the element 
error: [cli.main]   Uncaught exception: AssertionError [ERR_ASSERTION]: Trying to copy from a source that does not exist: xxx/icon-toggle/node_modules/polymer-cli/templates/element/polymer-3.x/.gitignore
e
```

これは、[Polymer3のエレメントテンプレートがミスっている](https://github.com/Polymer/polymer-cli/issues/999)ということで、ファイルを作ってからリトライします。

```sh
$ touch ./node_modules/polymer-cli/templates/element/polymer-3.x/.gitignore
$ ./node_modules/.bin/polymer init
```

質問には、上記と同じように回答してください。そうすると、以下のように表示されて完了します。

```
Setup Complete!
Check out your new project README for information about what to do next.
```

### 必要なパッケージをインストールする

まずインストールされている PolymerElement を削除します。

```sh
$ npm uninstall @polymer/polymer
```

つづいて、LitElement をインストールします。

```sh
$ npm i @polymer/lit-element
```

icon-toggle では `iron-icon` と `iron-icons` を利用する（codelabsでは最初からbower.jsonに入っている）ので、これらのCustomElementsもインストールします。

```sh
$ npm i @polymer/iron-icon
$ npm i @polymer/iron-icons
```

最後にもう一度 Polymer CLI をインストールしておきます。

```sh
$ npm i -D polymer-cli@next
```

### LitElement で書き換えてみる

ソースコードを GitHub に置きました。
[sizuhiko/lit-element-icon-toggle](https://github.com/sizuhiko/lit-element-icon-toggle)

Polymer CLIで作った Polymer3.0 element を LitElement に書き換える箇所は以下のとおりです。

- `import` を `LitElement` に変更
- 親クラスを `LitElement` に変更
- `static get template()` を `_render({必要な引数})` に変更

codelabs は Polymer1 で書かれているので、Polymer3 形式に変更するときに気をつける箇所は以下のとおりです。

- `listeners` は使わずに `addEventListener` でクリックイベントを受け取る

あと、デモのコードのアップした内容を見て確認してください。
LitElementとは関係ないですが、Polyfillのインポートが以下のように変わっています。

```html
<script src="../node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js"></script>
```

### LitElement と PolymerElement の違い

PolymerElementはHtmlElementに以下のような機能が追加されて構成されています。
[公式ドキュメントのAPI doc](https://www.polymer-project.org/3.0/docs/api/)の `polymer-element.js` を参照してください。

> Base class that provides the core API for Polymer's meta-programming features including template stamping, data-binding, attribute deserialization, and property change observation.

また、このドキュメントに書いてある様々な機能を利用できます（たとえば tap イベントを処理するための `gesture-event-listeners.js` とか）。

対して、LitElementではPolymerElementのつもりでいると、以下のようなポイントで躓きます。

- プロパティで `reflectToAttribute` が使えない
    - LitElement の issue [Adding reflectToAttribute to the demo doesn't work #10](https://github.com/Polymer/lit-element/issues/10) に解決するサンプルコードが書いてあります。lit-element-icon-toggleではそのまま利用しています。
- プロパティで2ウェイデータバインディングが使えない
    - LitElement の issue [2 way data binding not working #14](https://github.com/Polymer/lit-element/issues/14) や [Implement property change notification events (notify) #81](https://github.com/Polymer/lit-element/issues/81) が参考になります。
- プロパティで `observer` が使えない

ということで、codelabs のPolymer1版ではあった、データバインディングの箇所は実装されていません。
現時点は上記 issue を参考に、値に変更があったときにイベント `pressed-changed` イベントを投げるところまでは実装しています。
受け取り側の `demo/index.html` で以下のようなJavaScriptを書くと変更イベントを受け取れます。

```js
document.querySelector('icon-toggle[toggleicon="favorite"]'). addEventListener('pressed-changed', e => console.log(e));
```

プロパティの値が変化したときには、データバインディングでなく redux などを使おう、というのは PWA-Starter-Kit のコードからも伝わってくるので、まぁそうなのかなーと思います。
ただ、アプリでなく、エレメントを作って公開したい場合は、 redux なのか？という気もするので、change イベントなどを投げるのが良いのだろうな、とは思っています。

### 次回は

8/20(月) の予定です。[Doorkeeperのコミュニティページ](https://polymercoedo.doorkeeper.jp/)に今年の予定も書いてあるので参考にしてください。

そろそろ、edoエレメントの開発をしないとなー、なんて思っています...
