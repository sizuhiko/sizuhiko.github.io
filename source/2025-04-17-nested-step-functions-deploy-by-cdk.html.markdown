---
title: ネスト構造の Step Functions を CDK でデプロイする
date: 2025-04-17 10:02 UTC
tags: 
- AWS
- StepFunctions
- CDK
---

この記事はネスト構造の Step Functions を CDK でデプロイしようとしたとき、うまくいかないことがあったので記録したものです。

なお Step Functions のワークフロー定義は、別途 JSON で用意されていて、CDK からは生成しない前提になっています。
ファイルは `definitions` の下に入っている想定です。

### CDK でネスト構造の Step Functions を 定義する

たとえば ParentStateMachine から ChildStateMachine を実行すると仮定しましょう。

```typescript
    const parent = new StateMachine(this, 'ParentStateMachine', {
      definitionBody: DefinitionBody.fromFile(
        path.join(__dirname, `/definitions/parent.json`),
        {}
      ),
    })
    const child = new StateMachine(this, 'ChildStateMachine', {
      definitionBody: DefinitionBody.fromFile(
        path.join(__dirname, `/definitions/child.json`),
        {}
      ),
    })
    // 子ステートマシーンの実行を親ステートマシーンに許可する
    child.grantStartExecution(parent)
```

みたいにすれば実行できるのかな？と思ってました。

### デプロイしてみたが実行できない

実際にデプロイしてみたところ動きませんでした。

AWS の公式ドキュメント[実行中の実行から新しい AWS Step Functions ステートマシンを起動する](https://docs.aws.amazon.com/ja_jp/step-functions/latest/dg/connect-stepfunctions.html)を確認しました。

`ネストされたステートマシンの IAM アクセス許可の設定` というところに書いてあります。

> 親ステートマシンは、ポーリングとイベントを使用して子ステートマシンが実行を完了したかどうかを判断します。ポーリングには states:DescribeExecution のアクセス許可が必要ですが、EventBridge 経由で Step Functions に送信されるイベントには events:PutTargets、events:PutRule、events:DescribeRule のアクセス許可が必要です。

というか `grantStartExecution` ってそれらの権限当たらないの？って思うじゃないですか。

[CDKのソースコード](https://github.com/aws/aws-cdk/blob/v2.190.0/packages/aws-cdk-lib/aws-stepfunctions/lib/state-machine.ts#L221-L227)を見てみました。

```typescript
  public grantStartExecution(identity: iam.IGrantable): iam.Grant {
    return iam.Grant.addToPrincipal({
      grantee: identity,
      actions: ['states:StartExecution'],
      resourceArns: [this.stateMachineArn],
    });
  }
  ```

`identity` が `StateMachine` だったら `actions` を追加して欲しいなぁ....（って思いますよね）。これだと grant って言ってる割にただ単に `actions` に関数名のを追加するだけでしょ？ってなるからなー（愚痴です）。

### L2コンストラクタを継承してメソッドを追加する

ということで、 `StateMachine` を継承したコンストラクタを作り、 `grantNestedExecute` という許可メソッドを追加してみました。

```typescript
  grantNestedExecute(parent: StateMachine) {
    this.grantStartExecution(parent)
    this.grantRead(parent)
  }
```

あとは先ほどの定義を修正するだけです。

```typescript
    const parent = new MyStateMachine(this, 'ParentStateMachine', {
      definitionBody: DefinitionBody.fromFile(
        path.join(__dirname, `/definitions/parent.json`),
        {}
      ),
    })
    const child = new MyStateMachine(this, 'ChildStateMachine', {
      definitionBody: DefinitionBody.fromFile(
        path.join(__dirname, `/definitions/child.json`),
        {}
      ),
    })
    // 子ステートマシーンの実行を親ステートマシーンに許可する
    child.grantNestedExecute(parent)
```

### HTTP メソッドを実行する場合

Step Functions で HTTP メソッドを実行するみたいなのも同様に [HTTP タスクを実行するための IAM アクセス許可](https://docs.aws.amazon.com/ja_jp/step-functions/latest/dg/call-https-apis.html#connect-http-task-permissions)を参照して許可設定を追加する必要があります。

先ほどの例と同じで `MyStateMachine` に `grantConnection` みたいなメソッドを追加しておきます。

```typescript
  grantConnection() {
    const stack = Stack.of(this)
    this.addToRolePolicy(
      new PolicyStatement({
        actions: ['states:InvokeHTTPEndpoint'],
        resources: [
          stack.formatArn({
            service: 'states',
            region: stack.region,
            account: stack.account,
            resource: 'stateMachine:*',
          }),
        ],
      })
    )
    this.addToRolePolicy(
      new PolicyStatement({
        actions: ['events:RetrieveConnectionCredentials'],
        resources: [
          stack.formatArn({
            service: 'events',
            region: stack.region,
            account: stack.account,
            resource: 'connection/*',
          }),
        ],
      })
    )
    this.addToRolePolicy(
      new PolicyStatement({
        actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
        resources: [
          stack.formatArn({
            service: 'secretsmanager',
            region: '*',
            account: '*',
            resource: 'secret:events!connection/*',
          }),
        ],
      })
    )
  }
```

### まとめ

Step Functions のワークフロー定義を、別途 JSON から取り込むと、必要な権限がいい感じにはなってくれないことがわかりました。
でも Workflow Studio みたいなビジュアルエディタでワークフロー書くのが便利なんで、それはそれで使いたいんですよね。

grant メソッドの CDK コードを確認して、公式ドキュメントと見比べながら適切な権限があたっているか確認しながら進めていくとハマることなく進められると思います。
