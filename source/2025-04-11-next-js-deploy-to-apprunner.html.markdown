---

title: Next.js で作ったアプリケーションを AppRunner にデプロイする
date: 2025-04-11 08:59 UTC
tags: 
- Next.hs
- AppRunner
- CDK
---

こちらの記事は [AppRunner へのデプロイは cdk でサクッとできるのか？](/2025/04/08/apprunner-deploy-from-cdk-is-easy-really.html) の続編となります。
前編を読まないとわからない内容ではないですが、もし良ければ事前に確認してください。

まず前編でも触れてますが、アプリケーションのリポジトリ構成は以下のようになっています。

- Next.js のアプリケーションリポジトリ
- AWSのリソースを管理するインフラリポジトリ

アプリのリポジトリでは、ECR へのデプロイまでやってます。
インフラのリポジトリで、AppRunner など AWS リソースを CDK で構築しています。

## AppRunner で Next.js アプリケーションを動かすには

Next.js を standalone モードでビルドして、Docker コンテナで起動する。これだけで ok です。

### ECR に Next.js の standalone モードビルドしたコンテナイメージを push する

まずは Next.js のアプケーションリポジトリの CI/CD で ECR に Docker イメージを push します。
アプリケーションリポジトリ側にも CDK を入れてあるので、以下のようなコードで ECR にデプロイしています。
タグは `package.json` の `version` から入手します。

```typescript
import * as imagedeploy from 'cdk-docker-image-deployment'
import * as ecr from 'aws-cdk-lib/aws-ecr'

export class DeployStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const projectRoot = path.join(__dirname, '../..')
    const { version } = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json')).toString())
    const repository = ecr.Repository.fromRepositoryName(this, 'webapp-ect', 'webapp')
    new imagedeploy.DockerImageDeployment(this, 'DockerImageDeployment', {
      source: imagedeploy.Source.directory(projectRoot),
      destination: imagedeploy.Destination.ecr(repository, {
        tag: version,
      }),
    })
```

Dockerfile は Next.js の公式サンプル[With Docker](https://github.com/vercel/next.js/tree/canary/examples/with-docker) を参考に（というかほぼそのまま流用）すれば大丈夫です。
ベースイメージの Node.js バージョンが古かったりするので、そこは自分たちが使うバージョンに変更しておきましょう。

### AppRunner で ECR からデプロイする

こちらは前編でも触れた `@aws-cdk/aws-apprunner-alpha` が使えるので簡単にデプロイできます。
以下のような感じで書けば良いでしょう。ヘルスチェックを何でやるかは、いろいろだと思いますが、ここではいったん `favicon` にしています。
CDK で作成した ECR のリポジトリと、デプロイ対象のアプリケーションバージョンはコンストラクタの引数で渡せるようにしています。

```typescript
import { Service, Source } from '@aws-cdk/aws-apprunner-alpha'

export class WebAppConstruct extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: WebAppConstructProps) {
    super(scope, id, props)

    const service = new Service(this, 'WebAppService', {
      source: Source.fromEcr({
        imageConfiguration: { port: 3000 },
        repository: props.ecrRepository,
        tagOrDigest: props.webAppVersion,
      }),
      serviceName: 'webapp-service',
      autoDeploymentsEnabled: true,
      healthCheck: HealthCheck.http({
        healthyThreshold: 2,
        interval: Duration.seconds(10),
        path: '/favicon.ico',
        timeout: Duration.seconds(10),
        unhealthyThreshold: 10,
      }),
    })
```

#### コラム: ヘルスチェックについて、いろいろと参考になった記事

実はヘルスチェックはちょっといろいろあって実際も `favicon` にしたんですけど、そのときに参考になった記事があるので、載せておきます

- [Next.js App Router でヘルスチェックをする](https://zenn.dev/seelog/articles/next_js_health_check)
- [How to set up an endpoint for Health check on Next.js?](https://stackoverflow.com/questions/57956476/how-to-set-up-an-endpoint-for-health-check-on-next-js)
- [Heath check failing only after enabling VPC connector](https://repost.aws/questions/QUq9Sqy5hKQrSZdIuDgEJoSw/heath-check-failing-only-after-enabling-vpc-connector)

## デプロイできたので動かしてみるが動かない

> Error: listen EADDRNOTAVAIL: address not available 10.0.1.2:3000

何か動きません。

あれ、Dockerfile に `HOSTNAME=0.0.0.0` 入ってるのに何でだろう？
ローカルで build したイメージ動かしたときは大丈夫だったんだけど？と思ったら、1つ罠があります。

こちらの記事がとても参考になりました。
[AWS App RunnerでNext.jsのstandaloneモードを動かす時のTips(ないしは失敗談)](https://zenn.dev/kojipole/articles/7e0472e71dc19b)

> App Runnerの環境では環境変数HOSTNAMEに対して、暗黙的にアタッチされているENIのprivate DNSが指定されるようです。

なんですって？
AppRunner が環境変数にセットしてくるの？？

だから `10.0.1.2:3000` みたいな ENI の private アドレスになるんですね。Dockerfile では

```dockerfile
ENV HOSTNAME="0.0.0.0"
CMD ["node",  "server.js"]
```

のように指定されていても、コンテナ起動時に HOSTNAME を指定されるので環境変数が上書きされてセットされます。

## CDK で HOSTNAME を設定する

ということで、AppRunner のサービスを作るときに環境変数 `HOSTNAME` を指定してあげます。

```typescript
    const service = new Service(this, 'WebAppService', {
      source: Source.fromEcr({
        imageConfiguration: {
            port: 3000,
            environmentVariables: {
                HOSTNAME: '0.0.0.0',
            }
        },
```

これでデプロイしたら無事起動しました。👏👏

少しでも AppRunner で Next.js アプリを動かす人の役にたてばと思います。
