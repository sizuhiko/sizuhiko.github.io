---
title: tsyringe を TypeScript 5 で使う方法
date: 2023-05-02 06:00 UTC
tags: 
- tsyringe
- TypeScript
---

[tsyringe](https://github.com/microsoft/tsyringe) は、Microsoft のオーガナイゼーションにある、JavaScript/TypeScript用のDIコンテナです。

Microsoft は TypeScript の親だし、DIコンテナあるんだったら使うよなーというぐらいの理由で使っていましたが、ここ数年はアップデートのリリースがありません。
この記事を書いている時点での最新版は、2020/11/9 に出た [v4.4.0](https://github.com/microsoft/tsyringe/releases/tag/v4.4.0) です。

### TypeScript 5 でコンパイルエラーになる

tsyringe を TypeScript 5 で利用しようとすると、コンパイルエラーになります。
で、さすがに利用者が多いライブラリだけあって、すぐ issue [TypeScript 5.0 Support of tighter parameter decorator checking](https://github.com/microsoft/tsyringe/issues/221) が出ました。
しばらくしたら PR [fix: allow propertyKey to be undefined](https://github.com/microsoft/tsyringe/pull/226) も出ました。PRが 2023/3/26 に出て、マージされたのは 2023/4/17 です。

それから2週間ぐらい経過しましたが、リリースされる気配はありません....

### でも TypeScript 5 を使いたいんや

まぁそう思いますよね。
僕らのプロジェクトでもそう思ったんで、パッチを作りました。

プロジェクトルート(package.json とか置いているディレクトリ)に `tsyringe.d.ts` を置いて、型定義をオーバーライドする感じです。
例えば以下のような感じです。

```javascript
import tsyringe = require('tsyringe/dist/typings/index');

declare namespace t {
  function inject(
    token: tsyringe.InjectionToken<any>
  ): (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => any;
  const injectable: typeof tsyringe.injectable;
  const container: typeof tsyringe.container;
  type DependencyContainer = typeof tsyringe.container;
}

export = t;
```

まずコンパイルエラーになるのは `inject` 関数なので、それをオーバーライドします。
次に、プロジェクトで import している関数や型があれば、それぞれ `const` や `type` で宣言して require した内容からそのまま export するようにしました。

これはマージされている PR が型定義ぐらいしか修正しておらず、実装に関しては何も修正されていなかったので、問題なしと判断して型定義だけをオーバーライドしたパッチを作ることにしました。

### で、どうなの？

現時点動作に問題はなく、普通に TypeScript 5 で tsyringe が使えています。
PRがマージされて、すぐリリースされるんじゃないか？と思ったので、この内容を記事にする必要もないかな？と思っていたのですが、
リリースされる気配を感じないので、僕らのやっている方法が少しでも役に立てばと思い、記事にしました。
はやく TypeScript 5 対応が正式リリースされて欲しいですね。
