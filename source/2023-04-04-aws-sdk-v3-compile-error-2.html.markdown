---
title: aws-sdk v3 でコンパイルエラーになる - その２
date: 2023-04-04 07:20 UTC
tags: 
- TypeScript
- aws-sdk
- aws-sdk@v3
---

先日の [aws-sdk v3 で TS2345 が出てコンパイルエラーになる](/2023/04/03/aws-sdk-v3-ts2345.html) という記事でも書いたとおり、 `@aws-sdk/client-xxxxx` を追加するときは

> 新しく `@aws-sdk/client-xxxx` を追加するときは、既存のクライアントも含めてすべて同じバージョンに変更する

のがオススメなのは変わりがないのですが、これだけだとうまく対応できないことがあったので、別記事として書いておきます。

### ある日の変更前依存パッケージ

```javascript
  "devDependencies": {
    "@aws-sdk/client-dynamodb": "^3.264.0",
    "@aws-sdk/client-s3": "^3.264.0",
    "@aws-sdk/client-s3-control": "^3.264.0",
    "@aws-sdk/client-secrets-manager": "^3.264.0",
    "@aws-sdk/lib-dynamodb": "^3.264.0",
  }
```

DynamoDB, S3, Secret Manager を利用するようになっていました。

### パッケージを追加したらエラーになる

で、そこに `@aws-sdk/lib-storage` というパッケージを追加しようとしたところ、また先日と同様に `TS2345` でコンパイルエラーになります。
ちゃんとバージョンをすべて最新にしてみたのですが、ダメでした。

### ふたたび issue を探る

そうすると、issue ではなく discussions に変更されてしまったものを発見しました。

[Peer dependencies not pinned for lib-dynamodb](https://github.com/aws/aws-sdk-js-v3/discussions/4261)

### なぜこんなことになるのか

やはりパッケージ管理が崩壊しているとしか思えないのですが、何でこうなっているのかというのを解説していきます。

以下は、今回追加しようとした `@aws-sdk/lib-storage` の `package.json` の一部です。
追加時点の `lib-storage` のバージョンが `3.272.0` だったので、上記の変更前依存パッケージでインストール済みだったものも `3.272.0` に更新済みです。

```javascript
  "dependencies": {
    "@aws-sdk/middleware-endpoint": "3.272.0",
    "@aws-sdk/smithy-client": "3.272.0",
    "buffer": "5.6.0",
    "events": "3.3.0",
    "stream-browserify": "3.0.0",
    "tslib": "^2.3.1"
  },
  "peerDependencies": {
    "@aws-sdk/abort-controller": "^3.0.0",
    "@aws-sdk/client-s3": "^3.0.0"
  },
```

`peerDependencies` の依存がありますね。

で、すでにインストール済みだった `@aws-sdk/client-dymanodb` の `package.json` の一部も見てみましょう。

```javascript
  "dependencies": {
    "@aws-crypto/sha256-browser": "3.0.0",
    // 省略
    "@aws-sdk/smithy-client": "3.272.0",
    "@aws-sdk/types": "3.272.0",
    // 省略
    "uuid": "^8.3.2"
  },
```

依存が多いのでちょっと省略しましたが、注目したいところだけ書きました。
こちらには `peerDependencies` の依存はありません。

`@aws-sdk/client-s3` は上記のとおりインストール済みだったので、 `@aws-sdk/abort-controller` を見てみましょう。

```javascirpt
  "dependencies": {
    "@aws-sdk/types": "3.289.0",
    "tslib": "^2.3.1"
  },
```

おや？ `@aws-sdk/types` のバージョンが違うじゃん...

> "@aws-sdk/abort-controller": "^3.0.0",

なぜ、ここは `^3.0.0` なのだ？？
というのが、最初のディスカッションでもふれられている訳ですが、本当にパッケージ管理が (ry

### 対応案

使っている aws-sdk のパッケージで `peerDependencies` になっているのを調べて、すべてバージョン指定でインストールします。

ということで変更後の依存は以下のとおりにします。

```javascript
    "@aws-sdk/abort-controller": "3.272.0",
    "@aws-sdk/client-dynamodb": "3.272.0",
    "@aws-sdk/client-s3": "3.272.0",
    "@aws-sdk/client-s3-control": "3.272.0",
    "@aws-sdk/client-secrets-manager": "3.272.0",
    "@aws-sdk/lib-dynamodb": "3.272.0",
    "@aws-sdk/lib-storage": "3.272.0",
    "@aws-sdk/smithy-client": "3.272.0",
    "@aws-sdk/types": "3.272.0",
```

abort-controller, smithy-client, types が利用しているパッケージの中で `peerDependencies` にあったので、すべてバージョンを揃えてコンパイルエラーは解消されました。

### aws-sdk v3 を安心して使うためには

- 基本的にバージョンは最新版、もしくは最新に近い同じバージョンに揃える
- `peerDependencies` が指定されていたら、バージョンを揃えるために自分でインストールする

この2つとても大事です。

こんなの discussions に変更した上で放置していて良いのか？...

とても悲しい状況ですが、同様の問題に遭遇した人の解決に役立てれば幸いです。
