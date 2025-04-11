---

title: AppRunner へのデプロイは cdk でサクッとできるのか？
date: 2025-04-08 09:45 UTC
tags: 
- AWS
- AppRunner
- CDK
---

> AWS App Runner は、ソースコードまたはコンテナイメージから AWS クラウドのスケーラブルで安全なウェブアプリケーションに直接デプロイするための、高速でシンプル、かつ費用対効果の高い方法を提供する AWS サービスです。

と[公式ドキュメント](https://docs.aws.amazon.com/ja_jp/apprunner/latest/dg/what-is-apprunner.html) に書かれています。

ソースコードからデプロイする場合は

- GitHub
- BitBucket

といったところのクラウドリポジトリを使っていれば簡単に連携して自動デプロイができます。

一方、仕事でオンプレのソースコードリポジトリ、たとえば GitHub Enterprise とか BitBucket Server とか、GitLabs とかをパブリッククラウドでなく使っている場合はソースコード連携できないので、ECR にイメージをデプロイして AppRunner と連携することになります。
本ブログは、この方法について、ネット上で簡単にできそうに書いてある記事をやってみたら、実際はそんなことなかったということについて記録するものです。

## CDK で AppRunner + ECR でデプロイする

`cdk apprunner DockerImageDeployment` みたいな検索条件でググると、まぁいっぱい出てきます。

ここで `DockerImageDeployment` というのは、Dockerfile をビルドして ECR に push までしてくれる CDK のライブラリです。
で、その ECR を AppRunner に関連づけてというのが流れです。

ちなみに `DockerImageAsset` というのもあって、そちらの記事も多く見受けられます。こちらはあらかじめ ECR を作っておかなくてもいい感じに作ってくれるものですが、[[AWS CDK] コンテナイメージもまとめてデプロイ！？DockerImageAssetの動作確認をしてみた](https://qiita.com/rickey0808/items/1e715b016d50f1d4c094) という記事のとおりお試しで使う分には良いと思いますが、ちゃんと管理して使いたい場合は `DockerImageDeployment` を使った方が良いでしょう。

## DockerImageDeployment を使って ECR にデプロイする

[DockerImageDeployment の公式GitHubリポジトリ](https://github.com/cdklabs/cdk-docker-image-deployment) にある例どおり簡単に利用できます。

```typescript
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as imagedeploy from 'cdk-docker-image-deployment';

const repo = ecr.Repository.fromRepositoryName(this, 'MyRepository', 'myrepository');

new imagedeploy.DockerImageDeployment(this, 'ExampleImageDeploymentWithTag', {
  source: imagedeploy.Source.directory('path/to/directory'),
  destination: imagedeploy.Destination.ecr(repo, { 
    tag: 'myspecialtag',
  }),
});
```
## AppRunner と連携でデプロイする

`@aws-cdk/aws-apprunner-alpha` というまだα版ですが、CDK のコンストラクタがあるので、これを利用します。

```typescript
import * as ecr from 'aws-cdk-lib/aws-ecr';

new apprunner.Service(this, 'Service', {
  source: apprunner.Source.fromEcr({
    imageConfiguration: { port: 80 },
    repository: ecr.Repository.fromRepositoryName(this, 'NginxRepository', 'nginx'),
    tagOrDigest: 'latest',
  }),
});
```

あとは CDK でいい感じにつなぎこんで、みたいな感じです。

## やってみたがエラーになる

はい、エラーになりました。

> The deployment will wait until the CodeBuild Project completes successfully before finishing.

というメッセージが出て失敗します。
メッセージどおり受け取ると、ECR のデプロイが終わってないので AppRunner にデプロイできないということです。

## どうやって解決したか

実はアプリケーションのソースコードリポジトリと、AWSのリソース構成をデプロイするインフラリポジトリは分けていたので、アプリケーションコード側の CI/CD で `DockerImageDeployment` を使って ECR までデプロイ。
ECR までデプロイされている状況で、インフラリポジトリ側の CI/CD で ECR と AppRunner の関連付けをやるようにしました。

では最初はなんで両方を一緒にやっていたかというと、アプリケーションが外部サービスに連携しているため、開発環境ではモックサーバーを使っているのですが、それは Dockerfile 1つだけなんでそのファイルをインフラリポジトリ側において AppRunner にデプロイしようとしていたという感じでした。

他の解決策としては、カスタムリソースを使って ECR へのデプロイを待ち合わせてデプロイするという方法があります。モノレポなどを使っているときにアプリケーションとインフラを同時にデプロイしたいときなどは有効な方法だと思います。
カスタムリソースも Lambda を作らないといけないというわけではなく、 AWS の API を実行する程度なら Lambda が不要なので、そういった選択肢も検討できます。

参考記事: [[AWS CDK] APIを呼び出すだけのカスタムリソースならLambda関数は不要な件](https://dev.classmethod.jp/articles/create-custom-resources-with-aws-cdk-without-using-lambda-functions/)

## さいごに

AppRunner を cdk を使ってデプロイしたい、というときに参考になれば幸いです。
`@aws-cdk/aws-apprunner-alpha` がαじゃなくなるときには、もう少し便利に（ちゃんと待ち合わせてくれるみたいな）ことができるようになるのかもしれないので期待はしたいですね。

ちなみにモックサーバーは [Mockoon](https://mockoon.com/) を使ってます。とても便利で助かる。
