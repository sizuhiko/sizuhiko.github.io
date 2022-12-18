---
title: Node.js で AWS SQS を使ったコードの自動テストを記述する
date: 2022-12-18 05:53 UTC
tags: 
- TypeScript
- Jest
- JavaScript
- SQS
- AWS
---

前回の[Node.js で BigQuery を使ったコードの自動テストを記述する](/2022/12/18/bigquery-test-on-node-js.html)と同じように外部サービスを使った部分の自動テストについてです。
今回は AWS SQS を使ったコードの自動テストを書く場合です。

BigQuery と違い、 AWS SQS のエミュレータは検索するとすぐに見つかりました。
たとえば [roribio16/alpine-sqs](https://hub.docker.com/r/roribio16/alpine-sqs/) というもの。
こちらは日本語の使ってみた記事もいくつか出ています。

- [ローカルDocker環境でSQSのモックElasticMQを利用する](https://k5-n.com/elasticmq/)
- [AWS SQSのローカル開発環境をDockerで構築する](https://zenn.dev/tady/articles/cccbc4d11bf19a)

## roribio16/alpine-sqs

さっそく上記の記事や、公式ドキュメントを参考に動かしてみます。

Dockerコンテナをあげて aws cli から実行してみると、簡単に利用することができたので、 Node.js + Jest のテストコードを書いて試してみます。
すると ECONNRESET エラーとなって動きません。おやぁ？

GitHub のリポジトリを見てみると、関連する [issue](https://github.com/roribio/alpine-sqs/issues/49) が出てました。
どうも Apple Silicon (いわゆるM1とかM2とか)からだとエラーになるようです。
解決するための [Pull Request](https://github.com/roribio/alpine-sqs/pull/50) も出てるんですが、マージされる気配がないようです。
現在、開発用の端末は M1 MacBook Pro を使っているので、困ってしまいました。

[alpine-sqs の Dockerfile](https://github.com/roribio/alpine-sqs/blob/master/Dockerfile) を見ると `elasticmq-server` を使っているようなので、それを調べてみます。

## elasticmq-server

[ElasticMQ](https://github.com/softwaremill/elasticmq) の GitHub を見てみると、普通に 

> Amazon SQS-compatible interface

って書いてありました。
これだけで良いのでは？という感じです。
（alpine-sqs の利点は何だったんだろう？）

で、それっぽいキーワードで検索すると、記事もありました。

- [Amazon SQS互換のElasticMQを使って、Temoporary Queue＋RPCを試してみる](https://kazuhira-r.hatenablog.com/entry/2021/09/18/164425)
- [Amazon SQSをDockerを使ってローカルで実行](https://techgrowup.net/2021/08/17/amazon-sqs/)
- [LocalでSQS(ElasticMQ)を動かしてみた](https://note.com/shift_tech/n/n5954af51eaaf)
- [ElasticMQでAmazon SQSのローカルテスト環境を作る](http://takaaki.info/2014/05/05/elasticmq-sqs/)

調べ方の問題ですかね？キーワードの指定の方法によっては、こっちの方がたくさん出てきました。

さてこちらも Docker コンテナがあるので、それを使って起動します。

```bash
$ docker run -d -rm -p 9324:9324 -p 9325:9325 softwaremill/elasticmq-native
```

起動時にキューを作っておくには config ファイルを記述してファイルをマウントします。

```bash
$ docker run -d -rm -p 9324:9324 -p 9325:9325 -v `pwd`/custom.conf:/opt/elasticmq.conf softwaremill/elasticmq-native
```

config の書き方は、 GitHub に例が書いてあるので、そちらを参考にしてください。

## Node.js からの接続

まず aws-sdk のクレデンシャルに適当な値を設定しておきます。
あとは SQS クラスのインスタンスを生成するだけです。

```javascript
import * as AWS from 'aws-sdk';
import { SQS } from 'aws-sdk';

AWS.config.credentials = {
  secretAccessKey: 'secretAccessKey',
  accessKeyId: 'accessKeyId',
  sessionToken: 'sessionToken',
};

let sqs: SQS;

beforeAll(() => {
  sqs = new SQS({
    region: 'ap-northeast-1',
    endpoint: 'http://localhost:9324',
  })
});
```

キューのURLはデフォルト設定だと `http://localhost:9324/000000000000/キュー名` のようになります。
このあたりは aws-cli などでキュー一覧を取得してもわかるので、そこから情報を取得しても大丈夫でしょう。

## さいごに

はい。
これで AWS SQS を使ったコードの UnitTest も書けるようになりますね。
どんどん UnitTest を充実させていきましょう。
