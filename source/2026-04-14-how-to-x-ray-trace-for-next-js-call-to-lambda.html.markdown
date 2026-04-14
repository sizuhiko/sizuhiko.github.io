---
title: AWS 環境の Next.js アプリから Lambda 呼び出しトレースを X-Rayで追跡できるようにする
date: 2026-04-14 07:19 UTC
tags: 
- AWS
- Next.js
- X-RAY
---

Next.js アプリを AWS にデプロイしたとき、SSR などでサーバーサイドで実行した処理から Lambda など別の AWS サービスを呼び出すことがあると思います。
アプリケーションのオブザーバビリティを確保するため、AWS 上のアプリケーションでは X-RAY を使ったログ集積をやることが多いと思います。

ここでは Lambda など別のAWSサービスを呼び出したとき、トレースを追跡できるようにする方法について記録していきます。

また本記事での Next.js のバージョンは v15 を想定しています。それ以前のバージョンでは `instrumentation` が  `experimental` になっていますのでご注意ください。

## Next.js で X-RAY に出力できるように設定する

`instrumentation.ts` で以下のようにします。

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await require('pino')
    await require('next-logger')
    await import('./instrumentation.node')
  }
}
```

ログが JSON で保持されていると X-RAY と相性が良いので、ロガーを pino にしておくと吉でお勧めです。

重要なのは `NEXT_RUNTIME` が `nodejs` の場合に `instrumentation.node` というファイルをダイナミックインポートすることです。
つまりサーバーサイドの処理のときの計測コードを使うようにします。

`instrumentation.node.ts` の内容は以下のようになります。

```typescript
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { AWSXRayIdGenerator } from '@opentelemetry/id-generator-aws-xray'
import { AwsInstrumentation } from '@opentelemetry/instrumentation-aws-sdk'
import { AWSXRayPropagator } from '@opentelemetry/propagator-aws-xray'
import { defaultResource, resourceFromAttributes } from '@opentelemetry/resources'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'

const sdk = new NodeSDK({
  idGenerator: new AWSXRayIdGenerator(),
  textMapPropagator: new AWSXRayPropagator(),
  resource: defaultResource().merge(resourceFromAttributes({ [ATTR_SERVICE_NAME]: 'your-app-service' })),
  instrumentations: [
    new AwsInstrumentation({ suppressInternalInstrumentation: true }),
  ],
  spanProcessors: [new BatchSpanProcessor(new OTLPTraceExporter())],
})

