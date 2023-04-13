---
title: ts-jest が esbuild/swc をトランスフォーマーに使って高速化していた
date: 2023-04-13 05:54 UTC
tags: 
- TypeScript
- Jest
- JavaScript
- ts-jest
---

昨年 [@swc-node/jest を使ってテストを高速化する](/2022/05/03/swc-node-jest.html) という記事を書きました。
その時点で ts-jest でのテストが遅くて、 `@swc-node/jest` に切り替えていました。

その後 `@swc-node/jest` もなんやかんやあって、たまに動かなくなったりして issue 投稿して直してもらったりいろいろあったのですが、最近 ts-jest の状況を見てみたら、こんな記述がありました。

> Starting from v28.0.0, ts-jest will gradually opt in adoption of esbuild/swc more to improve the performance. To make the transition smoothly, we introduce legacy presets as a fallback when the new codes don't work yet.

from https://kulshekhar.github.io/ts-jest/docs/getting-started/presets

なんと、高速化のために esbuild/swc を使うようになったって。まじかー

### 早速 ts-jest に変えてみた

`@swc-node/jest` から `ts-jest` に変更して、 `jest.config.js` を `preset` に変更。
テストを実行してみると、確かに速くなってる！

手元のプロジェクトだと、 `ts-jest` にかかる時間は、 `@swc-node/jest` + `tsc` の時間とほぼ一致していました。
`ts-jest` ではコンパイルエラーも検知されるので、つまりそういうことでしょう。

### また ts-jest で大丈夫！

ということで、 jest の実行に swc や esbuild を使うことや、tsconfig と違う設定を考慮したりとかなく、TypeScript のコードを jest でテストできるようになりました。

私たちのプロジェクトは、早速すべて ts-jest@29 に切り替えました。
もし問題がある場合は、 Preset にレガシーモードを指定すると esbuild や swc を使わないようにできるようですが、そもそも一度 swc に切り替えてテストできていれば、問題なく ts-jest に戻れるはずです。

今後は TypeScript + jest での開発環境に ts-jest のご利用をお勧めします。
