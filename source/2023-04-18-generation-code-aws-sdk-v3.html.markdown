---
title: AWS SDK v3 のモジュールと利用方法
date: 2023-04-18 03:21 UTC
tags: 
- aws-sdk
- aws-sdk@v3
- TypeScript
---

このところ何度か aws-sdk v3 について記事を書いてきましたが、こちらは現時点でのベストプラクティスというか、追記を含むまとめ記事になります。

### ランタイムに含まれないモジュールがある？

aws-sdk を使って Lambda から Lambda を実行するときのコードは、公式のExampleコードを見ると以下のようになっています。

[https://github.com/awsdocs/aws-doc-sdk-examples/blob/main/javascriptv3/example_code/lambda/actions/invoke.js](https://github.com/awsdocs/aws-doc-sdk-examples/blob/main/javascriptv3/example_code/lambda/actions/invoke.js)

```javascript
/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { InvokeCommand, LambdaClient, LogType } from "@aws-sdk/client-lambda";
import { createClientForDefaultRegion } from "../../libs/utils/util-aws-sdk.js";

/** snippet-start:[javascript.v3.lambda.actions.Invoke] */
const invoke = async (funcName, payload) => {
  const client = createClientForDefaultRegion(LambdaClient);
  const command = new InvokeCommand({
    FunctionName: funcName,
    Payload: JSON.stringify(payload),
    LogType: LogType.Tail,
  });

  const { Payload, LogResult } = await client.send(command);
  const result = Buffer.from(Payload).toString();
  const logs = Buffer.from(LogResult, "base64").toString();
  return { logs, result };
};
/** snippet-end:[javascript.v3.lambda.actions.Invoke] */

export { invoke };
```

ここで注目して欲しいのは

>     Payload: JSON.stringify(payload),

の部分なのですが、これは TypeScript で記述すると型違反でエラーになります。

```javascript
    /**
     * <p>The JSON that you want to provide to your Lambda function as input.</p>
     *          <p>You can enter the JSON directly. For example, <code>--payload '\{ "key": "value" \}'</code>. You can also
     *       specify a file path. For example, <code>--payload file://payload.json</code>.</p>
     */
    Payload?: Uint8Array;
```

公式 Example のコードの意味とは... というところですが、

で、そういう issue やら SlackOverflow があって

[https://github.com/aws/aws-sdk-js-v3/issues/4623](https://github.com/aws/aws-sdk-js-v3/issues/4623)

```javascript
import { InvocationType, InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { toUint8Array } from "@aws-sdk/util-utf8";

const lambda = new LambdaClient({});
const response = await lambda.send(
    new InvokeCommand({
      FunctionName: process.env.LAMBDA_ARN as string,
      InvocationType: InvocationType.RequestResponse,
      Payload: toUint8Array(payload),
    }),
  );
```

こんな感じで `Uint8Array` に変換する必要があります。
そこで `@aws-sdk/util-utf8` を使ったのですが、これが Node.js v18 の Lambda インスタンスだと見つからないとエラーになります。

### 執筆時点での Lambda インスタンスの sdk バージョンは 3.188.0

以下のページから現在のランタイムに入っている sdk バージョンがわかります。

[https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/lambda-runtimes.html](https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/lambda-runtimes.html)

執筆時点では 3.188.0 なので、 GitHub リポジトリでそのタグのコードを見てみると、確かにそんなパッケージはありません。
それどころか、 `@aws-sdk/util-utf8-node` と `@aws-sdk/util-utf8-browser` という2つのパッケージに分かれていました。
どうも、3.300.0 あたりでパッケージを統合したようです。

NPMのレジストリをみると、

[https://www.npmjs.com/package/@aws-sdk/util-utf8-node](https://www.npmjs.com/package/@aws-sdk/util-utf8-node)

> Deprecated package
>
> This internal package is deprecated in favor of @aws-sdk/util-utf8.

のように書いてあります。

ちなみに、最新の GitHub リポジトリからは、 `util-utf8-node` が完全に削除されています。

### 状況を整理し、これから発生することを整理

つまり、 3.188.0 で `@aws-sdk/util-utf8-node` を使っていて、Lambda の zip に sdk を含めていない人は、ランタイムのアップデートで突然 Lambda が動かなくなる可能性があるということです。

これはセマンティックバージョニングとしては破壊的変更なのでメジャーバージョンアップ相当ですが、そもそも aws-sdk がセマンティックバージョニングされているかどうかはわかりません（たぶんされていない）。

僕は長い間、公式ドキュメント「.zip ファイルアーカイブで Node.js Lambda 関数をデプロイする」に書いてある

> 関数が標準ライブラリまたは AWS SDK ライブラリにのみ依存する場合は、これらのライブラリを .zip ファイルに含める必要はありません

[https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/nodejs-package.html](https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/nodejs-package.html)

というポリシーを信じていました。
著名な Serverless Framework でもデフォルトの挙動では zip ファイルを作成するときに aws-sdk を除外するようになってます。

### 道を間違える前に AWS さんに確認してみた

僕の懸念は

- aws-sdk は zip に含めるべきか？
- 後方互換性がなくなる変更があるけど、アップデートの方針はどうなっているか？

というあたりです。

#### aws-sdk は zip に含めるべきか？

こちらは「はい」が正解ということです。
[AWS Lambda 関数を使用するためのベストプラクティス](https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/best-practices.html) に `関数のデプロイパッケージ内で依存関係を制御します` という部分があり、zip に含めた方が良いとなっています。

しかし aws-sdk のサイズはモジュール化されているとはいえ、Lambdaの上限サイズを考えるとかなりの割合を占めてしまうので、できればランタイムを使いたいとことです。

#### 後方互換性がなくなる変更があるけど、アップデートの方針はどうなっているか？

こちらの回答をふりかえる前に、aws-sdk v3 のモジュール構造について補足しておきます。
GitHub のリポジトリにある README [Generated Code](https://github.com/aws/aws-sdk-js-v3#generated-code)] によると以下のとおりです。ざっくり要約しました。

> v3 コードベースは、AWSサービスが公開しているモデルから生成されています。
> smithy-typescript で `/clients` サブディレクトリ内のコードを生成し、これらのパッケージは @aws-sdk/client-XXXX のような名前になります。
>
> クライアントは、 `/packages` にあるユーティリティコードに依存します。これらのコードは手動で記述されていて、通常あまり役に立ちません。
>
> `/lib` には高レベルのライブラリがあります。 client をラップして操作しやすくするライブラリです。よくある例は `@aws-sdk/lib-dynamodb` で Amazon DynamoDB のアイテムの操作を簡素化するものや、 `@aws-sdk/lib-storage` で S3 の multipartUpload での並列アップロードを簡素化するものです。

続けて、以下のようにも書いてあります。

1. /packages 手動でコード更新が行われる場所で、 NPM に @aws-sdk/XXXX で公開されています。特別なプレフィックスはありません。
2. /clients  このディレクトリのコードは自動生成され、 /packages に依存します。AWS のサービスと 1 対 1 です。通常、手動編集はここでは行わないでください。@aws-sdk/client-XXXX で NPM に公開されます。
3. /lib このディレクトリは、 /clients に依存します。既存の AWS サービスと操作をラップして、Javascript での作業を容易にします。@aws-sdk/lib-XXXX で NPM に公開されています。

上記以外にも private というのもあったりしますが、これは名前からも明らかに非公開のモジュールだとわかります。
NPM 公開されていて、僕らが利用することができるものが client / packages / lib にあるといった感じでしょうか。

上記3つのディレクトリについての AWS アップデートポリシーは以下のようなものになるそうです。

- client ユーザーが利用する想定のモジュールであり、破壊的変更は行われない
- lib ユーザーが利用する想定のモジュールであり、破壊的変更は行われない
- package client からの利用を想定している内部モジュールなので破壊的変更の可能性がある（ただしドキュメントに明示されていない）

package に入っているもので、README に利用方法が解説されているもの、たとえば S3 の署名付きURLを発行するためのライブラリ [@aws-sdk/s3-request-presigner](https://github.com/aws/aws-sdk-js-v3/tree/main/packages/s3-request-presigner) はユーザーからの利用が想定されていて、破壊的変更は行われないようです。
しかし、README にAPIの解説がないものについては内部利用を想定しているため、破壊的変更もありえると。

後者は private ディレクトリに入れた方が良いのでは？と思わなくはないですが、何か理由があるんでしょうかね。

今回のようにドキュメントに記述がない `@aws-sdk/util-utf8-node` を使いたい場合は zip に必ず含むようにしましょう。
それ以外は zip の容量が厳しければ v2 のときと同じようにランタイムに依存する方が良いと思います。aws-sdk の更新頻度がかなり多いので、どれがセキュリティパッチかわからないし、できればランタイムでの更新に期待したいという思いもあります。

### さいごに

これまでの aws-sdk v3 / Node.js v18 への移行記事を一覧にしてみます。

- [AWS Lambda の Node.js 14 を 18 に移行する（CI/CD環境移行編）](/2022/12/30/migrate-aws-lambda-node-js-14-to-18.html)
- [AWS Lambda の Node.js 14 を 18 に移行する（aws-sdk v3 移行編）](/2023/01/04/migrate-aws-sdk-node-js-v2-to-v3.html)
- [aws-sdk v3 で TS2345 が出てコンパイルエラーになる](/2023/04/03/aws-sdk-v3-ts2345.html)
- [aws-sdk v3 でコンパイルエラーになる - その２](/2023/04/04/aws-sdk-v3-compile-error-2.html)
- [Node.js v18 / aws-sdk v3 の Lambda アプリが突然動かなくなる](/2023/04/05/aws-sdk-v3-changed-enum-to-const.html)
- [aws-sdk v3 を使うライブラリを作ったときは、なるべく peerDependencies に設定しよう](/2023/04/11/aws-sdk-v3-to-peer-for-your-library.html)
- 本記事

#### 私の思う現時点でのベストプラクティス

- CIのイメージは公式の Lambda Docker イメージが便利
- aws-sdk v3 のユニットテストには aws-sdk-client-mock が良い
- aws-sdk の各モジュールのバージョンは揃えて、なるべく最新を使おう
- aws-sdk 関数/クラス以外、たとえば enum の値などは基本的に利用しない
- peerDependencies に書いてあるモジュールもバージョンを揃えてインストールしよう
- packages にあるドキュメントなしのモジュールを使う場合は、zip に含める
  - zip の容量に余裕があれば aws-sdk はすべて含めた方が良い

現時点はかなりクセがあるというか、ノウハウが必要であるというのが現実だと思います。
とくに AWS Lambda + aws-sdk v3 + TypeScript の場合にはですね。

ぶっちゃけ TypeScript でなければコンパイルエラーや型違反についての問題もないし、しいていえば zip に含めるかどうか？ぐらいです。
とはいえ、みんなもう Node.js ランタイム選ぶなら TypeScript 使うだろうと思うので、これまでの記事のノウハウが役に立てば幸いです。
