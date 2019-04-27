---
title: Toilet EvolutionのフロントエンドをPolymer3対応する(1)
date: 2019-04-25 06:42 UTC
tags:
- Polymer
- WebComponents
- IoT
- ToiletEvolution
---

私が開発運用している[Toilet Evolution](https://toiletevolution.space/)は、フロントエンドをPolymer(v1)で構築していました。
これは古いWebComponentsの仕組みを使っているので、常々アップデートしないとなーと思いながらも、長いこと重い腰があがりませんでした。

しかし以下のツイートを見て「よしやるぞ」という気持ちにスイッチが入り、移行を実施しました。

<blockquote class="twitter-tweet" data-lang="en-gb"><p lang="en" dir="ltr">PSA: The latest Chrome Canary has removed support for web components v0, per the deprecation plan announced last year.<br><br>If you have a site built with Polymer 1.x (or web components v0), check it against Canary now to make sure you&#39;re properly serving the polyfills. <a href="https://t.co/IElNjGGZbI">https://t.co/IElNjGGZbI</a></p>&mdash; Polymer Project (@polymer) <a href="https://twitter.com/polymer/status/1102664720891301888?ref_src=twsrc%5Etfw">4 March 2019</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

実際[Toilet Evolution](https://toiletevolution.space/)のサイトはもう最新に置き換わっております。
その様子は[Toilet EvolutionのGitHubリポジトリ](https://github.com/toiletevolution/toiletevolution-server)のコミットログを追うことでもわかったりしますが、かなり頑張ったので、その過程を連載でブログにまとめようと思いました。

この記事はその1回目です。

### Polymer1プロジェクトをPolymer3へ移行するには

マイグレーションガイドは1から2、2から3に向けてあります。
1から3のガイドがあるわけではないので、両方を事前に読んでおくと良いです。

- [Polymer1から2へのアップグレードガイド](https://polymer-library.polymer-project.org/2.0/docs/upgrade)
  - `<dom-module>` で `name` を使っていたら `id` に変更。
  - `styles` タグは `template` タグの内側へ
  - `<content>` タグは `<slot>` タグへ
  - CSSの `::content` セレクタは `::slotted()` セレクタへ
  - CSSの `/deep/` や `::shadow` は使えなくなる
  - などなど...
- [Polymer2から3へのアップグレードガイド](https://polymer-library.polymer-project.org/3.0/docs/upgrade)
  - [modulizer](https://github.com/Polymer/tools/tree/master/packages/modulizer)使うと簡単にできるよ！

Polymer2は1の記法が使えるハイブリッドモードがあるのと、そもそも1から2で変更が必要な記述を使っていないので、実際はmodulizer一発でいけるんでは？と考えました。
なので、1から2の手順は気にせず、進むことにしました。

### 何はともあれアップデート

npmのライブラリもだいぶ古くなっていたので、まずは[最新に更新しました](https://github.com/toiletevolution/toiletevolution-server/commit/bfcea2e380d1744012dee064e949a8cced64fe3d)。
Gulpを3から4にあげたので `gulpfile.js` もモリモリと変えていきます。

続いて、bowerに入っているパッケージも新しくしていきます。これは [modulizerのガイド](https://github.com/Polymer/tools/tree/master/packages/modulizer#local-package-mode)に書いてあるので、そのまま実施します。

続いてmodulizerを実行しますが、commitログではそこまでの手順で迷走しています。あまり気にしないでくださいw

### modulizerで変換する

`modulizer --out .` を実行します。すると html で記述していたカスタムエレメントが js ファイルに変更されます。
[ここまでのコミット](https://github.com/toiletevolution/toiletevolution-server/commit/da5a4aba7f40463731b467e3be7d6c856b6a918c)

変換するとだいたい良い感じになっています。
でも変換だけでは動きません。ここで以下のような箇所が変換されないことがわかります。

- polymerの公式エレメントなど、変換されたbower_componentsを参照していて、npmに切り替わらない
- [変換後に手動で書き換えること](https://polymer-library.polymer-project.org/3.0/docs/upgrade#less-common-upgrade-tasks)に書いてある手順の実施

これらの手順は[次回](/2019/04/26/toilet-evolution-polymer3-vol2.html)へ続きます。
