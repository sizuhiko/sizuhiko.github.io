---
title: Node.js v18 / aws-sdk v3 の Lambda アプリが突然動かなくなる
date: 2023-04-05 08:08 UTC
tags: 
- TypeScript
- aws-sdk
- aws-sdk@v3
---

「Lambda アプリが突然動かなくなる」なんて、どうせバグなんでしょーというのが当然のリアクションですが、これは本当にバグなのか...

本当にあった怖い話をします。

### ある日、Lambda アプリが突然動かなくなる

Node.js v18 のライタイムで動く Lambda にデプロイされているアプリで、ある日突然エラーが出るようになりました。

> original: TypeError: Cannot read properties of undefined (reading ‘RUNNING’)

この部分ですが TypeScript のコードでは以下のようになっていました。

```javascript
import {
  DescribeExecutionCommand,
  ExecutionDoesNotExist,
  ExecutionStatus,
  SFNClient,
  StartExecutionCommand,
  paginateListExecutions,
} from '@aws-sdk/client-sfn';

// 省略

if (latest?.status === ExecutionStatus.RUNNING) {
```

`ExecutionStatus` は StepFunctions のクライアントで export されている値です。
StepFuntions のジョブが実行中かどうか判定している箇所で。少し前まで普通に動いていたのに....

### Lambda アプリの構成

AWS Lambda は aws-sdk がランタイムにグローバルインストールされているので、最新版に追従して問題なければパッケージに含める必要はありません。
Lambda にデプロイするアプリケーションのサイズを少しでも減らすために、 aws-sdk は入れないようにしています。

### node コンソールで確認してみる

手元では devDependencies に `@aws-sdk/client-sfn` が入っているので、 node コンソールに入って require を実行してみました。

```
> const { ExecutionStatus} = require('@aws-sdk/client-sfn')
undefined
> ExecutionStatus
{
  ABORTED: 'ABORTED',
  FAILED: 'FAILED',
  RUNNING: 'RUNNING',
  SUCCEEDED: 'SUCCEEDED',
  TIMED_OUT: 'TIMED_OUT'
}
```

ふむ、問題なさそうだが？

最新版の aws-sdk で変わったのだろうか？
一時的に最新版にバージョンアップをしてみて、確認してみます

```
> const { ExecutionStatus} = require('@aws-sdk/client-sfn')
undefined
> ExecutionStatus
undefined
```

えええええええーーー

### aws-sdk の該当箇所の修正履歴をチェックする

[hore(codegen): export enums as const](https://github.com/aws/aws-sdk-js-v3/pull/4587)

#### 元のコード

```javascript
/**
 * @public
 */
export enum ExecutionStatus {
  ABORTED = "ABORTED",
  FAILED = "FAILED",
  RUNNING = "RUNNING",
  SUCCEEDED = "SUCCEEDED",
  TIMED_OUT = "TIMED_OUT",
}
```

#### 変更後のコード

```javascript
/**
 * @public
 * @enum
 */
export const ExecutionStatus = {
  ABORTED: "ABORTED",
  FAILED: "FAILED",
  RUNNING: "RUNNING",
  SUCCEEDED: "SUCCEEDED",
  TIMED_OUT: "TIMED_OUT",
} as const;
```

おいおい、これって `@public` なのに後方互換性なくなっとるだろ....

### なぜ undefined になるのか

enum はコンパイルされて JavaScript になると以下のようなコードになります。

```javascript
var ExecutionStatus;
(function (ExecutionStatus) {
    ExecutionStatus["ABORTED"] = "ABORTED";
    ExecutionStatus["FAILED"] = "FAILED";
    ExecutionStatus["RUNNING"] = "RUNNING";
    ExecutionStatus["SUCCEEDED"] = "SUCCEEDED";
    ExecutionStatus["TIMED_OUT"] = "TIMED_OUT";
})(ExecutionStatus = exports.ExecutionStatus || (exports.ExecutionStatus = {}));
```

でも `export const as const` になると、JavaScript にはコンパイルされることなく、変数の利用箇所に埋め込みの形になります。

最初にも書きましたが、 aws-sdk v2 では普通だった

> AWS Lambda は aws-sdk がランタイムにグローバルインストールされているので、最新版に追従して問題なければパッケージに含める必要はありません。
> Lambda にデプロイするアプリケーションのサイズを少しでも減らすために、 aws-sdk は入れないようにしています。

こういう運用はすでにオワコンなんでしょうか？
いやでも、v3 になってもランタイムに aws-sdk は入っています。

少なくとも `ExecutionStatus` が内部変数で export されてない private な値だったら良いのですが、これはさすがにマズイんじゃないですかね？awsさん。

### この問題が発生するケース

- AWS Lambda でランタイムの aws-sdk を使っていて、TypeScript から enum の値を参照していた場合（同一の変更ですべての enum が const に書き変わっています）

amplify とか Lambda でなくコンパイルされているケースでは問題は起きませんが、いやこういうのサクッと変更しちゃダメだと思うんですが...
しかもランタイム側に入っているので、動作している Lambda アプリケーションが突然動作しなくなります。

### aws-sdk v3 を安心して使うためには（追記）

- 基本的にバージョンは最新版、もしくは最新に近い同じバージョンに揃える
- `peerDependencies` が指定されていたら、バージョンを揃えるために自分でインストールする
- 関数/クラス以外、たとえば enum の値などは基本的に利用しない

大事なこと3つ目を追加しました。

aws-sdk@v3 のパッケージ管理に日々不安が募りますが、同様の問題に遭遇した人の解決に役立てれば幸いです。
