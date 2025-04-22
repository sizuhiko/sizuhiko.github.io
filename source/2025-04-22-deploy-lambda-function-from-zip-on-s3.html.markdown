---
title: S3 に設置した zip ファイルから Lambda 関数をデプロイする
date: 2025-04-22 05:49 UTC
tags: 
- AWS
- Lambda
- CDK
---

CDK で Lambda をデプロイするとき、S3 にある zip ファイルからのデプロイや、ソースコードからのデプロイなどいくつかのやり方があると思います。

今回は S3 の zip からデプロイする方法についてです。App Runner は ECR にコンテナイメージをデプロイして、それを自動連携しているので、Lambda もアプリイメージのデプロイと実際のアプリデプロイを分離しようと思ったわけです。
S3 の zip からデプロイする CDK のコードは以下のような感じになります。

```typescript
    return new Function(this, 'SampleFunction', {
      functionName: 'sample',
      code: Code.fromBucket(
        Bucket.fromBucketName(this, 'Resource', `lambda-packages`),
        'sample.zip'
      ),
      handler: 'index.handler',
      architecture: Architecture.ARM_64,
      runtime: Runtime.NODEJS_20_X,
    })
```

`Bucket.fromBucketName` でアプリ側でデプロイ済みの S3 バケットを指定して、その中に入っている `sample.zip` からデプロイします。

で、このとき `sample.zip` の中身が変化していたとき、CDK では差分があるとしてデプロイされるのかな？と思っていました。

### S3 の zip が異なるものでもデプロイはされない

でも、実際はそんなことなく zip が変更されたあとで cdk diff しても差分にはなってくれませんでした。
ちょうどそれらしい話題の issue 
[Lambda Function Code.FromBucket() does not update "Code Entry Type" in AWS console](https://github.com/aws/aws-cdk/issues/6176)
がありました。

簡単に解説すると「CloudFormation は、変更されたテンプレートを元のテンプレートと比較し、変更セットを生成します。」ということで props に指定している箇所自体に変更がなければ変更とみなされないということですね。
具体的にいうと zip のプロパティまでは参照されないということです。

解決策として提案されているのは

- Code.fromAsset() を使う。つまりソースコードからのデプロイ
- objectVersionプロパティを指定。バージョン番号は別途管理する必要がある。

という感じでした。

### S3 の変更イベントをトリガーにデプロイする

ということで、CDK がどうとかではなく、普通に思いつく解決策は S3 への PutObject を起点にデプロイをすることです。

[S3へのレプリケーションをトリガーにLambdaのコード更新・新規バージョン発行を実行する](https://qiita.com/yuta-katayama-23/items/7355e2280265fffa7c1b)
とか、これ関係の記事はたくさんあるので、参考になります。

具体的な Lambda コードは、こんな感じになります。

```typescript
import { LambdaClient, UpdateFunctionCodeCommand, UpdateFunctionCodeCommandInput } from '@aws-sdk/client-lambda'
import { S3Handler } from 'aws-lambda'

const client = new LambdaClient({ region: 'ap-northeast-1' })

export const handler: S3Handler = async (event) => {
  const bucket = event.Records[0].s3.bucket.name
  const object = event.Records[0].s3.object.key

  const functionNameMap =  {
    'sample.zip': 'sample',
    'sample-1.zip': 'sample1',
  }
  const FunctionName = functionNameMap[object]
  if (FunctionName === undefined) return

  const input: UpdateFunctionCodeCommandInput = { FunctionName, S3Bucket: bucket, S3Key: object }
  const updateCommand = new UpdateFunctionCodeCommand(input)
  await client.send(updateCommand)
}
```

で、それを CDK でデプロイします。

```typescript
    const func =  new NodejsFunction(this, 'LambdaUpdaterFunction', {
      functionName: 'lambda-function-updater',
      entry: path.join(__dirname, 'src', 'index.ts'),
      handler: 'handler',
      architecture: Architecture.X86_64,
      runtime: Runtime.NODEJS_20_X,
    })
    func.addToRolePolicy(
      new PolicyStatement({
        actions: ['lambda:UpdateFunctionCode'],
        resources: [
            // 更新対象の Lambda の ARN を列挙する
        ],
      })
    )
    const packageBucket = Bucket.fromBucketName(this, 'Resource', `lambda-packages`)
    packageBucket.grantRead(func)
    packageBucket.addEventNotification(
      EventType.OBJECT_CREATED_PUT,
      new LambdaDestination(func)
    )
```

こちらはソースコードからデプロイするので NodejsFunction とかを使って簡易に実現します。
Lambda に zip ファイルからデプロイする対象の Function ARN を列挙して更新の許可を与えます。

zip ファイルが置かれているバケットの読み込み許可を更新 Lambda につけて、バケットにファイルが追加/変更されたときのイベントで Lambda を実行するように関連づけます。

この記事は参考になりました。

- [CDKを使って既存S3バケットのPUTイベントをトリガーにLambda関数を実行しようとしたらハマった話](https://dev.classmethod.jp/articles/cdk-s3notification-kick-lambda/)

### おまけ: NodejsFunction では ARM アーキテクチャを使えない

最初、`lambda-function-updater` をデプロイするとき、アーキテクチャに ARM を指定していたのですが、うまく動きませんでした。

なんでか調べたところ、こちらの issue
[Wrong SAM container image architecture when trying to build NodeJS lambda](https://github.com/aws/aws-cdk/issues/27370)
がありました。

使えなくないけど、公式にサポートしてないやり方になるよ、ってことで、まぁこの Lambda ぐらいだったら良いか... ってことで X86 アーキテクチャにしました。
もし ARM にしたいならビルドは自分でやっておいて zip からやった方が良いですね（話がループする）。

### おまけ2: Lambda 関数をモノレポにしているとき sam build は使えない

S3 に zip ファイルをアップロードする前に TypeScript で書かれた Lambda を zip にするとき sam cli を使ってビルドしようとしたのですが、うまくいきませんでした。
調べてみると以下の issue を見つけました。

- [Feature request: NPM workspace support](https://github.com/aws/aws-sam-cli/issues/5236)
- [Feature request: Skip NodejsNpmEsbuildBuilder:NpmUpdate step when using --build-in-source in a js/ts "monorepo"](https://github.com/aws/aws-sam-cli/issues/6567)

モノレポでビルドするのは茨の道のようです。
自分で esbuild を呼び出してビルドした方が簡単ですね。Lambda のコードを esbuild でビルドする方法はいろいろありますので、困らないでしょう。
僕らは package.json に定義しておきました。

```
        "build": "esbuild index.ts --bundle --minify --sourcemap --platform=node --target=es2020 --outfile=dist/index.js"
```
