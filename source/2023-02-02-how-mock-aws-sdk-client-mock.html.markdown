---
title: aws-sdk-client-mock はどのように aws-sdk をモックしているのか？
date: 2023-02-02 08:05 UTC
tags: 
- AWS
- aws-sdk
- aws-sdk-client-mock
---

前回の記事[AWS Lambda の Node.js 14 を 18 に移行する（aws-sdk v3 移行編）](https://blog.open.tokyo.jp/2023/01/04/migrate-aws-sdk-node-js-v2-to-v3.html)で

> `aws-sdk-client-mock` 便利ですね。
> しかし、どうやって SFNClient をモックしているんだろうか？と思いませんか？
> sfn.start の実装側では、普通に aws-sdk から import した SFNClient を使って実装していて、 `mockClient` の結果で得られたモックを使っているわけでもありません。
> そのあたりは、次回の記事で明らかにしていきたいと思っていますので、ご期待ください。

書いたとおり、どうやってモックしているのか、紹介していきます。

## 前回のおさらい

aws-sdk v3 でのテストコードは以下のようになることを紹介しました。


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

モックするときは ` mockClient(SFNClient)` とクラスを渡しているだけでしたね。
生成した `SFNClientMock` はテストクラスでしか利用していません。

## aws-sdk-client-mock の実装を見てみる

[mockClientのコード](https://github.com/m-radzikowski/aws-sdk-client-mock/blob/main/packages/aws-sdk-client-mock/src/mockClient.ts)を見てみましょう。

```javascript
export const mockClient = <TInput extends object, TOutput extends MetadataBearer>(
    client: InstanceOrClassType<Client<TInput, TOutput, any>>,
): AwsClientStub<Client<TInput, TOutput, any>> => {
    const instance = isClientInstance(client) ? client : client.prototype;
```

ふむふむ `mockClient` の引数がインスタンスかどうか調べて、クラスだったら prototype が利用されるわけですか。
さらに見てみると

```javascript
const sendStub = stub(instance, 'send') as SinonStub<[Command<TInput, any, TOutput, any, any>], Promise<TOutput>>;
```

なるほど `send` メソッドをスタブしてますね。
あー、つまりクラスを指定すると、 prototype 定義が置き換わっちゃうわけですね。

## 使い分けが必要

prototype が置き換わることで `mockClient` に渡したクラスの `send` はすべてのシーンでスタブに置き換わります。
テストしたい実装側でクライアントのインスタンスをDIなどで注入していない場合は、この方法で良いですね。
逆にシーンによっては、実際に send を実行したい場合は困ってしまいます。

localstack などを使って部分的にインテグレーションテストをしたい場合は、なるべくインスタンスをDIできる仕組みにした方が良いでしょう。
インスタンスを生成するメソッドを作って、それをモックして `mockClient` の戻り値を返すようにしても良いですね。

とくにイングレーションテストとかなく、すべてのクライアント呼び出しをモックするのであれば、クラス指定が楽ですね。

このように使い分けることで、テストコードを書いていきたいですね。
簡単ではありますが、aws-sdk-client-mock はどのように aws-sdk をモックしているのか？ を紹介しました。