sdk.start()
```

OTEL 系のライブラリを使って計測の設定を行いますが、X-RAY を使うときは `@opentelemetry/id-generator-aws-xray` と `@opentelemetry/propagator-aws-xray` が重要になります。
あと、aws-sdk を使った呼び出しを計測できるようにラッパーである `@opentelemetry/instrumentation-aws-sdk` を入れておくと楽になります。

この例では Next.js を App Runner（新規申込が終了してしまいました。残念ですね）にデプロイしているのでリソース定義も `defaultResource().merge(resourceFromAttributes({ [ATTR_SERVICE_NAME]: 'your-app-service' }))` のようにしています。ここは Next.js をデプロイしたリソースによって書き方が変わります。

あとはいい感じに AWS のサービスを SDK で呼び出すと、Next.js（App Runner）から DynamoDB へのリクエストとか、S3 へのアクセスとか全部 X-RAY 上で線がつながって表示されるので、システムトレースの追跡がしやすくなります。

## なぜか Lambda だけ線がつながらない？

さて、DynamoDBとかS3などのマネージドサービスは線が接続されていて問題がなさそうに思うのですが、Lambdaの呼び出し（InvokeFunction）だけは、うまく線が接続されません。Lambdaから外部のAPIサーバーを実行していたり、Aurora DBを実行するトレースなどの情報が AppRunner とは結合されておらず、App Runner から Lambda の呼び出し、Lambda から HTTP(API) 呼び出しみたいな別の線が出来上がっていて、システムトレースの追跡ができません。

### 調べてみた

そうすると `X-Amzn-Trace-Id` がセグメントドキュメントの http.request に記録されておらず、Lambdaへ正しく伝播されてないことがわかりました。
`X-Amzn-Trace-Id` が X-RAY で線を結びつけるための値です。

## OpenTelemetry の仕様を調べてみる

公式ドキュメント [手動コンテキスト伝搬](https://opentelemetry.io/ja/docs/languages/js/propagation/#manual-context-propagation) などが参考になります。

```typescript
propagation.inject(context.active(), output);
```

上記のようにアクティブコンテキストに追加すれば良さそうです。
さらに AWS-SDK の Lambda クライアントでコマンドが送信されたときにフックするにはミドルウェアを使います。

公式ドキュメント [ミドルウェアを使用してリクエストをログに記録する](https://docs.aws.amazon.com/ja_jp/sdk-for-javascript/v3/developer-guide/logging-sdk-calls.html#middleware-logger)

上記サイトの例は DynamoDB クライアントですが、他のクライアントでも同様に実装できます。

### メモ

通常、AwsInstrumentation は多くの AWS サービスをカバーしていますが、Lambda の Invoke においては、ペイロードや呼び出し形式の都合上、自動でのコンテキスト注入が期待通りに動かないケースがあります。
これを解決するために、AWS SDK v3 の Middleware Stack を利用して、リクエストが送出される直前に OpenTelemetry のアクティブコンテキストからトレース情報を抽出し、HTTP ヘッダーに明示的にねじ込む処理を追加します。

## やってみた

### 手動伝搬するコードの追加

まず `x-ray.ts` を作ります。

```typescript
import { FinalizeHandlerArguments, HttpRequest, MiddlewareStack } from '@aws-sdk/types'
import { context, propagation } from '@opentelemetry/api'

interface HasMiddlewareStack {
  middlewareStack: MiddlewareStack<any, any>
}

const headerSetter = {
  set: (carrier: Record<string, unknown>, key: string, value: string) => {
    carrier[key] = value
  },
}

export const addXRayInjector = <T extends HasMiddlewareStack>(client: T): void => {
  client.middlewareStack.add(
    (next) => async (args) => {
      const finalizeArgs = args as FinalizeHandlerArguments<object>
      const request = finalizeArgs.request as HttpRequest

      if (request?.headers) {
        const activeContext = context.active()
        const carrier = request.headers as Record<string, string>
        propagation.inject(activeContext, carrier, headerSetter)
      }

      return next(args)
    },
    {
      step: 'serialize',
      name: 'xRayContextInjector',
      override: true,
    }
  )
}
```

このコードでは AWS-SDK のクライアントから X-RAY のコンテキストにリクエストヘッダーを手動伝搬しています。

トレースコンテキスト $C$ は、スパン ID $S$ とトレース ID $T$、およびフラグ $F$ の集合として定義されます。

<div>
$$
C = \{T, S, F\}
$$
</div>

この $C$ を X-Amzn-Trace-Id ヘッダーとして $C_{AppRunner} \rightarrow C_{Lambda}$ へ手動で注入（Inject）することが、今回のコードのキモです。

### Lambda クライアントのインスタンスに設定する

そして `LambdaClient` インスタンスを生成したら、 `addXRayInjector` で手動伝搬するためのミドルウェアを設定するようにします。

```typescript
  const client = new LambdaClient()
  addXRayInjector(client)
```

## 最後に

今回は Lambda クライアントについて手動伝搬できるような記事となっていますが、S3やDynamoDBのようにさらにその先がない場合は伝搬を気にしなくて良いのですが、Lambdaと同様に以下のサービスについても手動伝搬は必要になります。

- StepFunctions
- SQS

つまりリクエストが伝搬して、さらに別のサービスまでトレースを伝搬するようなサービスを利用するときは、リクエストを受け取ったサービス（今回の例でいうと Next.js）から、さきほどの `addXRayInjector` を設定して `X-Amzn-Trace-Id` を伝搬できるようにしましょう。

これで良きオブザーバビリティが実現できますように！
