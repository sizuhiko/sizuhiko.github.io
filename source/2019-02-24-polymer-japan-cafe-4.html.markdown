---
title: Polymer Japan Cafe ＃4 もくもく会が開催されました
date: 2019-02-24 02:32 UTC
tags:
- Polymer
- Web Components
- Polymer.co-edo
---

今月のPolymer/Web Components のもくもく会は、Polymer Japan との共催になったので、Co-Edoではなく渋谷にて開催となりました。

Lit Elementが2.0リリースになったので、
[はじめての LitElement エレメントの作り方](https://polymer-japan.github.io/litelement-first-element/index.ja.html)のバージョンを最新に更新しました。

Lit Elementではスタイル定義を以下のように、記述することが推奨されています。

```js
class MyElement extends LitElement {
  static get styles() {
    return css`
    :host {
        display: block;
    }`;
  }
}
```

これは[Constructable Stylesheets](https://wicg.github.io/construct-stylesheets/)として2019/1/24にGoogleから提出されたアイデアで、
エレメントのスタイルを `static getter` で返すことで、ページ内に同一エレメントが複数回あるとき１回だけスタイルを評価するようになるというものです。
高速化には役立ちそうですが、現時点サポートしているブラウザあるのか？（Chromeはもうサポートしてるかも）という状況です。

なので前述のCodeLabとか、私の好きな[LitLoader](https://github.com/PolymerX/lit-loader)とかは、まだ[Constructable Stylesheets](https://wicg.github.io/construct-stylesheets/)の記法には対応していません
（もちろん従来の書き方でも動きます）。
でも注目していきたい仕様の1つではあるので、今後組み込むこともあるかもな、とは思っています。

詳しくは[LitElementの公式ドキュメントのStyles](https://lit-element.polymer-project.org/guide/styles)を参照ください。
