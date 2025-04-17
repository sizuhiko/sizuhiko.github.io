---
title: Next.js standalone ビルドしたアプリを App Runner で動かして X-Ray で計測する
date: 2025-04-16 01:40 UTC
tags: 
- Next.js
- AppRunner
- X-Ray
- OpenTelemetry
- CDK
---

こちらの記事は [Next.js で作ったアプリケーションを AppRunner にデプロイする](/2025/04/11/next-js-deploy-to-apprunner.html) の続編となります。
前編を読まないとわからない内容ではないですが、もし良ければ事前に確認してください。

前の記事で Next.js を standalone ビルドしたアプリを App Runner にデプロイするところまで書きました。
さらに別の流れで[Next.js を standalone ビルドしたアプリで New Relic エージェントを動かす](/2025/04/15/next-js-standalone-build-with-iast-agent.html)という記事も公開しましたが、こちらはテスト環境での IAST 用でした。
本番の計測は X-Ray を使う（なぜ New Relic でない？とかは置いておいて）ので、 CDK / App Runner / Next.js standalone という構成でどうやって実現したのかを記録していきます。

### App Runner と X-Ray

AWS のサービスで X-Ray を使うとき、たとえば Lambda や StepFunctions で利用したいなと思ったときは簡単に利用できます。

たとえば StepFunctions では CDK を使って、以下のように `tracingEnabled` を `true` すると X-Ray トレーシングが有効になります。

```typescript
// Define a second state machine with the Task state above
new sfn.StateMachine(this, 'ParentStateMachine', {
  definition: task,
  tracingEnabled: true,
});
```

Lambda の場合は、以下のように `tracing` を `Active` にすると X-Ray トレーシングが有効になります。

```typescript
new lambda.Function(this, 'Function', {
  codeSigningConfig,
  runtime: lambda.Runtime.NODEJS_18_X,
  tracing: Tracing.ACTIVE,
  handler: 'index.handler',
  code: lambda.Code.fromAsset(path.join(__dirname, 'lambda-handler')),
});
```

簡単ですね。

