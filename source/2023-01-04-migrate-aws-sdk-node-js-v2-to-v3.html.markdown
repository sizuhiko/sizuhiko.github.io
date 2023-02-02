---
title: AWS Lambda の Node.js 14 を 18 に移行する（aws-sdk v3 移行編）
date: 2023-01-04 02:00 UTC
tags: 
- AWS
- Lambda
- Node.js
---

先日も紹介したクラメソさんの [[アップデート] AWS Lambdaが Node.js 18をサポートしました](https://dev.classmethod.jp/articles/aws-lambda-support-node-js-18/) 記事でもふれられていましたが、Node.js が 18 になるのに伴い、イメージ内の aws-sdk が v3 になりました。
Node.js 16 までは v2 系だったのですが、ここでは多くの変更が発生しています。

- npm install する対象が `aws-sdk` から `@aws-sdk/client-xxx` のように AWS のサービスごとのクライアントライブラリになった
- 書き方が、各クライアントを `new` して `send` でコマンドを送信する記述に統一された

大きくはこの2点でしょうか。
私たちは aws-sdk の利用に関してリポジトリパターンの中に閉じ込めているので、基本的にそこだけ対応すれば良いのですが、API で同期実行だったものが非同期実行に変更となっているので、そこだけはインターフェースを Promise に変更する必要があります。
これは実際のコマンド内部は同期で問題ないけど、 `Client.send(command)` が基本的に Promise を返却するようになったための副作用だと思ってください。
（ aws-sdk v2 のときは `command().promise()` のようにすると、非同期コマンドは Promise を返却するようになっていたのですが、この `promise()` 部分がなくなり、基本的な戻りは Promise になっています）

## 具体的なコードで見る v2 と v3 の違い

StepFuntions を実行するコードで違いをみてみましょう。

### v2 のコード

```javascript
import { StepFunctions } from 'aws-sdk';

const stepFunctions = new StepFunctions();
const results = await stepFunctions.startExecution({
  stateMachineArn: arn,
  input: JSON.stringify(event),
}).promise();
```

### v3 のコード

```javascript
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { build, parse } from '@aws-sdk/util-arn-parse';

const { region } = parse(arn);
const stepFunctions = new SFNClient({ region });
const results = await stepFunctions.send(new StartExecutionCommand({
  stateMachineArn: arn,
  input: JSON.stringify(event),  
}));
```

StepFunctions では、利用するライブラリ名が `aws-sdk/client-sfn` になりました。
ほとんどの場合は、サービス名を使っています（たとえば S3 なら aws-sdk/client-s3 だし、 S3Client です）が、StepFunctions の場合は `sfn` に省略されているので注意が必要です。（僕はこの略名に気付くまでメチャクチャ探したことを告白しておきます）

クライアントライブラリを探すときは [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/) の公式ドキュメントを参照すると良いのですが、ぱっとみてサービス名からクライアントライブラリが見つけられない場合は、それっぽい略名から探してみると良いでしょう。

v2 と v3 を比較するとわかりますが、大きな変更でないことはわかると思います。

## v3 移行するときに役立つドキュメント

次に v3 移行するときに役立つドキュメントを紹介していきます。

- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/) 
- [AWS SDK for JavaScript (v3) モジュールでのエラー処理](https://aws.amazon.com/jp/blogs/news/service-error-handling-modular-aws-sdk-js/)
- [Upgrading Notes (2.x to 3.x)](https://github.com/aws/aws-sdk-js-v3/blob/main/UPGRADING.md)

1つ目は公式のSDKドキュメントですね。クライアントライブラリを探すときも、コマンド名を確認するときにも良く参照します。

2つ目はエラーハンドリングのやり方の違いについてです。詳しくはドキュメントを読めばわかるのですが、従来はエラーの判定方法が 
`(<AWSError>e).code === 'ExecutionDoesNotExist'` みたいにしていたのを `e instanceof ExecutionDoesNotExist` のように例外クラスのインスタンスとして判定できるようになっています。これも v3 に移行するときに注意したいポイントです。

3つ目はSDKのv3へのアップグレードガイドで、主に破壊的変更があった部分について解説されています。単純に XxxxClient と XxxxCommand に変更したときに型エラーが出たときは、このドキュメントを読んで破壊的変更（変数名の変更や、JSON構造の変更など）がないか確認すると解決への近道になります。

ただし、先ほどの例で書いた StepFunctions のコンストラクタのように

```javascript
const stepFunctions = new SFNClient({ region });
```

リージョンが v3 から必須パラメータになったのですが、こういった変更は動かしてみるまでわからないことが多いので、ユニットテストを書いておくことは重要です。

## ユニットテスト

私たちは以下のサービスについては、モックせずにローカルで代替ライブラリを使って結合テストを行なっています。

- S3 : [S3rver](https://www.npmjs.com/package/s3rver)
- SQS: [ElasticMQ](https://github.com/softwaremill/elasticmq)
- RDS: [better-sqlite3](https://www.npmjs.com/package/better-sqlite3)

### v2 でのユニットテスト

上記以外について、v2 のときは以下のようにモックしていました。ここでは Jest での書き方を紹介します。
sfn の start というメソッドで StepFunctions を呼び出していると想定してください。

```javascript
const startExecutionMock = jest.fn(); // startExecution の引数チェック用
const startExecution = jest.fn(); // startExecution の戻り値モック用
jest.mock('aws-sdk', () => {
  return {
    StepFunctions: jest.fn().mockImplementation(() => {
      return {
        startExecution: startExecutionMock.mockImplementation(() => {
          return { promise: startExecution };
        }),
      };
    });
  };
});

beforeEach(() => {
  startExecutionMock.mockReset();
  startExecution.mockReset();
});

startExecution.mockResolvedValue({ executionArn });
const resuls = await sfn.start(sfnArn, event);

expect(results.executionArn).toBe(executionArn);
expect(startExecutionMock.mock.calls).toEqual([
  [{ stateMachineArn: arn, input: JSON.stringify(event) }]
]);
```

v2 でのモックは面倒でしたね。

### v3 でのユニットテスト

v3 で aws-sdk をモックするときは [AWS SDK v3 Client mock](https://github.com/m-radzikowski/aws-sdk-client-mock) を利用します。

> Library recommended by the AWS SDK for JavaScript team - see the introductory post on the AWS blog.

ということで公式にもオススメされるライブラリということで良いですね。

上記の v3 でのテストコードは以下のようになります。

```javascript
import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';

const SFNClientMock = mockClient(SFNClient);
beforeEach(() => SFNClientMock.reset());

SFNClientMock.on(StartExecutionCommand).resolves({ executionArn });
const resuls = await sfn.start(sfnArn, event);

expect(results.executionArn).toBe(executionArn);
expect(SFNClientMock).toHaveReceivedNthCommanddWith(1, StartExecutionCommand, {
  stateMachineArn: arn, input: JSON.stringify(event)
});
```

モックライブラリを使うと、v2 のときより可読性も良くわかりやすくなっています。

## さいごに

ここまで aws-sdk を v2 から v3 にする方法をまとめてみました。
`aws-sdk-client-mock` 便利ですね。
しかし、どうやって SFNClient をモックしているんだろうか？と思いませんか？
sfn.start の実装側では、普通に aws-sdk から import した SFNClient を使って実装していて、 `mockClient` の結果で得られたモックを使っているわけでもありません。
そのあたりは、次回の記事で明らかにしていきたいと思っていますので、ご期待ください。
