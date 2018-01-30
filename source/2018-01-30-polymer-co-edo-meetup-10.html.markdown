---
title: Polymer.co-edo meetup ＃10 を開催しました
date: 2018-01-30 01:46 UTC
tags:
- Polymer
- Polymer.co-edo
---

今年最初の [Polymer.co-edo ミートアップ](https://polymercoedo.doorkeeper.jp/events/69689) を開催しました。

今回の議題は

> 今月のテーマは、どうやって Web Components を作りはじめたら良いか？です。
> 自分たちが作ってみたい Web Components はあるものの、どうやって作り始めて良いかわからないといった悩みを解消できる会になれば良いと思っています。

ということで、まずは最近のPolymer/Web Componentsを取り巻く動向から解説しました。

- Custom Elements が HTML5.3に入る見込み
- Polymer で Custom Elements を作るとき、どのスタイル（バージョン）で記述するか

## 最近のPolymer/Web Components を取り巻く状況


まずHTML5.3に入るかどうかについては [suikawiki - HTML 5.3](https://wiki.suikawiki.org/n/HTML%205.3$27802) からリンクされている2つのissueに注目してみることができます。

- [Custom Elements in DOM · Issue #14 · w3c/dom](https://github.com/w3c/dom/issues/14)
- [Incorporate Custom Elements in HTML directly? · Issue #955 · w3c/html](https://github.com/w3c/html/issues/955)

Web Components を支える技術（仕様）のうち HTML Import でなく Script Module になる Polymer 3.0 からは、3つ以上のブラウザーが実装を持っている状況になるので標準仕様の後押しになっていると考えられます。

Polymer での記述スタイルについては、先日Polymer公式ブログに掲載された [The future of elements / What we're doing with Polymer elements, what we aren't doing, and why.](https://www.polymer-project.org/blog/2017-11-27-future-of-elements) が参考になります。

現時点で Polymer が提供しているコアエレメントのソースコードを見てみてください。ほとんどは Polymer 1 の形式（ES6クラスを利用しない）です。これは Polymer 2 でも利用可能なハイブリッド形式と呼ばれるものです。一方 Polymer 3 用には `3.0 preview` のようなブランチが用意されていて、現時点 Polymer 3 preview 版はこちらを参照するようになっています。

例えば `paper-input` エレメントでは

- https://github.com/PolymerElements/paper-input はハイブリッド形式
- https://github.com/PolymerElements/paper-input/tree/3.0-preview は3.0形式

になっています。

上記ブログにも書かれているとおり、なぜ ES6 形式を提供しないのか？という問いに関しては

> Polymerのユーザーに、Polymer 1.0からPolymer 2.0と3.0へのスムーズなアップグレードパスを提供する必要がありました。

と書かれています。これは互換性や移行可用性について、フレームワーク開発者がとても配慮してくれていることがわかります。

> 2.0のエレメントは、Polymer 1.0と2.0をブリッジする最小限の変更となるように設計されており、ユーザーがアプリケーションを簡単に2.0へアップグレードできるようにしました。
> 同じ理由から、3.0のエレメントは、既存エレメントを自動変換したES6モジュールで提供されます。
> 引き続き 2.xと3.xのエレメントはサポートされ、次世代のエレメントを計画しています。

3系の自動変換については、次のセクションでも詳しく書かれています。

> エレメントのメンテナンスは、チームにとって重要な作業です。現行のエレメントはハイブリッド形式とし、Polymer modulizerを使用して3.x形式に自動変換することで、
> 単一のコードベースからPolymerの3つのバージョン(1.x, 2.x, 3.x)をサポートできます。これによりチームの時間を新しいエレメントの開発に割り当てることができます。

つまり私たちが Custom Elements を作るときも同様に、ハイブリッド形式で開発し、3.0へは modulizer を使って変換したコードを用意することでコードベースを1つに保つことができます。

## 私たちは何を作るのか？

Custom Elements の作成は旧来でいうと jQuery のプラグインや UI ウィジェットを作る作業に似ていると思います。
そこで今回参加したメンバーからは以下のようなアイデアが出ました

- 郵便番号から住所を検索する入力ボックス
  - これについては `gold-zip-input` というエレメントがありますが、 `An input element that only allows US zip codes` なのでそれの日本版になります
- 天気予報ウィジェット
  - これについても `paper-weather` というエレメントがありますが、マテリアルデザインでない `Yahoo天気予報` みたいな見た目の天気予報が日本っぽいという意見がありました
- DatePicker
  - あるあるなんですが、なぜかどのプロジェクトでも作ってしまうエレメントがこれですね
- フォーマット表示
  - 日付／金額など日本でよく使う表示形式に対応したエレメントがあったら良いよね、という意見がありました。これも既存のエレメントにもありますが、より日本の開発者が使い易いスタイルだと良いよねという意見がありました

また Custom Elements は、エレメント名にプレフィックスが必要となります。これについては

- `jp-`
- `coedo-`
- `edo-`

みたいなアイデアが出ているので、実際のエレメントを作る段階で決めたいなと思っています。

## How To

ちょっと時間がなくなってしまったので、簡単におさらいしました。

- GitHubにリポジトリを作る
- エレメントを作る
- webcomponents.org に登録する
  - 手順は [Publish element](https://www.webcomponents.org/publish) を参考にする

## 次回は

2/26(月) の予定です。[Doorkeeperのコミュニティページ](https://polymercoedo.doorkeeper.jp/)に今年の予定も書いてあるので参考にしてください。

今後は、実際に今回アイデア出ししたエレメントを作っていきたいと思います。
また Custom Elements を作るのに大事な

- 単体テスト
- デモページ

の作り方もワークショップ形式で進めていきたいと思うので、ぜひ参加ください。
新しいエレメントのアイデアも募集しています。

## さいごに

写真撮り忘れたので、次回からは最初に撮ろう...

あと、コミュニティとイベントの拡散用に [connpassのインベントページ](https://polymer-co-edo.connpass.com/event/77884/)も作ったのですが、これがconnpassのイベントカレンダーや検索結果に出ないので、解決方法知っている人がいたら教えてください...