で、App Runner ではどうするのかな？と思って調べていたら、[AWS App RunnerでAWS X-Rayを使った分散トレースをAWS CDKで構築してみる(App Runner + Aurora Serverless v2)](https://dev.classmethod.jp/articles/x-ray-with-cdk-with-app-runner/) という記事を見つけました。

なるほど、OpenTelemetry 必要なのか。単にフラグをONにするだけではできないんですね。

この時点で役に立ちそうな記事もいくつか読んでおきました。

- [Next.js の OpenTelemetry サポートを使う方法](https://blog.ojisan.io/next-otel/)
- [Next.jsのサーバーサイド処理をX-Rayでトレースしてみた](https://dev.classmethod.jp/articles/trace-nextjs-with-aws-xray/)

### 参考記事からやり方を検討する

参考記事を確認して、タスクを整理しました。

- CDK で OpenTelemetry 計測を有効にする（最初の参考記事）
- Next.js の OpenTelemetry サポートを有効にする（次の2つの参考記事）

#### CDK で OpenTelemetry 計測を有効にする

[AWS App RunnerでAWS X-Rayを使った分散トレースをAWS CDKで構築してみる(App Runner + Aurora Serverless v2)](https://dev.classmethod.jp/articles/x-ray-with-cdk-with-app-runner/) の `App Runnerサービスを作成` でやっているように、App Runner で OpenTelemetryを有効にするにはコンストラクタではなく、CloudFormation クラスを使って作っていますが、現時点は Service の props に `observabilityConfiguration` があるので、これにセットすると良さそうです。

```typescript
    const observabilityConfiguration = new ObservabilityConfiguration(this, 'ObservabilityConfiguration', {
      observabilityConfigurationName: 'webapp-observability',
      traceConfigurationVendor: TraceConfigurationVendor.AWSXRAY,
    })
    const service = new Service(this, 'WebAppService', {
      source: Source.fromEcr({
        imageConfiguration: { port: 3000 },
        repository: props.ecrRepository,
        tagOrDigest: props.webAppVersion,
      }),
      serviceName: 'webapp-service',
      autoDeploymentsEnabled: true,
      observabilityConfiguration,
      healthCheck: HealthCheck.http({
        healthyThreshold: 2,
        interval: Duration.seconds(10),
        path: '/favicon.ico',
        timeout: Duration.seconds(10),
        unhealthyThreshold: 10,
      }),
    })
```

元々の Service に `ObservabilityConfiguration` で生成した設定を `observabilityConfiguration` に渡すだけです。ここは簡単ですね。
ポイントとしては `traceConfigurationVendor` を `AWSXRAY` に設定するところぐらいかな。

#### Next.js の OpenTelemetry サポートを有効にする

こちらも参考記事を元に設定していきます。

まず依存ライブラリを追加します。今回はこのあたりを利用しています。

- @opentelemetry/api
- @opentelemetry/exporter-trace-otlp-grpc
- @opentelemetry/id-generator-aws-xray
- @opentelemetry/instrumentation-aws-sdk
- @opentelemetry/instrumentation-http
- @opentelemetry/instrumentation-undici
- @opentelemetry/propagator-aws-xray
- @opentelemetry/sdk-node
- @opentelemetry/sdk-trace-node
- @opentelemetry/semantic-conventions
- @opentelemetry/resources

[Next.js の公式ドキュメント Instrumentation 章](https://nextjs.org/docs/14/app/building-your-application/optimizing/instrumentation) を読むと

> To set up instrumentation, create instrumentation.ts|js file in the root directory of your project (or inside the src folder if using one).

ということなので `instrumentation.ts` をルートディレクトリか、`src` フォルダを使っている場合はその中に入れる必要がありそうなので、`src/instrumentation.ts` を設置しました。

続きのページに [Next.js の公式ドキュメント OpenTelemetry 章](https://nextjs.org/docs/14/pages/building-your-application/optimizing/open-telemetry) があったので、こちらも確認しました。

今回は Vercel を使うわけではないので、 `Manual OpenTelemetry configuration` の部分を参考にしていきます。

そうすると以下のようにランタイム判定してダイナミックローディングする必要がありそうなので、`instrumentation.ts` から `instrumentation.node.ts` を呼ぶように設定します。

```typescript
// `instrumentation.ts`
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation.node.ts')
  }
}
```

あとは `instrumentation.node.ts` で X-Ray に出力されるような設定をします。

```typescript
// instrumentation.node.ts
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { AWSXRayIdGenerator } from '@opentelemetry/id-generator-aws-xray'
import { AwsInstrumentation } from '@opentelemetry/instrumentation-aws-sdk'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici'
import { AWSXRayPropagator } from '@opentelemetry/propagator-aws-xray'
import { Resource } from '@opentelemetry/resources'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'

const sdk = new NodeSDK({
  idGenerator: new AWSXRayIdGenerator(),  // AWS X-RayフォーマットのIDを生成
  textMapPropagator: new AWSXRayPropagator(), // AWS X-Ray Trace ヘッダー伝播プロトコルを利用
  resource: Resource.default().merge(new Resource({ [ATTR_SERVICE_NAME]: 'webapp-service' })), // App Runner のサービス名を指定
  instrumentations: [ // 利用する拡張機能
    new HttpInstrumentation(), // HTTP API をトレース
    new AwsInstrumentation({ suppressInternalInstrumentation: true }), // aws-sdk をトレース
    new UndiciInstrumentation(), // Node fetch API をトレース
  ],
  spanProcessors: [new BatchSpanProcessor(new OTLPTraceExporter())],
})

sdk.start()
```

こんな感じです。

#### ビルドして確認してみたがコードが生成されない

ここで `next build` してコードが生成されるか確認してみました。

すると、`instrumentation.ts` が識別されてないのか？ビルド結果にコードが生成されません。

こういうときはソースコードを読むしかないですね。Next.js のビルドコードは [next.js/packages/next/src/build/index.ts](https://github.com/vercel/next.js/blob/v14.2.28/packages/next/src/build/index.ts) にあるようです。

で、それっぽいところを検索していると、これか？という部分

```typescript
// #L882-L886
      const instrumentationHookDetectionRegExp = new RegExp(
        `^${INSTRUMENTATION_HOOK_FILENAME}\\.(?:${config.pageExtensions.join(
          '|'
        )})$`
      )
```

おやおやおや？拡張子のマッチが `pageExtensions` なんですけど。少し前の公式ドキュメントに何て書いてありましたっけ？

> To set up instrumentation, create instrumentation.ts|js file in the root directory of your project (or inside the src folder if using one).

です。`ts` か `js` なんでしょ。なんで `pageExtensions` 使ってんのよ？？このファイルはページなのか？

おそらくほとんどの人は `ts` のままで動くんでしょうが、僕らはこのコンフィグパラメータに覚えがあります。

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['tsx', 'api.ts'],
}
```

`tsx` と `api.ts` だけにしてるんですわ。今回は PagesRouter 使ってるんですけど、 `/pages/api/` の下の API コードのテストコードを同じディレクトリに設定したいんですね。
ルートで src と test を分けたくない。めんどいじゃないですか、そういうの。なんで実装とテストコードは同じディレクトリに入れたいんです。で、テストコードは API ではないので、pageExtensions を設定してページやAPIは
`.tsx` か `.api.ts` としています。たとえばこうすると `user.api.ts` というのがあったとき、同じディレクトリに `user.test.ts` というのを入れることができ、これはテストコードなのでビルドに含まれず、API でもないコードという対応ができます。
あとは API ではないコードとかも入れることができます（それはやってないけど）。

なんで、 `instrumentation` のファイル名を `pageExtensions` にするとは、何やってくれてんねん！って感じなんですけど、いったん従うしかないので、 `instrumentation.api.ts` というファイル名にし....ませんでした。

いろいろ理由はあるんですけど、CI/CD でビルドする直前に `instrumentation.ts` を `instrumentation.api.ts`  にコピーする対応にしています。
たとえば、これは `pageExtensions` じゃおかしい！という issue を僕が出して `ts|js` になったときファイル名をリネームするのは嫌だなぁというとこで、CI/CDでコピーするところだけなら修正しても良いかなと。

で、手元では手動でファイルをコピーして `next build` したらファイルがビルドされていることが確認できました👏

### デプロイして動かしてみる

出ない......

全体的には良さそうなんですが、何でかねー

困ったときは初心に戻って AWS の公式ドキュメントを漁ります。
[X-Ray を使用した App Runner アプリケーションのトレース](https://docs.aws.amazon.com/ja_jp/apprunner/latest/dg/monitor-xray.html) というのが App Runner のドキュメントの中にありました。

> App Runner サービスで X-Ray トレースを使用するには、サービスのインスタンスに X-Ray サービスとやり取りするためのアクセス許可を付与する必要があります。

なるほどー、それはそうか。OpenTelemetry 指定で X-Ray のポリシー適用されるかな？と思ったけど、ObservabilityConfiguration の vendor 判断してまではやってくれないようです。

```typescript
    const observabilityConfiguration = new ObservabilityConfiguration(this, 'ObservabilityConfiguration', {
      observabilityConfigurationName: 'webapp-observability',
      traceConfigurationVendor: TraceConfigurationVendor.AWSXRAY,
    })
    const service = new Service(this, 'WebAppService', {
      source: Source.fromEcr({
        imageConfiguration: { port: 3000 },
        repository: props.ecrRepository,
        tagOrDigest: props.webAppVersion,
      }),
      serviceName: 'webapp-service',
      autoDeploymentsEnabled: true,
      observabilityConfiguration,
      healthCheck: HealthCheck.http({
        healthyThreshold: 2,
        interval: Duration.seconds(10),
        path: '/favicon.ico',
        timeout: Duration.seconds(10),
        unhealthyThreshold: 10,
      }),
      instanceRole: new Role(this, 'WebAppServiceXRayWrite', {
        assumedBy: new ServicePrincipal('tasks.apprunner.amazonaws.com'),
        managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess')],
      }),
    })
```

CDK で Service を作るときのプロパティに `instanceRole` を追加しました。

### まとめ

Next.js standalone ビルドしたアプリを App Runner で動かしていたところに、 X-Ray での計測を追加してみました。
他の AWS サービスと違って X-Ray を有効にするのがちょっと面倒だったり、 `pageExtensions` いじっているとビルド時に工夫が必要だったりとか、いくつかハマりポイントはありますが、わかってしまえば対策は難しくありませんでした。
実際はものすごい調べるの時間かかったりするところもあったので、同じような課題になった人の解決に役立てば幸いです。
