---
title: LocalStack を使って aws-sdk の Integration Test を実行する
date: 2023-04-19 07:12 UTC
tags: 
- aws-sdk
- LocalStack
- test
---

[AWS Lambda の Node.js 14 を 18 に移行する（aws-sdk v3 移行編）](/2023/01/04/migrate-aws-sdk-node-js-v2-to-v3.html) の中でも書いたように、aws-sdk v3 を使ったコードを UnitTest するには [AWS SDK v3 Client mock](https://github.com/m-radzikowski/aws-sdk-client-mock) を利用してモックした方が簡単です。

一方で少し IntegrationTest をしたいと思うこともあるでしょう。そうしたときは LocalStack の利用が便利です。
手元も環境なら Docker の Extension で動きます。
CI 環境、たとえば GitHub Actions ならサービスでコンテナ起動すれば大丈夫です。

### インテグレーションテストでのエンドポイント

こんな感じでテストコードで endpoint を切り替えられるようにしておくとローカルとCI環境のどちらでもテストを実行しやすくなります。

```javascript
const options = {
  credentials: { accessKeyId: 'dummy', secretAccessKey: 'summy' },
  endpoint: `http://${process.env.TEST_AWS_HOSTNAME ?? 'localhost'}:4566`,
  region: 'ap-northeast-1',
};
const stepFunctions = new SFNClient(options);
```

手元では localhost で良いし、CI環境（たとえば GitHub Actions ） なら、以下のようにしておくと良いです。

```yaml
    container: node:18
    services:
      localstack:
        image: localstack/localstack
    env:
      TEST_AWS_HOSTNAME: localstack
    steps:
      - run: npm t
```


### LocalStack v2.0 以降での変更点

最近バージョンが 2.0 になった LocalStack ですが Lambda 関連で大きな変更がありました。
基本的に Lambda を利用しなければ問題はありませんが、特に問題なければ localstack サービスを以下のように設定しておくと安心です。

```yaml
    container: node:18
    services:
      localstack:
        image: localstack/localstack
        env:
          LAMBDA_SYNCHRONOUS_CREATE: 1
        volumes:
          - /var/run/docker.sock:/var/run/docker.sock
```

Actions のホストコントローラの docker.sock をマウントすることで LocalStack の中で Lambda が起動できるようになります。

詳しくは[公式の v2.0.0 リリースノート](https://github.com/localstack/localstack/releases/tag/v2.0.0) の `Lambda` 部分に書いてありますので、読んでみてください。

### さいごに

単体テストで LocalStack 使うのはやりすぎだと思いますが、部分的にインテグレーションテストしたい、といった場合には有用な方法かな、と思いますので、用途に応じて使い分けられると良いですね。
