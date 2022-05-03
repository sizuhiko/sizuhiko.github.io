---
title: "@swc-node/jest を使ってテストを高速化する"
date: 2022-05-03 02:07 UTC
tags: 
- TypeScript
- Jest
- JavaScript
- swc
- swc-node
---

TypeScriptを使ってサーバーサイドのAPIサーバーなどを作っていて、テスティングフレームワークとして [Jest](https://jestjs.io/ja/) を使っているとき
まずは [ts-jest](https://kulshekhar.github.io/ts-jest/) を使いはじめると思います。

ts-jestはTypeScriptのコードをJestでテストするのに大変便利で、とても使いやすいのですが、コード量が多くなってきたときCI/CDにおける
テスト時間が問題になってきます。

## Jest + TypeScript のテストを高速化するノウハウ

このあたりはすでに多くのブログ記事が出ているように、ググるとたくさんの情報が出てきます。

- [JestでTypeScriptを高速化する](https://miyauchi.dev/ja/posts/speeding-up-jest/)
- [Jest高速化の魔法のレシピ](https://akfm.dev/blog/2020-09-25/jest.html)
- [Jest＋TypeScriptを高速に実行したい（ts-jest、esbuild、SWCを比べる）](https://kazuhira-r.hatenablog.com/entry/2022/01/10/203844)

などなど...

これらで書かれているもので、共通してくるワードが

- [esbuild-jest](https://github.com/aelbore/esbuild-jest)
- [@swc/jest](https://github.com/swc-project/jest)

です。
どちらも esbuild(Goで書かれている) や swc(Rustで書かれている) といった高速のトランスパイラを使って実行するので、
Jestのテストが速くなります。

## TypeScript も様々

では実際に esbuild や swc を簡単に導入できるかということです。
TypeScript で、特にサーバーサイドの実装の場合、いろいろな機能を使っている場合があります。
たとえば DI であったり、 ORM であったり。
私が関わっているプロジェクトでも DI フレームワークとして [tsyringe](https://github.com/microsoft/tsyringe) を、 ORM で [typeorm](https://typeorm.io/) を使っています。
これらのライブラリは TypeScript の DI や ORM としては一番に思いつく有名どことで特にマニアックなライブラリではないと思います。

で、これらのライブラリを使う上では、 tsconfig に以下の設定を入れる必要があります。

```javascript
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

さて、そこで問題になるのが esbuild です。
esbuild ではデコレータのサポートがないので、まず候補から外しました
（もちろん [esbuild-decorators](https://github.com/anatine/esbuildnx/tree/main/packages/esbuild-decorators) 
という拡張があるのも知ってはいますが、公式ではないうえ、これ自体がTypeScriptで書かれているので実行速度的に結局美味しくないというのがあります）。

そうすると、 swc を使うことになるのです。 swc はデコレータにも対応しており、理想的です。

## @swc/jest の使い勝手

`@swc/jest` を使って速くなったという記事のソースコードは単純なサンプルであることが多く、実際に単純に導入するだけではうまくいきません。
もちろんうまく動作するプロジェクトもそれなりにはあるでしょうが。

swc では　tsconfig を解釈してくれるわけではないので、 [.swcrc](https://swc.rs/docs/configuration/swcrc) でコンフィグを書く必要があります。
これが微妙に tsconfig と違うので、ビルドでは swc を使わず webback と serverless framework で AWS Lambda にデプロイするような
APIサーバーでは設定を合わせるのが面倒です。

## @swc-node/jest という解決策

そこで調べていくと、 [@swc-node](https://github.com/swc-project/swc-node) という swc をより node.js 環境に特化したラッパーがあることを知りましt。

で、 `@swc-node` には [@swc-node/jest](https://github.com/swc-project/swc-node/tree/master/packages/jest) というパッケージがあり、
これは `@swc/jest` と対になっている関係ですね。

`@swc-node` も tsconfig を解釈してくれるわけではないのですが、オプションの項目は tsconfig を一致しているので特に迷いなく設定できます。

ちなみに 1.5系からは tsconfig を読み込むように変更されているのですが、現時点私たちのプロジェクトではビルドが失敗するので、まだ 1.4 系を利用しています。
問題はすでに issue [TypeScript path mapping is not working.](https://github.com/swc-project/swc-node/issues/626) になっており、
パスエイリアスを使っているときに、うまくファイルが import できないところなのですが、これが解決されれば transformer の設定も不要になるので、
とても便利になるはずです。

ところで、この `@swc-node` ですが、当初(私たちが採用を決めたとき)は [@Brooooooklyn](https://github.com/Brooooooklyn) さんの個人リポジトリにあったと思うのですが、現在は `@swc-project` 配下に移動しています。
プロジェクトの一部になったというのは、一つ安心材料ですね。

`@swc-node` も TypeScript で書かれていて、 `esbuild-decorators` と同じじゃないのか？という話はあるかもしれませんが、 `@swc-node` に関していうと、これは tsconfig の設定値を swcrc にマッピングするラッパーという感じなので、動作時は swc 相当となります（実際に測定値もGitHubに出ている）。

もし、サーバーサイドのTypeScriptプロジェクトで同様の課題を持っている人がいたら、 `@swc-node` の利用を試してもらえると良いかなと思っています。
私たちはCIの時間を劇的に改善することができました。
