---
title: "@swc-node/jest を使ってテストを高速化する（v1.5対応版）"
date: 2022-07-12 09:23 UTC
tags: 
- TypeScript
- Jest
- JavaScript
- swc
- swc-node
---

少し前のブログで [@swc-node/jest を使ってテストを高速化する](/2022/05/03/swc-node-jest.html) という記事を書いたのですが、最後のまとめで以下のように紹介していました。

> ちなみに 1.5系からは tsconfig を読み込むように変更されているのですが、現時点私たちのプロジェクトではビルドが失敗するので、まだ 1.4 系を利用しています。 問題はすでに issue TypeScript path mapping is not working. になっており、 パスエイリアスを使っているときに、うまくファイルが import できないところなのですが、これが解決されれば transformer の設定も不要になるので、 とても便利になるはずです。

そこから他の issue を調べたりしているうちに解決策がわかったので、今回の記事で追記していきます。

`@swc-node/jest` の最新版（現時点では `1.5.2` ）を使います。

## パスエイリアスの指定方法

1.5系からは tsconfig を読み込むので、 `jest.config.js` の `transform` は以下のように記述すれば良いことになっています。

```javascript
/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.ts$': ['@swc-node/jest']
  },
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '@/(.*)$': '<rootDir>/$1',
  },
};

module.exports = config;
```

パスエイリアスは `moduleNameMapper` に記述されているとおり、テストコードからは `@/domain/entities/user-entity` みたいに `@` をルートにしてパスエイリアスを使えるようにしています。

で、このままだとパスエイリアスがすべて解決されません、というのが前回までの内容でした。

今回は調べるなかで、以下のように指定することでパスエイリアスがうまく利用できるようになったので、紹介します。

```javascript
/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.ts$': [
      '@swc-node/jest',
      // ここから
      {
        paths: {
          '@/*': [`${__dirname}/*`],
        }
      }
      // ここまで
    ]
  },
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '@/(.*)$': '<rootDir>/$1',
  },
};

module.exports = config;
```

`transform` で `paths` の指定をするとパスエイリアスが使えるようになります。
tsconfig にも `paths` の指定が以下のようになっています

```javascript
  "paths": {
    "@/*": ["./*"]
  },
```

で、tsconfig に記述しているとおりコードが書き変わると、そのまま相対パスになってしまい、 インポートパスが見つからないということになっていました。
TypeScript は tsconfig でパスエイリアスを指定するとき `./*` のように書くとプロジェクトルートからの解釈をしてくれるのですが、 `swc` ではそのように解釈はしてくれません。
そのため `jest.config.js` の `transform` で絶対パスに上書きするように記述します。 `jest.config.js` はJavaScriptコードなので、 `__dirname` を使って絶対パスに変更することができるようになります。

これで安心して `@swc-node/jest` も最新版に追従できるようになりました。
もし同じような問題になっている人の手助けになる記事になっていれば幸いです。
