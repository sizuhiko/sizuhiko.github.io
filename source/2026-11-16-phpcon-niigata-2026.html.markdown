---

title: PHPカンファレンス新潟 2026 で 「Wasm は PHP と JS の壁を壊せるか？ 」について登壇してきました
date: 2026-11-16 09:48 UTC
tags: 
- PHP
- phpcon
- niigata
---

初参加のPHPカンファレンス新潟。今年は応募したトークが採用されたので、スピーカーとして参加してきました。

[Wasm は PHP と JS の壁を壊せるか？ Extism プラグインシステムがもたらす越境開発](https://fortee.jp/phpconniigata-2026/proposal/f9e5d4f3-5184-49b8-8037-2b5b7281009c)

今年はフジロック、北海道航路（フェリー）に続き3度目の新潟県です。前2回は車だったので、新幹線での新潟は過去に遡っても初めてかも？

## 前日入り

新潟は上越新幹線で1本で、かなり早くに東京を出れば間に合わなくもないですが、当日何かあって午前中の登壇に影響あると困るので前日入りです。

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">着

#phpcon_niigata https://t.co/DencwrgFXj</p>&mdash; しずひこ (@sizuhiko) <a href="https://x.com/sizuhiko/status/2121171363595714952?ref_src=twsrc%5Etfw">November 13, 2026</a></blockquote>

15:00ぐらいまで仕事をしてから移動です。特に公式前夜祭とかはなかったので、前に訪れたときにも来た[須坂屋そば 新潟駅前店](https://suzakaya-ekimae.owst.jp/)へ。

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">The新潟

#phpcon_niigata https://t.co/Ez7JJjrZNY</p>&mdash; しずひこ (@sizuhiko) <a href="https://x.com/sizuhiko/status/2121219104770249063?ref_src=twsrc%5Etfw">November 13, 2026</a></blockquote>

さっそく新潟名物を堪能するところで、偶然にも翌日同時間帯発表枠の[@tadsan](https://x.com/tadsan)と隣の席になるという（僕の方が後からの訪問でした）驚きがありました。

だいぶ良くなってきたけど、風邪からの復帰中だったので一軒だけでホテルへ戻りました。

## 当日

体調もだいぶ良く当日を迎えられました。

会場の朱鷺メッセはすごい綺麗で大きいところでした。

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">会場がスゴイそ
#phpcon_niigata https://t.co/QTGkIjcVN4</p>&mdash; しずひこ (@sizuhiko) <a href="https://x.com/sizuhiko/status/2121390883937669480?ref_src=twsrc%5Etfw">November 13, 2026</a></blockquote>

A会場でオープニングを見て、そのあとは自分が登壇するB会場でセッションを見てました。B会場は小さい画面だったので事前にスライドとコードを共有

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">Track Bはスライド見づらそうなので、僕の WASM セッションに参加予定の方は手元でもごらんください

スライド: https://t.co/qPtxacf8hp
デモコード: https://t.co/Z0mfsYeiJs

 #phpcon_niigata</p>&mdash; しずひこ (@sizuhiko) <a href="https://x.com/sizuhiko/status/2121421177273127151?ref_src=twsrc%5Etfw">November 14, 2026</a></blockquote>

## 登壇内容について

午前中最後の20分枠でしたが、ちゃんとリハしたとおりの時間で（余裕をもって）終えることができました。

### 発表内容への想い

今年[フロントエンド・PHPカンファレンス北海道2026に参加しました](/2026/06/07/frontend-php-con-hokkaido-2026.html)でも書いたように "フロントエンド x PHP という" コラボでフロントエンドとバックエンドのロジック共通化みたいな話をいくつか聞いていたので、それが現時点でどのぐらいできるのか？という発表テーマは面白いのではないか？と思って応募しました。

「フロントのロジックを、そのままバックエンドでも動かせたらいいのに…」というところから、以前に面白いと思って少し触っていた Extism を使えばできるんじゃないか？というのと、現時点で Laravel を使った場合の越境方法と比べてどういうことができるのか？という比較も入れたらわかりやすそう、というところからのスライド内容になっています。

現時点では Extism を使うと PHP で FFI を有効にしないといけないという部分が本番運用ではネックになりそうですが、パフォーマンスとしてはまずまずなのではないかと思います。
もちろん、現実はそんなに越境して共通化したいということはないよ、ということがあるかもしれませんが、1つの選択肢を提案できたのではないかと思っています。

### デモプログラム

発表するデモプログラムを作るにあたり、考えたことや苦労したことは以下のようなこと

- 簡単に誰でも試せるように Docker で動かせるようにする
- フレームワークは Slim（Laravel にしなかった）
  - Laravel も検討したのですが、Slim + PDO にした。Eloquent やサービスコンテナが入ると、本題である「PHP から Wasm（Extism）をどう呼ぶか」がコードの中で埋もれそうだったため`bootstrap/app.php` と `src/` の3クラスだけで全体が読める薄さを優先しました
- extism-js が動かない: `GLIBC_2.39' not found`
  - JS PDK の `extism-js` v1.7.0 の Linux バイナリは glibc 2.39 以上を要求するので `node:24-bookworm-slim`（Debian 12 / glibc 2.36）ではビルド時に落ちてしまいます。`node:24-trixie-slim`（Debian 13 / glibc 2.41）を採用しましょう（新しい方が良い）
- Enhance SSR 公式 PHP パッケージには `EnhanceWASM` クラスがあるのですが、次の理由で使わず、Extism を直接呼ぶ約50行の `src/EnhanceRenderer.php` を自作しました。
  - wasm の読み込みパスが `__DIR__ . "/../vendor/enhance/ssr-wasm/enhance-ssr.wasm"` に固定されていて、依存パッケージとして入れるとパスが合わない
  - wasm を配置する処理が、そのパッケージ自身の `post-install-cmd` に書かれているため、依存パッケージとして入れた場合は実行されない
  - `extism/extism: dev-main` に依存しているため、`minimum-stability: dev` が必要

### ふれなかったこと

デモプログラムのコードに以下のようなコメントが入っています。

```typescript
// <task-form> タスクの追加・編集フォーム
//
// この関数はブラウザ（@enhance/element）と PHP（Enhance SSR Wasm）の両方で実行される。
// SSR 側では JS に変換したあと関数のソース文字列として渡されるため、import や外部の関数を参照せず自己完結させること。
// （import type はビルド時に消えるので使ってよい）
import type { TaskInput, TaskStatus, ValidationErrors } from '../shared/task-schema'
import type { ElementArgs, FormState } from '../shared/types'
```

> SSR 側では JS に変換したあと関数のソース文字列として渡されるため、import や外部の関数を参照せず自己完結させること。

これについては、厳密に言うと TypeScript を esbuild してバンドルするので、外部の関数を参照することは可能です。
最終的に JavaScript ファイルになったとき外部の関数を参照せず自己完結させることができていれば ok です。
バンドルした場合も手元では試していて問題なく動くことは確認していますが、これもデモプログラムをシンプルに見せるために公開コードには入れなかった点になります。

また、細かくソースコードについて解説すると時間がなくなるので、スライドの "PHP から JS/Wasm を動かす仕組み" という図での説明にとどめました。
Ask The Speaker に来てもらった方には詳しくコードを一緒に見ながら呼び出し方法などを説明しましたが、そこはデモプログラムを参照して欲しいところです。
シンプルな実装になるように心がけたので読みやすくはなっていると思います。

### 時間外で話したこと

Ask The Speaker や廊下、懇親会などで話したことについて少し

- フロントエンドとバックエンドでバリデーションロジックは別物なのでは？
  - 今回のケースは Laravel の FormRequest と Zod のバリデーションといった API のリクエストボディの JSON スキーマを検証する部分についてフォーカスしていて、400エラーを戻すようなダブルチェックをするサーバーサイドのユースケースです。もちろんバックエンドではDBの状態をチェックしたり論理的なチェックをすると思いますが、あくまでそれはリクエストボディが正しかった場合に実行される処理であって、リクエストボディの検証自体は共通的であると考えます
- 利用シーンあるかなぁ？
  - これは難しいですね。それぞれのプロジェクトの特徴もあると思うので、無理に探すというよりは、こういう課題がある場合に検討の候補になるかどうかというところなんでしょう
- 面白そうなんで調べてみます
  - ぜひデモプログラムを触ってコードを見てください！と伝えました
- SSRするのにNode.js起動するのはそういうものなのでは？
  - まぁ確かにそうかもしれないですけど、やっぱり管理対象のランタイムが減るのはメリットがあるのではないかと思います。昨今のCVE対策とかありますし...。もちろんプロジェクトそれぞれの都合があると思います

## 登壇後

各セッションに楽しく参加して、懇親会＆2次会も腹パンになるまで楽しめました。

体調フルの状態だったら3次会も行くところでしたが、そこまでで終了。

## 後日

[新潟ひとつなぎ2026](https://niigata-hitotsunagi.com/) というイベントをやることを事前に知っていたので、そちらへ見学に行きました。

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">イベントに来ました
#phpcon_niigata https://t.co/j8VfT8WTk3</p>&mdash; しずひこ (@sizuhiko) <a href="https://x.com/sizuhiko/status/2121785160505180633?ref_src=twsrc%5Etfw">November 15, 2026</a></blockquote>

このイベントを知ったきっかけは道マニアとしては有名なスポット "日本一国道が集まる交差点" に関するイベントがあるということでした。
国道スタンプ＆クイズラリー（全問正解！）、フォトスポット、国道缶バッジガチャを楽しみました。缶バッジは2回チャレンジで 7 号と 17 号を GET 。受付の人とラッキー7続きですね、という話で盛り上がりました。

そのあとイベント会場の日本酒ブースに行ったら、また野生のPHPerに遭遇しました。前日からヒキが強い。もうすでに飲み終わってラーメン屋巡りをするというので、少し会話をしたあとで交代するように飲み始めました。

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">昼呑み
#phpcon_niigata https://t.co/FrI1XXrk7o</p>&mdash; しずひこ (@sizuhiko) <a href="https://x.com/sizuhiko/status/2121788542435344446?ref_src=twsrc%5Etfw">November 15, 2026</a></blockquote>

そのあとはランチタイムになってお腹も空いてきたので、イベントエリアにある sano 食堂さんでカレー活をしてました。カレーすごく美味しかった。店主が気さくに話してくれて過ごしやすかったです。

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">カレー活
#phpcon_niigata https://t.co/yaEIJYCFGS</p>&mdash; しずひこ (@sizuhiko) <a href="https://x.com/sizuhiko/status/2121808679918002473?ref_src=twsrc%5Etfw">November 15, 2026</a></blockquote>

## 最後に

久々の登壇に加え、PHPの話をするのもすごくレアだったと思います。

Extism については PHP の PDK がない分、まだ未来に発展の余地はあると思いますが、今回の発表をきっかけに Wasm を使うと色々なことができそうだな？というのを感じてもらえれば僕の想いは伝わったのではないかなと思います。

PHP の Wasm 実装としては [php-wasm](https://github.com/seanmorris/php-wasm) というのがあり、それを参考にPDKを作れるのかもしれないので、いずれ試してみようかなぁ？とは思います。

カンファレンス全体と新潟での体験すべてに大満足で帰宅できました。すべての現地にいた人に感謝です。また来年あれば参加したいですね。東京からも近いので参加しやすかったです。

<script async src="https://platform.x.com/widgets.js" charset="utf-8"></script>
